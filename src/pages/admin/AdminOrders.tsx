import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { formatDate, formatPrice } from '@/lib/mockData';
import {
  Search, CheckCircle, XCircle, Trash2, Eye, X, Loader2, ShoppingBag,
  Clock, TrendingUp, Download, Zap, Calendar, Filter, Image as ImageIcon,
  Check, CreditCard, ChevronRight, FileText
} from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import { toast } from 'sonner';

type Order = Tables<'orders'>;

export default function AdminOrders() {
  const { profile, refreshPendingOrdersCount } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | Order['status']>('all');
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [billUrl, setBillUrl] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<{ id: string; subject_id: string; price: number; subject_name: string }[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const fetch = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    setOrders(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    const matchQ = !q || o.id.toLowerCase().includes(q) || o.full_name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
    const matchS = filterStatus === 'all' || o.status === filterStatus;
    return matchQ && matchS;
  });

  const setStatus = async (id: string, status: 'approved' | 'rejected') => {
    setActioning(id);
    const { error } = await supabase.from('orders').update({
      status, reviewed_by: profile?.id, reviewed_at: new Date().toISOString(),
    }).eq('id', id);

    if (error) {
      toast.error('Lỗi: ' + error.message);
    } else {
      toast.success(status === 'approved' ? 'Đã duyệt đơn hàng' : 'Đã từ chối đơn hàng');
      if (status === 'approved') {
        supabase.functions.invoke('notify-order-approved', { body: { orderId: id } })
          .then(({ error: mailErr }) => {
            if (mailErr) toast.error('Đã duyệt nhưng gửi email thông báo thất bại');
            else toast.success('Đã gửi email thông báo cho khách hàng');
          });
      }
    }
    setViewOrder(v => v?.id === id ? { ...v, status } : v);
    await fetch();
    refreshPendingOrdersCount();
    setActioning(null);
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa đơn hàng này?')) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) {
      toast.error('Lỗi khi xoá đơn hàng: ' + error.message);
      return;
    }
    toast.success('Đã xoá đơn hàng');
    fetch();
    refreshPendingOrdersCount();
  };

  const openDetail = async (order: Order) => {
    setViewOrder(order);
    setBillUrl(null);
    setOrderItems([]);
    setLoadingItems(true);
    const { data: items } = await supabase
      .from('order_items')
      .select('id, subject_id, price, subjects(name)')
      .eq('order_id', order.id);

    setOrderItems(
      (items ?? []).map((it: any) => ({
        id: it.id,
        subject_id: it.subject_id,
        price: Number(it.price),
        subject_name: it.subjects?.name ?? 'Môn không xác định',
      }))
    );
    setLoadingItems(false);

    if (order.bill_image_url) {
      const { data } = await supabase.storage.from('bill-images').createSignedUrl(order.bill_image_url, 300);
      setBillUrl(data?.signedUrl ?? null);
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'pending')  return <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>• Chờ duyệt</span>;
    if (s === 'approved') return <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>✓ Đã duyệt</span>;
    return <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>✕ Đã hủy</span>;
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const approvedCount = orders.filter(o => o.status === 'approved').length;
  const totalRevenue = orders.filter(o => o.status === 'approved').reduce((s, o) => s + Number(o.final_amount), 0);
  const avgOrderValue = approvedCount > 0 ? Math.round(totalRevenue / approvedCount) : 0;

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 450, background: '#f4f7fc' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );

  return (
    <div className="admin-orders-container" style={{ width: '100%', boxSizing: 'border-box', background: '#f4f7fc', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", color: '#0f172a' }}>
      
      {/* Dynamic Responsive Styles */}
      <style>{`
        .admin-orders-container {
          padding: 28px 32px;
        }
        .orders-desktop-table {
          display: block;
        }
        .orders-mobile-cards {
          display: none;
        }
        @media (max-width: 768px) {
          .admin-orders-container {
            padding: 16px 12px !important;
          }
          .orders-desktop-table {
            display: none !important;
          }
          .orders-mobile-cards {
            display: flex !important;
            flex-direction: column;
            gap: 14px;
          }
          .header-action-btns {
            width: 100%;
            justify-content: space-between;
          }
          .header-action-btns button {
            flex: 1;
            justify-content: center;
          }
          .stat-cards-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
          }
        }
      `}</style>

      {/* ── TOP HEADER AREA ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 style={{ fontSize: 'clamp(22px, 5vw, 28px)', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
            Quản lý Đơn hàng
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
            Theo dõi, phê duyệt và quản lý các giao dịch của học viên TQMaster.
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div className="header-action-btns" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
            borderRadius: 12, border: '1.5px solid #cbd5e1', background: '#ffffff',
            fontSize: 12.5, fontWeight: 700, color: '#475569', cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <Download size={15} /> Xuất báo cáo
          </button>

          <button style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px',
            borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#ffffff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)'
          }}>
            <Zap size={15} /> Thao tác nhanh
          </button>
        </div>
      </div>

      {/* ── 4 PASTEL STAT CARDS ── */}
      <div className="stat-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        
        {/* Card 1: TỔNG ĐƠN HÀNG */}
        <div style={{ background: '#f3eefd', border: '1px solid #ede9fe', borderRadius: 20, padding: 18, boxShadow: '0 2px 10px rgba(139, 92, 246, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TỔNG ĐƠN</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ffffff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={16} />
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.02em' }}>
            {orders.length.toLocaleString()}
          </div>
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
            📈 +12% tháng trước
          </div>
        </div>

        {/* Card 2: ĐANG CHỜ DUYỆT */}
        <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 20, padding: 18, boxShadow: '0 2px 10px rgba(217, 119, 6, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CHỜ DUYỆT</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ffffff', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <Clock size={16} />
              {pendingCount > 0 && (
                <span style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: '#e11d48', border: '2px solid #ffffff' }} />
              )}
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.02em' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: 11, color: '#e11d48', fontWeight: 800 }}>
            {pendingCount > 0 ? '❗ Cần xử lý' : '✓ Đã xong'}
          </div>
        </div>

        {/* Card 3: DOANH THU (THÁNG) */}
        <div style={{ background: '#edf5ff', border: '1px solid #dbeafe', borderRadius: 20, padding: 18, boxShadow: '0 2px 10px rgba(37, 99, 235, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DOANH THU</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ffffff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={16} />
            </div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.02em' }}>
            {formatPrice(totalRevenue)}
          </div>
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
            📈 +8.4% tăng trưởng
          </div>
        </div>

        {/* Card 4: GIÁ TRỊ TB ĐƠN */}
        <div style={{ background: '#eafaf5', border: '1px solid #d1fae5', borderRadius: 20, padding: 18, boxShadow: '0 2px 10px rgba(5, 150, 105, 0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <span style={{ fontSize: 10.5, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TB ĐƠN</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ffffff', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} />
            </div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.02em' }}>
            {formatPrice(avgOrderValue)}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>
            Ổn định 30 ngày
          </div>
        </div>

      </div>

      {/* ── FILTER TABS & SEARCH CONTROLS BAR ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        
        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4, maxWidth: '100%' }}>
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'pending', label: 'Chờ duyệt' },
            { key: 'approved', label: 'Đã duyệt' },
            { key: 'rejected', label: 'Đã hủy' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key as any)}
              style={{
                padding: '7px 16px', borderRadius: 20, border: '1px solid #cbd5e1',
                fontSize: 12.5, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                background: filterStatus === tab.key ? '#2563eb' : '#ffffff',
                color: filterStatus === tab.key ? '#ffffff' : '#475569',
                boxShadow: filterStatus === tab.key ? '0 3px 10px rgba(37, 99, 235, 0.25)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: 420 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm tên, email, mã..."
              style={{
                width: '100%', padding: '9px 12px 9px 36px', borderRadius: 12,
                border: '1.5px solid #cbd5e1', fontSize: 13, outline: 'none', background: '#ffffff',
                color: '#0f172a', boxSizing: 'border-box'
              }}
            />
          </div>

          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', borderRadius: 12, border: '1.5px solid #cbd5e1', background: '#ffffff', fontSize: 12.5, fontWeight: 700, color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Calendar size={14} /> 7 ngày
          </button>
        </div>
      </div>

      {/* ── DESKTOP TABLE VIEW (With overflowX: 'auto' so it never cuts off) ── */}
      <div className="orders-desktop-table">
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, overflowX: 'auto', WebkitOverflowScrolling: 'touch', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', minWidth: 780, borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '14px 18px', fontWeight: 900, color: '#0f172a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>MÃ ĐƠN</th>
                <th style={{ padding: '14px 18px', fontWeight: 900, color: '#0f172a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>HỌC VIÊN</th>
                <th style={{ padding: '14px 18px', fontWeight: 900, color: '#0f172a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>NGÀY TẠO</th>
                <th style={{ padding: '14px 18px', fontWeight: 900, color: '#0f172a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>SỐ TIỀN</th>
                <th style={{ padding: '14px 18px', fontWeight: 900, color: '#0f172a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>TRẠNG THÁI</th>
                <th style={{ padding: '14px 18px', fontWeight: 900, color: '#0f172a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>MINH CHỨNG</th>
                <th style={{ padding: '14px 18px', fontWeight: 900, color: '#0f172a', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8', fontSize: 13 }}>
                    Không tìm thấy đơn hàng nào
                  </td>
                </tr>
              ) : filtered.map((order) => {
                const avatarInitials = (order.full_name || 'U').slice(0, 2).toUpperCase();

                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
                    {/* Order ID */}
                    <td style={{ padding: '14px 18px', fontWeight: 900, color: '#2563eb', fontFamily: 'monospace', fontSize: 13 }}>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>

                    {/* Student Info */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', background: '#eff6ff', color: '#2563eb',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12.5, fontWeight: 900,
                          flexShrink: 0
                        }}>
                          {avatarInitials}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13 }}>{order.full_name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{order.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Created At */}
                    <td style={{ padding: '14px 18px', color: '#64748b', fontSize: 12.5 }}>
                      {formatDate(order.created_at)}
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '14px 18px', fontWeight: 900, color: '#0f172a', fontSize: 13.5 }}>
                      {formatPrice(Number(order.final_amount))}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '14px 18px' }}>
                      {statusBadge(order.status)}
                    </td>

                    {/* Bill Proof Button */}
                    <td style={{ padding: '14px 18px' }}>
                      {order.bill_image_url ? (
                        <button
                          onClick={() => openDetail(order)}
                          style={{
                            border: 'none', background: '#eff6ff', color: '#2563eb',
                            padding: '5px 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 800,
                            cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap'
                          }}
                        >
                          <ImageIcon size={13} /> Xem Bill
                        </button>
                      ) : (
                        <span style={{ fontSize: 11.5, color: '#94a3b8', fontStyle: 'italic' }}>Không có ảnh</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {order.status === 'pending' && (
                          <button
                            disabled={actioning === order.id}
                            onClick={() => setStatus(order.id, 'approved')}
                            style={{
                              padding: '6px 12px', borderRadius: 10, border: 'none',
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: '#ffffff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                              boxShadow: '0 3px 8px rgba(37, 99, 235, 0.25)',
                              display: 'flex', alignItems: 'center', gap: 4
                            }}
                          >
                            {actioning === order.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} strokeWidth={3} />}
                            Duyệt
                          </button>
                        )}

                        {order.status === 'pending' && (
                          <button
                            disabled={actioning === order.id}
                            onClick={() => setStatus(order.id, 'rejected')}
                            style={{
                              padding: '6px 10px', borderRadius: 10, border: '1px solid #fecdd3',
                              background: '#ffe4e6', color: '#e11d48', fontSize: 12, fontWeight: 800, cursor: 'pointer'
                            }}
                          >
                            Hủy
                          </button>
                        )}

                        <button
                          onClick={() => openDetail(order)}
                          style={{
                            width: 30, height: 30, borderRadius: 8, border: '1.5px solid #cbd5e1',
                            background: '#ffffff', color: '#475569', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          onClick={() => remove(order.id)}
                          style={{
                            width: 30, height: 30, borderRadius: 8, border: '1px solid #fecdd3',
                            background: '#fff1f2', color: '#e11d48', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          title="Xóa đơn hàng"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MOBILE CARDS VIEW (Clean, High-contrast responsive list) ── */}
      <div className="orders-mobile-cards">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#ffffff', borderRadius: 20, border: '1px solid #e2e8f0', color: '#94a3b8', fontSize: 13 }}>
            Không tìm thấy đơn hàng nào
          </div>
        ) : filtered.map(order => {
          const avatarInitials = (order.full_name || 'U').slice(0, 2).toUpperCase();

          return (
            <div
              key={order.id}
              style={{
                background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20,
                padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: 12
              }}
            >
              {/* Header: Student Info & Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', background: '#eff6ff', color: '#2563eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900,
                    flexShrink: 0
                  }}>
                    {avatarInitials}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.full_name}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.email}
                    </div>
                  </div>
                </div>
                {statusBadge(order.status)}
              </div>

              {/* Detail row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>MÃ ĐƠN</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#2563eb', fontSize: 13 }}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>SỐ TIỀN</div>
                  <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 14 }}>
                    {formatPrice(Number(order.final_amount))}
                  </div>
                </div>
              </div>

              {/* Bottom Date & Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 11.5, color: '#64748b' }}>{formatDate(order.created_at)}</span>

                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {order.bill_image_url && (
                    <button
                      onClick={() => openDetail(order)}
                      style={{
                        border: 'none', background: '#eff6ff', color: '#2563eb',
                        padding: '6px 10px', borderRadius: 8, fontSize: 11.5, fontWeight: 800,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <ImageIcon size={13} /> Bill
                    </button>
                  )}

                  {order.status === 'pending' && (
                    <button
                      disabled={actioning === order.id}
                      onClick={() => setStatus(order.id, 'approved')}
                      style={{
                        padding: '6px 12px', borderRadius: 8, border: 'none',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: '#ffffff', fontSize: 12, fontWeight: 800, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      {actioning === order.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={12} strokeWidth={3} />}
                      Duyệt
                    </button>
                  )}

                  {order.status === 'pending' && (
                    <button
                      disabled={actioning === order.id}
                      onClick={() => setStatus(order.id, 'rejected')}
                      style={{
                        padding: '6px 10px', borderRadius: 8, border: '1px solid #fecdd3',
                        background: '#ffe4e6', color: '#e11d48', fontSize: 12, fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      Hủy
                    </button>
                  )}

                  <button
                    onClick={() => openDetail(order)}
                    style={{
                      width: 30, height: 30, borderRadius: 8, border: '1.5px solid #cbd5e1',
                      background: '#ffffff', color: '#475569', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Chi tiết"
                  >
                    <Eye size={14} />
                  </button>

                  <button
                    onClick={() => remove(order.id)}
                    style={{
                      width: 30, height: 30, borderRadius: 8, border: '1px solid #fecdd3',
                      background: '#fff1f2', color: '#e11d48', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title="Xóa đơn"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ORDER DETAIL & BILL SLIDE PANEL ── */}
      {viewOrder && (
        <>
          <div onClick={() => setViewOrder(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
          <div style={{
            position: 'fixed', right: 0, top: 0, bottom: 0,
            width: 'min(450px, 100vw)', background: '#ffffff',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.15)', zIndex: 201,
            display: 'flex', flexDirection: 'column', overflowY: 'auto'
          }}>
            {/* Drawer Header */}
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#ffffff', zIndex: 2 }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 900, color: '#0f172a', margin: '0 0 2px 0' }}>
                  Chi tiết đơn hàng
                </h2>
                <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 800, fontFamily: 'monospace' }}>
                  #{viewOrder.id}
                </div>
              </div>
              <button onClick={() => setViewOrder(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: 'Họ tên học viên', value: viewOrder.full_name },
                { label: 'Email', value: viewOrder.email },
                { label: 'Mã sinh viên', value: viewOrder.student_code || 'Chưa cập nhật' },
                { label: 'Thời gian tạo đơn', value: formatDate(viewOrder.created_at) },
                { label: 'Số tiền gốc', value: formatPrice(viewOrder.original_amount) },
                { label: 'Giảm giá', value: formatPrice(viewOrder.discount_amount) },
                { label: 'Thành tiền', value: formatPrice(viewOrder.final_amount) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>{row.label}</span>
                  <strong style={{ color: '#0f172a', fontWeight: 800, textAlign: 'right' }}>{row.value}</strong>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontSize: 13, fontWeight: 500 }}>Trạng thái đơn</span>
                {statusBadge(viewOrder.status)}
              </div>

              {/* Order Items */}
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8, textTransform: 'uppercase' }}>
                  DANH SÁCH MÔN HỌC ({orderItems.length})
                </div>

                {loadingItems ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, padding: 12 }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải dữ liệu môn...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {orderItems.map((item, idx) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                          <span style={{ width: 20, height: 20, borderRadius: 6, background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{idx + 1}</span>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subject_name}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: '#2563eb', fontSize: 13, flexShrink: 0, marginLeft: 8 }}>{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bill Image View */}
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', marginBottom: 8, textTransform: 'uppercase' }}>
                  ẢNH BILL CHUYỂN KHOẢN
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 8 }}>
                  {billUrl ? (
                    <img src={billUrl} alt="Bill chuyển khoản" style={{ maxWidth: '100%', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  ) : (
                    <span style={{ fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic' }}>Khách hàng chưa tải lên ảnh bill</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div style={{ padding: 16, borderTop: '1px solid #e2e8f0', background: '#ffffff', position: 'sticky', bottom: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {viewOrder.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => { setStatus(viewOrder.id, 'approved'); setViewOrder(null); }}
                    style={{
                      flex: 1, padding: '11px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: '#ffffff', border: 'none', borderRadius: 12, fontSize: 13.5, fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <Check size={16} strokeWidth={3} /> Duyệt đơn
                  </button>

                  <button
                    onClick={() => { setStatus(viewOrder.id, 'rejected'); setViewOrder(null); }}
                    style={{
                      padding: '11px 16px', background: '#ffe4e6', color: '#e11d48',
                      border: '1px solid #fecdd3', borderRadius: 12, fontSize: 13.5, fontWeight: 800, cursor: 'pointer'
                    }}
                  >
                    Từ chối
                  </button>
                </div>
              )}

              <button
                onClick={() => { remove(viewOrder.id); setViewOrder(null); }}
                style={{
                  width: '100%', padding: '10px', background: '#ffffff', color: '#e11d48',
                  border: '1px solid #fecdd3', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer'
                }}
              >
                Xóa đơn hàng này
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
