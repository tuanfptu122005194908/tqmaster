import React, { useState, useEffect, useCallback } from 'react';
import { MessageCircle, X, ChevronDown, Headphones } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { useChat } from '@/hooks/useChat';
import ChatWindow from './ChatWindow';

export default function ChatWidget() {
  const { profile, isAdmin } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Chỉ hiển thị cho user thường (không phải admin)
  if (!profile || isAdmin) return null;

  return <ChatWidgetInner profileId={profile.id} isOpen={isOpen} setIsOpen={setIsOpen} isMinimized={isMinimized} setIsMinimized={setIsMinimized} />;
}

interface ChatWidgetInnerProps {
  profileId: string;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
  isMinimized: boolean;
  setIsMinimized: (v: boolean) => void;
}

function ChatWidgetInner({ profileId, isOpen, setIsOpen, isMinimized, setIsMinimized }: ChatWidgetInnerProps) {
  const { conversation, messages, loading, sending, unreadCount, setUnreadCount, sendMessage, markAsRead } = useChat({
    userId: profileId,
    isAdmin: false,
  });

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    // Khi mở chat, reset unread count và mark as read
    if (conversation?.id) {
      setUnreadCount(0);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleSend = useCallback(async (content: string, convId: string, imageUrl?: string) => {
    return sendMessage(content, convId, imageUrl);
  }, [sendMessage]);

  const handleMarkAsRead = useCallback((convId: string) => {
    markAsRead(convId);
    setUnreadCount(0);
  }, [markAsRead, setUnreadCount]);

  return (
    <>
      {/* Chat Panel */}
      {isOpen && !isMinimized && (
        <div
          style={{
            position: 'fixed',
            bottom: 88,
            right: 24,
            width: 370,
            height: 520,
            background: '#ffffff',
            borderRadius: 20,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.18), 0 4px 20px rgba(59, 130, 246, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            border: '1px solid #e2e8f0',
            overflow: 'hidden',
            animation: 'chatSlideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0,
          }}>
            {/* Admin avatar */}
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(255,255,255,0.4)',
              flexShrink: 0,
            }}>
              <Headphones size={20} color="#ffffff" />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', lineHeight: 1.2 }}>
                Hỗ trợ TQMaster
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#4ade80',
                  boxShadow: '0 0 0 2px rgba(74, 222, 128, 0.3)',
                }} />
                Admin đang trực tuyến
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6 }}>
              {/* Minimize */}
              <button
                onClick={handleMinimize}
                title="Thu nhỏ"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              >
                <ChevronDown size={16} />
              </button>
              {/* Close */}
              <button
                onClick={handleClose}
                title="Đóng"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(255,255,255,0.15)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Chat Window */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ChatWindow
              messages={messages}
              loading={loading}
              sending={sending}
              currentUserId={profileId}
              currentUserRole="user"
              conversationId={conversation?.id ?? null}
              onSend={handleSend}
              onMarkAsRead={handleMarkAsRead}
              placeholder="Nhắn tin cho admin..."
            />
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        id="chat-widget-button"
        onClick={isOpen && !isMinimized ? handleClose : handleOpen}
        title={isOpen && !isMinimized ? 'Đóng chat' : 'Mở chat hỗ trợ'}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: 'none',
          background: isOpen && !isMinimized
            ? '#64748b'
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
          transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
        onMouseEnter={(e) => { 
          e.currentTarget.style.transform = 'scale(1.1)'; 
          e.currentTarget.style.animation = 'none'; 
        }}
        onMouseLeave={(e) => { 
          e.currentTarget.style.transform = 'scale(1)'; 
        }}
      >
        {isOpen && !isMinimized ? (
          <X size={24} />
        ) : (
          <span style={{ 
            display: 'flex', 
            animation: 'wiggle 2s infinite',
            transformOrigin: 'center' 
          }}>
            <MessageCircle size={24} />
          </span>
        )}

        {/* Unread badge */}
        {unreadCount > 0 && (!isOpen || isMinimized) && (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: '#ef4444',
            color: '#ffffff',
            fontSize: 11,
            fontWeight: 800,
            height: 20,
            minWidth: 20,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            border: '2px solid #ffffff',
            animation: 'pulse 2s infinite',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* CSS Animations */}
      <style>{`
        @keyframes chatSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes wiggle {
          0%, 15% { transform: rotateZ(0); }
          20% { transform: rotateZ(-20deg) scale(1.1); }
          25% { transform: rotateZ(15deg) scale(1.1); }
          30% { transform: rotateZ(-15deg) scale(1.1); }
          35% { transform: rotateZ(10deg) scale(1.1); }
          40% { transform: rotateZ(-5deg) scale(1.1); }
          45%, 100% { transform: rotateZ(0) scale(1); }
        }
      `}</style>
    </>
  );
}
