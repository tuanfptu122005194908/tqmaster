import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useApp } from '@/lib/AppContext';
import { formatPrice } from '@/lib/mockData';
import { Plus, Trash2, Pencil, X, Check, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';

type Coupon = Tables<'discount_codes'>;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)',
  fontSize: '0.875rem', outline: 'none', background: 'hsl(var(--surface-raised))',
};

export default function AdminCoupons() {
  const { profile } = useApp();
  const [coupons,  setCoupons]  = useState<Coupon[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', value: 10, discount_type: 'percent', is_active: true, max_uses: '' });

  const fetch = async () => {
    const { data } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false });
    setCoupons(data ?? []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm({ code: '', value: 10, discount_type: 'percent', is_active: true, max_uses: '' }); setEditing(null); setShowForm(true); };
  const openEdit   = (c: Coupon) => { setForm({ code: c.code, value: c.value, discount_type: c.discount_type || 'percent', is_active: c.is_active, max_uses: c.max_uses ? String(c.max_uses) : '' }); setEditing(c.id); setShowForm(true); };

  const save = async () => {
    if (!form.code.trim()) return;
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      value: form.value,
      discount_type: form.discount_type,
      is_active: form.is_active,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
    };

    let err = null;
    if (editing) {
      const { error } = await supabase.from('discount_codes').update(payload).eq('id', editing);
      err = error;
    } else {
      const { error } = await supabase.from('discount_codes').insert({ ...payload, created_by: profile?.id });
      err = error;
    }

    setSaving(false);
    if (err) {
      alert('Lỗi lưu mã giảm giá: ' + err.message);
    } else {
      setShowForm(false);
      await fetch();
    }
  };

  const remove  = async (id: string) => {
    if (!confirm('Xóa mã này?')) return;
    const { error } = await supabase.from('discount_codes').delete().eq('id', id);
    if (error) {
      alert('Không thể xóa mã giảm giá: ' + error.message);
    } else {
      await fetch();
    }
  };

  const toggle  = async (c: Coupon) => {
    const { error } = await supabase.from('discount_codes').update({ is_active: !c.is_active }).eq('id', c.id);
    if (error) {
      alert('Lỗi cập nhật trạng thái: ' + error.message);
    } else {
      await fetch();
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Mã giảm giá</h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>{coupons.length} mã</p>
        </div>
        <button id="create-coupon-btn" className="btn-primary" onClick={openCreate}><Plus size={15} /> Tạo mã mới</button>
      </div>

      <div style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 1.5)', overflow: 'hidden' }}>
        {coupons.length === 0 ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'hsl(var(--muted-fg))' }}>Chưa có mã giảm giá nào</div>
        ) : (
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th>Mã</th><th>Loại / Giá trị</th><th>Đã dùng</th><th>Trạng thái</th><th>Ngày tạo</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr></thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id}>
                  <td><code style={{ fontWeight: 700, fontSize: '0.9rem', background: 'hsl(var(--muted))', padding: '2px 8px', borderRadius: 4 }}>{c.code}</code></td>
                  <td><span style={{ fontWeight: 700, color: 'hsl(var(--success))' }}>-{c.discount_type === 'percent' ? `${c.value}%` : formatPrice(Number(c.value))}</span></td>
                  <td style={{ color: 'hsl(var(--muted-fg))' }}>{c.used_count} lần {c.max_uses ? `/ ${c.max_uses}` : ''}</td>
                  <td>
                    <button onClick={() => toggle(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {c.is_active
                        ? <><ToggleRight size={20} style={{ color: 'hsl(var(--success))' }} /><span style={{ fontSize: '0.75rem', color: 'hsl(var(--success))' }}>Hoạt động</span></>
                        : <><ToggleLeft size={20} style={{ color: 'hsl(var(--muted-fg))' }} /><span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>Tắt</span></>}
                    </button>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>{c.created_at.split('T')[0]}</td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                      <button className="btn-ghost" style={{ padding: 6 }} onClick={() => openEdit(c)}><Pencil size={14} /></button>
                      <button className="btn-ghost" style={{ padding: 6, color: 'hsl(var(--danger))' }} onClick={() => remove(c.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'hsl(240 20% 12% / 0.4)', zIndex: 200 }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 360, background: 'hsl(var(--surface-raised))', boxShadow: 'var(--shadow-lg)', zIndex: 201, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>{editing ? 'Sửa mã' : 'Tạo mã mới'}</h2>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Mã giảm giá *</label>
                <input id="coupon-code-input" style={{ ...inputStyle, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="VD: SALE20" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Loại giảm giá</label>
                <select style={inputStyle} value={form.discount_type} onChange={e => setForm(p => ({ ...p, discount_type: e.target.value }))}>
                  <option value="percent">Giảm theo %</option>
                  <option value="fixed">Giảm số tiền cụ thể (VNĐ)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>
                  {form.discount_type === 'percent' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (VNĐ)'}
                </label>
                <input style={inputStyle} type="number" min={1} max={form.discount_type === 'percent' ? 100 : undefined} value={form.value} onChange={e => setForm(p => ({ ...p, value: +e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>
                  Số lượt dùng tối đa (để trống nếu không giới hạn)
                </label>
                <input style={inputStyle} type="number" min={1} value={form.max_uses} onChange={e => setForm(p => ({ ...p, max_uses: e.target.value }))} placeholder="Không giới hạn" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'hsl(var(--primary))' }} />
                Kích hoạt ngay
              </label>
            </div>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Hủy</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={save} disabled={saving}>
                {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={15} />}
                {editing ? 'Lưu' : 'Tạo mã'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
