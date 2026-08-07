import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { ChatMessage } from '@/hooks/useChat';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean; // true = tin nhắn của bản thân
  onDelete?: (messageId: string) => void;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatMessageBubble({ message, isOwnMessage, onDelete }: ChatMessageBubbleProps) {
  const isAdmin = message.sender_role === 'admin';
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
        marginBottom: 12,
        padding: '0 4px',
      }}
    >
      {/* Sender label (chỉ hiển thị cho admin messages từ phía user) */}
      {!isOwnMessage && (
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#64748b',
          marginBottom: 3,
          paddingLeft: 4,
        }}>
          {isAdmin ? 'Admin' : 'Bạn'}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, maxWidth: '85%' }}>
        {/* Avatar nhỏ cho admin */}
        {!isOwnMessage && (
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginBottom: 2,
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
          }}>
            A
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwnMessage ? 'flex-end' : 'flex-start', position: 'relative' }}>
          
          {/* Delete Button (chỉ hiện khi có hàm onDelete và đang hover) */}
          {onDelete && isHovered && (
            <button
              onClick={() => onDelete(message.id)}
              title="Xoá tin nhắn"
              style={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                [isOwnMessage ? 'left' : 'right']: -36,
                background: '#fee2e2',
                color: '#ef4444',
                border: 'none',
                width: 28,
                height: 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                zIndex: 10,
              }}
            >
              <Trash2 size={14} />
            </button>
          )}

          {/* Message bubble */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: isOwnMessage
                ? '18px 18px 4px 18px'
                : '18px 18px 18px 4px',
              background: isOwnMessage
                ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                : '#f1f5f9',
              color: isOwnMessage ? '#ffffff' : '#1e293b',
              fontSize: 14,
              lineHeight: 1.5,
              boxShadow: isOwnMessage
                ? '0 2px 8px rgba(59, 130, 246, 0.3)'
                : '0 1px 3px rgba(0,0,0,0.06)',
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {message.image_url && (
              <img 
                src={message.image_url} 
                alt="Đính kèm" 
                style={{
                  maxWidth: '100%',
                  maxHeight: 200,
                  borderRadius: 8,
                  cursor: 'zoom-in',
                  objectFit: 'contain',
                  backgroundColor: 'rgba(0,0,0,0.05)'
                }}
                onClick={() => window.open(message.image_url!, '_blank')}
              />
            )}
            {message.content && <span>{message.content}</span>}
          </div>

          {/* Timestamp + Read indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            marginTop: 3,
            fontSize: 10,
            color: '#94a3b8',
          }}>
            <span>{formatTime(message.created_at)}</span>
            {isOwnMessage && (
              <span style={{ fontSize: 12 }}>
                {message.is_read ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
