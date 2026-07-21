import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useApp } from '@/lib/AppContext';
import { formatPrice } from '@/lib/mockData';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import {
  Users, BookOpen, FileText, CircleHelp, Clock, TrendingUp,
  Loader2, ShoppingCart, Award, ArrowUpRight, ArrowDownRight,
  BarChart3, Package, ChevronRight, Calendar, Filter, RotateCcw,
  FileSpreadsheet, FileCode, Download, RefreshCw, XCircle, Tag, CheckCircle2, MoreVertical
} from 'lucide-react';

type Order = Tables<'orders'>;
type Subject = Tables<'subjects'>;
type OrderItem = Tables<'order_items'>;

// ─── Custom Tooltip for Revenue Chart ───────────────────────────────────────
function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '12px 16px',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
        Tháng {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
        {formatPrice(payload[0].value)}
      </div>
      <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
        Doanh thu thực tế từ Supabase
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { setCurrentView } = useApp();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<(OrderItem & { subject_name?: string })[]>([]);
  const [stats, setStats] = useState({
    users: 0, subjects: 0, exams: 0, questions: 0,
    pendingOrders: 0, orders: 0, approved: 0, rejected: 0,
  });
  const [revTab, setRevTab] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');

  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, subjectsRes, examsRes, questionsRes, ordersRes] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('subjects').select('id', { count: 'exact', head: true }),
          supabase.from('exams').select('id', { count: 'exact', head: true }),
          supabase.from('questions').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('*').order('created_at', { ascending: false }),
        ]);

        const allOrders: Order[] = ordersRes.data ?? [];
        setOrders(allOrders);

        setStats({
          users:         usersRes.count ?? 0,
          subjects:      subjectsRes.count ?? 0,
          exams:         examsRes.count ?? 0,
          questions:     questionsRes.count ?? 0,
          orders:        allOrders.length,
          pendingOrders: allOrders.filter(o => o.status === 'pending').length,
          approved:      allOrders.filter(o => o.status === 'approved').length,
          rejected:      allOrders.filter(o => o.status === 'rejected').length,
        });

        const approvedIds = allOrders.filter(o => o.status === 'approved').map(o => o.id);
        if (approvedIds.length > 0) {
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*, subjects(name)')
            .in('order_id', approvedIds);
          const allItems = (itemsData ?? []) as any[];
          setOrderItems(allItems.map((i: any) => ({ ...i, subject_name: i.subjects?.name ?? 'Môn học ôn thi' })));
        }
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const approvedOrders = useMemo(() => orders.filter(o => o.status === 'approved'), [orders]);
  const totalRevenue = useMemo(() => approvedOrders.reduce((s, o) => s + Number(o.final_amount), 0), [approvedOrders]);
  const avgTripValue = useMemo(() => approvedOrders.length > 0 ? Math.round(totalRevenue / approvedOrders.length) : 0, [totalRevenue, approvedOrders]);
  const cancellationRate = useMemo(() => orders.length > 0 ? ((stats.rejected / orders.length) * 100).toFixed(1) : '0.0', [orders, stats.rejected]);

  // Real Monthly Revenue Chart Data
  const revenueChartData = useMemo(() => {
    const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
    const byM = Array(12).fill(0);
    approvedOrders.forEach(o => { byM[new Date(o.created_at).getMonth()] += Number(o.final_amount); });
    return months.map((label, i) => ({ label, revenue: byM[i] }));
  }, [approvedOrders]);

  // Real Order Status Donut Chart Data
  const donutData = useMemo(() => {
    const total = orders.length || 1;
    const conf = stats.approved;
    const pend = stats.pendingOrders;
    const canc = stats.rejected;

    return [
      { name: 'Đã duyệt (Approved)', count: conf, pct: Math.round((conf / total) * 100), color: '#2563eb' },
      { name: 'Chờ duyệt (Pending)', count: pend, pct: Math.round((pend / total) * 100), color: '#f59e0b' },
      { name: 'Từ chối (Rejected)', count: canc, pct: Math.round((canc / total) * 100), color: '#ef4444' },
    ];
  }, [orders, stats]);

  // Real Best-selling Subjects Data from Supabase order_items
  const topSubjects = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};
    orderItems.forEach(item => {
      const n = item.subject_name ?? 'Môn học ôn thi';
      if (!map[n]) map[n] = { name: n, count: 0, revenue: 0 };
      map[n].count++;
      map[n].revenue += Number(item.price);
    });
    const list = Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const maxRev = list[0]?.revenue || 1;
    const colors = ['#2563eb','#8b5cf6','#10b981','#f59e0b','#ec4899'];
    return list.map((s, idx) => ({
      ...s,
      pct: Math.round((s.revenue / maxRev) * 100),
      color: colors[idx % colors.length]
    }));
  }, [orderItems]);

  const recentOrders = orders.slice(0, 6);

  const statusBadge = (s: string) => {
    if (s === 'pending')  return <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>Chờ duyệt</span>;
    if (s === 'approved') return <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>Đã duyệt</span>;
    return <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3' }}>Từ chối</span>;
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, background: '#f4f7fc' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );

  return (
    <div style={{ padding: '28px 36px', flex: 1, minWidth: 0, background: '#f4f7fc', minHeight: '100vh', color: '#0f172a', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>
              Báo cáo Hệ thống (Real Data)
            </h1>
            <span style={{ padding: '3px 10px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 800, border: '1px solid #bbf7d0' }}>
              Dữ liệu trực tiếp Supabase
            </span>
          </div>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
            Thống kê chi tiết doanh thu, đơn hàng và hoạt động ôn tập thực tế trên TQMaster.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setCurrentView('admin-orders')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
              background: '#2563eb', color: '#ffffff', border: 'none',
              borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            <ShoppingCart size={16} /> Quản lý đơn hàng ({stats.pendingOrders} đơn mới)
          </button>
        </div>
      </div>

      {/* ── TOP 4 PASTEL STAT CARDS GRID (REAL DATA) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 18,
        marginBottom: 24,
      }}>
        {/* Card 1: TỔNG DOANH THU THỰC TẾ */}
        <div style={{
          background: '#edf5ff',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #dbeafe',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              TỔNG DOANH THU
            </span>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#10b981', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.15)'
            }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 8 }}>
            {formatPrice(totalRevenue)}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            Đã duyệt <strong style={{ color: '#16a34a' }}>{approvedOrders.length}</strong> đơn hàng thành công
          </div>
        </div>

        {/* Card 2: TỔNG ĐƠN HÀNG THỰC TẾ */}
        <div style={{
          background: '#f3eefd',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #ede9fe',
          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8b5cf6', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              TỔNG ĐƠN HÀNG
            </span>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8b5cf6', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.15)'
            }}>
              <ShoppingCart size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 8 }}>
            {stats.orders.toLocaleString()} đơn
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            Có <strong style={{ color: '#b45309' }}>{stats.pendingOrders}</strong> đơn đang chờ admin duyệt
          </div>
        </div>

        {/* Card 3: DOANH THU TRUNG BÌNH THỰC TẾ */}
        <div style={{
          background: '#eafaf5',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #d1fae5',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              GIÁ TRỊ TB / ĐƠN
            </span>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#10b981', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.15)'
            }}>
              <Tag size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 8 }}>
            {formatPrice(avgTripValue)}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            Tính trên {approvedOrders.length} đơn đã thanh toán
          </div>
        </div>

        {/* Card 4: TỶ LỆ TỪ CHỐI THỰC TẾ */}
        <div style={{
          background: '#fdf2f2',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #ffe4e6',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#e11d48', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              TỶ LỆ TỪ CHỐI
            </span>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ef4444', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.15)'
            }}>
              <XCircle size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 8 }}>
            {cancellationRate}%
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            Tổng số <strong style={{ color: '#dc2626' }}>{stats.rejected}</strong> đơn đã bị hủy
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW: REVENUE ANALYTICS + REPORT SUMMARY (REAL DATA DONUT) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)',
        gap: 20,
        marginBottom: 24,
      }}>
        {/* Left: Real Revenue Analytics Chart */}
        <div style={{
          background: '#ffffff',
          borderRadius: 22,
          padding: '24px 28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Phân Tích Doanh Thu Theo Tháng
              </h2>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                Tổng doanh thu thực tế ghi nhận: <strong style={{ color: '#2563eb' }}>{formatPrice(totalRevenue)}</strong>
              </p>
            </div>
          </div>

          {/* Area Chart */}
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueChartData} margin={{ top: 20, right: 10, bottom: 0, left: -15 }}>
              <defs>
                <linearGradient id="blueRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '0' : `${(v/1000000).toFixed(1)}M`} dx={-5} />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fill="url(#blueRevGrad)" dot={{ r: 4, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Real Order Status Summary Donut Chart */}
        <div style={{
          background: '#ffffff',
          borderRadius: 22,
          padding: '24px 24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
            Trạng Thái Đơn Hàng Real
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Donut Chart */}
            <div style={{ width: 140, height: 140, position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%" cy="50%"
                    innerRadius={44} outerRadius={64}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {donutData.map((d, i) => (
                      <Cell key={i} fill={d.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {stats.orders}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 2 }}>
                  Tổng đơn
                </div>
              </div>
            </div>

            {/* Legend list */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {donutData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: item.color }} />
                    <span style={{ color: '#475569', fontWeight: 600 }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>
                    {item.count} <span style={{ color: '#94a3b8', fontWeight: 500 }}>({item.pct}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── LOWER DATA SECTION: REAL RECENT ORDERS TABLE + TOP SUBJECTS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)',
        gap: 20,
        marginBottom: 24,
      }}>
        {/* Left: Real Orders Data Table */}
        <div style={{
          background: '#ffffff',
          borderRadius: 22,
          padding: '24px 28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}>
          {/* Table Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                Đơn Hàng Gần Đây (Real Supabase)
              </h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Hiển thị 6 đơn mới nhất từ cơ sở dữ liệu
              </p>
            </div>

            <button
              onClick={() => setCurrentView('admin-orders')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12.5, fontWeight: 700, color: '#2563eb', background: '#eff6ff', cursor: 'pointer' }}
            >
              Xem tất cả đơn ({stats.orders}) <ChevronRight size={14} />
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>MÃ ĐƠN</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>KHÁCH HÀNG</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>MÃ SV</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>NGÀY TẠO</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>SỐ TIỀN</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8', fontSize: 13 }}>
                      Chưa có đơn hàng nào trong cơ sở dữ liệu
                    </td>
                  </tr>
                ) : recentOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 12px', fontWeight: 800, color: '#2563eb' }}>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: '14px 12px', fontWeight: 700, color: '#0f172a' }}>
                      {order.full_name || order.email}
                    </td>
                    <td style={{ padding: '14px 12px', color: '#64748b', fontFamily: 'monospace' }}>
                      {order.student_code || '---'}
                    </td>
                    <td style={{ padding: '14px 12px', color: '#64748b' }}>
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '14px 12px', fontWeight: 800, color: '#0f172a' }}>
                      {formatPrice(order.final_amount)}
                    </td>
                    <td style={{ padding: '14px 12px' }}>{statusBadge(order.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Top Performing Subjects & System Database Counters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Top Môn Học Bán Chạy Real */}
          <div style={{
            background: '#ffffff',
            borderRadius: 22,
            padding: '24px 24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
              Top Môn Học Bán Chạy Real
            </h2>

            {topSubjects.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                Chưa có dữ liệu đơn hàng thành công
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {topSubjects.map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{item.name}</span>
                      <span style={{ color: '#2563eb' }}>{formatPrice(item.revenue)}</span>
                    </div>
                    <div style={{ height: 7, width: '100%', background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 10 }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real System Database Counters */}
          <div style={{
            background: '#ffffff',
            borderRadius: 22,
            padding: '22px 24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 14px 0' }}>
              Tổng Quan Kho Dữ Liệu
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 14, border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Tổng Sinh Viên</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#2563eb', marginTop: 2 }}>{stats.users}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 14, border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Tổng Môn Học</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#8b5cf6', marginTop: 2 }}>{stats.subjects}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 14, border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Tổng Bộ Đề Thi</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981', marginTop: 2 }}>{stats.exams}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 14, border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Ngân Hàng Câu Hỏi</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b', marginTop: 2 }}>{stats.questions}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
