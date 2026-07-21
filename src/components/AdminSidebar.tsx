import React from 'react';
import { useApp } from '@/lib/AppContext';
import {
  LayoutDashboard, BookOpen, FileText, Library, Bell, Newspaper,
  ShoppingBag, Tag, Users, Settings, Mountain
} from 'lucide-react';
import authMountainBg from '@/assets/auth-mountain-bg.png';

const NAV = [
  { key: 'admin-dashboard',     label: 'Dashboard',   icon: LayoutDashboard },
  { key: 'admin-orders',        label: 'Đơn hàng',    icon: ShoppingBag },
  { key: 'admin-subjects',      label: 'Môn học',     icon: BookOpen },
  { key: 'admin-exams',         label: 'Đề thi',      icon: FileText },
  { key: 'admin-theory',        label: 'Lý thuyết',   icon: Library },
  { key: 'admin-announcements', label: 'Thông báo',   icon: Bell },
  { key: 'admin-news',          label: 'Tin tức',     icon: Newspaper },
  null, // divider
  { key: 'admin-coupons',       label: 'Mã giảm giá', icon: Tag },
  { key: 'admin-users',         label: 'Người dùng',  icon: Users },
  null,
  { key: 'admin-settings',      label: 'Cài đặt',     icon: Settings },
];

export default function AdminSidebar() {
  const { currentView, setCurrentView, pendingOrdersCount } = useApp();

  return (
    <aside style={{
      width: 250,
      minWidth: 250,
      maxWidth: 250,
      flexShrink: 0,
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 64px)',
      position: 'sticky',
      top: 64,
      overflow: 'hidden',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Top Sidebar Brand Badge */}
      <div style={{
        padding: '20px 20px 12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        }}>
          <Mountain size={20} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
            TQMaster System
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginTop: 2 }}>
            Admin Portal
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ 
        padding: '12px 14px', 
        flex: 1,
        overflowY: 'auto',
      }}>
        {NAV.map((item, i) => {
          if (!item) return (
            <div key={i} style={{ height: 1, background: '#f1f5f9', margin: '10px 8px' }} />
          );
          const active = currentView === item.key;
          const Icon   = item.icon;
          const hasBadge = item.key === 'admin-orders' && pendingOrdersCount > 0;

          return (
            <button
              key={item.key}
              id={`admin-nav-${item.key}`}
              onClick={() => setCurrentView(item.key as any)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 12,
                border: 'none',
                marginBottom: 3,
                fontSize: 14,
                fontWeight: active ? 700 : 500,
                color: active ? '#2563eb' : '#475569',
                background: active ? '#eff6ff' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                position: 'relative',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = '#f8fafc';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Icon size={18} style={{ color: active ? '#2563eb' : '#64748b', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{item.label}</span>
              
              {hasBadge && (
                <span style={{
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
                  padding: '0 6px',
                  boxShadow: '0 2px 6px rgba(239, 68, 68, 0.35)',
                }}>
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Mountain Illustration Decoration */}
      <div style={{
        height: 140,
        position: 'relative',
        marginTop: 'auto',
        background: `url(${authMountainBg}) no-repeat center bottom`,
        backgroundSize: 'cover',
        borderTop: '1px solid #f1f5f9',
        opacity: 0.88,
      }} />
    </aside>
  );
}
