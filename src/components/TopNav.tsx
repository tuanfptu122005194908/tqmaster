import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/AppContext';
import { BookOpen, ShoppingCart, User, LayoutDashboard, LogOut, ChevronDown, Search, Facebook, Youtube, Newspaper } from 'lucide-react';
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
      height: 'var(--topnav-h)',
      background: 'hsl(var(--surface-raised))',
      borderBottom: '1px solid hsl(var(--border))',
      display: 'flex', alignItems: 'center',
      padding: '0 var(--space-6)', gap: 'var(--space-6)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.06)',
    }}>
      {/* Brand & Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)', flexShrink: 0 }}>
        {/* Logo */}
        <button
          id="nav-logo"
          onClick={() => setCurrentView(isAdmin ? 'admin-dashboard' : 'home')}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 10, border: 'none', background: 'none', cursor: 'pointer', padding: 0,
            transition: 'transform var(--duration-fast) var(--ease-out-quart)',
          }}
        >
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            overflow: 'hidden', border: '1.5px solid hsl(var(--surface-raised))',
            background: 'white', boxShadow: '0 4px 12px hsl(var(--primary) / 0.2)',
          }}>
            <img src={logoAvatar} alt="TQMaster" width={34} height={34} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: '1.125rem', letterSpacing: '-0.02em', color: 'hsl(var(--foreground))' }}>TQMaster</span>
        </button>

        {/* Links */}
        <div className="hide-on-mobile" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
          <button 
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 600, color: currentView === 'home' ? 'hsl(var(--primary))' : 'hsl(var(--foreground))', transition: 'color 0.2s' }}
            onClick={() => setCurrentView('home')}
          >
            Khóa học
          </button>

          {profile && !isAdmin && (
            <button 
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 600, color: currentView === 'my-courses' ? 'hsl(var(--primary))' : 'hsl(var(--foreground))', transition: 'color 0.2s' }}
              onClick={() => setCurrentView('my-courses')}
            >
              Khóa học của bạn
            </button>
          )}
          <button 
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 600, color: currentView === 'news' ? 'hsl(var(--primary))' : 'hsl(var(--foreground))', transition: 'color 0.2s' }}
            onClick={() => setCurrentView('news')}
          >
            Tin tức
          </button>
          
          <div ref={contactRef} style={{ position: 'relative' }}>
            <button 
              style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontSize: '0.9375rem', fontWeight: 600, color: contactOpen ? 'hsl(var(--primary))' : 'hsl(var(--foreground))', display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.2s' }}
              onClick={() => setContactOpen(!contactOpen)}
            >
              Liên hệ <ChevronDown size={14} style={{ transform: contactOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
            {contactOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 12px)', left: -20, width: 220, background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 12, boxShadow: 'var(--shadow-lg)', padding: 'var(--space-2)', zIndex: 100, animation: 'slideUp 0.2s ease' }}>
                <a href="https://www.facebook.com/tuanvaquan" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'hsl(var(--foreground))', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--muted))'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                  <Facebook size={18} color="#1877F2" /> Facebook
                </a>
                <a href="https://www.youtube.com/@tuanvaquanfptu" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, color: 'hsl(var(--foreground))', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--muted))'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                  <Youtube size={18} color="#FF0000" /> YouTube
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Global Search - Highlighted */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <div className="nav-search-wrap" style={{ position: 'relative', width: '100%', maxWidth: 460 }}>
          <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-fg))', pointerEvents: 'none' }} />
          <input 
            type="text" 
            placeholder="Tìm môn học..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', padding: '9px 14px 9px 40px', borderRadius: 999, border: '2px solid hsl(var(--border))', 
              background: 'hsl(var(--muted) / 0.3)', fontSize: '0.875rem', fontWeight: 500, outline: 'none', transition: 'all 0.2s',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
            }} 
            onFocus={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = 'hsl(var(--primary))'; e.target.style.boxShadow = '0 0 0 4px hsl(var(--primary) / 0.1), var(--shadow-sm)'; }}
            onBlur={(e) => { e.target.style.background = 'hsl(var(--muted) / 0.3)'; e.target.style.borderColor = 'hsl(var(--border))'; e.target.style.boxShadow = 'inset 0 1px 2px rgba(0,0,0,0.02)'; }}
          />
        </div>
      </div>

      {/* Cart (user only) */}
      {!isAdmin && profile && (
        <button
          id="nav-cart"
          className="btn-ghost hide-on-mobile"
          style={{ position: 'relative', padding: 'var(--space-2)' }}
          onClick={() => setCurrentView('cart')}
        >
          <ShoppingCart size={18} />
          {cart.length > 0 && (
            <span style={{
              position: 'absolute', top: 1, right: 1,
              width: 15, height: 15, borderRadius: '50%',
              background: 'hsl(var(--primary))', color: 'white',
              fontSize: '0.5625rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1.5px solid hsl(var(--surface-raised))',
            }}>{cart.length}</span>
          )}
        </button>
      )}

      {/* User menu */}
      {!authLoading && profile ? (
        <div ref={menuRef} style={{ position: 'relative' }} className="hide-on-mobile">
          <button
            id="nav-user-menu"
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1px solid hsl(var(--border))',
              background: menuOpen ? 'hsl(var(--primary-muted))' : 'hsl(var(--surface-raised))',
              cursor: 'pointer',
              padding: '5px var(--space-3) 5px 6px',
              borderRadius: 999,
              transition: 'background var(--duration-fast), border-color var(--duration-fast)',
            }}
          >
            {/* Avatar circle */}
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'hsl(var(--primary))',
              color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.75rem', flexShrink: 0,
              letterSpacing: '-0.01em',
            }}>{avatarLetter}</div>

            <span style={{
              fontSize: '0.8125rem', fontWeight: 500, maxWidth: 110,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: 'hsl(var(--foreground))',
            }}>
              {profile.full_name || profile.username}
            </span>
            <ChevronDown size={13} style={{
              color: 'hsl(var(--muted-fg))', flexShrink: 0,
              transform: menuOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform var(--duration-fast)',
            }} />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)',
              width: 220,
              background: 'hsl(var(--surface-raised))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'calc(var(--radius) * 1.5)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100, overflow: 'hidden',
              animation: 'slideUp 140ms cubic-bezier(0.25,1,0.5,1) both',
            }}>
              {/* User info */}
              <div style={{ padding: 'var(--space-3) var(--space-4)', borderBottom: '1px solid hsl(var(--border))' }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 2 }}>
                  {profile.full_name || profile.username}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>{profile.email}</div>
                {isAdmin && (
                  <span className="badge badge-primary" style={{ marginTop: 'var(--space-2)' }}>Admin</span>
                )}
              </div>

              {/* Actions */}
              <div style={{ padding: 'var(--space-2)' }}>
                {!isAdmin && (
                  <MenuItem icon={<User size={14} />} label="Hồ sơ của tôi"
                    onClick={() => { setCurrentView('profile'); setMenuOpen(false); }} />
                )}
                {isAdmin && (
                  <>
                    <MenuItem icon={<LayoutDashboard size={14} />} label="Trang quản trị"
                      onClick={() => { setCurrentView('admin-dashboard'); setMenuOpen(false); }} />
                    <MenuItem icon={<BookOpen size={14} />} label="Xem trang sinh viên"
                      onClick={() => { setCurrentView('home'); setMenuOpen(false); }} />
                  </>
                )}
                <div style={{ height: 1, background: 'hsl(var(--border))', margin: '4px var(--space-2)' }} />
                <MenuItem icon={<LogOut size={14} />} label="Đăng xuất" danger
                  onClick={() => { signOut(); setMenuOpen(false); }} />
              </div>
            </div>
          )}
        </div>
      ) : !authLoading ? (
        <button id="nav-login-btn" className="btn-primary" style={{ fontSize: '0.875rem' }}
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
        display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
        width: '100%', padding: 'var(--space-2) var(--space-3)',
        border: 'none', borderRadius: 'var(--radius)',
        background: hov
          ? danger ? 'hsl(var(--danger-light))' : 'hsl(var(--primary-muted))'
          : 'none',
        cursor: 'pointer', textAlign: 'left',
        fontSize: '0.875rem',
        color: danger ? 'hsl(var(--danger))' : hov ? 'hsl(var(--primary))' : 'hsl(var(--foreground))',
        transition: 'background var(--duration-fast), color var(--duration-fast)',
      }}
    >
      {icon} {label}
    </button>
  );
}
