import React, { useState, lazy, Suspense } from 'react';
import { useCommerceSummary, useRecentOrders, useRevenueSeries, useSubjectSales } from '@/hooks/useAdminAnalytics';
import { AdminDataState } from '@/components/admin/AdminDataState';
import { formatPrice } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import {
  Users, BookOpen, FileText, CircleHelp, Clock, TrendingUp,
  Loader2, ShoppingCart, Award, ArrowUpRight, ArrowDownRight,
  BarChart3, Package, ChevronRight, Calendar, Filter, RotateCcw,
  FileSpreadsheet, FileCode, Download, RefreshCw, XCircle, Tag, CheckCircle2, MoreVertical
} from 'lucide-react';


// ─── Custom Tooltip for Revenue Chart ───────────────────────────────────────

const RevenueChart = lazy(() => import('@/components/admin/DashboardCharts').then(m => ({default:m.RevenueChart})));
const SubjectDonut = lazy(() => import('@/components/admin/DashboardCharts').then(m => ({default:m.SubjectDonut})));

type RevFilter = 'day' | 'week' | 'month' | 'year';

import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [revFilter, setRevFilter] = useState<RevFilter>('day');
  const [topTimeRange, setTopTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [isPurging, setIsPurging] = useState(false);

  const handlePurgeAttemptAnswers = async () => {
    setIsPurging(true);
    try {
      const { data, error } = await supabase.rpc('purge_old_attempt_answers', { days_old: 1 });
      if (error) throw error;
      const deleted = (data as any)?.deleted_rows ?? 0;
      if (deleted > 0) {
        toast.success(`Đã dọn dẹp thành công ${deleted.toLocaleString()} câu trả lời cũ! Giải phóng dung lượng Database.`);
      } else {
        toast.success('Hệ thống Database đã ở trạng thái tối ưu nhất (không có bản ghi cũ nào cần dọn dẹp).');
      }
    } catch (err: any) {
      toast.error('Lỗi khi dọn dẹp database: ' + (err.message || 'Thử lại sau'));
    } finally {
      setIsPurging(false);
    }
  };
  const summary = useCommerceSummary();
  const recent = useRecentOrders();
  const series = useRevenueSeries(revFilter);
  const sales = useSubjectSales(topTimeRange, 5);
  const stats = summary.data;
  const totalRevenue = stats?.revenue;
  const avgTripValue = stats ? (stats.approved ? Math.round(stats.revenue / stats.approved) : 0) : undefined;
  const revenueChartData = series.data ?? [];
  const recentOrders = recent.data ?? [];
  const colors = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899'];
  const topSellingSubjectsByRange = (sales.data?.rows ?? []).map((s, idx) => ({
    ...s, pct: sales.data?.total ? Math.round(s.revenue / sales.data.total * 100) : 0,
    color: colors[idx % colors.length],
  }));

  const otherRevenue = Math.max(0, (sales.data?.total ?? 0) - topSellingSubjectsByRange.reduce((sum, s) => sum + s.revenue, 0));
  const pieData = otherRevenue ? [...topSellingSubjectsByRange, {name: 'Khác / chưa phân bổ', revenue: otherRevenue, color: '#94a3b8'}] : topSellingSubjectsByRange;
  const statusBadge = (s: string) => {
    if (s === 'pending')  return <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>Chờ duyệt</span>;
    if (s === 'approved') return <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>Đã duyệt</span>;
    return <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3' }}>Từ chối</span>;
  };

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
            onClick={() => navigate('/admin/orders')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px',
              background: '#2563eb', color: '#ffffff', border: 'none',
              borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}
          >
            <ShoppingCart size={16} /> Quản lý đơn hàng ({(stats?.pendingOrders ?? '—')} đơn mới)
          </button>
        </div>
      </div>

      <AdminDataState query={summary} />
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
              TỔNG DOANH THU · MỌI THỜI GIAN
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
            {totalRevenue === undefined ? '—' : formatPrice(totalRevenue)}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            Đã duyệt <strong style={{ color: '#16a34a' }}>{(stats?.approved ?? '—')}</strong> đơn hàng thành công
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
            {(stats?.orders.toLocaleString() ?? '—')} đơn
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            Có <strong style={{ color: '#b45309' }}>{(stats?.pendingOrders ?? '—')}</strong> đơn đang chờ admin duyệt
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
            {avgTripValue === undefined ? '—' : formatPrice(avgTripValue)}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            Tính trên {(stats?.approved ?? '—')} đơn đã thanh toán
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
            {(stats?.users.toLocaleString() ?? '—')} Sinh viên
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
            Đã đăng ký tài khoản hệ thống TQMaster
          </div>
        </div>
      </div>

      <AdminDataState query={recent} />
      {/* ── MIDDLE ROW: REVENUE ANALYTICS (MẶC ĐỊNH THEO NGÀY) + TOP MÔN BÁN CHẠY (MẶC ĐỊNH THEO TUẦN) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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
                Doanh thu mọi thời gian: <strong style={{ color: '#2563eb' }}>{totalRevenue === undefined ? '—' : formatPrice(totalRevenue)}</strong>
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

          <AdminDataState query={series}>
          <Suspense fallback={<div role="status" style={{height:260}}>Đang tải biểu đồ…</div>}><RevenueChart data={revenueChartData} /></Suspense>
          </AdminDataState>
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

            <AdminDataState query={sales}>
            {sales.data && topSellingSubjectsByRange.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '36px 16px', color: '#94a3b8', textAlign: 'center' }}>
                <Package size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
                <div style={{ fontSize: 13, fontWeight: 600 }}>Chưa có đơn hàng trong khoảng thời gian này</div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* Donut Chart */}
                <Suspense fallback={<div role="status" style={{width:170,height:170}}>Đang tải biểu đồ…</div>}><SubjectDonut data={pieData} count={sales.data?.count ?? 0} /></Suspense>

                {/* Legend list with elegant pill containers */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden' }}>
                  {topSellingSubjectsByRange.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontSize: 12.5, background: '#f8fafc', padding: '10px 14px', borderRadius: 12,
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
            {sales.data && otherRevenue > 0 && <p style={{fontSize:12,color:'#64748b'}}>Các môn khác / chưa phân bổ: {formatPrice(otherRevenue)}</p>}
            {sales.data && sales.data.unallocated > 0 && <p role="status" style={{fontSize:12,color:'#b45309'}}>Chưa phân bổ theo môn do thiếu chi tiết: {formatPrice(sales.data.unallocated)}</p>}
            </AdminDataState>
          </div>

          {/* Bottom Summary Strip to eliminate awkward whitespace */}
          {topSellingSubjectsByRange.length > 0 && (
            <div style={{
              marginTop: 18,
              paddingTop: 12,
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: '#64748b'
            }}>
              <span>Doanh thu thuần toàn kỳ:</span>
              <strong style={{ color: '#2563eb', fontSize: 13, fontWeight: 800 }}>
                {formatPrice((sales.data?.total ?? 0))}
              </strong>
            </div>
          )}
        </div>
      </div>

      {/* ── LOWER DATA SECTION: REAL RECENT ORDERS TABLE (10 ĐƠN) + TOP SUBJECTS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
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
              onClick={() => navigate('/admin/orders')}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 12.5, fontWeight: 700, color: '#2563eb', background: '#eff6ff', cursor: 'pointer' }}
            >
              Xem tất cả đơn ({(stats?.orders ?? '—')}) <ChevronRight size={14} />
            </button>
          </div>

          {/* Desktop Table View */}
          <div className="hidden-mobile" style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', minWidth: 620, borderCollapse: 'collapse', fontSize: 13 }}>
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
                {recent.isPending || (recent.error && !recent.data) ? null : recentOrders.length === 0 ? (
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
                      {new Date(order.created_at).toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
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

          {/* Mobile Orders Cards List */}
          <div className="visible-mobile" style={{ display: 'none', flexDirection: 'column', gap: 12 }}>
            {recent.isPending || (recent.error && !recent.data) ? null : recentOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: 13 }}>
                Chưa có đơn hàng nào
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 900, color: '#2563eb', fontSize: 13 }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                    {statusBadge(order.status)}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 13.5, color: '#0f172a', marginBottom: 4 }}>{order.full_name || order.email}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                    <span>MSV: {order.student_code || '---'}</span>
                    <span style={{ fontWeight: 900, color: '#0f172a' }}>{formatPrice(order.final_amount)}</span>
                  </div>
                </div>
              ))
            )}
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

            {sales.isPending || (sales.error && !sales.data) ? null : topSellingSubjectsByRange.length === 0 ? (
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
                <div style={{ fontSize: 20, fontWeight: 900, color: '#2563eb', marginTop: 2 }}>{(stats?.users ?? '—')}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 14, border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Tổng Môn Học</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#8b5cf6', marginTop: 2 }}>{(stats?.subjects ?? '—')}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 14, border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Tổng Bộ Đề Thi</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981', marginTop: 2 }}>{(stats?.exams ?? '—')}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 14, border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Ngân Hàng Câu Hỏi</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b', marginTop: 2 }}>{(stats?.questions ?? '—')}</div>
              </div>
            </div>
          </div>

          {/* Tối Ưu & Bảo Trì Hệ Thống */}
          <div style={{
            background: '#ffffff',
            borderRadius: 22,
            padding: '22px 24px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Bảo Trì & Tối Ưu Hệ Thống
                </h2>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#059669', background: '#eafaf5', border: '1px solid #d1fae5', padding: '2px 8px', borderRadius: 12 }}>
                Cron 03:00 Hàng Ngày
              </span>
            </div>

            <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5, margin: '0 0 14px 0' }}>
              Tự động dọn dẹp chi tiết câu trả lời bài thi cũ (&gt;1 ngày) để cố định Database dưới 100 MB. Toàn bộ điểm số, lịch sử bài thi và xếp hạng của sinh viên luôn được bảo lưu 100%.
            </p>

            <button
              onClick={handlePurgeAttemptAnswers}
              disabled={isPurging}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '10px 16px',
                background: isPurging ? '#94a3b8' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                cursor: isPurging ? 'not-allowed' : 'pointer',
                boxShadow: isPurging ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.25)',
                transition: 'all 0.2s',
              }}
            >
              {isPurging ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Đang dọn dẹp...
                </>
              ) : (
                <>
                  <RotateCcw size={15} />
                  Dọn dẹp Database ngay (Giải phóng Disk)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .visible-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
