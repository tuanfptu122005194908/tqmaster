import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/lib/AppContext';
import { Check, Loader2 } from 'lucide-react';
import FileUploader from '@/components/FileUploader';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)',
  fontSize: '0.875rem', outline: 'none', background: 'hsl(var(--surface-raised))',
};

const KEYS = ['bank_name', 'bank_account', 'bank_owner', 'bank_content', 'bank_qr_url', 'contact_info', 'site_name'] as const;
type SettingKey = typeof KEYS[number];

export default function AdminSettings() {
  const { profile } = useApp();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    supabase.from('system_settings').select('key, value').then(({ data }) => {
      const map: Record<string, string> = {};
      (data ?? []).forEach(r => { map[r.key] = r.value ?? ''; });
      setSettings(map);
      setLoading(false);
    });
  }, []);

  const set = (k: string, v: string) => setSettings(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    const updates = KEYS.map(k => supabase.from('system_settings').upsert({ key: k, value: settings[k] ?? '', updated_by: profile?.id, updated_at: new Date().toISOString() }));
    await Promise.all(updates);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 1.5)', overflow: 'hidden', marginBottom: 'var(--space-5)' }}>
      <div style={{ padding: 'var(--space-4) var(--space-6)', borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--muted))' }}>
        <h2 style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{title}</h2>
      </div>
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>{children}</div>
    </div>
  );

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)', flex: 1, maxWidth: 680 }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Cài đặt hệ thống</h1>
        <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>Thông tin thanh toán và cấu hình hệ thống</p>
      </div>

      <Section title="Thông tin website">
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Tên website</label>
          <input id="site-name-input" style={inputStyle} value={settings['site_name'] ?? ''} onChange={e => set('site_name', e.target.value)} />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Thông tin liên hệ</label>
          <textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={settings['contact_info'] ?? ''} onChange={e => set('contact_info', e.target.value)} placeholder="Email, SĐT, Zalo..." />
        </div>
      </Section>

      <Section title="Thông tin chuyển khoản">
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Tên ngân hàng</label>
          <input id="bank-name-input" style={inputStyle} value={settings['bank_name'] ?? ''} onChange={e => set('bank_name', e.target.value)} placeholder="VD: Vietcombank" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Số tài khoản</label>
            <input id="account-number-input" style={{ ...inputStyle, fontFamily: 'monospace' }} value={settings['bank_account'] ?? ''} onChange={e => set('bank_account', e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Chủ tài khoản</label>
            <input style={{ ...inputStyle, textTransform: 'uppercase' }} value={settings['bank_owner'] ?? ''} onChange={e => set('bank_owner', e.target.value.toUpperCase())} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: 6 }}>Nội dung chuyển khoản mẫu</label>
          <input id="transfer-content-input" style={inputStyle} value={settings['bank_content'] ?? ''} onChange={e => set('bank_content', e.target.value)} placeholder="TQMASTER [MaSV] [HoTen]" />
          <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))', marginTop: 4 }}>Dùng [MaSV] và [HoTen] làm placeholder</p>
        </div>
        <FileUploader
          bucket="qr-codes"
          value={settings['bank_qr_url'] ?? ''}
          onChange={url => set('bank_qr_url', url)}
          accept="image/*"
          preview="image"
          label="QR code thanh toán"
        />
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button id="save-settings-btn" className="btn-primary" style={{ minWidth: 140, justifyContent: 'center', background: saved ? 'hsl(var(--success))' : undefined }} onClick={save} disabled={saving}>
          {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <Check size={15} /> : null}
          {saving ? 'Đang lưu...' : saved ? 'Đã lưu!' : 'Lưu cài đặt'}
        </button>
      </div>
    </div>
  );
}
