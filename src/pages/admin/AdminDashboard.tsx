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
  Loader2, ShoppingCart, Award, ArrowUpRight,
  BarChart, Package
} from 'lucide-react';

type Order = Tables<'orders'>;
type Subject = Tables<'subjects'>;
type OrderItem = Tables<'order_items'>;

// ─── palette for chart gradient fills ───────────────────────────
const CHART_COLORS = {
  revenue: { stroke: '#818cf8', gradStart: 'rgba(129,140,248,0.35)', gradEnd: 'rgba(129,140,248,0)' },
  bar:     ['#818cf8','#34d399','#fb923c','#f472b6','#60a5fa','#facc15','#a78bfa','#2dd4bf'],
};

// ─── Custom tooltip ──────────────────────────────────────────────
function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10, 10, 20, 0.85)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(129, 140, 248, 0.35)',
      borderRadius: 16,
      padding: '14px 18px',
      boxShadow: '0 15px 35px rgba(0,0,0,0.6), 0 0 20px rgba(129,140,248,0.15)',
      animation: 'fadeSlideUp 0.3s ease-out',
    }}>
      <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </div>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>
        {formatPrice(payload[0].value)}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(52,211,153,0.15)', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, color: '#34d399' }}>
          <TrendingUp size={10} />
          <span>+8.4%</span>
        </div>
        <span style={{ fontSize: 10, color: '#475569' }}>so với kỳ trước</span>
      </div>
    </div>
  );
}

function ProductTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,15,30,0.95)', border: '1px solid rgba(52,211,153,0.3)',
      borderRadius: 10, padding: '10px 14px',
    }}>
      <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#34d399' }}>{payload[0].value} đơn</div>
    </div>
  );
}

// ─── Animated counter ────────────────────────────────────────────
function Counter({ value, isString }: { value: number | string; isString?: boolean }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (isString) return;
    const end = Number(value);
    if (end === 0) return;
    let start = 0;
    const step = Math.ceil(end / 40);
    const t = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(t); }
      else setDisplay(start);
    }, 20);
    return () => clearInterval(t);
  }, [value, isString]);
  if (isString) return <>{value}</>;
  return <>{display.toLocaleString('vi-VN')}</>;
}

