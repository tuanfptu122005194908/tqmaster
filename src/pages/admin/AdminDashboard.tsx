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
  BarChart3, Package, ChevronRight
} from 'lucide-react';

type Order = Tables<'orders'>;
type Subject = Tables<'subjects'>;
type OrderItem = Tables<'order_items'>;

// ─── Custom tooltip for Light Mode ──────────────────────────────────────────
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

// ─── Stat card config for Light SaaS theme ───────────────────────────
const STAT_DEFS = [
  { key: 'revenue',      label: 'Tổng doanh thu',   icon: TrendingUp,   color: '#4f46e5', bg: '#e0e7ff', border: '#c7d2fe', isString: true },
  { key: 'users',        label: 'Người dùng',        icon: Users,        color: '#059669', bg: '#dcfce7', border: '#a7f3d0' },
  { key: 'orders',       label: 'Tổng đơn hàng',    icon: ShoppingCart, color: '#d97706', bg: '#fef3c7', border: '#fde68a' },
  { key: 'pendingOrders',label: 'Đơn chờ duyệt',    icon: Clock,        color: '#e11d48', bg: '#ffe4e6', border: '#fecdd3' },
  { key: 'subjects',     label: 'Môn học',            icon: BookOpen,     color: '#0284c7', bg: '#e0f2fe', border: '#bae6fd' },
  { key: 'exams',        label: 'Đề thi',             icon: FileText,     color: '#ca8a04', bg: '#fef9c3', border: '#fef08a' },
  { key: 'questions',    label: 'Câu hỏi',            icon: CircleHelp,   color: '#7c3aed', bg: '#f3e8ff', border: '#ddd6fe' },
  { key: 'approved',     label: 'Đơn đã duyệt',      icon: Award,        color: '#0d9488', bg: '#ccfbf1', border: '#99f6e4' },
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
    if (s === 'pending')  return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>Chờ duyệt</span>;
    if (s === 'approved') return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>Đã duyệt</span>;
    return <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3' }}>Từ chối</span>;
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, background: '#f8fafc' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#4f46e5' }} />
    </div>
  );

  return (
    <div style={{ padding: '32px 36px', flex: 1, minWidth: 0, background: '#f8fafc', minHeight: '100vh', color: '#0f172a' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
              Dashboard Admin
            </h1>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px',
              borderRadius: 20, background: '#dcfce7', color: '#15803d',
              fontSize: 12, fontWeight: 700, border: '1px solid #bbf7d0'
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} /> Trực tiếp
            </span>
          </div>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
            Tổng quan chỉ số hiệu suất & tình hình kinh doanh TQMaster
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setCurrentView('admin-orders')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
              background: '#ffffff', color: '#334155', border: '1px solid #cbd5e1',
              borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all 0.15s'
            }}
          >
            <ShoppingCart size={16} /> Quản lý đơn hàng ({stats.pendingOrders} mới)
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="dash-stats-grid" style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 28
      }}>
        {STAT_DEFS.map((def) => {
          const Icon = def.icon;
          const val = statValues[def.key];
          return (
            <div key={def.key} style={{
              background: '#ffffff',
              border: `1px solid #e2e8f0`,
              borderRadius: 16,
              padding: '20px 22px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 6px 12px -2px rgba(0,0,0,0.02)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = 'translateY(-3px)';
                el.style.boxShadow = '0 12px 24px -4px rgba(0,0,0,0.08)';
                el.style.borderColor = def.color;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.transform = '';
                el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 6px 12px -2px rgba(0,0,0,0.02)';
                el.style.borderColor = '#e2e8f0';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, background: def.bg,
                  border: `1px solid ${def.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={20} style={{ color: def.color }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f1f5f9', padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: '#475569' }}>
                  <span>+0%</span>
                  <ArrowUpRight size={12} />
                </div>
              </div>
              <div style={{
                fontSize: def.isString ? 22 : 28, fontWeight: 800, color: '#0f172a',
                lineHeight: 1.1, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', marginBottom: 6
              }}>
                <Counter value={val} isString={def.isString} />
              </div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, letterSpacing: '0.01em' }}>
                {def.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Revenue Section ── */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        padding: '28px',
        marginBottom: 28,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 10px 20px -5px rgba(0,0,0,0.03)',
      }}>
        {/* Top: title + tab + big number */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
                <BarChart3 size={18} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#4f46e5', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Phân tích doanh thu</span>
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, marginBottom: 6 }}>
              {formatPrice(totalRevenue)}
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>Đã xác nhận từ <strong style={{ color: '#059669' }}>{approvedOrders.length}</strong> đơn hàng</span>
              <span style={{ fontSize: 13, color: '#64748b' }}>Chờ xử lý: <strong style={{ color: '#e11d48' }}>{stats.pendingOrders}</strong> đơn</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
            {(['day','month','year'] as RevTab[]).map(t => (
              <button key={t} onClick={() => setRevTab(t)} style={{
                padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                background: revTab === t ? '#4f46e5' : 'transparent',
                color: revTab === t ? '#ffffff' : '#64748b',
                boxShadow: revTab === t ? '0 2px 8px rgba(79,70,229,0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}>
                {t === 'day' ? '30 Ngày' : t === 'month' ? 'Tháng' : 'Năm'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Summary Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Doanh thu tháng này', value: formatPrice(revenueChartData[new Date().getMonth()]?.revenue ?? 0), color: '#4f46e5', bg: '#f5f3ff' },
            { label: 'Doanh thu cao nhất', value: formatPrice(Math.max(...revenueChartData.map(d => d.revenue))), color: '#059669', bg: '#f0fdf4' },
            { label: 'Doanh thu trung bình', value: formatPrice(revenueChartData.filter(d=>d.revenue>0).length ? Math.round(totalRevenue / revenueChartData.filter(d=>d.revenue>0).length) : 0), color: '#d97706', bg: '#fffbeb' },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: kpi.bg, borderRadius: 12, padding: '14px 18px', border: `1px solid ${kpi.color}20` }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: kpi.color, fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Area chart */}
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={revenueChartData} margin={{ top: 20, right: 10, bottom: 0, left: -15 }}>
            <defs>
              <linearGradient id="revGradLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              interval={revTab === 'day' ? 4 : 0}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => v === 0 ? '0' : `${(v/1000000).toFixed(1)}M`}
              dx={-5}
            />
            <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#4f46e5"
              strokeWidth={3}
              fill="url(#revGradLight)"
              animationDuration={1200}
              dot={{ r: 4, fill: '#ffffff', stroke: '#4f46e5', strokeWidth: 2, fillOpacity: 1 }}
              activeDot={{ r: 7, fill: '#4f46e5', stroke: '#ffffff', strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Bottom row: Best sellers + Recent orders ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>

        {/* Top 5 Products — Donut chart */}
        <div style={{
          background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 10px 20px -5px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <Package size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Top 5 Môn học bán chạy</h2>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16, marginLeft: 44 }}>Phân bổ doanh thu theo từng khóa học</p>

          {topSubjects.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, padding: '60px 0' }}>Chưa có dữ liệu đơn hàng</div>
          ) : (() => {
            const PIE_COLORS = ['#4f46e5','#10b981','#f59e0b','#ec4899','#06b6d4'];
            const totalRev = topSubjects.reduce((s,x) => s + x.revenue, 0) || 1;
            const pieData = topSubjects.map((s,i) => ({ name: s.name, value: s.revenue, count: s.count, color: PIE_COLORS[i] }));
            const DonutLabel = ({ cx, cy }: any) => (
              <>
                <text x={cx} y={cy - 6} textAnchor="middle" fill="#0f172a" fontSize={22} fontWeight={800} fontFamily="inherit">
                  {topSubjects.length}
                </text>
                <text x={cx} y={cy + 14} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={600} fontFamily="inherit">
                  môn học
                </text>
              </>
            );
            return (
              <div>
                <ResponsiveContainer width="100%" height={210}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={88}
                      paddingAngle={4}
                      dataKey="value"
                      labelLine={false}
                      label={DonutLabel}
                      isAnimationActive
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (!active || !payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div style={{ background: '#ffffff', border: `1px solid ${d.color}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 3 }}>{d.name}</div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: d.color }}>{formatPrice(d.value)}</div>
                            <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{d.count} đơn đã bán ({Math.round(d.value/totalRev*100)}%)</div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  {pieData.map((d, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>{d.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 12, color: d.color, fontWeight: 800, background: '#ffffff', padding: '2px 8px', borderRadius: 12, border: `1px solid ${d.color}30` }}>
                          {Math.round(d.value/totalRev*100)}%
                        </span>
                        <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatPrice(d.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Recent orders */}
        <div style={{
          background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 10px 20px -5px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <ShoppingCart size={18} />
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>Đơn hàng mới nhất</h2>
            </div>
            <button
              onClick={() => setCurrentView('admin-orders')}
              style={{
                fontSize: 12, fontWeight: 700, color: '#4f46e5', background: '#e0e7ff',
                border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s'
              }}
            >
              Xem tất cả <ChevronRight size={14} />
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '60px 0', fontSize: 13 }}>Chưa có đơn hàng nào</div>
          ) : recentOrders.map((order) => (
            <div key={order.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 24px', borderBottom: '1px solid #f8fafc',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#f8fafc'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = ''}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 3 }}>{order.full_name}</div>
                <div style={{ fontSize: 12, color: '#64748b', fontVariantNumeric: 'tabular-nums' }}>
                  {new Date(order.created_at).toLocaleDateString('vi-VN')} · #{order.id.slice(0, 8)}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>{formatPrice(order.final_amount)}</span>
                {statusBadge(order.status)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
