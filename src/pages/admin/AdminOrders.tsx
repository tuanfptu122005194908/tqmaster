import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { formatDate, formatPrice } from '@/lib/mockData';
import { Search, CheckCircle, XCircle, Trash2, Eye, X, Loader2, ShoppingBag, Clock, TrendingUp } from 'lucide-react';
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
    if (s === 'pending') return <span className="badge badge-pending">Chờ duyệt</span>;
    if (s === 'approved') return <span className="badge badge-approved">Đã duyệt</span>;
    return <span className="badge badge-rejected">Từ chối</span>;
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const approvedCount = orders.filter(o => o.status === 'approved').length;
  const totalRevenue = orders.filter(o => o.status === 'approved').reduce((s, o) => s + Number(o.final_amount), 0);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))' }} /></div>;

  return (
    <div className="admin-orders-page" style={{ padding: 'var(--page-pad-y) var(--page-pad-x)', flex: 1, minWidth: 0 }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <h1 className="page-title">Quản lý đơn hàng</h1>
          {pendingCount > 0 && (
            <span style={{ background: 'hsl(var(--warning))', color: 'white', borderRadius: 9999, padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, animation: 'pulse 2s infinite' }}>
              {pendingCount} chờ duyệt
            </span>
          )}
        </div>
        <p className="page-subtitle">{orders.length} tổng đơn hàng</p>
      </div>

      {/* Stat strip */}
      <div className="orders-stats" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 'var(--space-3)', marginBottom: 'var(--space-5)',
      }}>
        {[
          { label: 'Tổng đơn', value: orders.length, icon: ShoppingBag, color: 'hsl(var(--primary))' },
          { label: 'Chờ duyệt', value: pendingCount, icon: Clock, color: 'hsl(var(--warning))' },
          { label: 'Đã duyệt', value: approvedCount, icon: CheckCircle, color: 'hsl(var(--success))' },
          { label: 'Doanh thu', value: formatPrice(totalRevenue), icon: TrendingUp, color: 'hsl(var(--primary))', isString: true },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `color-mix(in srgb, ${s.color} 12%, transparent)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <s.icon size={16} style={{ color: s.color }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-fg))', fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: s.isString ? '0.95rem' : '1.25rem', fontWeight: 800, lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' }}>
                  {s.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-fg))' }} />
          <input id="orders-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, email, mã đơn..."
            style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: '0.875rem', outline: 'none', background: 'hsl(var(--surface-raised))' }} />
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
            <button key={s} className={`tab-pill ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
              {s === 'all' ? 'Tất cả' : s === 'pending' ? 'Chờ duyệt' : s === 'approved' ? 'Đã duyệt' : 'Từ chối'}
            </button>
          ))}
        </div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="orders-table-wrap" style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 1.5)', overflow: 'hidden' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th>Mã đơn</th><th>Người dùng</th><th>Thời gian</th><th>Số tiền</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'hsl(var(--muted-fg))' }}>Không tìm thấy đơn hàng nào</td></tr>}
            {filtered.map(order => (
              <tr key={order.id}>
                <td><span style={{ fontFamily: 'monospace', fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--primary))' }}>{order.id}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                      {order.full_name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{order.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>{order.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>{formatDate(order.created_at)}</td>
                <td style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>{formatPrice(order.final_amount)}</td>
                <td>{statusBadge(order.status)}</td>
                <td>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                    <button id={`view-order-${order.id}`} className="btn-ghost" style={{ padding: 6 }} onClick={() => openDetail(order)} title="Xem"><Eye size={14} /></button>
                    {order.status === 'pending' && (
                      <>
                        <button id={`approve-${order.id}`} className="btn-ghost" style={{ padding: 6, color: 'hsl(var(--success))' }} disabled={actioning === order.id} onClick={() => setStatus(order.id, 'approved')} title="Duyệt">
                          {actioning === order.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={14} />}
                        </button>
                        <button id={`reject-${order.id}`} className="btn-ghost" style={{ padding: 6, color: 'hsl(var(--danger))' }} disabled={actioning === order.id} onClick={() => setStatus(order.id, 'rejected')} title="Từ chối">
                          <XCircle size={14} />
                        </button>
                      </>
                    )}
                    <button className="btn-ghost" style={{ padding: 6, color: 'hsl(var(--danger))' }} onClick={() => remove(order.id)} title="Xoá"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="orders-card-list" style={{ display: 'none', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filtered.length === 0 && (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'hsl(var(--muted-fg))', background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}>
            Không tìm thấy đơn hàng nào
          </div>
        )}
        {filtered.map(order => (
          <div key={order.id} style={{
            background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))',
            borderRadius: 'calc(var(--radius) * 1.5)', padding: 'var(--space-4)', boxShadow: 'var(--shadow-xs)',
          }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', fontWeight: 700 }}>
                  {order.full_name.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.full_name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-fg))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.email}</div>
                </div>
              </div>
              {statusBadge(order.status)}
            </div>

            {/* Details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderTop: '1px dashed hsl(var(--border))', borderBottom: '1px dashed hsl(var(--border))', marginBottom: 'var(--space-3)' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-fg))', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Mã đơn</div>
                <div style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, color: 'hsl(var(--primary))' }}>{order.id}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.65rem', color: 'hsl(var(--muted-fg))', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Số tiền</div>
                <div style={{ fontWeight: 800, color: 'hsl(var(--primary))', fontSize: '0.95rem' }}>{formatPrice(order.final_amount)}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: 'hsl(var(--muted-fg))', marginBottom: 'var(--space-3)' }}>
              {formatDate(order.created_at)}
            </div>

            {/* Action buttons - prominent */}
            <div style={{ display: 'grid', gridTemplateColumns: order.status === 'pending' ? '1fr 1fr 1fr' : '1fr 1fr', gap: 8 }}>
              <button
                onClick={() => openDetail(order)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '10px 8px', borderRadius: 10, border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--surface-raised))', color: 'hsl(var(--foreground))',
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Eye size={15} /> Xem
              </button>
              {order.status === 'pending' && (
                <>
                  <button
                    disabled={actioning === order.id}
                    onClick={() => setStatus(order.id, 'approved')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 8px', borderRadius: 10, border: 'none',
                      background: 'hsl(var(--success))', color: 'white',
                      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      boxShadow: '0 2px 6px hsl(var(--success) / 0.35)',
                    }}
                  >
                    {actioning === order.id ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={15} />}
                    Duyệt
                  </button>
                  <button
                    disabled={actioning === order.id}
                    onClick={() => setStatus(order.id, 'rejected')}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      padding: '10px 8px', borderRadius: 10, border: 'none',
                      background: 'hsl(var(--danger))', color: 'white',
                      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      boxShadow: '0 2px 6px hsl(var(--danger) / 0.3)',
                    }}
                  >
                    <XCircle size={15} /> Từ chối
                  </button>
                </>
              )}
              {order.status !== 'pending' && (
                <button
                  onClick={() => remove(order.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px 8px', borderRadius: 10, border: '1px solid hsl(var(--danger) / 0.4)',
                    background: 'hsl(var(--danger) / 0.08)', color: 'hsl(var(--danger))',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  <Trash2 size={15} /> Xoá
                </button>
              )}
            </div>

            {order.status === 'pending' && (
              <button
                onClick={() => remove(order.id)}
                style={{
                  width: '100%', marginTop: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px', borderRadius: 10, border: '1px solid hsl(var(--danger) / 0.4)',
                  background: 'transparent', color: 'hsl(var(--danger))',
                  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Trash2 size={13} /> Xoá đơn
              </button>
            )}
          </div>
        ))}
      </div>

      {viewOrder && (
        <>
          <div onClick={() => setViewOrder(null)} style={{ position: 'fixed', inset: 0, background: 'hsl(240 20% 12% / 0.5)', zIndex: 200, backdropFilter: 'blur(2px)' }} />
          <div className="orders-detail-panel" style={{
            position: 'fixed', right: 0, top: 0, bottom: 0,
            width: 'min(420px, 100vw)',
            background: 'hsl(var(--surface-raised))', boxShadow: 'var(--shadow-lg)',
            zIndex: 201, overflow: 'auto',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'hsl(var(--surface-raised))', zIndex: 1 }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>Chi tiết đơn {viewOrder.id}</h2>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setViewOrder(null)}><X size={18} /></button>
            </div>
            <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', flex: 1 }}>
              {[
                { label: 'Họ tên', value: viewOrder.full_name },
                { label: 'Email', value: viewOrder.email },
                { label: 'Mã sinh viên', value: viewOrder.student_code },
                { label: 'Thời gian đặt', value: formatDate(viewOrder.created_at) },
                { label: 'Số tiền gốc', value: formatPrice(viewOrder.original_amount) },
                { label: 'Giảm giá', value: formatPrice(viewOrder.discount_amount) },
                { label: 'Thanh toán', value: formatPrice(viewOrder.final_amount) },
                { label: 'Trạng thái', value: statusBadge(viewOrder.status) },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', paddingBottom: 'var(--space-3)', borderBottom: '1px solid hsl(var(--border))', gap: 12 }}>
                  <span style={{ color: 'hsl(var(--muted-fg))' }}>{row.label}</span>
                  <strong style={{ textAlign: 'right', wordBreak: 'break-word' }}>{row.value}</strong>
                </div>
              ))}
              {/* Order Items Section */}
              <div>
                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-fg))', marginBottom: 'var(--space-2)', fontWeight: 600 }}>Môn học đã đặt ({orderItems.length})</div>
                {loadingItems ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4)' }}>
                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))' }} />
                  </div>
                ) : orderItems.length === 0 ? (
                  <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))', padding: 'var(--space-3)', textAlign: 'center', background: 'hsl(var(--muted))', borderRadius: 'var(--radius)' }}>
                    Không có môn học nào
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {orderItems.map((item, idx) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'hsl(var(--muted))', borderRadius: 'var(--radius)', fontSize: '0.8125rem' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, background: 'hsl(var(--primary))', color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                          {idx + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subject_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>ID: {item.subject_id}</div>
                        </div>
                        <div style={{ fontWeight: 700, color: 'hsl(var(--primary))', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatPrice(item.price)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-fg))', marginBottom: 'var(--space-2)' }}>Ảnh bill</div>
                <div style={{ background: 'hsl(var(--muted))', borderRadius: 'var(--radius)', minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {billUrl
                    ? <img src={billUrl} alt="bill" style={{ maxWidth: '100%', borderRadius: 'var(--radius)' }} />
                    : <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>Chưa có ảnh bill</span>}
                </div>
              </div>
            </div>
            {/* Sticky action footer */}
            <div style={{ position: 'sticky', bottom: 0, background: 'hsl(var(--surface-raised))', borderTop: '1px solid hsl(var(--border))', padding: 'var(--space-4) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {viewOrder.status === 'pending' && (
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  <button
                    style={{
                      flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                      background: 'hsl(var(--danger))', color: 'white',
                      fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '0 2px 8px hsl(var(--danger) / 0.35)',
                    }}
                    onClick={() => { setStatus(viewOrder.id, 'rejected'); setViewOrder(null); }}
                  >
                    <XCircle size={16} /> Từ chối
                  </button>
                  <button
                    style={{
                      flex: 1, padding: '12px', borderRadius: 10, border: 'none',
                      background: 'hsl(var(--success))', color: 'white',
                      fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      boxShadow: '0 2px 8px hsl(var(--success) / 0.35)',
                    }}
                    onClick={() => { setStatus(viewOrder.id, 'approved'); setViewOrder(null); }}
                  >
                    <CheckCircle size={16} /> Duyệt đơn
                  </button>
                </div>
              )}
              <button
                style={{
                  width: '100%', padding: '10px', borderRadius: 10,
                  border: '1px solid hsl(var(--danger) / 0.4)',
                  background: 'transparent', color: 'hsl(var(--danger))',
                  fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
                onClick={() => { remove(viewOrder.id); setViewOrder(null); }}
              >
                <Trash2 size={14} /> Xoá đơn hàng
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
