import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useApp } from '@/lib/AppContext';
import { formatPrice } from '@/lib/mockData';
import { toast } from 'sonner';
import {
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Loader2,
  Tag,
  Ticket,
  Search,
  Calendar,
  Clock,
  Coins,
  Copy,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';

type Coupon = Tables<'discount_codes'>;

interface FormState {
  code: string;
  value: number;
  discount_type: 'percent' | 'fixed';
  min_order_value: string;
  expires_at: string;
  max_uses: string;
  is_active: boolean;
}

const initialFormState: FormState = {
  code: '',
  value: 10,
  discount_type: 'percent',
  min_order_value: '',
  expires_at: '',
  max_uses: '',
  is_active: true,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1.5px solid #cbd5e1',
  borderRadius: 12,
  fontSize: '0.875rem',
  outline: 'none',
  background: '#ffffff',
  color: '#0f172a',
  transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
};

export default function AdminCoupons() {
  const { profile } = useApp();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'inactive'>('all');

  const fetchCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data ?? []);
    } catch (err: any) {
      toast.error('Lỗi tải danh sách mã giảm giá: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const isExpired = (c: Coupon) => {
    return c.expires_at ? new Date(c.expires_at).getTime() < Date.now() : false;
  };

  const isExpiringSoon = (c: Coupon) => {
    if (!c.expires_at) return false;
    const diff = new Date(c.expires_at).getTime() - Date.now();
    return diff > 0 && diff <= 3 * 24 * 60 * 60 * 1000;
  };

  const getDaysLeft = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
    return days;
  };

  const openCreate = () => {
    setForm({ ...initialFormState });
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    // Format expires_at for date input (YYYY-MM-DD)
    let formattedDate = '';
    if (c.expires_at) {
      const d = new Date(c.expires_at);
      formattedDate = d.toISOString().slice(0, 10);
    }

    setForm({
      code: c.code,
      value: Number(c.value) || 0,
      discount_type: (c.discount_type as 'percent' | 'fixed') || 'percent',
      min_order_value: c.min_order_value != null ? String(c.min_order_value) : '',
      expires_at: formattedDate,
      max_uses: c.max_uses != null ? String(c.max_uses) : '',
      is_active: c.is_active,
    });
    setEditing(c.id);
    setShowForm(true);
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = 'TQ';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({ ...prev, code: res }));
  };

  const setPresetDate = (daysAhead: number | null) => {
    if (daysAhead === null) {
      setForm(prev => ({ ...prev, expires_at: '' }));
      return;
    }
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    setForm(prev => ({ ...prev, expires_at: d.toISOString().slice(0, 10) }));
  };

  const setEndOfMonth = () => {
    const d = new Date();
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    setForm(prev => ({ ...prev, expires_at: endOfMonth.toISOString().slice(0, 10) }));
  };

  const save = async () => {
    const cleanCode = form.code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error('Vui lòng nhập mã giảm giá');
      return;
    }
    if (form.value <= 0) {
      toast.error('Giá trị giảm giá phải lớn hơn 0');
      return;
    }
    if (form.discount_type === 'percent' && form.value > 100) {
      toast.error('Phần trăm giảm giá không được vượt quá 100%');
      return;
    }

    setSaving(true);

    // If date is provided, set time to end of day 23:59:59
    let expiresAtIso: string | null = null;
    if (form.expires_at) {
      const [year, month, day] = form.expires_at.split('-').map(Number);
      const expiryDate = new Date(year, month - 1, day, 23, 59, 59, 999);
      expiresAtIso = expiryDate.toISOString();
    }

    const payload = {
      code: cleanCode,
      value: form.value,
      discount_type: form.discount_type,
      min_order_value: form.min_order_value ? Number(form.min_order_value) : null,
      expires_at: expiresAtIso,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      is_active: form.is_active,
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
      toast.error('Lỗi lưu mã giảm giá: ' + err.message);
    } else {
      toast.success(editing ? 'Đã cập nhật mã giảm giá' : 'Đã tạo mã giảm giá mới thành công');
      setShowForm(false);
      await fetchCoupons();
    }
  };

  const remove = async (id: string, code: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${code}"?`)) return;
    const { error } = await supabase.from('discount_codes').delete().eq('id', id);
    if (error) {
      toast.error('Không thể xóa mã: ' + error.message);
    } else {
      toast.success(`Đã xóa mã ${code}`);
      await fetchCoupons();
    }
  };

  const toggle = async (c: Coupon) => {
    const nextState = !c.is_active;
    const { error } = await supabase.from('discount_codes').update({ is_active: nextState }).eq('id', c.id);
    if (error) {
      toast.error('Lỗi cập nhật trạng thái: ' + error.message);
    } else {
      toast.success(nextState ? `Đã kích hoạt mã ${c.code}` : `Đã tạm ẩn mã ${c.code}`);
      await fetchCoupons();
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Đã sao chép mã: ${code}`);
  };

  // Stats
  const activeCount = coupons.filter(c => c.is_active && !isExpired(c)).length;
  const expiredCount = coupons.filter(c => isExpired(c) || (c.max_uses != null && (c.used_count ?? 0) >= c.max_uses)).length;
  const totalUsed = coupons.reduce((sum, c) => sum + Number(c.used_count || 0), 0);

  // Filtered list
  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      const matchesSearch = c.code.toLowerCase().includes(searchQuery.trim().toLowerCase());
      if (!matchesSearch) return false;

      if (statusFilter === 'active') {
        return c.is_active && !isExpired(c) && (c.max_uses == null || (c.used_count ?? 0) < c.max_uses);
      }
      if (statusFilter === 'expired') {
        return isExpired(c) || (c.max_uses != null && (c.used_count ?? 0) >= c.max_uses);
      }
      if (statusFilter === 'inactive') {
        return !c.is_active;
      }
      return true;
    });
  }, [coupons, searchQuery, statusFilter]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, background: '#f4f7fc' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
      </div>
    );
  }

  return (
    <div
      className="admin-coupons-container"
      style={{
        padding: '28px 36px',
        flex: 1,
        minWidth: 0,
        background: '#f4f7fc',
        minHeight: '100vh',
        color: '#0f172a',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ── Breadcrumb & Header ── */}
      <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>
        Hệ thống <span style={{ margin: '0 6px', color: '#cbd5e1' }}>›</span>{' '}
        <strong style={{ color: '#2563eb' }}>Mã giảm giá</strong>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 6px 0' }}>
            Mã giảm giá & Khuyến mãi
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
            Quản lý voucher ưu đãi, điều kiện giá trị đơn hàng tối thiểu và thời hạn áp dụng.
          </p>
        </div>

        <button
          onClick={openCreate}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 22px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
            transition: 'transform 0.15s ease',
          }}
        >
          <Plus size={18} /> Tạo mã mới
        </button>
      </div>

      {/* ── 4 STAT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        {/* Card 1: Total */}
        <div style={{ background: '#edf5ff', border: '1px solid #dbeafe', borderRadius: 20, padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>TỔNG SỐ MÃ</span>
            <Tag size={18} style={{ color: '#3b82f6' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>
            {coupons.length} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>mã</span>
          </div>
        </div>

        {/* Card 2: Active */}
        <div style={{ background: '#edfdf5', border: '1px solid #d1fae5', borderRadius: 20, padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>ĐANG HIỆU LỰC</span>
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#059669' }}>{activeCount}</span>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
              ACTIVE
            </span>
          </div>
        </div>

        {/* Card 3: Expired / Out of uses */}
        <div style={{ background: '#ffe4e6', border: '1px solid #fecdd3', borderRadius: 20, padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#e11d48' }}>HẾT HẠN / HẾT LƯỢT</span>
            <Clock size={18} style={{ color: '#e11d48' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#e11d48' }}>
            {expiredCount} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>mã</span>
          </div>
        </div>

        {/* Card 4: Used */}
        <div style={{ background: '#f3eefd', border: '1px solid #ede9fe', borderRadius: 20, padding: '18px 22px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#8b5cf6' }}>LƯỢT SỬ DỤNG</span>
            <ShoppingBag size={18} style={{ color: '#8b5cf6' }} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>
            {totalUsed} <span style={{ fontSize: 13, fontWeight: 500, color: '#64748b' }}>lượt</span>
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 18,
          padding: '14px 18px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', minWidth: 260, flex: '1 1 280px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Tìm theo mã voucher (VD: TQMASTER...)"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              fontSize: 13.5,
              outline: 'none',
              background: '#f8fafc',
            }}
          />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `Tất cả (${coupons.length})` },
            { key: 'active', label: `Hiệu lực (${activeCount})` },
            { key: 'expired', label: `Hết hạn (${expiredCount})` },
            { key: 'inactive', label: `Đã tắt (${coupons.filter(c => !c.is_active).length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key as any)}
              style={{
                padding: '7px 14px',
                borderRadius: 10,
                border: statusFilter === tab.key ? '1px solid #2563eb' : '1px solid #e2e8f0',
                background: statusFilter === tab.key ? '#eff6ff' : '#ffffff',
                color: statusFilter === tab.key ? '#2563eb' : '#64748b',
                fontWeight: statusFilter === tab.key ? 800 : 600,
                fontSize: 12.5,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT (Coupons Table or Dashboard Empty State) ── */}
      {coupons.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '2px dashed #cbd5e1',
            borderRadius: 24,
            padding: '64px 32px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.15)',
            }}
          >
            <Ticket size={36} />
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Chưa có mã giảm giá nào</h2>
          <p style={{ fontSize: 14, color: '#64748b', maxWidth: 460, margin: '0 auto 28px auto', lineHeight: 1.5 }}>
            Tạo voucher giảm giá với các điều kiện giá trị đơn hàng tối thiểu và thời hạn sử dụng để thu hút thêm học viên.
          </p>

          <button
            onClick={openCreate}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 14,
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
            }}
          >
            Tạo mã giảm giá đầu tiên
          </button>
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 20,
            padding: '48px 24px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <Search size={36} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: '#0f172a' }}>Không tìm thấy mã giảm giá phù hợp</p>
          <p style={{ fontSize: 13, margin: 0 }}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái</p>
        </div>
      ) : (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          {/* Desktop Table View */}
          <div className="hidden-mobile" style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', minWidth: 800, borderCollapse: 'collapse', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 12 }}>MÃ VOUCHER</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 12 }}>MỨC GIẢM</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 12 }}>ĐƠN TỐI THIỂU</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 12 }}>HẠN SỬ DỤNG</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 12 }}>LƯỢT DÙNG</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 12 }}>TRẠNG THÁI</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 12, textAlign: 'right' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map(c => {
                  const expired = isExpired(c);
                  const expiringSoon = isExpiringSoon(c);
                  const maxUsesReached = c.max_uses != null && (c.used_count ?? 0) >= c.max_uses;

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                      {/* Code */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 900,
                              fontSize: 14.5,
                              color: '#1d4ed8',
                              background: '#eff6ff',
                              padding: '4px 10px',
                              borderRadius: 8,
                              border: '1px solid #dbeafe',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {c.code}
                          </span>
                          <button
                            onClick={() => copyCode(c.code)}
                            title="Sao chép mã"
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                      </td>

                      {/* Discount value */}
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#15803d' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#15803d', padding: '3px 10px', borderRadius: 8, fontSize: 12.5, fontWeight: 800 }}>
                          {c.discount_type === 'percent' ? `Giảm ${c.value}%` : `Giảm ${formatPrice(c.value)}`}
                        </span>
                      </td>

                      {/* Min order value */}
                      <td style={{ padding: '16px 20px' }}>
                        {c.min_order_value != null && Number(c.min_order_value) > 0 ? (
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13 }}>
                            ≥ {formatPrice(Number(c.min_order_value))}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12.5 }}>Không yêu cầu</span>
                        )}
                      </td>

                      {/* Expiration date */}
                      <td style={{ padding: '16px 20px' }}>
                        {c.expires_at ? (
                          expired ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: '#ffe4e6',
                                color: '#e11d48',
                                border: '1px solid #fecdd3',
                                borderRadius: 8,
                                padding: '3px 8px',
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              <Clock size={12} /> Hết hạn: {new Date(c.expires_at).toLocaleDateString('vi-VN')}
                            </span>
                          ) : expiringSoon ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                background: '#fef3c7',
                                color: '#b45309',
                                border: '1px solid #fde68a',
                                borderRadius: 8,
                                padding: '3px 8px',
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              <Clock size={12} /> Còn {getDaysLeft(c.expires_at)} ngày ({new Date(c.expires_at).toLocaleDateString('vi-VN')})
                            </span>
                          ) : (
                            <span style={{ color: '#334155', fontWeight: 600, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <Calendar size={13} style={{ color: '#64748b' }} /> {new Date(c.expires_at).toLocaleDateString('vi-VN')}
                            </span>
                          )
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 12.5 }}>Vô thời hạn</span>
                        )}
                      </td>

                      {/* Usage */}
                      <td style={{ padding: '16px 20px', color: '#475569', fontWeight: 600 }}>
                        <span>
                          {c.used_count ?? 0} {c.max_uses ? `/ ${c.max_uses}` : 'lượt'}
                        </span>
                        {maxUsesReached && (
                          <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 800, padding: '1px 6px', borderRadius: 6, background: '#fee2e2', color: '#dc2626' }}>
                            Hết
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 20px' }}>
                        <button onClick={() => toggle(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <span
                            style={{
                              padding: '4px 12px',
                              borderRadius: 20,
                              fontSize: 12,
                              fontWeight: 800,
                              background: !c.is_active ? '#f1f5f9' : expired || maxUsesReached ? '#ffe4e6' : '#dcfce7',
                              color: !c.is_active ? '#64748b' : expired || maxUsesReached ? '#e11d48' : '#15803d',
                              border: !c.is_active ? '1px solid #cbd5e1' : expired || maxUsesReached ? '1px solid #fecdd3' : '1px solid #bbf7d0',
                            }}
                          >
                            {!c.is_active ? 'Đã tắt' : expired ? 'Hết hạn' : maxUsesReached ? 'Hết lượt' : 'Hoạt động'}
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                          <button
                            onClick={() => openEdit(c)}
                            title="Chỉnh sửa"
                            style={{ padding: 6, background: '#f1f5f9', border: 'none', borderRadius: 8, color: '#475569', cursor: 'pointer' }}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => remove(c.id, c.code)}
                            title="Xóa mã"
                            style={{ padding: 6, background: '#ffe4e6', border: 'none', borderRadius: 8, color: '#e11d48', cursor: 'pointer' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards List */}
          <div className="visible-mobile" style={{ display: 'none', flexDirection: 'column', gap: 12, padding: 16 }}>
            {filteredCoupons.map(c => {
              const expired = isExpired(c);
              const maxUsesReached = c.max_uses != null && (c.used_count ?? 0) >= c.max_uses;

              return (
                <div key={c.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 900, color: '#1d4ed8', fontSize: 15, fontFamily: 'monospace', background: '#eff6ff', padding: '2px 8px', borderRadius: 6 }}>
                        {c.code}
                      </span>
                      <button onClick={() => copyCode(c.code)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}>
                        <Copy size={12} />
                      </button>
                    </div>

                    <button onClick={() => toggle(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 800,
                          background: !c.is_active ? '#f1f5f9' : expired || maxUsesReached ? '#ffe4e6' : '#dcfce7',
                          color: !c.is_active ? '#64748b' : expired || maxUsesReached ? '#e11d48' : '#15803d',
                        }}
                      >
                        {!c.is_active ? 'Đã tắt' : expired ? 'Hết hạn' : 'Hoạt động'}
                      </span>
                    </button>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 800, color: '#15803d', marginBottom: 6 }}>
                    {c.discount_type === 'percent' ? `Giảm ${c.value}%` : `Giảm ${formatPrice(c.value)}`}
                  </div>

                  {/* Conditions & Details */}
                  <div style={{ fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10, background: '#ffffff', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                    <div>
                      Đơn tối thiểu: <strong>{c.min_order_value ? `≥ ${formatPrice(Number(c.min_order_value))}` : 'Không giới hạn'}</strong>
                    </div>
                    <div>
                      Hạn dùng:{' '}
                      <strong style={{ color: expired ? '#e11d48' : '#0f172a' }}>
                        {c.expires_at ? new Date(c.expires_at).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                      </strong>
                    </div>
                    <div>
                      Lượt dùng: <strong>{c.used_count ?? 0} {c.max_uses ? `/ ${c.max_uses}` : ''}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button onClick={() => openEdit(c)} style={{ padding: '6px 12px', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Pencil size={13} /> Sửa
                    </button>
                    <button onClick={() => remove(c.id, c.code)} style={{ border: '1px solid #fecdd3', background: '#fff1f2', color: '#e11d48', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Trash2 size={13} /> Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT FORM MODAL ── */}
      {showForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              width: '100%',
              maxWidth: 500,
              borderRadius: 24,
              padding: 28,
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid #e2e8f0',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Tag size={20} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {editing ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}
                  </h2>
                  <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Thiết lập mức giảm, điều kiện đơn và thời hạn</p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: '#f1f5f9', border: 'none', color: '#64748b', cursor: 'pointer', padding: 6, borderRadius: 8 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Code */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Mã giảm giá (Code) <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  {!editing && (
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Sparkles size={12} /> Tạo tự động
                    </button>
                  )}
                </div>
                <input
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, '') })}
                  placeholder="VD: TQMASTER2026, SUMMER50"
                  style={{ ...inputStyle, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.05em' }}
                />
              </div>

              {/* Discount Type & Value */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>
                    Loại giảm giá
                  </label>
                  <select
                    value={form.discount_type}
                    onChange={e => setForm({ ...form, discount_type: e.target.value as any })}
                    style={inputStyle}
                  >
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>
                    Mức giảm {form.discount_type === 'percent' ? '(%)' : '(VNĐ)'} <span style={{ color: '#e11d48' }}>*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={form.discount_type === 'percent' ? '100' : undefined}
                    value={form.value}
                    onChange={e => setForm({ ...form, value: Number(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Min Order Value condition */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Đơn hàng tối thiểu (VNĐ)
                  </label>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Để trống nếu không giới hạn</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="10000"
                  value={form.min_order_value}
                  onChange={e => setForm({ ...form, min_order_value: e.target.value })}
                  placeholder="VD: 200000 (áp dụng cho đơn từ 200k)"
                  style={inputStyle}
                />
                {/* Presets for min order value */}
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Không giới hạn', val: '' },
                    { label: '≥ 100.000đ', val: '100000' },
                    { label: '≥ 200.000đ', val: '200000' },
                    { label: '≥ 500.000đ', val: '500000' },
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setForm({ ...form, min_order_value: p.val })}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: form.min_order_value === p.val ? '1px solid #2563eb' : '1px solid #e2e8f0',
                        background: form.min_order_value === p.val ? '#eff6ff' : '#f8fafc',
                        color: form.min_order_value === p.val ? '#2563eb' : '#64748b',
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiration date condition */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    Hạn sử dụng (Hết hiệu lực vào cuối ngày)
                  </label>
                  <span style={{ fontSize: 11, color: '#64748b' }}>Để trống nếu vô thời hạn</span>
                </div>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={e => setForm({ ...form, expires_at: e.target.value })}
                  style={inputStyle}
                />
                {/* Presets for expiry */}
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  {[
                    { label: '+7 ngày', onClick: () => setPresetDate(7) },
                    { label: '+30 ngày', onClick: () => setPresetDate(30) },
                    { label: 'Cuối tháng này', onClick: setEndOfMonth },
                    { label: 'Vô thời hạn', onClick: () => setPresetDate(null) },
                  ].map(p => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={p.onClick}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        color: '#64748b',
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max uses */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>
                  Số lượt dùng tối đa
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={e => setForm({ ...form, max_uses: e.target.value })}
                  placeholder="Để trống nếu không giới hạn lượt dùng"
                  style={inputStyle}
                />
              </div>

              {/* Active Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 14px',
                  background: '#f8fafc',
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  marginTop: 4,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  id="active-check"
                  style={{ width: 18, height: 18, accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <label htmlFor="active-check" style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', cursor: 'pointer' }}>
                  Kích hoạt mã ngay sau khi lưu
                </label>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    height: 46,
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  style={{
                    flex: 2,
                    height: 46,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 800,
                    cursor: saving ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang lưu...
                    </>
                  ) : editing ? (
                    'Lưu thay đổi'
                  ) : (
                    'Tạo mã giảm giá'
                  )}
                </button>
              </div>
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
