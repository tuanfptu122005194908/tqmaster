import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Send, Loader2, WifiOff } from 'lucide-react';
import ChatMessageBubble from './ChatMessage';
import type { ChatMessage } from '@/hooks/useChat';

const MAX_CHARS = 2000;

interface ChatWindowProps {
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  currentUserId: string;
  currentUserRole: 'user' | 'admin';
  conversationId: string | null;
  onSend: (content: string, conversationId: string) => Promise<boolean>;
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
    if (!conversationId || !input.trim() || sending || input.length > MAX_CHARS) return;
    const ok = await onSend(input, conversationId);
    if (ok) setInput('');
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
      background: '#fafbff',
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
      }}>
        <div style={{
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
        }}>
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
                padding: '10px 12px',
                borderRadius: 14,
                border: `1.5px solid ${isOverLimit ? '#ef4444' : '#e2e8f0'}`,
                fontSize: 14,
                lineHeight: 1.5,
                resize: 'none',
                outline: 'none',
                fontFamily: "'Inter', -apple-system, sans-serif",
                color: '#1e293b',
                background: '#f8fafc',
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
            disabled={!input.trim() || sending || isOverLimit}
            title="Gửi (Enter)"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: !input.trim() || sending || isOverLimit
                ? '#e2e8f0'
                : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: !input.trim() || sending || isOverLimit ? '#94a3b8' : '#ffffff',
              cursor: !input.trim() || sending || isOverLimit ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.15s ease',
              boxShadow: !input.trim() || sending || isOverLimit
                ? 'none'
                : '0 4px 12px rgba(59, 130, 246, 0.4)',
            }}
          >
            {sending ? (
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
