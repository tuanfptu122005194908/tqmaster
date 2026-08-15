import React, { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/lib/AppContext';
import type { Tables } from '@/integrations/supabase/types';
import { MessageCircle, Loader2, Search, Users, Clock, CheckCheck, Trash2 } from 'lucide-react';
import ChatWindow from '@/components/chat/ChatWindow';
import { toast } from 'sonner';

type Conversation = Tables<'conversations'>;
type Profile = Tables<'profiles'>;

interface ConversationWithUser extends Conversation {
  profile: Pick<Profile, 'id' | 'full_name' | 'username' | 'email' | 'avatar_url'> | null;
  unreadCount: number;
  lastMessage: string | null;
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHour < 24) return `${diffHour} giờ trước`;
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return d.toLocaleDateString('vi-VN');
}

export default function AdminChat() {
  const { profile, refreshUnreadChatCount } = useApp();
  const [conversations, setConversations] = useState<ConversationWithUser[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Tables<'chat_messages'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const convChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Tải danh sách conversations ────────────────────────────
  const loadConversations = useCallback(async () => {
    const { data: convs, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('Error loading conversations:', error);
      return;
    }

    if (!convs || convs.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Tải profile và unread count cho từng conversation
    const enriched = await Promise.all(
      convs.map(async (conv) => {
        const [profileRes, unreadRes, lastMsgRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, username, email, avatar_url')
            .eq('id', conv.user_id)
            .maybeSingle(),
          supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('sender_role', 'user')
            .eq('is_read', false),
          supabase
            .from('chat_messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        return {
          ...conv,
          profile: profileRes.data ?? null,
          unreadCount: unreadRes.count ?? 0,
          lastMessage: lastMsgRes.data?.content ?? null,
        } as ConversationWithUser;
      })
    );

    // Lọc bỏ những cuộc trò chuyện chưa có tin nhắn nào
    const activeConversations = enriched.filter(
      conv => conv.lastMessage !== null || conv.unreadCount > 0
    );

    setConversations(activeConversations);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // ── Realtime: listen to ALL conversations changes ─────────
  useEffect(() => {
    const ch = supabase
      .channel('admin-chat-conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => { loadConversations(); }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          const newMsg = payload.new as Tables<'chat_messages'>;
          setConversations(prev => {
            const exists = prev.some(c => c.id === newMsg.conversation_id);
            if (!exists) {
              // Only reload if we don't have this conversation
              loadConversations();
              return prev;
            }
            const updated = prev.map(c => {
              if (c.id === newMsg.conversation_id) {
                // If the message is from user, and admin is NOT currently viewing this chat, increment unread
                // (If admin IS viewing, the specific conversation subscription will auto-read it and reset count)
                const isUnread = newMsg.sender_role === 'user' && !newMsg.is_read;
                return {
                  ...c,
                  lastMessage: newMsg.content || (newMsg.image_url ? 'Hình ảnh' : ''),
                  last_message_at: newMsg.created_at,
                  unreadCount: isUnread ? c.unreadCount + 1 : c.unreadCount
                };
              }
              return c;
            });
            updated.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
            return updated;
          });
        }
      )
      .subscribe();

    convChannelRef.current = ch;

    return () => {
      supabase.removeChannel(ch);
    };
  }, [loadConversations]);

  // ── Tải tin nhắn khi chọn conversation ───────────────────
  const selectConversation = useCallback(async (convId: string) => {
    setSelectedConvId(convId);
    setLoadingMessages(true);

    // Load messages
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      setLoadingMessages(false);
      return;
    }

    setMessages(data ?? []);

    // Mark user messages as read
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('conversation_id', convId)
      .eq('sender_role', 'user')
      .eq('is_read', false);

    // Cập nhật local state unread count
    setConversations(prev =>
      prev.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c)
    );

    // Cập nhật global sidebar badge ngay lập tức
    refreshUnreadChatCount();

    setLoadingMessages(false);

    // Cleanup old channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Subscribe realtime cho conversation này
    const ch = supabase
      .channel(`admin-messages-${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${convId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Tables<'chat_messages'>;
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Auto mark as read nếu tin từ user
          if (newMsg.sender_role === 'user') {
            await supabase
              .from('chat_messages')
              .update({ is_read: true })
              .eq('id', newMsg.id);
              
            setConversations(prevConvs => 
              prevConvs.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c)
            );
            refreshUnreadChatCount();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const deletedId = (payload.old as Tables<'chat_messages'>).id;
          setMessages(prev => prev.filter(m => m.id !== deletedId));
        }
      )
      .subscribe();

    channelRef.current = ch;
  }, []);

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
      if (convChannelRef.current) supabase.removeChannel(convChannelRef.current);
    };
  }, []);

  // ── Gửi tin nhắn ─────────────────────────────────────────
  const handleSend = useCallback(async (content: string, convId: string, imageUrl?: string): Promise<boolean> => {
    if (!profile) return false;
    setSending(true);

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: convId,
        sender_id: profile.id,
        sender_role: 'admin',
        content: content.trim() || null,
        image_url: imageUrl || null,
        is_read: false,
      })
      .select()
      .single();

    setSending(false);

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Không thể gửi tin nhắn.');
      return false;
    }

    if (data) {
      setMessages(prev => {
        if (prev.find(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }

    return true;
  }, [profile]);

  // ── Xoá tin nhắn ─────────────────────────────────────────
  const handleDelete = useCallback(async (messageId: string) => {
    const confirm = window.confirm('Bạn có chắc chắn muốn xoá tin nhắn này không? Hành động này không thể hoàn tác.');
    if (!confirm) return;

    // 1. Tìm xem tin nhắn có chứa ảnh không để xoá file trong Storage trước
    const targetMsg = messages.find(m => m.id === messageId);
    if (targetMsg?.image_url) {
      // Lấy tên file từ URL (đoạn sau cùng)
      const fileName = targetMsg.image_url.split('/').pop();
      if (fileName) {
        await supabase.storage.from('chat-images').remove([fileName]);
      }
    }

    // 2. Xoá bản ghi trong Database
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      toast.error('Không thể xoá tin nhắn.');
    } else {
      // Cập nhật local state ngay lập tức (optimistic)
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Đã xoá tin nhắn');
    }
  }, [messages]);

  // ── Xoá đoạn chat ────────────────────────────────────────
  const handleDeleteConversation = useCallback(async (convId: string) => {
    const confirm = window.confirm('Xoá toàn bộ cuộc hội thoại này? Tất cả tin nhắn và ảnh sẽ bị xoá vĩnh viễn.');
    if (!confirm) return;

    // 1. Tìm và xoá tất cả ảnh đính kèm trong cuộc hội thoại này
    const { data: messagesWithImages } = await supabase
      .from('chat_messages')
      .select('image_url')
      .eq('conversation_id', convId)
      .not('image_url', 'is', null);

    if (messagesWithImages && messagesWithImages.length > 0) {
      const fileNames = messagesWithImages
        .map(m => m.image_url?.split('/').pop())
        .filter(Boolean) as string[];
        
      if (fileNames.length > 0) {
        await supabase.storage.from('chat-images').remove(fileNames);
      }
    }

    // 2. Xoá cuộc hội thoại (các tin nhắn sẽ bị xoá cascade theo)
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', convId);

    if (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Không thể xoá đoạn chat.');
    } else {
      setConversations(prev => prev.filter(c => c.id !== convId));
      if (selectedConvId === convId) {
        setSelectedConvId(null);
      }
      toast.success('Đã xoá đoạn chat');
    }
  }, [selectedConvId]);

  // ── Filter conversations ──────────────────────────────────
  const filtered = conversations.filter(conv => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      conv.profile?.full_name?.toLowerCase().includes(q) ||
      conv.profile?.username?.toLowerCase().includes(q) ||
      conv.profile?.email?.toLowerCase().includes(q)
    );
  });

  const selectedConv = conversations.find(c => c.id === selectedConvId);

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      fontFamily: "'Inter', -apple-system, sans-serif",
      background: '#f4f7fc',
    }}>
      {/* Left: Conversation List */}
      <div style={{
        width: 300,
        minWidth: 300,
        flexShrink: 0,
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 16px 14px',
          borderBottom: '1px solid #f1f5f9',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MessageCircle size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                Chat Support
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                {conversations.length} cuộc trò chuyện
              </div>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
            }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm user..."
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                fontSize: 13,
                outline: 'none',
                background: '#f8fafc',
                color: '#0f172a',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; }}
              onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; }}
            />
          </div>
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              gap: 10,
              color: '#94a3b8',
            }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 13 }}>Đang tải...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 40,
              gap: 10,
              color: '#94a3b8',
            }}>
              <Users size={32} style={{ opacity: 0.4 }} />
              <span style={{ fontSize: 13, textAlign: 'center' }}>
                {search ? 'Không tìm thấy' : 'Chưa có cuộc trò chuyện nào'}
              </span>
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive = conv.id === selectedConvId;
              const displayName = conv.profile?.full_name || conv.profile?.username || 'Người dùng';
              const initials = displayName.charAt(0).toUpperCase();

              return (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    background: isActive ? '#eff6ff' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: conv.unreadCount > 0
                      ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                      : 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    fontSize: 15,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}>
                    {initials}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 3,
                    }}>
                      <span style={{
                        fontSize: 14,
                        fontWeight: conv.unreadCount > 0 ? 700 : 600,
                        color: conv.unreadCount > 0 ? '#0f172a' : '#374151',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 140,
                      }}>
                        {displayName}
                      </span>
                      <span style={{
                        fontSize: 11,
                        color: '#94a3b8',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 3,
                      }}>
                        <Clock size={10} />
                        {formatRelativeTime(conv.last_message_at)}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{
                        fontSize: 12,
                        color: conv.unreadCount > 0 ? '#64748b' : '#94a3b8',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 160,
                      }}>
                        {conv.lastMessage ?? 'Chưa có tin nhắn'}
                      </span>

                      {conv.unreadCount > 0 && (
                        <span style={{
                          background: '#ef4444',
                          color: '#ffffff',
                          fontSize: 11,
                          fontWeight: 800,
                          height: 18,
                          minWidth: 18,
                          borderRadius: 9,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '0 5px',
                          flexShrink: 0,
                          boxShadow: '0 2px 6px rgba(239, 68, 68, 0.35)',
                        }}>
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                      {conv.profile?.email ?? ''}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Chat Panel */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
        overflow: 'hidden',
      }}>
        {selectedConvId && selectedConv ? (
          <>
            {/* Conversation Header */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: '#ffffff',
              flexShrink: 0,
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: 15,
                fontWeight: 700,
                flexShrink: 0,
              }}>
                {(selectedConv.profile?.full_name || selectedConv.profile?.username || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  {selectedConv.profile?.full_name || selectedConv.profile?.username || 'Người dùng'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCheck size={12} style={{ color: '#10b981' }} />
                  {selectedConv.profile?.email}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleDeleteConversation(selectedConvId)}
                  title="Xoá toàn bộ đoạn chat"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#fee2e2',
                    color: '#ef4444',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#fca5a5'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#fee2e2'; }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Chat Window */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ChatWindow
                messages={messages}
                loading={loadingMessages}
                sending={sending}
                currentUserId={profile?.id ?? ''}
                currentUserRole="admin"
                conversationId={selectedConvId}
                onSend={handleSend}
                onDelete={handleDelete}
                placeholder="Trả lời người dùng..."
              />
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            color: '#94a3b8',
            background: '#fafbff',
          }}>
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <MessageCircle size={36} style={{ color: '#3b82f6' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                Chọn cuộc trò chuyện
              </div>
              <div style={{ fontSize: 14, color: '#94a3b8', maxWidth: 280 }}>
                Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu hỗ trợ người dùng
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
