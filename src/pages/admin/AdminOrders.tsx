import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { formatDate, formatPrice } from '@/lib/mockData';
import {
  Search, CheckCircle, XCircle, Trash2, Eye, X, Loader2, ShoppingBag,
  Clock, TrendingUp, Download, Zap, Calendar, Filter, Image as ImageIcon,
  Check, CreditCard, ChevronRight, FileText, ArrowUpRight
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
    if (s === 'pending')  return <span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', display: 'inline-flex', alignItems: 'center', gap: 4 }}>• Chờ duyệt</span>;
    if (s === 'approved') return <span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', display: 'inline-flex', alignItems: 'center', gap: 4 }}>✓ Đã duyệt</span>;
    return <span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3', display: 'inline-flex', alignItems: 'center', gap: 4 }}>✕ Đã hủy</span>;
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
    <div style={{ padding: '32px 40px', background: '#f4f7fc', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", color: '#0f172a' }}>
      
      {/* ── TOP HEADER AREA ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
            Quản lý Đơn hàng
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500, maxWidth: 680, lineHeight: 1.5 }}>
            Theo dõi, phê duyệt và quản lý các giao dịch của học viên trong hệ thống TQMaster. Đảm bảo quy trình thanh toán minh bạch và nhanh chóng.
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
            borderRadius: 14, border: '1.5px solid #cbd5e1', background: '#ffffff',
            fontSize: 13, fontWeight: 700, color: '#475569', cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
          }}>
            <Download size={16} /> Xuất báo cáo
          </button>

          <button style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
            borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#ffffff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)'
          }}>
            <Zap size={16} /> Thao tác nhanh
          </button>
        </div>
      </div>

      {/* ── 4 PASTEL STAT CARDS (EXACT MATCH TO SCREENSHOT) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
        
        {/* Card 1: TỔNG ĐƠN HÀNG (Purple Pastel) */}
        <div style={{ background: '#f3eefd', border: '1px solid #ede9fe', borderRadius: 24, padding: 22, boxShadow: '0 2px 10px rgba(139, 92, 246, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TỔNG ĐƠN HÀNG</span>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: '#ffffff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(139, 92, 246, 0.15)' }}>
              <ShoppingBag size={20} />
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.03em' }}>
            {orders.length.toLocaleString()}
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            📈 +12% so với tháng trước
          </div>
        </div>

        {/* Card 2: ĐANG CHỜ DUYỆT (Orange Pastel) */}
        <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 24, padding: 22, boxShadow: '0 2px 10px rgba(217, 119, 6, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ĐANG CHỜ DUYỆT</span>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: '#ffffff', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(217, 119, 6, 0.15)', position: 'relative' }}>
              <Clock size={20} />
              {pendingCount > 0 && (
                <span style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: '50%', background: '#e11d48', border: '2px solid #ffffff' }} />
              )}
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.03em' }}>
            {pendingCount}
          </div>
          <div style={{ fontSize: 12, color: '#e11d48', fontWeight: 800 }}>
            {pendingCount > 0 ? '❗ Cần xử lý ngay' : '✓ Đã duyệt tất cả'}
          </div>
        </div>

        {/* Card 3: DOANH THU (THÁNG) (Blue Pastel) */}
        <div style={{ background: '#edf5ff', border: '1px solid #dbeafe', borderRadius: 24, padding: 22, boxShadow: '0 2px 10px rgba(37, 99, 235, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DOANH THU (THÁNG)</span>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: '#ffffff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.15)' }}>
              <CreditCard size={20} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.03em' }}>
            {formatPrice(totalRevenue)}
          </div>
          <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            📈 +8.4% tăng trưởng
          </div>
        </div>

        {/* Card 4: GIÁ TRỊ TB ĐƠN (Green Pastel) */}
        <div style={{ background: '#eafaf5', border: '1px solid #d1fae5', borderRadius: 24, padding: 22, boxShadow: '0 2px 10px rgba(5, 150, 105, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GIÁ TRỊ TB ĐƠN</span>
            <div style={{ width: 40, height: 40, borderRadius: 14, background: '#ffffff', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.03em' }}>
            {formatPrice(avgOrderValue)}
          </div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
            Ổn định trong 30 ngày
          </div>
        </div>

      </div>

      {/* ── FILTER TABS & SEARCH CONTROLS BAR ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        
        {/* Status Filter Pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
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
                padding: '9px 20px', borderRadius: 24, border: '1px solid #cbd5e1',
                fontSize: 13.5, fontWeight: 800, cursor: 'pointer',
                background: filterStatus === tab.key ? '#2563eb' : '#ffffff',
                color: filterStatus === tab.key ? '#ffffff' : '#475569',
                boxShadow: filterStatus === tab.key ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right Search Input & Filters */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm theo tên, email, mã đơn..."
              style={{
                width: '100%', padding: '10px 14px 10px 40px', borderRadius: 14,
                border: '1.5px solid #cbd5e1', fontSize: 13.5, outline: 'none', background: '#ffffff',
                color: '#0f172a'
              }}
            />
          </div>

          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 14, border: '1.5px solid #cbd5e1', background: '#ffffff', fontSize: 13.5, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
            <Calendar size={16} /> 7 ngày qua
          </button>

          <button style={{ padding: '10px 14px', borderRadius: 14, border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* ── HIGH-CONTRAST LIGHT DATA TABLE (MATCHES SCREENSHOT EXACTLY) ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '18px 24px', fontWeight: 900, color: '#0f172a', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>MÃ ĐƠN HÀNG</th>
              <th style={{ padding: '18px 24px', fontWeight: 900, color: '#0f172a', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>HỌC VIÊN</th>
              <th style={{ padding: '18px 24px', fontWeight: 900, color: '#0f172a', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>NGÀY TẠO</th>
              <th style={{ padding: '18px 24px', fontWeight: 900, color: '#0f172a', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SỐ TIỀN</th>
              <th style={{ padding: '18px 24px', fontWeight: 900, color: '#0f172a', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TRẠNG THÁI</th>
              <th style={{ padding: '18px 24px', fontWeight: 900, color: '#0f172a', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>MINH CHỨNG</th>
              <th style={{ padding: '18px 24px', fontWeight: 900, color: '#0f172a', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8', fontSize: 14 }}>
                  Không tìm thấy đơn hàng nào
                </td>
              </tr>
            ) : filtered.map((order) => {
              const avatarInitials = (order.full_name || 'U').slice(0, 2).toUpperCase();

              return (
                <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9', background: '#ffffff' }}>
                  {/* Order ID */}
                  <td style={{ padding: '18px 24px', fontWeight: 900, color: '#2563eb', fontFamily: 'monospace', fontSize: 13.5 }}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </td>

                  {/* Student Info */}
                  <td style={{ padding: '18px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', color: '#2563eb',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, fontWeight: 900,
                        flexShrink: 0
                      }}>
                        {avatarInitials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>{order.full_name}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{order.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Created At */}
                  <td style={{ padding: '18px 24px', color: '#64748b', fontSize: 13 }}>
                    {formatDate(order.created_at)}
                  </td>

                  {/* Amount */}
                  <td style={{ padding: '18px 24px', fontWeight: 900, color: '#0f172a', fontSize: 14.5 }}>
                    {formatPrice(Number(order.final_amount))}
                  </td>

                  {/* Status Badge */}
                  <td style={{ padding: '18px 24px' }}>
                    {statusBadge(order.status)}
                  </td>

                  {/* Bill Proof Button */}
                  <td style={{ padding: '18px 24px' }}>
                    {order.bill_image_url ? (
                      <button
                        onClick={() => openDetail(order)}
                        style={{
                          border: 'none', background: '#eff6ff', color: '#2563eb',
                          padding: '6px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 800,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <ImageIcon size={14} /> Xem Bill
                      </button>
                    ) : (
                      <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>Không có ảnh</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '18px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      {/* Approved Button */}
                      {order.status === 'pending' && (
                        <button
                          disabled={actioning === order.id}
                          onClick={() => setStatus(order.id, 'approved')}
                          style={{
                            padding: '7px 16px', borderRadius: 12, border: 'none',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            color: '#ffffff', fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                            display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          {actioning === order.id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} strokeWidth={3} />}
                          Duyệt
                        </button>
                      )}

                      {/* Reject / Cancel Button */}
                      {order.status === 'pending' && (
                        <button
                          disabled={actioning === order.id}
                          onClick={() => setStatus(order.id, 'rejected')}
                          style={{
                            padding: '7px 14px', borderRadius: 12, border: '1px solid #fecdd3',
                            background: '#ffe4e6', color: '#e11d48', fontSize: 12.5, fontWeight: 800, cursor: 'pointer'
                          }}
                        >
                          Hủy
                        </button>
                      )}

                      {/* View Detail Button */}
                      <button
                        onClick={() => openDetail(order)}
                        style={{
                          width: 34, height: 34, borderRadius: 10, border: '1.5px solid #cbd5e1',
                          background: '#ffffff', color: '#475569', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Xem chi tiết"
                      >
                        <Eye size={16} />
                      </button>

                      {/* Delete Order Button */}
                      <button
                        onClick={() => remove(order.id)}
                        style={{
                          width: 34, height: 34, borderRadius: 10, border: '1px solid #fecdd3',
                          background: '#fff1f2', color: '#e11d48', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Xóa đơn hàng"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── ORDER DETAIL & BILL SLIDE PANEL ── */}
      {viewOrder && (
        <>
          <div onClick={() => setViewOrder(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
          <div style={{
            position: 'fixed', right: 0, top: 0, bottom: 0,
            width: 'min(460px, 100vw)', background: '#ffffff',
            boxShadow: '-10px 0 30px rgba(0,0,0,0.15)', zIndex: 201,
            display: 'flex', flexDirection: 'column', overflowY: 'auto'
          }}>
            {/* Drawer Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#ffffff', zIndex: 2 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '0 0 2px 0' }}>
                  Chi tiết đơn hàng
                </h2>
                <div style={{ fontSize: 12.5, color: '#2563eb', fontWeight: 800, fontFamily: 'monospace' }}>
                  #{viewOrder.id}
                </div>
              </div>
              <button onClick={() => setViewOrder(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Họ tên học viên', value: viewOrder.full_name },
                { label: 'Email', value: viewOrder.email },
                { label: 'Mã sinh viên', value: viewOrder.student_code || 'Chưa cập nhật' },
                { label: 'Thời gian tạo đơn', value: formatDate(viewOrder.created_at) },
                { label: 'Số tiền gốc', value: formatPrice(viewOrder.original_amount) },
                { label: 'Giảm giá', value: formatPrice(viewOrder.discount_amount) },
                { label: 'Thành tiền', value: formatPrice(viewOrder.final_amount) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b', fontWeight: 500 }}>{row.label}</span>
                  <strong style={{ color: '#0f172a', fontWeight: 800 }}>{row.value}</strong>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ color: '#64748b', fontSize: 13.5, fontWeight: 500 }}>Trạng thái đơn</span>
                {statusBadge(viewOrder.status)}
              </div>

              {/* Order Items */}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', marginBottom: 10, textTransform: 'uppercase' }}>
                  DANH SÁCH MÔN HỌC ({orderItems.length})
                </div>

                {loadingItems ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, padding: 12 }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải dữ liệu môn...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {orderItems.map((item, idx) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ width: 22, height: 22, borderRadius: 6, background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                          <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{item.subject_name}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: '#2563eb', fontSize: 13.5 }}>{formatPrice(item.price)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bill Image View */}
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0f172a', marginBottom: 10, textTransform: 'uppercase' }}>
                  ẢNH BILL CHUYỂN KHOẢN
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 8 }}>
                  {billUrl ? (
                    <img src={billUrl} alt="Bill chuyển khoản" style={{ maxWidth: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  ) : (
                    <span style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>Khách hàng chưa tải lên ảnh bill</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sticky Action Footer */}
            <div style={{ padding: 20, borderTop: '1px solid #e2e8f0', background: '#ffffff', sticky: 'bottom', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {viewOrder.status === 'pending' && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => { setStatus(viewOrder.id, 'approved'); setViewOrder(null); }}
                    style={{
                      flex: 1, padding: '12px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: '#ffffff', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer',
                      boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <Check size={16} strokeWidth={3} /> Duyệt đơn này
                  </button>

                  <button
                    onClick={() => { setStatus(viewOrder.id, 'rejected'); setViewOrder(null); }}
                    style={{
                      padding: '12px 18px', background: '#ffe4e6', color: '#e11d48',
                      border: '1px solid #fecdd3', borderRadius: 12, fontSize: 14, fontWeight: 800, cursor: 'pointer'
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
