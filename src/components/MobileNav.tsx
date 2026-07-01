import React from 'react';
import { Home, BookOpen, ShoppingCart, User, Newspaper } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

export default function MobileNav() {
  const { currentView, setCurrentView, isAdmin } = useApp();

  if (isAdmin && currentView.startsWith('admin-')) {
    return null;
  }

  const navItems = [
    { id: 'home', icon: Home, label: 'Khám phá' },
    { id: 'my-courses', icon: BookOpen, label: 'Khóa học' },
    { id: 'news', icon: Newspaper, label: 'Tin tức' },
    { id: 'cart', icon: ShoppingCart, label: 'Giỏ hàng' },
    { id: 'profile', icon: User, label: 'Tài khoản' },
  ];

  return (
    <nav className="show-on-mobile safe-area-bottom" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: 'var(--bottom-nav-height)',
      background: 'hsl(var(--surface-raised))',
      borderTop: '1px solid hsl(var(--border))',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 100,
    }}>
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id as any)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-fg))',
              background: 'transparent',
              border: 'none',
              width: '20%',
              padding: '8px 0',
            }}
            className="touch-target"
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 500 }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