// ─── Stat card config ────────────────────────────────────────────
const STAT_DEFS = [
  { key: 'revenue',      label: 'Tổng doanh thu',   icon: TrendingUp,  color: '#818cf8', bg: 'rgba(129,140,248,0.12)', isString: true },
  { key: 'users',        label: 'Người dùng',        icon: Users,       color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  { key: 'orders',       label: 'Tổng đơn hàng',    icon: ShoppingCart,color: '#fb923c', bg: 'rgba(251,146,60,0.12)'  },
  { key: 'pendingOrders',label: 'Đơn chờ duyệt',    icon: Clock,       color: '#f472b6', bg: 'rgba(244,114,182,0.12)' },
  { key: 'subjects',     label: 'Môn học',            icon: BookOpen,    color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  { key: 'exams',        label: 'Đề thi',             icon: FileText,    color: '#facc15', bg: 'rgba(250,204,21,0.12)'  },
  { key: 'questions',    label: 'Câu hỏi',            icon: CircleHelp,  color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  { key: 'approved',     label: 'Đơn đã duyệt',      icon: Award,       color: '#2dd4bf', bg: 'rgba(45,212,191,0.12)'  },
];

type RevTab = 'day' | 'month' | 'year';

export default function AdminDashboard() {
  const { setCurrentView } = useApp();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<(OrderItem & { subject_name?: string })[]>([]);
  const [stats, setStats] = useState({
    users: 0, subjects: 0, exams: 0, questions: 0,
    pendingOrders: 0, orders: 0, approved: 0,
  });
  const [revTab, setRevTab] = useState<RevTab>('month');

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
        });

        const approvedIds = allOrders.filter(o => o.status === 'approved').map(o => o.id);
        if (approvedIds.length > 0) {
          const { data: itemsData } = await supabase
            .from('order_items')
            .select('*, subjects(name)')
            .in('order_id', approvedIds);
          const allItems = (itemsData ?? []) as any[];
          setOrderItems(allItems.map((i: any) => ({ ...i, subject_name: i.subjects?.name ?? 'Không rõ' })));
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

  // Revenue chart data per tab
  const revenueChartData = useMemo(() => {
    const now = new Date();
    if (revTab === 'day') {
      const days: Record<string, number> = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        days[`${d.getDate()}/${d.getMonth() + 1}`] = 0;
      }
      approvedOrders.forEach(o => {
        const d = new Date(o.created_at);
        const key = `${d.getDate()}/${d.getMonth() + 1}`;
        if (key in days) days[key] += Number(o.final_amount);
      });
      return Object.entries(days).map(([label, revenue]) => ({ label, revenue }));
    }
    if (revTab === 'month') {
      const months = ['T1','T2','T3','T4','T5','T6','T7','T8','T9','T10','T11','T12'];
      const byM = Array(12).fill(0);
      approvedOrders.forEach(o => { byM[new Date(o.created_at).getMonth()] += Number(o.final_amount); });
      return months.map((label, i) => ({ label, revenue: byM[i] }));
    }
    // year
    const years: Record<string, number> = {};
    approvedOrders.forEach(o => {
      const y = String(new Date(o.created_at).getFullYear());
      years[y] = (years[y] ?? 0) + Number(o.final_amount);
    });
    return Object.entries(years).sort().map(([label, revenue]) => ({ label, revenue }));
  }, [approvedOrders, revTab]);

  // Best-selling subjects from order_items
  const topSubjects = useMemo(() => {
    const map: Record<string, { name: string; count: number; revenue: number }> = {};
    orderItems.forEach(item => {
      const n = item.subject_name ?? 'Không rõ';
      if (!map[n]) map[n] = { name: n, count: 0, revenue: 0 };
      map[n].count++;
      map[n].revenue += Number(item.price);
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [orderItems]);

  const recentOrders = orders.slice(0, 6);

  const statValues: Record<string, any> = {
    ...stats,
    revenue: formatPrice(totalRevenue),
  };

  const statusBadge = (s: string) => {
    if (s === 'pending')  return <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(250,204,21,0.15)', color: '#fbbf24' }}>Chờ duyệt</span>;
    if (s === 'approved') return <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>Đã duyệt</span>;
    return <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: 'rgba(244,114,182,0.15)', color: '#f472b6' }}>Từ chối</span>;
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#818cf8' }} />
    </div>
  );

  const maxCount = topSubjects[0]?.count || 1;

  return (
    <div style={{ padding: '28px 32px', flex: 1, minWidth: 0, background: '#0a0a1a', minHeight: '100vh', color: '#e2e8f0' }}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 4, height: 32, borderRadius: 2, background: 'linear-gradient(180deg,#818cf8,#34d399)', boxShadow: '0 0 12px rgba(129,140,248,0.6)' }} />
          <h1 className="text-prominent" style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>
            Dashboard Admin
          </h1>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', marginLeft: 14, letterSpacing: '0.01em' }}>
          Tổng quan hệ thống TQMaster
          <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 4, background: 'rgba(52,211,153,0.12)', color: '#34d399', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>● Live</span>
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="dash-stats-grid">
        {STAT_DEFS.map((def, idx) => {
          const Icon = def.icon;
          const val = statValues[def.key];
          return (
            <div key={def.key} className="dash-stat-card" style={{
              background: `linear-gradient(135deg, ${def.color}10 0%, rgba(10,10,26,0.8) 100%)`,
              border: `1px solid ${def.color}33`,
              borderRadius: 18,
              padding: '20px 22px',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.22s cubic-bezier(0.25,1,0.5,1), box-shadow 0.22s',
              animationDelay: `${idx * 55}ms`,
              animation: 'fadeSlideUp 0.45s cubic-bezier(0.25,1,0.5,1) both',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-5px)';
                el.style.boxShadow = `0 16px 40px ${def.color}30, 0 4px 12px rgba(0,0,0,0.4)`;
                el.style.borderColor = `${def.color}66`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = '';
                el.style.boxShadow = '';
                el.style.borderColor = '';
              }}
            >
              {/* shimmer line at top */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${def.color}, transparent)`, opacity: 0.7 }} />
              {/* glow blob */}
              <div style={{ position: 'absolute', bottom: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: def.color, opacity: 0.1, filter: 'blur(24px)' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${def.color}20`, border: `1px solid ${def.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${def.color}20` }}>
                  <Icon size={18} style={{ color: def.color }} />
                </div>
                <ArrowUpRight size={14} style={{ color: def.color, opacity: 0.7 }} />
              </div>
              <div style={{ fontSize: def.isString ? 18 : 30, fontWeight: 900, color: def.color, lineHeight: 1.05, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', marginBottom: 5, textShadow: `0 0 20px ${def.color}60` }}>
                <Counter value={val} isString={def.isString} />
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{def.label}</div>
            </div>
          );
        })}
      </div>

      {/* ── Revenue Section ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(129,140,248,0.08) 0%, rgba(15,15,30,0.6) 60%, rgba(52,211,153,0.06) 100%)',
        border: '1px solid rgba(129,140,248,0.25)',
        borderRadius: 24,
        padding: '28px 28px 20px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* glow decorations */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: '#818cf8', opacity: 0.07, filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 260, height: 260, borderRadius: '50%', background: '#34d399', opacity: 0.06, filter: 'blur(70px)', pointerEvents: 'none' }} />

        {/* Top: title + tab + big number */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 22 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(129,140,248,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart size={16} style={{ color: '#818cf8' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Phân tích doanh thu</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#c7d2fe', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1, marginBottom: 6 }}>
              {formatPrice(totalRevenue)}
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Từ <strong style={{ color: '#34d399' }}>{approvedOrders.length}</strong> đơn đã duyệt</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>Chờ duyệt: <strong style={{ color: '#f472b6' }}>{stats.pendingOrders}</strong></span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, background: 'rgba(0,0,0,0.3)', padding: 4, borderRadius: 12, alignSelf: 'flex-start' }}>
            {(['day','month','year'] as RevTab[]).map(t => (
              <button key={t} onClick={() => setRevTab(t)} style={{
                padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: revTab === t ? 'linear-gradient(135deg,#818cf8,#6366f1)' : 'transparent',
                color: revTab === t ? '#fff' : '#64748b',
                boxShadow: revTab === t ? '0 4px 14px rgba(129,140,248,0.4)' : 'none',
                transition: 'all 0.2s',
              }}>
                {t === 'day' ? '30 Ngày' : t === 'month' ? 'Tháng' : 'Năm'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 22 }}>
          {[
            { label: 'Doanh thu tháng này', value: formatPrice(revenueChartData[new Date().getMonth()]?.revenue ?? 0), color: '#818cf8' },
            { label: 'Cao nhất', value: formatPrice(Math.max(...revenueChartData.map(d => d.revenue))), color: '#34d399' },
            { label: 'TB / kỳ', value: formatPrice(revenueChartData.filter(d=>d.revenue>0).length ? Math.round(totalRevenue / revenueChartData.filter(d=>d.revenue>0).length) : 0), color: '#fb923c' },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px', border: `1px solid ${kpi.color}22` }}>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Area chart */}
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={revenueChartData} margin={{ top: 20, right: 10, bottom: 0, left: -15 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
              <filter id="lineShadow" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
                <feOffset dx="0" dy="4" result="offsetblur" />
                <feFlood floodColor="#818cf8" floodOpacity="0.5" />
                <feComposite in2="offsetblur" operator="in" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              interval={revTab === 'day' ? 4 : 0}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v === 0 ? '0' : `${(v/1000000).toFixed(1)}M`}
              dx={-5}
            />
            <Tooltip content={<RevenueTooltip />} cursor={{ stroke: 'rgba(129, 140, 248, 0.2)', strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#818cf8"
              strokeWidth={4}
              fill="url(#revGrad)"
              filter="url(#lineShadow)"
              animationDuration={1500}
              dot={{ r: 4, fill: '#0f0f12', stroke: '#818cf8', strokeWidth: 2, fillOpacity: 1 }}
              activeDot={{ r: 7, fill: '#818cf8', stroke: '#fff', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Bottom row: Best sellers + Recent orders ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>

        {/* Best-selling products — donut chart */}
        <div style={{ background: 'linear-gradient(135deg,rgba(52,211,153,0.07) 0%,rgba(15,15,30,0.5) 100%)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 24, padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: '#34d399', opacity: 0.06, filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={16} style={{ color: '#34d399' }} />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Top 5 Sản phẩm bán chạy</h2>
          </div>
          <p style={{ fontSize: 11, color: '#64748b', marginBottom: 16, marginLeft: 40 }}>Theo doanh thu từ đơn đã duyệt</p>

          {topSubjects.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, padding: '60px 0' }}>Chưa có dữ liệu đơn hàng</div>
          ) : (() => {
            const PIE_COLORS = ['#818cf8','#34d399','#fb923c','#f472b6','#60a5fa'];
            const totalRev = topSubjects.reduce((s,x) => s + x.revenue, 0) || 1;
            const pieData = topSubjects.map((s,i) => ({ name: s.name, value: s.revenue, count: s.count, color: PIE_COLORS[i] }));
            const DonutLabel = ({ cx, cy }: any) => (
              <>
                <text x={cx} y={cy - 8} textAnchor="middle" fill="#c7d2fe" fontSize={22} fontWeight={900} fontFamily="inherit">
                  {topSubjects.length}
                </text>
                <text x={cx} y={cy + 14} textAnchor="middle" fill="#64748b" fontSize={10} fontFamily="inherit">
                  môn học
                </text>
              </>
            );
            return (
              <div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <defs>
                      {PIE_COLORS.map((c,i) => (
                        <radialGradient key={i} id={`pieGrad${i}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor={c} stopOpacity={1} />
                          <stop offset="100%" stopColor={c} stopOpacity={0.7} />
                        </radialGradient>
                      ))}
                    </defs>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={58} outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={DonutLabel}
                      isAnimationActive
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={`url(#pieGrad${i})`} stroke="rgba(0,0,0,0.3)" strokeWidth={1} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div style={{ background: 'rgba(10,10,26,0.95)', border: `1px solid ${d.color}44`, borderRadius: 10, padding: '10px 14px' }}>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{d.name}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: d.color }}>{formatPrice(d.value)}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{d.count} đơn · {Math.round(d.value/totalRev*100)}%</div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  {pieData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{d.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, color: d.color, fontWeight: 700 }}>{Math.round(d.value/totalRev*100)}%</span>
                        <span style={{ fontSize: 11, color: '#475569', fontVariantNumeric: 'tabular-nums' }}>{formatPrice(d.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Recent orders */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251,146,60,0.15)', borderRadius: 20, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: '#fb923c', opacity: 0.05, filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShoppingCart size={17} style={{ color: '#fb923c' }} />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Đơn hàng gần nhất</h2>
            </div>
            <button onClick={() => setCurrentView('admin-orders')} style={{
              fontSize: 12, fontWeight: 600, color: '#fb923c', background: 'rgba(251,146,60,0.1)',
              border: '1px solid rgba(251,146,60,0.2)', borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
            }}>
              Xem tất cả
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '40px 0', fontSize: 13 }}>Chưa có đơn hàng</div>
          ) : recentOrders.map((order, i) => (
            <div key={order.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '13px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>{order.full_name}</div>
                <div style={{ fontSize: 11, color: '#475569', fontVariantNumeric: 'tabular-nums' }}>
                  {new Date(order.created_at).toLocaleDateString('vi-VN')} · #{order.id.slice(0, 8)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#fb923c', fontVariantNumeric: 'tabular-nums' }}>{formatPrice(order.final_amount)}</span>
                {statusBadge(order.status)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
