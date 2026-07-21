import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/AppContext';
import { BookOpen, ShoppingCart, User, LayoutDashboard, LogOut, ChevronDown, Search, Facebook, Youtube, Newspaper, X, ShieldCheck } from 'lucide-react';
import logoAvatar from '@/assets/logo-avatar.png';

export default function TopNav() {
  const { profile, isAdmin, cart, currentView, setCurrentView, signOut, authLoading, searchQuery, setSearchQuery } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) setContactOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const avatarLetter = profile?.full_name?.charAt(0)?.toUpperCase()
    ?? profile?.username?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <nav className="topnav-root" style={{
      position: 'sticky', top: 0, zIndex: 50,
      height: 64,
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      display: 'flex', alignItems: 'center',
      padding: '0 28px', gap: 24,
      boxShadow: '0 4px 20px -4px rgba(15, 23, 42, 0.04)',
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      {/* Brand & Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
        {/* Logo */}
        <button
          id="nav-logo"
          onClick={() => setCurrentView(isAdmin ? 'admin-dashboard' : 'home')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'none', cursor: 'pointer', padding: 0,
            transition: 'transform 0.15s ease',
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            overflow: 'hidden', border: '1.5px solid #e2e8f0',
            background: '#ffffff', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
          }}>
            <img src={logoAvatar} alt="TQMaster" width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: '1.2rem', letterSpacing: '-0.03em', color: '#0f172a' }}>TQMaster</span>
        </button>

        {/* Links */}
        <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button 
            style={{
              border: 'none', background: 'none', padding: '6px 4px', cursor: 'pointer',
              fontSize: 14, fontWeight: 700,
              color: currentView === 'home' ? '#2563eb' : '#475569',
              transition: 'color 0.15s'
            }}
            onClick={() => setCurrentView('home')}
          >
            Khóa học
          </button>

          {profile && !isAdmin && (
            <button 
              style={{
                border: 'none', background: 'none', padding: '6px 4px', cursor: 'pointer',
                fontSize: 14, fontWeight: 700,
                color: currentView === 'my-courses' ? '#2563eb' : '#475569',
                transition: 'color 0.15s'
              }}
              onClick={() => setCurrentView('my-courses')}
            >
              Khóa học của bạn
            </button>
          )}

          <button 
            style={{
              border: 'none', background: 'none', padding: '6px 4px', cursor: 'pointer',
              fontSize: 14, fontWeight: 700,
              color: currentView === 'news' ? '#2563eb' : '#475569',
              transition: 'color 0.15s'
            }}
            onClick={() => setCurrentView('news')}
          >
            Tin tức
          </button>
          
          <div ref={contactRef} style={{ position: 'relative' }}>
            <button 
              style={{
                border: 'none', background: 'none', padding: '6px 4px', cursor: 'pointer',
                fontSize: 14, fontWeight: 700,
                color: contactOpen ? '#2563eb' : '#475569',
                display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.15s'
              }}
              onClick={() => setContactOpen(!contactOpen)}
            >
              Liên hệ <ChevronDown size={14} style={{ transform: contactOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {contactOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 12px)', left: -10, width: 200,
                background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16,
                boxShadow: '0 12px 30px -4px rgba(15, 23, 42, 0.12)', padding: 6, zIndex: 100, animation: 'slideUp 0.15s ease'
              }}>
                <a href="https://www.facebook.com/tuanvaquan" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, color: '#0f172a', textDecoration: 'none', fontSize: 13.5, fontWeight: 600, transition: 'background 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                  <Facebook size={18} color="#1877F2" /> Facebook
                </a>
                <a href="https://www.youtube.com/@tuanvaquanfptu" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, color: '#0f172a', textDecoration: 'none', fontSize: 13.5, fontWeight: 600, transition: 'background 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                  <Youtube size={18} color="#FF0000" /> YouTube
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Search */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div className="nav-search-wrap" style={{ position: 'relative', width: '100%', maxWidth: 440 }}>
          <Search size={17} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
          <input 
            type="text" 
            placeholder="Tìm môn học..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '9px 38px 9px 44px', borderRadius: 999, border: '1.5px solid #e2e8f0', 
              background: '#f8fafc', fontSize: 13.5, fontWeight: 500, outline: 'none', transition: 'all 0.15s',
              color: '#0f172a',
            }} 
            onFocus={(e) => { e.target.style.background = '#ffffff'; e.target.style.borderColor = '#2563eb'; e.target.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.1)'; }}
            onBlur={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                width: 20, height: 20, borderRadius: '50%',
                background: '#cbd5e1', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#ffffff', padding: 0,
              }}
            >
              <X size={12} strokeWidth={3} />
            </button>
          )}
        </div>
      </div>

      {/* Cart (user only) */}
      {!isAdmin && profile && (
        <button
          id="nav-cart"
          className="btn-ghost hide-on-mobile"
          style={{ position: 'relative', padding: 8, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#475569' }}
          onClick={() => setCurrentView('cart')}
        >
          <ShoppingCart size={18} />
          {cart.length > 0 && (
            <span style={{
              position: 'absolute', top: -3, right: -3,
              width: 17, height: 17, borderRadius: '50%',
              background: '#2563eb', color: 'white',
              fontSize: 10, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #ffffff',
            }}>{cart.length}</span>
          )}
        </button>
      )}

      {/* User profile menu */}
      {!authLoading && profile ? (
        <div ref={menuRef} style={{ position: 'relative' }} className="hide-on-mobile">
          <button
            id="nav-user-menu"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              border: '1.5px solid #cbd5e1',
              background: menuOpen ? '#f1f5f9' : '#ffffff',
              cursor: 'pointer',
              padding: '5px 14px 5px 6px',
              borderRadius: 30,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              transition: 'all 0.15s ease',
            }}
          >
            {/* Avatar circle */}
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: 13, flexShrink: 0,
              boxShadow: '0 2px 6px rgba(37, 99, 235, 0.3)',
            }}>{avatarLetter}</div>

            <span style={{
              fontSize: 13.5, fontWeight: 700, maxWidth: 110,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: '#0f172a',
            }}>
              {profile.full_name || profile.username}
            </span>
            <ChevronDown size={14} style={{
              color: '#64748b', flexShrink: 0,
              transform: menuOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }} />
          </button>

          {/* User Dropdown Menu */}
          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 10px)',
              width: 230,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 18,
              boxShadow: '0 16px 36px -6px rgba(15, 23, 42, 0.15), 0 4px 12px -2px rgba(15, 23, 42, 0.05)',
              zIndex: 100, overflow: 'hidden', padding: 8,
              animation: 'slideUp 140ms cubic-bezier(0.25,1,0.5,1) both',
            }}>
              {/* User info header */}
              <div style={{ padding: '12px 14px 14px 14px', borderBottom: '1px solid #f1f5f9', marginBottom: 6 }}>
                <div style={{ fontWeight: 800, fontSize: 14.5, color: '#0f172a', marginBottom: 2 }}>
                  {profile.full_name || profile.username}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', wordBreak: 'break-all' }}>{profile.email}</div>
                {isAdmin && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    marginTop: 8, padding: '3px 10px', borderRadius: 12,
                    background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 800,
                    border: '1px solid #dbeafe'
                  }}>
                    <ShieldCheck size={12} /> Admin
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {!isAdmin && (
                  <MenuItem icon={<User size={15} />} label="Hồ sơ của tôi"
                    onClick={() => { setCurrentView('profile'); setMenuOpen(false); }} />
                )}
                {isAdmin && (
                  <>
                    <MenuItem icon={<LayoutDashboard size={15} />} label="Trang quản trị"
                      onClick={() => { setCurrentView('admin-dashboard'); setMenuOpen(false); }} />
                    <MenuItem icon={<BookOpen size={15} />} label="Xem trang sinh viên"
                      onClick={() => { setCurrentView('home'); setMenuOpen(false); }} />
                  </>
                )}
                <div style={{ height: 1, background: '#f1f5f9', margin: '4px 6px' }} />
                <MenuItem icon={<LogOut size={15} />} label="Đăng xuất" danger
                  onClick={() => { signOut(); setMenuOpen(false); }} />
              </div>
            </div>
          )}
        </div>
      ) : !authLoading ? (
        <button id="nav-login-btn" className="btn-primary" style={{ fontSize: 13.5, padding: '8px 18px', borderRadius: 12 }}
          onClick={() => setCurrentView('home')}>
          Đăng nhập
        </button>
      ) : null}
    </nav>
  );
}

function MenuItem({ icon, label, onClick, danger = false }: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '9px 12px',
        border: 'none', borderRadius: 10,
        background: hov
          ? danger ? '#ffe4e6' : '#f1f5f9'
          : 'transparent',
        cursor: 'pointer', textAlign: 'left',
        fontSize: 13.5, fontWeight: 600,
        color: danger ? '#e11d48' : hov ? '#2563eb' : '#334155',
        transition: 'all 0.15s ease',
      }}
    >
      <span style={{ color: danger ? '#e11d48' : hov ? '#2563eb' : '#64748b', display: 'flex', alignItems: 'center' }}>
        {icon}
      </span>
      {label}
    </button>
  );
}
