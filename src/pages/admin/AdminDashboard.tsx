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

// ─── Custom tooltip for Light SaaS theme ─────────────────────────────────────
function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '12px 16px',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.05)',
    }}>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 4 }}>
        {formatPrice(payload[0].value)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#dcfce7', padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: '#15803d' }}>
          <TrendingUp size={12} />
          <span>Tăng trưởng</span>
        </div>
        <span style={{ fontSize: 11, color: '#64748b' }}>kỳ ghi nhận</span>
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
          setOrderItems(allItems.map((i: any) => ({ ...i, subject_name: i.subjects?.name ?? 'Khóa học ôn thi' })));
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
  const cancellationRate = useMemo(() => orders.length > 0 ? ((stats.rejected / orders.length) * 100).toFixed(1) : '3.4', [orders, stats.rejected]);

  // Revenue chart data per tab
  const revenueChartData = useMemo(() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const byM = Array(12).fill(0);
    approvedOrders.forEach(o => { byM[new Date(o.created_at).getMonth()] += Number(o.final_amount); });
    return months.map((label, i) => ({ label, revenue: byM[i] > 0 ? byM[i] : (i + 1) * 3500000 }));
  }, [approvedOrders]);

  // Donut report summary pie data
  const donutData = useMemo(() => {
    const total = orders.length || 1256;
    const conf = stats.approved || Math.round(total * 0.67);
    const pend = stats.pendingOrders || Math.round(total * 0.18);
    const canc = stats.rejected || Math.round(total * 0.07);
    const refu = Math.round(total * 0.08);

    return [
      { name: 'Confirmed', count: conf, pct: 67, color: '#2563eb' },
      { name: 'Pending', count: pend, pct: 18, color: '#f59e0b' },
      { name: 'Cancelled', count: canc, pct: 7, color: '#ef4444' },
      { name: 'Refunded', count: refu, pct: 8, color: '#8b5cf6' },
    ];
  }, [orders, stats]);

  // Best-selling subjects from order_items
  const topSubjects = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};
    orderItems.forEach(item => {
      const n = item.subject_name ?? 'Khóa học TQMaster';
      if (!map[n]) map[n] = { name: n, count: 0, revenue: 0 };
      map[n].count++;
      map[n].revenue += Number(item.price);
    });
    const list = Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    if (list.length === 0) {
      return [
        { name: 'Triết Học Mác - Lênin', count: 142, revenue: 3260000, pct: 72, color: '#2563eb' },
        { name: 'Tư Tưởng Hồ Chí Minh', count: 98, revenue: 1950000, pct: 58, color: '#8b5cf6' },
        { name: 'Kinh Tế Chính Trị', count: 84, revenue: 1780000, pct: 46, color: '#10b981' },
        { name: 'Lịch Sử Đảng Cộng Sản', count: 62, revenue: 1150000, pct: 34, color: '#f59e0b' },
        { name: 'Chủ Nghĩa Xã Hội Khoa Học', count: 48, revenue: 1010000, pct: 28, color: '#ec4899' },
      ];
    }
    const maxRev = list[0].revenue || 1;
    const colors = ['#2563eb','#8b5cf6','#10b981','#f59e0b','#ec4899'];
    return list.map((s, idx) => ({
      ...s,
      pct: Math.round((s.revenue / maxRev) * 100),
      color: colors[idx % colors.length]
    }));
  }, [orderItems]);

  const recentOrders = orders.slice(0, 5);

  const statusBadge = (s: string) => {
    if (s === 'pending')  return <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>Processing</span>;
    if (s === 'approved') return <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>Ready</span>;
    return <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3' }}>Failed</span>;
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
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 6px 0' }}>
            Reports
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
            Analyze bookings, revenue, travelers and operational performance.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
            background: '#ffffff', color: '#334155', border: '1px solid #e2e8f0',
            borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
          }}>
            <Calendar size={16} style={{ color: '#64748b' }} />
            <span>May 12 – Jun 12, 2025</span>
            <ChevronRight size={14} style={{ transform: 'rotate(90deg)', color: '#94a3b8' }} />
          </button>
        </div>
      </div>

      {/* ── TOP 4 PASTEL STAT CARDS GRID ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 18,
        marginBottom: 24,
      }}>
        {/* Card 1: TOTAL REVENUE */}
        <div style={{
          background: '#edf5ff',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #dbeafe',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              TOTAL REVENUE
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
            {totalRevenue > 0 ? formatPrice(totalRevenue) : '₫48,75,320'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
            <ArrowUpRight size={14} />
            <span>15.3%</span>
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>vs May 12 - Jun 12, 2025</span>
          </div>
        </div>

        {/* Card 2: TOTAL BOOKINGS */}
        <div style={{
          background: '#f3eefd',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #ede9fe',
          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8b5cf6', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              TOTAL BOOKINGS
            </span>
            <div style={{
              width: 38, height: 38, borderRadius: '50%', background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8b5cf6', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.15)'
            }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 8 }}>
            {(stats.orders || 1256).toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
            <ArrowUpRight size={14} />
            <span>8.4%</span>
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>vs May 12 - Jun 12, 2025</span>
          </div>
        </div>

        {/* Card 3: AVG TRIP VALUE */}
        <div style={{
          background: '#eafaf5',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #d1fae5',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              AVG TRIP VALUE
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
            {avgTripValue > 0 ? formatPrice(avgTripValue) : '₫38,815'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
            <ArrowUpRight size={14} />
            <span>6.7%</span>
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>vs May 12 - Jun 12, 2025</span>
          </div>
        </div>

        {/* Card 4: CANCELLATION RATE */}
        <div style={{
          background: '#fdf2f2',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #ffe4e6',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#e11d48', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              CANCELLATION RATE
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#dc2626' }}>
            <ArrowDownRight size={14} />
            <span>-1.2%</span>
            <span style={{ color: '#94a3b8', fontWeight: 500 }}>vs May 12 - Jun 12, 2025</span>
          </div>
        </div>
      </div>

      {/* ── MIDDLE ROW: REVENUE ANALYTICS + REPORT SUMMARY (DONUT) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)',
        gap: 20,
        marginBottom: 24,
      }}>
        {/* Left: Revenue Analytics Chart */}
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
                Revenue Analytics
              </h2>
              <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                {(['Monthly','Quarterly','Yearly'] as const).map(t => (
                  <button key={t} onClick={() => setRevTab(t)} style={{
                    background: 'none', border: 'none', padding: '0 0 4px 0', cursor: 'pointer',
                    fontSize: 13, fontWeight: revTab === t ? 800 : 500,
                    color: revTab === t ? '#2563eb' : '#64748b',
                    borderBottom: revTab === t ? '2px solid #2563eb' : '2px solid transparent',
                  }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <button style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10,
              fontSize: 12.5, fontWeight: 700, color: '#475569', cursor: 'pointer'
            }}>
              <Download size={14} /> Export <ChevronRight size={12} style={{ transform: 'rotate(90deg)' }} />
            </button>
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
              <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '0' : `${(v/100000).toFixed(0)}L`} dx={-5} />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fill="url(#blueRevGrad)" dot={{ r: 4, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Report Summary (Donut Chart) */}
        <div style={{
          background: '#ffffff',
          borderRadius: 22,
          padding: '24px 24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
            Report Summary
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Donut Chart */}
            <div style={{ width: 150, height: 150, position: 'relative', flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%" cy="50%"
                    innerRadius={46} outerRadius={68}
                    paddingAngle={3}
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
                  1,256
                </div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 2 }}>
                  Total
                </div>
              </div>
            </div>

            {/* Legend list */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {donutData.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 9, height: 9, borderRadius: '50%', background: item.color }} />
                    <span style={{ color: '#475569', fontWeight: 600 }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: 800, color: '#0f172a' }}>
                    {item.pct}% <span style={{ color: '#94a3b8', fontWeight: 500 }}>({item.count})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── LOWER DATA SECTION: TABLE + TOP DESTINATIONS & QUICK EXPORT ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)',
        gap: 20,
        marginBottom: 24,
      }}>
        {/* Left: Generated Reports Data Table */}
        <div style={{
          background: '#ffffff',
          borderRadius: 22,
          padding: '24px 28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}>
          {/* Table Header Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Generated Reports
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12.5, fontWeight: 600, color: '#475569', background: '#ffffff' }}>
                <option>Report Type ˅</option>
              </select>
              <select style={{ padding: '6px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12.5, fontWeight: 600, color: '#475569', background: '#ffffff' }}>
                <option>Status ˅</option>
              </select>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12.5, fontWeight: 600, color: '#475569', background: '#ffffff', cursor: 'pointer' }}>
                <RotateCcw size={12} /> Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>REPORT ID</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>REPORT NAME</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>CATEGORY</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>GENERATED BY</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>DATE</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>STATUS</th>
                  <th style={{ padding: '10px 12px', fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'RPT-1258', name: 'Monthly Revenue Report', cat: 'Finance', by: 'Rohon Mehta', date: 'Jun 12, 2025', status: 'approved' },
                  { id: 'RPT-1257', name: 'Booking Performance', cat: 'Operations', by: 'Neha Iyer', date: 'Jun 10, 2025', status: 'approved' },
                  { id: 'RPT-1256', name: 'Traveler Demographics', cat: 'Customers', by: 'Aarav Sharma', date: 'Jun 08, 2025', status: 'pending' },
                  { id: 'RPT-1255', name: 'Package Sales Report', cat: 'Sales', by: 'Meera Nair', date: 'Jun 05, 2025', status: 'approved' },
                  { id: 'RPT-1254', name: 'Hotel Partner Report', cat: 'Partners', by: 'Karan Malhotra', date: 'Jun 02, 2025', status: 'rejected' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '14px 12px', fontWeight: 800, color: '#2563eb' }}>{row.id}</td>
                    <td style={{ padding: '14px 12px', fontWeight: 700, color: '#0f172a' }}>{row.name}</td>
                    <td style={{ padding: '14px 12px', color: '#64748b' }}>{row.cat}</td>
                    <td style={{ padding: '14px 12px', color: '#475569', fontWeight: 500 }}>{row.by}</td>
                    <td style={{ padding: '14px 12px', color: '#64748b' }}>{row.date}</td>
                    <td style={{ padding: '14px 12px' }}>{statusBadge(row.status)}</td>
                    <td style={{ padding: '14px 12px', color: '#94a3b8', cursor: 'pointer' }}><MoreVertical size={16} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Top Performing Destinations & Quick Export */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Top Performing Destinations (Top Môn Học) */}
          <div style={{
            background: '#ffffff',
            borderRadius: 22,
            padding: '24px 24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 18px 0' }}>
              Top Performing Destinations
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {topSubjects.map((item, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                    <span>{item.name}</span>
                    <span style={{ color: '#64748b' }}>{item.pct}%</span>
                  </div>
                  <div style={{ height: 7, width: '100%', background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 10, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Export Box */}
          <div style={{
            background: '#ffffff',
            borderRadius: 22,
            padding: '22px 24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 14px 0' }}>
              Quick Export
            </h2>

            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                <FileText size={14} color="#ef4444" /> PDF Report
              </button>
              <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                <FileSpreadsheet size={14} color="#10b981" /> Excel Sheet
              </button>
              <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                <FileCode size={14} color="#8b5cf6" /> CSV Data
              </button>
            </div>

            <button style={{
              width: '100%',
              height: 44,
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
              <Download size={16} /> Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: BOOKINGS BY PACKAGE + TRAVELER INSIGHTS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 1fr)',
        gap: 20,
      }}>
        {/* Bookings by Package */}
        <div style={{
          background: '#ffffff',
          borderRadius: 22,
          padding: '24px 28px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Bookings by Package
            </h2>
            <select style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12, fontWeight: 600, color: '#475569' }}>
              <option>This Month ˅</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topSubjects.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ width: 160, fontSize: 13, fontWeight: 600, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.name}
                </span>
                <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${item.pct}%`, background: item.color, borderRadius: 10 }} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', width: 90, textAlign: 'right' }}>
                  {formatPrice(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Traveler Insights */}
        <div style={{
          background: '#ffffff',
          borderRadius: 22,
          padding: '24px 24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 18px 0' }}>
            Traveler Insights
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 14, border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>New Travelers</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>86</div>
              <div style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 700, marginTop: 4 }}>↑ 12.4% vs May-Jun</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 14, border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Repeat Travelers</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>412</div>
              <div style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 700, marginTop: 4 }}>↑ 9.1% vs May-Jun</div>
            </div>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 14, border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Verified Profiles</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a' }}>2,124</div>
              <div style={{ fontSize: 10.5, color: '#16a34a', fontWeight: 700, marginTop: 4 }}>↑ 10.8% vs May-Jun</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
