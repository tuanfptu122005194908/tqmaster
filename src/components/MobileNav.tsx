import React from 'react';
import { Home, BookOpen, ShoppingCart, User, Newspaper } from 'lucide-react';
import { useApp } from '@/lib/AppContext';

import { useNavigate, useLocation } from 'react-router-dom';

export default function MobileNav() {
    const { isAdmin, cart } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  if (isAdmin && location.pathname.startsWith('/admin')) {
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
        const pathName = item.id === 'home' ? '/' : `/${item.id}`;
        const Icon = item.icon;
        const isActive = location.pathname === pathName;
        return (
          <button
            key={item.id}
            onClick={() => navigate(pathName)}
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
              position: 'relative'
            }}
            className="touch-target"
          >
            <div style={{ position: 'relative' }}>
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              {item.id === 'cart' && cart.length > 0 && (
                <span className="animate-bounce" style={{
                  position: 'absolute', top: -6, right: -8,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#ef4444', color: 'white',
                  fontSize: 10, fontWeight: 900,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                }}>{cart.length}</span>
              )}
            </div>
            <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 500 }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
