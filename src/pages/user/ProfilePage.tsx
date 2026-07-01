import React, { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { formatPrice, formatDate } from '@/lib/mockData';
import { User, Package, BookOpen, Phone, Loader2, ChevronDown, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

type Order   = Tables<'orders'>;
type Subject = Tables<'subjects'>;
type OrderItem = { id: string; subject_id: string; price: number; subject_name: string };

export default function ProfilePage() {
  const { profile, purchasedIds, setCurrentView, setSelectedSubjectId } = useApp();
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [bankInfo, setBankInfo] = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});
  const [loadingItemsOrderId, setLoadingItemsOrderId] = useState<string | null>(null);

  // Change password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleChangePassword = async () => {
    setPwError('');
    setPwSuccess(false);
    if (newPassword.length < 6) {
      setPwError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Mật khẩu xác nhận không khớp');
      return;
    }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);
    if (error) {
      setPwError(error.message);
    } else {
      setPwSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccess(false), 4000);
    }
  };

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      supabase.from('orders').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').in('id', purchasedIds.length ? purchasedIds : ['x']),
      supabase.from('system_settings').select('key, value').in('key', ['contact_info', 'bank_name']),
    ]).then(([ordersRes, subjectsRes, settingsRes]) => {
      setOrders(ordersRes.data ?? []);
      setSubjects(subjectsRes.data ?? []);
      const m: Record<string, string> = {};
      (settingsRes.data ?? []).forEach(r => { m[r.key] = r.value ?? ''; });
      setBankInfo(m);
      setLoading(false);
    });
  }, [profile, purchasedIds]);

  const loadOrderItems = async (orderId: string) => {
    if (orderItemsMap[orderId]) {
      setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
      return;
    }
    setLoadingItemsOrderId(orderId);
    const { data: items } = await supabase
      .from('order_items')
      .select('id, subject_id, price, subjects(name)')
      .eq('order_id', orderId);
    const mappedItems = (items ?? []).map((it: any) => ({
      id: it.id,
      subject_id: it.subject_id,
      price: Number(it.price),
      subject_name: it.subjects?.name ?? 'Môn không xác định',
    }));
    setOrderItemsMap(prev => ({ ...prev, [orderId]: mappedItems }));
    setExpandedOrderId(orderId);
    setLoadingItemsOrderId(null);
  };

  if (loading || !profile) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))' }} />
    </div>
  );

  const statusBadge = (s: string) => {
    if (s === 'pending')  return <span className="badge badge-pending">Chờ duyệt</span>;
    if (s === 'approved') return <span className="badge badge-approved">Đã duyệt</span>;
    return <span className="badge badge-rejected">Từ chối</span>;
  };

  const avatarLetter = (profile.full_name || profile.username).charAt(0).toUpperCase();

  return (
    <div className="page-shell" style={{ maxWidth: 860, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 'var(--space-6)' }}>Hồ sơ của tôi</h1>

      <div className="profile-grid">
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Avatar */}
          <div style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 1.5)', padding: 'var(--space-6)', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.5rem', fontWeight: 700, margin: '0 auto var(--space-3)' }}>
              {avatarLetter}
            </div>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{profile.full_name || profile.username}</div>
            <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>{profile.email}</div>
            {profile.student_code && <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))', marginTop: 2 }}>MSV: {profile.student_code}</div>}
          </div>

          {/* Stats */}
          <div style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 1.5)', padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[
              { label: 'Môn đã mua', value: subjects.length },
              { label: 'Tổng đơn hàng', value: orders.length },
              { label: 'Chờ duyệt', value: orders.filter(o => o.status === 'pending').length },
            ].map(stat => (
              <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'hsl(var(--muted-fg))' }}>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>

          {/* Contact */}
          {bankInfo['contact_info'] && (
            <div style={{ background: 'hsl(var(--primary-muted))', border: '1px solid hsl(var(--primary) / 0.2)', borderRadius: 'calc(var(--radius) * 1.5)', padding: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600, fontSize: '0.875rem', marginBottom: 'var(--space-3)', color: 'hsl(var(--primary))' }}>
                <Phone size={15} /> Liên hệ Admin
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))', whiteSpace: 'pre-line' }}>{bankInfo['contact_info']}</div>
            </div>
          )}

          {/* Change Password */}
          <div style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 1.5)', padding: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontWeight: 600, fontSize: '0.875rem', marginBottom: 'var(--space-4)', color: 'hsl(var(--foreground))' }}>
              <Lock size={15} /> Đổi mật khẩu
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {/* New password */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(var(--muted-fg))', marginBottom: 4, display: 'block' }}>Mật khẩu mới</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    style={{
                      width: '100%',
                      padding: '8px 36px 8px 12px',
                      fontSize: '0.8125rem',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-fg))', padding: 2 }}
                  >
                    {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'hsl(var(--muted-fg))', marginBottom: 4, display: 'block' }}>Xác nhận mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    style={{
                      width: '100%',
                      padding: '8px 36px 8px 12px',
                      fontSize: '0.8125rem',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      background: 'hsl(var(--background))',
                      color: 'hsl(var(--foreground))',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--muted-fg))', padding: 2 }}
                  >
                    {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Error / Success messages */}
              {pwError && (
                <div style={{ fontSize: '0.75rem', color: 'hsl(0 72% 51%)', background: 'hsl(0 72% 51% / 0.08)', padding: '6px 10px', borderRadius: 'var(--radius)', fontWeight: 500 }}>
                  {pwError}
                </div>
              )}
              {pwSuccess && (
                <div style={{ fontSize: '0.75rem', color: 'hsl(142 71% 45%)', background: 'hsl(142 71% 45% / 0.08)', padding: '6px 10px', borderRadius: 'var(--radius)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <CheckCircle2 size={14} /> Đổi mật khẩu thành công!
                </div>
              )}

              {/* Submit button */}
              <button
                onClick={handleChangePassword}
                disabled={pwLoading || !newPassword || !confirmPassword}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'white',
                  background: pwLoading || !newPassword || !confirmPassword ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--primary))',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  cursor: pwLoading || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer',
                  transition: 'all var(--duration-fast)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)',
                }}
              >
                {pwLoading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
                {pwLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Orders */}
          <div>
            <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Package size={16} /> Đơn hàng của tôi
            </h2>
            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'hsl(var(--muted-fg))', background: 'hsl(var(--muted))', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>Chưa có đơn hàng nào</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {orders.map(order => (
                  <div key={order.id}>
                    <button
                      onClick={() => loadOrderItems(order.id)}
                      style={{
                        width: '100%',
                        background: 'hsl(var(--surface-raised))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        padding: 'var(--space-4)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all var(--duration-fast)',
                        borderColor: expandedOrderId === order.id ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                        boxShadow: expandedOrderId === order.id ? '0 0 0 2px hsl(var(--primary) / 0.1)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--muted-fg))', fontFamily: 'monospace' }}>{order.id}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          {statusBadge(order.status)}
                          <ChevronDown
                            size={18}
                            style={{
                              transform: expandedOrderId === order.id ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform var(--duration-fast)',
                              color: 'hsl(var(--muted-fg))',
                            }}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>
                        <span>{formatDate(order.created_at)}</span>
                        <strong style={{ color: 'hsl(var(--foreground))' }}>{formatPrice(Number(order.final_amount))}</strong>
                      </div>
                    </button>

                    {/* Expanded items */}
                    {expandedOrderId === order.id && (
                      <div style={{ borderLeft: '2px solid hsl(var(--primary) / 0.3)', marginTop: 'var(--space-2)', paddingLeft: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {loadingItemsOrderId === order.id ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-3)' }}>
                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))' }} />
                          </div>
                        ) : orderItemsMap[order.id]?.length === 0 ? (
                          <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))', padding: 'var(--space-3)', textAlign: 'center', background: 'hsl(var(--muted))', borderRadius: 'var(--radius)' }}>
                            Không có môn học nào
                          </div>
                        ) : (
                          (orderItemsMap[order.id] || []).map((item, idx) => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3)', background: 'hsl(var(--muted))', borderRadius: 'var(--radius)', fontSize: '0.8125rem' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 4, background: 'hsl(var(--primary))', color: 'white', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                                {idx + 1}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subject_name}</div>
                              </div>
                              <div style={{ fontWeight: 700, color: 'hsl(var(--primary))', textAlign: 'right', whiteSpace: 'nowrap', fontSize: '0.75rem' }}>{formatPrice(item.price)}</div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Purchased subjects */}
          <div>
            <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <BookOpen size={16} /> Môn học đã mua
            </h2>
            {subjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'hsl(var(--muted-fg))', background: 'hsl(var(--muted))', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>Chưa mua môn học nào</div>
            ) : (
              <div className="profile-subjects" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                {subjects.map(s => (
                  <button key={s.id} id={`profile-subject-${s.id}`}
                    onClick={() => { setSelectedSubjectId(s.id); setCurrentView('subject-detail'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'left', transition: 'border-color var(--duration-fast)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: 'hsl(var(--primary-muted))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--primary))' }}>
                        {s.name.split(' ').slice(-2).map((w: string) => w[0]).join('')}
                      </span>
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.8125rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>Kỳ {s.semester}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
