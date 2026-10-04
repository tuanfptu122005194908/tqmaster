import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export default function FacebookWidget() {
  const { isAdmin, siteSettings } = useApp();

  // Chỉ hiển thị cho user thường (không phải admin)
  if (isAdmin) return null;

  const handleClick = () => {
    const link = siteSettings['facebook_url'] || 'https://www.facebook.com';
    window.open(link, '_blank');
  };

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: 'var(--space-6)',
        right: 'var(--space-6)',
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'hsl(var(--primary))',
        color: 'white',
        border: 'none',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        zIndex: 1000,
        transition: 'transform 0.2s ease',
      }}
      title="Liên hệ với chúng tôi"
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <MessageCircle size={28} />
    </button>
  );
}
