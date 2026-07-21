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
        {label}
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

type RevFilter = 'day' | 'week' | 'month' | 'year';

export default function AdminDashboard() {
  const { setCurrentView } = useApp();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<(OrderItem & { subject_name?: string })[]>([]);
  const [stats, setStats] = useState({
    users: 0, subjects: 0, exams: 0, questions: 0,
    pendingOrders: 0, orders: 0, approved: 0, rejected: 0,
  });

  // Defaults: revFilter = 'day', topTimeRange = 'week'
  const [revFilter, setRevFilter] = useState<RevFilter>('day');
  const [topTimeRange, setTopTimeRange] = useState<'week' | 'month' | 'year'>('week');

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

  // Real Dynamic Revenue Chart Data (Ngày / Tuần / Tháng / Năm)
  const revenueChartData = useMemo(() => {
    const now = new Date();

    if (revFilter === 'day') {
      // 14 ngày gần nhất
      const days: { label: string; revenue: number }[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
        const rev = approvedOrders
          .filter(o => {
            const od = new Date(o.created_at);
            return od.getDate() === d.getDate() && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
          })
          .reduce((sum, o) => sum + Number(o.final_amount), 0);
        days.push({ label: dayLabel, revenue: rev });
      }
      return days;
    }

    if (revFilter === 'week') {
      // 8 tuần gần nhất
      const weeks: { label: string; revenue: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(startOfWeek.getDate() - i * 7);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        
        const rev = approvedOrders
          .filter(o => {
            const od = new Date(o.created_at);
            return od >= startOfWeek && od <= endOfWeek;
          })
          .reduce((sum, o) => sum + Number(o.final_amount), 0);
        weeks.push({ label: `Tuần ${8 - i}`, revenue: rev });
      }
      return weeks;
    }

    if (revFilter === 'month') {
      // 12 tháng
      const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
      const byM = Array(12).fill(0);
      approvedOrders.forEach(o => { byM[new Date(o.created_at).getMonth()] += Number(o.final_amount); });
      return months.map((label, i) => ({ label, revenue: byM[i] }));
    }

    // Năm
    const yearsMap: Record<string, number> = {};
    approvedOrders.forEach(o => {
      const y = String(new Date(o.created_at).getFullYear());
      yearsMap[y] = (yearsMap[y] ?? 0) + Number(o.final_amount);
    });
    const sortedYears = Object.keys(yearsMap).sort();
    if (sortedYears.length === 0) {
      return [{ label: String(now.getFullYear()), revenue: totalRevenue }];
    }
    return sortedYears.map(y => ({ label: `Năm ${y}`, revenue: yearsMap[y] }));
  }, [approvedOrders, revFilter, totalRevenue]);

  // Filter Approved Orders by Selected Time Range (Tuần / Tháng / Năm)
  const filteredApprovedOrders = useMemo(() => {
    const now = new Date();
    return approvedOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      if (topTimeRange === 'week') {
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        return orderDate >= sevenDaysAgo;
      }
      if (topTimeRange === 'month') {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return orderDate >= thirtyDaysAgo;
      }
      // year
      return orderDate.getFullYear() === now.getFullYear();
    });
  }, [approvedOrders, topTimeRange]);

  const filteredApprovedOrderIds = useMemo(() => {
    return new Set(filteredApprovedOrders.map(o => o.id));
  }, [filteredApprovedOrders]);

  // Real Top Best-Selling Subjects by Selected Time Range (Tuần / Tháng / Năm)
  const topSellingSubjectsByRange = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};
    
    orderItems.forEach(item => {
      if (filteredApprovedOrderIds.has(item.order_id)) {
        const n = item.subject_name ?? 'Môn học ôn thi';
        if (!map[n]) map[n] = { name: n, count: 0, revenue: 0 };
        map[n].count++;
        map[n].revenue += Number(item.price);
      }
    });

    const list = Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    const totalRev = list.reduce((s, x) => s + x.revenue, 0) || 1;
    const colors = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
    
    return list.map((s, idx) => ({
      ...s,
      pct: Math.round((s.revenue / totalRev) * 100),
      color: colors[idx % colors.length]
    }));
  }, [orderItems, filteredApprovedOrderIds]);

  // DISPLAY 10 RECENT ORDERS
  const recentOrders = useMemo(() => orders.slice(0, 10), [orders]);

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
              Báo cáo Hệ thống
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

        {/* Card 4: TỔNG SINH VIÊN */}
        <div style={{
          background: '#fff7ed',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #ffedd5',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#d97706', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              TỔNG SINH VIÊN
            </span>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#f59e0b', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.18)'
            }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 8 }}>
            {stats.users.toLocaleString()} Sinh viên
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            Đã đăng ký tài khoản hệ thống TQMaster
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW: REVENUE ANALYTICS (MẶC ĐỊNH THEO NGÀY) + TOP MÔN BÁN CHẠY (MẶC ĐỊNH THEO TUẦN) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1.1fr)',
        gap: 20,
        marginBottom: 24,
      }}>
        {/* Left: Real Revenue Analytics Chart (Default: Ngày) */}
        <div style={{
          background: '#ffffff',
          borderRadius: 22,
          padding: '24px 28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                {revFilter === 'day' ? 'Phân Tích Doanh Thu Theo Ngày' :
                 revFilter === 'week' ? 'Phân Tích Doanh Thu Theo Tuần' :
                 revFilter === 'month' ? 'Phân Tích Doanh Thu Theo Tháng' : 'Phân Tích Doanh Thu Theo Năm'}
              </h2>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: 0 }}>
                Tổng doanh thu ghi nhận: <strong style={{ color: '#2563eb' }}>{formatPrice(totalRevenue)}</strong>
              </p>
            </div>

            {/* Filter Tabs: Ngày (Default) / Tuần / Tháng / Năm */}
            <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
              {(['day', 'week', 'month', 'year'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setRevFilter(t)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 9,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: revFilter === t ? '#2563eb' : 'transparent',
                    color: revFilter === t ? '#ffffff' : '#64748b',
                    boxShadow: revFilter === t ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t === 'day' ? 'Ngày' : t === 'week' ? 'Tuần' : t === 'month' ? 'Tháng' : 'Năm'}
                </button>
              ))}
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

        {/* Right: TOP MÔN BÁN CHẠY (Default: Tuần, Compact Layout) */}
        <div style={{
          background: '#ffffff',
          borderRadius: 22,
          padding: '24px 24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            {/* Header & Time Range Filter Pills */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Top Môn Bán Chạy
              </h2>

              {/* Time Filter Pills (Default: Tuần) */}
              <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 3, borderRadius: 10 }}>
                {(['week', 'month', 'year'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTopTimeRange(t)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 7,
                      border: 'none',
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      background: topTimeRange === t ? '#2563eb' : 'transparent',
                      color: topTimeRange === t ? '#ffffff' : '#64748b',
                      boxShadow: topTimeRange === t ? '0 2px 6px rgba(37, 99, 235, 0.25)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {t === 'week' ? 'Tuần' : t === 'month' ? 'Tháng' : 'Năm'}
                  </button>
                ))}
              </div>
            </div>

            {topSellingSubjectsByRange.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 16px', color: '#94a3b8', textAlign: 'center' }}>
                <Package size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>Chưa có đơn hàng trong khoảng thời gian này</div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Donut Chart */}
                <div style={{ width: 145, height: 145, position: 'relative', flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topSellingSubjectsByRange}
                        cx="50%" cy="50%"
                        innerRadius={46} outerRadius={66}
                        paddingAngle={4}
                        dataKey="revenue"
                      >
                        {topSellingSubjectsByRange.map((d, i) => (
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
                      {topSellingSubjectsByRange.reduce((s, x) => s + x.count, 0)}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 3 }}>
                      Đã bán
                    </div>
                  </div>
                </div>

                {/* Legend list with elegant pill containers */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, overflow: 'hidden' }}>
                  {topSellingSubjectsByRange.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontSize: 12, background: '#f8fafc', padding: '6px 10px', borderRadius: 10,
                      border: '1px solid #f1f5f9'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                        <span style={{ color: '#334155', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>
                          {item.name}
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>
                        {formatPrice(item.revenue)} <span style={{ color: '#94a3b8', fontWeight: 500 }}>({item.pct}%)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Summary Strip to eliminate awkward whitespace */}
          {topSellingSubjectsByRange.length > 0 && (
            <div style={{
              marginTop: 18,
              paddingTop: 12,
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: '#64748b'
            }}>
              <span>Doanh thu kỳ chọn:</span>
              <strong style={{ color: '#2563eb', fontSize: 13, fontWeight: 800 }}>
                {formatPrice(topSellingSubjectsByRange.reduce((s, x) => s + x.revenue, 0))}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* ── LOWER DATA SECTION: REAL RECENT ORDERS TABLE (10 ĐƠN) + TOP SUBJECTS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)',
        gap: 20,
        marginBottom: 24,
      }}>
        {/* Left: Real Orders Data Table (10 Đơn gần đây) */}
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
                Đơn Hàng Gần Đây (10 Đơn Mới Nhất)
              </h2>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>
                Hiển thị 10 đơn hàng mới nhất ghi nhận từ Supabase
              </p>
            </div>

            <button
              onClick={() => setCurrentView('admin-orders')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12.5, fontWeight: 700, color: '#2563eb', background: '#eff6ff', cursor: 'pointer' }}
            >
              Xem tất cả đơn ({stats.orders}) <ChevronRight size={14} />
            </button>
          </div>

          {/* Table (10 Đơn gần đây) */}
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
                    <td style={{ padding: '12px 12px', fontWeight: 800, color: '#2563eb' }}>
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: '12px 12px', fontWeight: 700, color: '#0f172a' }}>
                      {order.full_name || order.email}
                    </td>
                    <td style={{ padding: '12px 12px', color: '#64748b', fontFamily: 'monospace' }}>
                      {order.student_code || '---'}
                    </td>
                    <td style={{ padding: '12px 12px', color: '#64748b' }}>
                      {new Date(order.created_at).toLocaleDateString('vi-VN')}
                    </td>
                    <td style={{ padding: '12px 12px', fontWeight: 800, color: '#0f172a' }}>
                      {formatPrice(order.final_amount)}
                    </td>
                    <td style={{ padding: '12px 12px' }}>{statusBadge(order.status)}</td>
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
              Bảng Xếp Hạng Doanh Thu Môn Học
            </h2>

            {topSellingSubjectsByRange.length === 0 ? (
              <div style={{ color: '#94a3b8', fontSize: 13, textAlign: 'center', padding: '24px 0' }}>
                Chưa có dữ liệu đơn hàng thành công
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {topSellingSubjectsByRange.map((item, idx) => (
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
