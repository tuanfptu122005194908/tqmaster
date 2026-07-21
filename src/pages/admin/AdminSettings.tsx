import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/lib/AppContext';
import { Check, Loader2, Save, Settings, Landmark, Globe } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import { toast } from 'sonner';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid #cbd5e1', borderRadius: 12,
  fontSize: '0.875rem', outline: 'none', background: '#ffffff',
  color: '#0f172a', transition: 'all 0.15s ease',
  boxSizing: 'border-box'
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
    toast.success('Đã lưu cấu hình hệ thống thành công');
    setTimeout(() => setSaved(false), 2500);
  };

  const Section = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, overflow: 'hidden', marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={16} />
        </div>
        <h2 style={{ fontWeight: 900, fontSize: 16, color: '#0f172a', margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>{children}</div>
    </div>
  );

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 450, background: '#f4f7fc' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );

  return (
    <div className="admin-settings-container" style={{ padding: '32px 40px', background: '#f4f7fc', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", color: '#0f172a', maxWidth: 840 }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
            Cài đặt hệ thống
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
            Quản lý thông tin thanh toán chuyển khoản, QR Code và thông tin tổng quan của hệ thống TQMaster.
          </p>
        </div>

        <button
          onClick={save}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#ffffff',
            border: 'none', borderRadius: 14, fontSize: 13.5, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)', transition: 'transform 0.15s ease'
          }}
        >
          {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <Check size={16} strokeWidth={3} /> : <Save size={16} />}
          {saving ? 'Đang lưu...' : saved ? 'Đã lưu!' : 'Lưu cấu hình'}
        </button>
      </div>

      <Section title="Thông tin website" icon={Globe}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Tên website hệ thống</label>
          <input id="site-name-input" style={inputStyle} value={settings['site_name'] ?? ''} onChange={e => set('site_name', e.target.value)} placeholder="TQMaster - Nền tảng học tập thông minh" />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Thông tin liên hệ & Hỗ trợ</label>
          <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={settings['contact_info'] ?? ''} onChange={e => set('contact_info', e.target.value)} placeholder="Email hỗ trợ, Số điện thoại, Link Zalo..." />
        </div>
      </Section>

      <Section title="Thông tin chuyển khoản ngân hàng" icon={Landmark}>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Tên ngân hàng</label>
          <input id="bank-name-input" style={inputStyle} value={settings['bank_name'] ?? ''} onChange={e => set('bank_name', e.target.value)} placeholder="VD: MBBank / Vietcombank" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Số tài khoản</label>
            <input id="account-number-input" style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 800 }} value={settings['bank_account'] ?? ''} onChange={e => set('bank_account', e.target.value)} placeholder="VD: 0987654321" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Chủ tài khoản</label>
            <input style={{ ...inputStyle, textTransform: 'uppercase', fontWeight: 800 }} value={settings['bank_owner'] ?? ''} onChange={e => set('bank_owner', e.target.value.toUpperCase())} placeholder="VD: NGUYEN VAN A" />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Nội dung chuyển khoản mẫu</label>
          <input id="transfer-content-input" style={inputStyle} value={settings['bank_content'] ?? ''} onChange={e => set('bank_content', e.target.value)} placeholder="TQMASTER [MaSV] [HoTen]" />
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 4, fontStyle: 'italic' }}>Dùng [MaSV] và [HoTen] làm placeholder tự động điền</p>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>QR Code nhận thanh toán</label>
          <FileUploader
            bucket="qr-codes"
            value={settings['bank_qr_url'] ?? ''}
            onChange={url => set('bank_qr_url', url)}
            accept="image/*"
            preview="image"
            label="Tải ảnh QR Code"
          />
        </div>
      </Section>

      {/* Save action button footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#ffffff',
            border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)', transition: 'transform 0.15s ease'
          }}
        >
          {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <Check size={18} strokeWidth={3} /> : <Save size={18} />}
          {saving ? 'Đang lưu...' : saved ? 'Đã lưu thành công!' : 'Lưu cấu hình hệ thống'}
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .admin-settings-container {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
