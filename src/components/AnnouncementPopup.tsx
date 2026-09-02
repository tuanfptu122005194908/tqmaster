import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/lib/AppContext';
import { Bell, X, Sparkles } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
}

const KEYFRAMES = `
@keyframes annOverlayIn { from { opacity: 0 } to { opacity: 1 } }
@keyframes annPopIn {
  0% { opacity: 0; transform: translateY(24px) scale(0.94); }
  60% { opacity: 1; transform: translateY(-4px) scale(1.015); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes annGlow {
  0%, 100% { box-shadow: 0 24px 70px -18px hsl(var(--primary) / 0.55), 0 0 0 1px hsl(var(--primary) / 0.25); }
  50% { box-shadow: 0 30px 90px -14px hsl(var(--primary) / 0.8), 0 0 0 6px hsl(var(--primary) / 0.14); }
}
@keyframes annBellRing {
  0%, 60%, 100% { transform: rotate(0deg); }
  5% { transform: rotate(16deg); } 10% { transform: rotate(-14deg); }
  15% { transform: rotate(11deg); } 20% { transform: rotate(-9deg); }
  25% { transform: rotate(6deg); } 30% { transform: rotate(-4deg); }
  35% { transform: rotate(0deg); }
}
@keyframes annBadgePulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.12); opacity: 0.85; }
}
@keyframes annShine {
  0% { transform: translateX(-120%) skewX(-18deg); }
  100% { transform: translateX(320%) skewX(-18deg); }
}
`;

export default function AnnouncementPopup() {
  const { profile } = useApp();
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  const showIfUnseen = useCallback((data: Announcement) => {
    if (!profile) return;
    const key = `seen_announcement_${profile.id}`;
    if (localStorage.getItem(key) !== data.id) {
      setAnn(data);
      setOpen(true);
    }
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    const run = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('id, title, content, image_url, created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled || !data) return;
      showIfUnseen(data as Announcement);
    };
    run();

    // Nhận thông báo mới ngay lập tức (realtime) — không cần tải lại trang
    const channel = supabase
      .channel('announcements-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        payload => {
          const row = payload.new as Announcement;
          if (!cancelled && row?.id) showIfUnseen(row);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [profile, showIfUnseen]);

  const dismiss = () => {
    if (ann && profile) {
      localStorage.setItem(`seen_announcement_${profile.id}`, ann.id);
    }
    setOpen(false);
  };

  if (!open || !ann) return null;

  return (
    <div
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-label="Thông báo mới"
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'hsl(240 25% 8% / 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'annOverlayIn 0.2s ease',
      }}
    >
      <style>{KEYFRAMES}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(500px, 100%)', maxHeight: '88vh', overflow: 'auto',
          background: 'hsl(var(--surface-raised))',
          borderRadius: 'calc(var(--radius) * 2.5)',
          display: 'flex', flexDirection: 'column',
          animation: 'annPopIn 0.42s cubic-bezier(0.34, 1.4, 0.64, 1), annGlow 2.4s ease-in-out 0.4s infinite',
        }}
      >
        {/* Header nổi bật */}
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: 'var(--space-5) var(--space-6)',
            background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.75) 55%, hsl(var(--accent, var(--primary)) / 0.9) 100%)',
            color: 'hsl(var(--primary-foreground))',
            borderRadius: 'calc(var(--radius) * 2.5) calc(var(--radius) * 2.5) 0 0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)',
          }}
        >
          {/* vệt sáng chạy ngang */}
          <span
            aria-hidden
            style={{
              position: 'absolute', top: 0, bottom: 0, left: 0, width: '35%',
              background: 'linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.28), transparent)',
              animation: 'annShine 2.6s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0, position: 'relative' }}>
            <div
              style={{
                width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                background: 'hsl(0 0% 100% / 0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Bell size={22} style={{ animation: 'annBellRing 2.2s ease-in-out infinite', transformOrigin: '50% 10%' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>Thông báo mới</span>
                <span
                  style={{
                    fontSize: '0.625rem', fontWeight: 900, letterSpacing: '0.08em',
                    padding: '2px 7px', borderRadius: 999,
                    background: 'hsl(0 0% 100% / 0.9)', color: 'hsl(var(--primary))',
                    animation: 'annBadgePulse 1.2s ease-in-out infinite',
                  }}
                >
                  MỚI
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                {new Date(ann.created_at).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label="Đóng"
            style={{
              position: 'relative',
              width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'hsl(0 0% 100% / 0.18)', color: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem', lineHeight: 1.3, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <Sparkles size={20} style={{ color: 'hsl(var(--primary))', flexShrink: 0, marginTop: 3 }} />
            <span>{ann.title}</span>
          </h2>
          {ann.image_url && (
            <img
              src={ann.image_url}
              alt={ann.title}
              loading="lazy"
              style={{ width: '100%', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}
            />
          )}
          {ann.content && (
            <p style={{ fontSize: '0.9375rem', color: 'hsl(var(--muted-fg))', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
              {ann.content}
            </p>
          )}
        </div>

        <div style={{ padding: 'var(--space-4) var(--space-6) var(--space-6)' }}>
          <button
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', fontWeight: 700, padding: '12px 16px', fontSize: '0.9375rem' }}
            onClick={dismiss}
          >
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
}
