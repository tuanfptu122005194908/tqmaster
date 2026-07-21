import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useApp } from '@/lib/AppContext';
import { formatPrice } from '@/lib/mockData';
import { Plus, Trash2, Pencil, X, Check, ToggleLeft, ToggleRight, Loader2, Tag, Ticket, HelpCircle } from 'lucide-react';

type Coupon = Tables<'discount_codes'>;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #cbd5e1', borderRadius: 12,
  fontSize: '0.875rem', outline: 'none', background: '#ffffff',
  color: '#0f172a',
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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, background: '#f4f7fc' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );

  const activeCount = coupons.filter(c => c.is_active).length;
  const totalUsed = coupons.reduce((sum, c) => sum + Number(c.used_count || 0), 0);

  return (
    <div className="admin-coupons-container" style={{ padding: '28px 36px', flex: 1, minWidth: 0, background: '#f4f7fc', minHeight: '100vh', color: '#0f172a', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* ── Breadcrumb & Header ── */}
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>
        Hệ thống <span style={{ margin: '0 6px', color: '#cbd5e1' }}>›</span> <strong style={{ color: '#2563eb' }}>Mã giảm giá</strong>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 6px 0' }}>
            Mã giảm giá
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
            Quản lý các chương trình khuyến mãi và voucher ưu đãi khách hàng.
          </p>
        </div>

        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#ffffff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800,
            cursor: 'pointer', boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
            transition: 'transform 0.15s ease'
          }}
        >
          <Plus size={18} /> Tạo mã mới
        </button>
      </div>

      {/* ── 4 STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Tổng số mã</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{coupons.length} <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>mã</span></div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Đang hiệu lực</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#2563eb' }}>{activeCount}</span>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: '#dbeafe', color: '#1d4ed8' }}>ACTIVE</span>
          </div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Đã sử dụng</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{totalUsed} <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>lượt</span></div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>Doanh thu ưu đãi</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>0 <span style={{ fontSize: 13, fontWeight: 500, color: '#94a3b8' }}>đ</span></div>
        </div>
      </div>

      {/* ── MAIN CONTENT (Coupons Table or Dashboard Empty State) ── */}
      {coupons.length === 0 ? (
        <div style={{
          background: '#ffffff',
          border: '2px dashed #cbd5e1',
          borderRadius: 24,
          padding: '64px 32px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#eff6ff', color: '#2563eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px auto', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.15)'
          }}>
            <Ticket size={36} />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
            Chưa có mã giảm giá nào
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', maxWidth: 460, margin: '0 auto 28px auto', lineHeight: 1.5 }}>
            Hãy bắt đầu tạo các chương trình khuyến mãi đầu tiên để thu hút thêm học viên cho hệ thống của bạn.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 14 }}>
            <button
              onClick={openCreate}
              style={{
                padding: '12px 24px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800,
                cursor: 'pointer', boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)'
              }}
            >
              Tạo chiến dịch mới
            </button>
            <button
              style={{
                padding: '12px 24px', background: '#ffffff', color: '#475569',
                border: '1.5px solid #cbd5e1', borderRadius: 14, fontSize: 14, fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Tìm hiểu thêm
            </button>
          </div>

          {/* Decorative Tag Icon at Bottom Right */}
          <div style={{ position: 'absolute', right: 28, bottom: 20, opacity: 0.15, color: '#0f172a' }}>
            <Tag size={96} />
          </div>
        </div>
      ) : (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          {/* Desktop Table View */}
          <div className="hidden-mobile" style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', minWidth: 650, borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>MÃ KHUYẾN MÃI</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>GIÁ TRỊ GIẢM</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>LƯỢT DÙNG</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>TRẠNG THÁI</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569' }}>NGÀY TẠO</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', textAlign: 'right' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 900, color: '#2563eb', fontFamily: 'monospace', fontSize: 15 }}>
                      {c.code}
                    </td>
                    <td style={{ padding: '16px 20px', fontWeight: 800, color: '#15803d' }}>
                      {c.discount_type === 'percent' ? `Giảm ${c.value}%` : `Giảm ${formatPrice(c.value)}`}
                    </td>
                    <td style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>
                      {c.used_count ?? 0} {c.max_uses ? `/ ${c.max_uses}` : ''}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <button onClick={() => toggle(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: c.is_active ? '#dcfce7' : '#f1f5f9', color: c.is_active ? '#15803d' : '#64748b', border: c.is_active ? '1px solid #bbf7d0' : '1px solid #cbd5e1' }}>
                          {c.is_active ? 'Hoạt động' : 'Đã ẩn'}
                        </span>
                      </button>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#64748b' }}>
                      {new Date(c.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <button onClick={() => openEdit(c)} style={{ padding: 6, background: '#f1f5f9', border: 'none', borderRadius: 8, color: '#475569', cursor: 'pointer' }}>
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => remove(c.id)} style={{ padding: 6, background: '#ffe4e6', border: 'none', borderRadius: 8, color: '#e11d48', cursor: 'pointer' }}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards List */}
          <div className="visible-mobile" style={{ display: 'none', flexDirection: 'column', gap: 12, padding: 16 }}>
            {coupons.map((c) => (
              <div key={c.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 900, color: '#2563eb', fontSize: 15, fontFamily: 'monospace' }}>{c.code}</span>
                  <button onClick={() => toggle(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: c.is_active ? '#dcfce7' : '#f1f5f9', color: c.is_active ? '#15803d' : '#64748b' }}>
                      {c.is_active ? 'Hoạt động' : 'Đã ẩn'}
                    </span>
                  </button>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#15803d', marginBottom: 4 }}>
                  {c.discount_type === 'percent' ? `Giảm ${c.value}%` : `Giảm ${formatPrice(c.value)}`}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748b' }}>
                  <span>Lượt dùng: {c.used_count ?? 0}{c.max_uses ? `/${c.max_uses}` : ''}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => openEdit(c)} style={{ padding: 6, background: '#f1f5f9', border: 'none', borderRadius: 8, color: '#475569', cursor: 'pointer' }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove(c.id)} style={{ border: 'none', background: '#fff1f2', color: '#e11d48', padding: 6, borderRadius: 8, cursor: 'pointer' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT FORM MODAL ── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#ffffff', width: '100%', maxWidth: 440, borderRadius: 24,
            padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {editing ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Mã giảm giá</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VD: CHAOHE2026" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Loại giảm giá</label>
                  <select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })} style={inputStyle}>
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Giá trị</label>
                  <input type="number" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Số lượt dùng tối đa</label>
                <input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="Để trống nếu không giới hạn" style={inputStyle} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} id="active-check" style={{ width: 18, height: 18, accentColor: '#2563eb', cursor: 'pointer' }} />
                <label htmlFor="active-check" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>Kích hoạt ngay mã này</label>
              </div>

              <button
                onClick={save} disabled={saving}
                style={{
                  height: 48, width: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800,
                  cursor: saving ? 'not-allowed' : 'pointer', marginTop: 12, boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)'
                }}
              >
                {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : (editing ? 'Lưu thay đổi' : 'Tạo mã giảm giá')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .admin-coupons-container {
            padding: 16px !important;
          }
          .hidden-mobile { display: none !important; }
          .visible-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
