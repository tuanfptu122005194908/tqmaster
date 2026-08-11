import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Loader2, WifiOff, ImagePlus } from 'lucide-react';
import ChatMessageBubble from './ChatMessage';
import type { ChatMessage } from '@/hooks/useChat';
import { supabase } from '@/integrations/supabase/client';

const MAX_CHARS = 2000;

interface ChatWindowProps {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  currentUserId: string;
  currentUserRole: 'user' | 'admin';
  conversationId: string | null;
  onSend: (content: string, conversationId: string, imageUrl?: string) => Promise<boolean>;
  onMarkAsRead?: (conversationId: string) => void;
  onDelete?: (messageId: string) => Promise<void>;
  placeholder?: string;
}

export default function ChatWindow({
  messages,
  loading,
  sending,
  currentUserId,
  currentUserRole,
  conversationId,
  onSend,
  onMarkAsRead,
  onDelete,
  placeholder = 'Nhập tin nhắn...',
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll xuống cuối khi có tin mới
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input khi mở
  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  // Đánh dấu đã đọc khi component mount / khi có tin nhắn mới
  useEffect(() => {
    if (conversationId && onMarkAsRead) {
      onMarkAsRead(conversationId);
    }
  }, [conversationId, messages.length, onMarkAsRead]);

  const handleSend = async () => {
    if (!conversationId || sending || isUploading || input.length > MAX_CHARS) return;
    if (!input.trim() && !imageFile) return; // Không có gì để gửi

    let imageUrl = '';
    if (imageFile) {
      setIsUploading(true);
      const ext = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
      
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        alert('Lỗi tải ảnh lên: ' + error.message);
        setIsUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);
        
      imageUrl = publicUrl;
      setIsUploading(false);
    }

    const ok = await onSend(input, conversationId, imageUrl);
    if (ok) {
      setInput('');
      setImageFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh nhỏ hơn 5MB');
        return;
      }
      setImageFile(file);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const charsLeft = MAX_CHARS - input.length;
  const isOverLimit = input.length > MAX_CHARS;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 10,
        color: '#64748b',
      }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 14 }}>Đang tải...</span>
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 12,
        color: '#94a3b8',
      }}>
        <WifiOff size={32} style={{ opacity: 0.5 }} />
        <span style={{ fontSize: 14 }}>Chọn một cuộc trò chuyện để bắt đầu</span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#f4f7fc',
      backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.4)), url(/chat-bg-field.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
      {/* Message List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {messages.length === 0 ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            color: '#94a3b8',
            fontSize: 14,
          }}>
            <div style={{ fontSize: 36 }}>💬</div>
            <div style={{ fontWeight: 600, color: '#64748b' }}>Bắt đầu cuộc trò chuyện</div>
            <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 220 }}>
              Gửi tin nhắn để được hỗ trợ từ admin
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              isOwnMessage={msg.sender_id === currentUserId}
              onDelete={currentUserRole === 'admin' && onDelete ? () => onDelete(msg.id) : undefined}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div style={{
        borderTop: '1px solid #e2e8f0',
        padding: '12px 14px',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        {/* Image Preview */}
        {imageFile && (
          <div style={{ position: 'relative', alignSelf: 'flex-start', marginBottom: 4 }}>
            <img 
              src={URL.createObjectURL(imageFile)} 
              alt="Preview" 
              style={{ height: 60, borderRadius: 8, border: '1px solid #e2e8f0', objectFit: 'cover' }} 
            />
            <button 
              onClick={() => setImageFile(null)}
              style={{
                position: 'absolute', top: -6, right: -6,
                background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%',
                width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 12, fontWeight: 'bold'
              }}
            >×</button>
          </div>
        )}

        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
        }}>
          {/* File Input & Upload Button */}
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/webp" 
            hidden 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Đính kèm ảnh"
            style={{
              width: 40, height: 40, borderRadius: '50%', border: 'none',
              background: 'transparent', color: '#3b82f6', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <ImagePlus size={22} />
          </button>

          <div style={{ flex: 1, position: 'relative' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              rows={2}
              maxLength={MAX_CHARS + 10}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 20,
                border: `1px solid ${isOverLimit ? '#ef4444' : '#e2e8f0'}`,
                fontSize: 14,
                lineHeight: 1.5,
                resize: 'none',
                outline: 'none',
                fontFamily: "'Inter', -apple-system, sans-serif",
                color: '#1e293b',
                background: '#f1f5f9',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                if (!isOverLimit) {
                  e.target.style.borderColor = '#3b82f6';
                  e.target.style.background = '#ffffff';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = isOverLimit ? '#ef4444' : '#e2e8f0';
                e.target.style.background = '#f8fafc';
              }}
            />
            {/* Character counter */}
            {input.length > MAX_CHARS * 0.8 && (
              <div style={{
                position: 'absolute',
                bottom: 6,
                right: 10,
                fontSize: 10,
                color: isOverLimit ? '#ef4444' : '#94a3b8',
                fontWeight: isOverLimit ? 700 : 400,
              }}>
                {charsLeft < 0 ? `+${Math.abs(charsLeft)}` : charsLeft}
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !imageFile) || sending || isUploading || isOverLimit}
            title="Gửi (Enter)"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              border: 'none',
              background: (!input.trim() && !imageFile) || sending || isUploading || isOverLimit
                ? 'transparent'
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: (!input.trim() && !imageFile) || sending || isUploading || isOverLimit ? '#94a3b8' : '#ffffff',
              cursor: (!input.trim() && !imageFile) || sending || isUploading || isOverLimit ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              boxShadow: (!input.trim() && !imageFile) || sending || isUploading || isOverLimit
                ? 'none'
                : '0 4px 12px rgba(59, 130, 246, 0.4)',
            }}
          >
            {sending || isUploading ? (
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>

        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, textAlign: 'right' }}>
          Enter để gửi • Shift+Enter xuống dòng
        </div>
      </div>
    </div>
  );
}
