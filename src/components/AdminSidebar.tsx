import React from 'react';
import { useApp } from '@/lib/AppContext';
import {
  LayoutDashboard, BookOpen, FileText, Library, Bell, Newspaper,
  ShoppingBag, Tag, Users, Settings,
} from 'lucide-react';

const NAV = [
  { key: 'admin-dashboard',     label: 'Dashboard',   icon: LayoutDashboard },
  { key: 'admin-subjects',      label: 'Môn học',     icon: BookOpen },
  { key: 'admin-exams',         label: 'Đề thi',      icon: FileText },
  { key: 'admin-theory',        label: 'Lý thuyết',   icon: Library },
  { key: 'admin-announcements', label: 'Thông báo',   icon: Bell },
  { key: 'admin-news',          label: 'Tin tức',     icon: Newspaper },
  null, // divider
  { key: 'admin-orders',        label: 'Đơn hàng',    icon: ShoppingBag },
  { key: 'admin-coupons',       label: 'Mã giảm giá', icon: Tag },
  { key: 'admin-users',         label: 'Người dùng',  icon: Users },
  null,
  { key: 'admin-settings',      label: 'Cài đặt',     icon: Settings },
];

export default function AdminSidebar() {
  const { currentView, setCurrentView, pendingOrdersCount } = useApp();

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      minWidth: 'var(--sidebar-w)',
      maxWidth: 'var(--sidebar-w)',
      flexShrink: 0,
      flexGrow: 0,
      background: 'hsl(var(--sidebar-background))',
      borderRight: '1px solid hsl(var(--border))',
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - var(--topnav-h))',
      position: 'sticky',
      top: 'var(--topnav-h)',
      overflow: 'hidden',
    }}>
      <nav style={{ 
        padding: 'var(--space-3) var(--space-3)', 
        flex: 1,
        overflowY: 'auto',
      }}>
        {NAV.map((item, i) => {
          if (!item) return (
            <div key={i} style={{ height: 1, background: 'hsl(var(--border))', margin: 'var(--space-3) var(--space-2)' }} />
          );
          const active = currentView === item.key;
          const Icon   = item.icon;
          const hasBadge = item.key === 'admin-orders' && pendingOrdersCount > 0;

          return (
            <button
              key={item.key}
              id={`admin-nav-${item.key}`}
              onClick={() => setCurrentView(item.key as any)}
              className={`nav-item${active ? ' active' : ''}`}
              style={{ marginBottom: 2, position: 'relative' }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} />
              {item.label}
              
              {hasBadge && (
                <span style={{
                  position: 'absolute',
                  right: 'var(--space-3)',
                  background: 'hsl(var(--danger))',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 800,
                  height: 18,
                  minWidth: 18,
                  borderRadius: 9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 5px',
                  boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)',
                  animation: 'pulse 2s infinite',
                }}>
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div style={{
        padding: 'var(--space-4) var(--space-5)',
        borderTop: '1px solid hsl(var(--border))',
      }}>
        <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-medium)', color: 'hsl(var(--subtle-fg))', letterSpacing: 'var(--ls-wider)', textTransform: 'uppercase' }}>
          TQMaster Admin
        </div>
      </div>
    </aside>
  );
}
