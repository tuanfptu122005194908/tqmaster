import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/lib/AppContext';
import { Bell, X } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
}

export default function AnnouncementPopup() {
  const { profile } = useApp();
  const [ann, setAnn] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

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

      const key = `seen_announcement_${profile.id}`;
      const seen = localStorage.getItem(key);
      if (seen !== data.id) {
        setAnn(data as Announcement);
        setOpen(true);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [profile]);

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
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'hsl(240 20% 12% / 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 'min(460px, 100%)', maxHeight: '85vh', overflow: 'auto',
          background: 'hsl(var(--surface-raised))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'calc(var(--radius) * 2)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', minWidth: 0 }}>
            <Bell size={18} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Thông báo mới</span>
          </div>
          <button className="btn-ghost" style={{ padding: 6 }} onClick={dismiss}><X size={18} /></button>
        </div>

        <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.125rem', lineHeight: 1.3 }}>{ann.title}</h2>
          {ann.image_url && (
            <img src={ann.image_url} alt="" style={{ width: '100%', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }} />
          )}
          {ann.content && (
            <p style={{ fontSize: '0.9375rem', color: 'hsl(var(--muted-fg))', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{ann.content}</p>
          )}
        </div>

        <div style={{ padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid hsl(var(--border))' }}>
          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={dismiss}>Đã hiểu</button>
        </div>
      </div>
    </div>
  );
}
