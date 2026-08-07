import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export type ChatMessage = Tables<'chat_messages'>;
export type Conversation = Tables<'conversations'>;
export type ChatCleanupLog = Tables<'chat_cleanup_logs'>;

interface UseChatOptions {
  userId: string;
  isAdmin: boolean;
  /** Nếu là admin thì cần truyền conversationId để listen tin nhắn */
  conversationId?: string;
}

export function useChat({ userId, isAdmin, conversationId }: UseChatOptions) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Lấy hoặc tạo conversation cho user ──────────────────
  const getOrCreateConversation = useCallback(async () => {
    if (isAdmin) return null;

    // Thử lấy conversation hiện có
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      setConversation(existing);
      return existing;
    }

    // Tạo mới nếu chưa có
    const { data: created, error } = await supabase
      .from('conversations')
      .insert({ user_id: userId })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return null;
    }

    setConversation(created);
    return created;
  }, [userId, isAdmin]);

  // ── Tải tin nhắn ─────────────────────────────────────────
  const loadMessages = useCallback(async (convId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data ?? []);
  }, []);

  // ── Đánh dấu đã đọc khi mở chat ─────────────────────────
  const markAsRead = useCallback(async (convId: string) => {
    // Admin mở conversation → đánh dấu tin của user là đã đọc
    // User mở chat widget → đánh dấu tin của admin là đã đọc
    const senderRole = isAdmin ? 'user' : 'admin';

    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('conversation_id', convId)
      .eq('sender_role', senderRole)
      .eq('is_read', false);

    // Refresh unread count
    setUnreadCount(0);
  }, [isAdmin]);

  // ── Đếm tin nhắn chưa đọc (cho badge) ───────────────────
  const refreshUnreadCount = useCallback(async (convId: string) => {
    const expectedSenderRole = isAdmin ? 'user' : 'admin';
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', convId)
      .eq('sender_role', expectedSenderRole)
      .eq('is_read', false);

    setUnreadCount(count ?? 0);
  }, [isAdmin]);

  // ── Gửi tin nhắn ─────────────────────────────────────────
  const sendMessage = useCallback(async (content: string, convId: string) => {
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 2000) return false;

    setSending(true);
    const senderRole = isAdmin ? 'admin' : 'user';

    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        conversation_id: convId,
        sender_id: userId,
        sender_role: senderRole,
        content: trimmed,
        is_read: false,
      })
      .select()
      .single();

    setSending(false);

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Không thể gửi tin nhắn. Vui lòng thử lại.');
      return false;
    }

    if (data) {
      setMessages(prev => {
        if (prev.find(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
    }

    return true;
  }, [userId, isAdmin]);

  // ── Realtime subscription ─────────────────────────────────
  const subscribeToMessages = useCallback((convId: string) => {
    // Cleanup channel cũ nếu có
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`chat-messages-${convId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages(prev => {
            // Tránh duplicate
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Nếu tin đến từ phía kia, tăng unread (nếu chat chưa mở)
          const fromSenderRole = isAdmin ? 'user' : 'admin';
          if (newMsg.sender_role === fromSenderRole) {
            setUnreadCount(prev => prev + 1);
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
          const deletedId = (payload.old as ChatMessage).id;
          setMessages(prev => prev.filter(m => m.id !== deletedId));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          const updated = payload.new as Partial<ChatMessage>;
          setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [isAdmin]);

  // ── Khởi tạo (cho user) ──────────────────────────────────
  useEffect(() => {
    if (isAdmin) return;

    let mounted = true;

    const init = async () => {
      setLoading(true);
      const conv = await getOrCreateConversation();
      if (!mounted || !conv) {
        setLoading(false);
        return;
      }
      await loadMessages(conv.id);
      await refreshUnreadCount(conv.id);
      subscribeToMessages(conv.id);
      setLoading(false);
    };

    init();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAdmin, getOrCreateConversation, loadMessages, refreshUnreadCount, subscribeToMessages]);

  // ── Khởi tạo (cho admin khi chọn một conversation) ───────
  useEffect(() => {
    if (!isAdmin || !conversationId) return;

    let mounted = true;

    const init = async () => {
      setLoading(true);
      await loadMessages(conversationId);
      await markAsRead(conversationId);
      subscribeToMessages(conversationId);
      if (mounted) setLoading(false);
    };

    init();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [isAdmin, conversationId, loadMessages, markAsRead, subscribeToMessages]);

  return {
    conversation,
    messages,
    loading,
    sending,
    unreadCount,
    setUnreadCount,
    sendMessage,
    markAsRead,
    refreshUnreadCount,
  };
}
