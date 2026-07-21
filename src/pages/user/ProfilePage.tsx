import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { formatPrice, formatDate } from '@/lib/mockData';
import {
  User, Package, BookOpen, Phone, Loader2, ChevronDown, Lock, Eye, EyeOff, CheckCircle2,
  GraduationCap, Award, PlayCircle, CheckCircle, Clock, ShieldCheck, Download, Sparkles,
  MessageSquare, Zap, Search, Calendar, ChevronRight, Edit3, ArrowRight, Smartphone, Laptop
} from 'lucide-react';

type Order = Tables<'orders'>;
type Subject = Tables<'subjects'>;
type OrderItem = { id: string; subject_id: string; price: number; subject_name: string };

type TabKey = 'profile' | 'security' | 'orders' | 'courses';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid #cbd5e1', borderRadius: 12,
  fontSize: '0.875rem', outline: 'none', background: '#ffffff',
  color: '#0f172a', transition: 'all 0.15s ease',
};

export default function ProfilePage() {
  const { profile, purchasedIds, setCurrentView, setSelectedSubjectId } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [bankInfo, setBankInfo] = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});
  const [loadingItemsOrderId, setLoadingItemsOrderId] = useState<string | null>(null);

  // Change password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  // Course Semester filter inside tab 4
  const [semFilter, setSemFilter] = useState<'all' | number>('all');

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
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccess(false), 5000);
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

  const statusBadge = (s: string) => {
    if (s === 'pending')  return <span style={{ padding: '3px 10px', borderRadius: 14, fontSize: 11.5, fontWeight: 800, background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }}>• Chờ duyệt</span>;
    if (s === 'approved') return <span style={{ padding: '3px 10px', borderRadius: 14, fontSize: 11.5, fontWeight: 800, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>• Đã duyệt</span>;
    return <span style={{ padding: '3px 10px', borderRadius: 14, fontSize: 11.5, fontWeight: 800, background: '#ffe4e6', color: '#be123c', border: '1px solid #fecdd3' }}>• Từ chối</span>;
  };

  const avatarLetter = (profile?.full_name || profile?.username || 'U').charAt(0).toUpperCase();

  if (loading || !profile) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 450, background: '#f4f7fc' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const approvedOrdersCount = orders.filter(o => o.status === 'approved').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7fc', fontFamily: "'Inter', -apple-system, sans-serif", color: '#0f172a' }}>
      
      {/* ── LEFT SIDEBAR NAVIGATION ── */}
      <div style={{
        width: 260,
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        padding: '24px 18px',
        display: 'flex',
        flexDirection: 'column',
        justify: 'space-between',
        flexShrink: 0,
        boxShadow: '2px 0 12px rgba(15, 23, 42, 0.02)'
      }}>
        <div>
          {/* Logo Brand Header */}
          <div style={{ padding: '0 8px 24px 8px', borderBottom: '1px solid #f1f5f9', marginBottom: 20 }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#2563eb', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              TQMaster
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>Learning Platform</div>
          </div>

          {/* Navigation Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                background: activeTab === 'profile' ? '#eff6ff' : 'transparent',
                color: activeTab === 'profile' ? '#2563eb' : '#475569',
                transition: 'all 0.15s ease', textAlign: 'left'
              }}
            >
              <User size={18} /> Hồ sơ cá nhân
            </button>

            <button
              onClick={() => setActiveTab('security')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                background: activeTab === 'security' ? '#eff6ff' : 'transparent',
                color: activeTab === 'security' ? '#2563eb' : '#475569',
                transition: 'all 0.15s ease', textAlign: 'left'
              }}
            >
              <Lock size={18} /> Đổi mật khẩu
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                background: activeTab === 'orders' ? '#eff6ff' : 'transparent',
                color: activeTab === 'orders' ? '#2563eb' : '#475569',
                transition: 'all 0.15s ease', textAlign: 'left'
              }}
            >
              <Package size={18} /> Lịch sử đơn hàng
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700,
                background: activeTab === 'courses' ? '#eff6ff' : 'transparent',
                color: activeTab === 'courses' ? '#2563eb' : '#475569',
                transition: 'all 0.15s ease', textAlign: 'left'
              }}
            >
              <GraduationCap size={18} /> Khóa học của tôi
            </button>
          </div>
        </div>

        {/* Bottom Upgrade Account Button */}
        <button
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px', background: '#eff6ff', color: '#2563eb', border: '1.5px solid #dbeafe',
            borderRadius: 14, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', width: '100%',
            transition: 'all 0.15s ease'
          }}
        >
          <Zap size={16} /> Nâng cấp tài khoản
        </button>
      </div>

      {/* ── RIGHT MAIN CONTENT AREA ── */}
      <div style={{ flex: 1, padding: '28px 36px', overflowY: 'auto', minWidth: 0 }}>
        
        {/* ── TAB 1: HỒ SƠ & THỐNG KÊ ── */}
        {activeTab === 'profile' && (
          <div>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.03em' }}>
                Hồ sơ & Thống kê
              </h1>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
                Chào mừng trở lại, hãy theo dõi tiến trình học tập của bạn.
              </p>
            </div>

            {/* Layout Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 20 }}>
              
              {/* Left Column: Personal Card & Points */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Main Profile Info Card */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 24, textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  {/* Large Avatar */}
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%', background: '#eff6ff', color: '#2563eb',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900,
                    margin: '0 auto 14px auto', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.2)'
                  }}>
                    {avatarLetter}
                  </div>

                  <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 2px 0' }}>
                    {profile.full_name || profile.username}
                  </h2>
                  <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 18, wordBreak: 'break-all' }}>
                    {profile.email}
                  </div>

                  {/* Student Code Box */}
                  <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 14, padding: '10px 14px', marginBottom: 10, textAlign: 'left' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MÃ SINH VIÊN</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#2563eb', fontFamily: 'monospace', marginTop: 2 }}>
                      {profile.student_code || 'TQM-2024-STUDENT-01'}
                    </div>
                  </div>

                  {/* Joined Date Box */}
                  <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 14, padding: '10px 14px', marginBottom: 18, textAlign: 'left' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>NGÀY THAM GIA</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>
                      {new Date(profile.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('security')}
                    style={{
                      width: '100%', padding: '10px', background: '#ffffff', color: '#475569',
                      border: '1.5px solid #cbd5e1', borderRadius: 12, fontSize: 13, fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                  >
                    <Edit3 size={15} /> Cập nhật hồ sơ
                  </button>
                </div>

                {/* TQM Points Card */}
                <div style={{ background: '#f3eefd', border: '1px solid #ede9fe', borderRadius: 24, padding: 22, boxShadow: '0 2px 10px rgba(139, 92, 246, 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 12, background: '#8b5cf6', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Điểm tích lũy</div>
                      <div style={{ fontSize: 11, color: '#8b5cf6', fontWeight: 700 }}>Xếp hạng: Vàng</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
                    1,250 <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>TQM Points</span>
                  </div>
                </div>
              </div>

              {/* Right Column: 4 Stat Cards + Recent Activity */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* 4 Stat Cards Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {/* Card 1: Môn học đã mua */}
                  <div style={{ background: '#edf5ff', border: '1px solid #dbeafe', borderRadius: 20, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ffffff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={18} />
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: 10, background: '#dcfce7', color: '#15803d', fontSize: 10.5, fontWeight: 800 }}>
                        +2 tháng này
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>Môn học đã mua</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>{subjects.length}</div>
                    <div style={{ height: 4, width: '100%', background: '#dbeafe', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: '75%', background: '#2563eb', borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 10.5, color: '#64748b', marginTop: 4, fontWeight: 600 }}>75% hoàn thành mục tiêu năm</div>
                  </div>

                  {/* Card 2: Tổng số đơn hàng */}
                  <div style={{ background: '#f3eefd', border: '1px solid #ede9fe', borderRadius: 20, padding: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ffffff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <Package size={18} />
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>Tổng số đơn hàng</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>{String(orders.length).padStart(2, '0')}</div>
                    <button onClick={() => setActiveTab('orders')} style={{ border: 'none', background: 'none', padding: 0, color: '#8b5cf6', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Xem lịch sử <ArrowRight size={12} />
                    </button>
                  </div>

                  {/* Card 3: Chờ duyệt thanh toán */}
                  <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 20, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ffffff', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Clock size={18} />
                      </div>
                      {pendingOrdersCount > 0 && (
                        <span style={{ padding: '2px 8px', borderRadius: 10, background: '#fef3c7', color: '#b45309', fontSize: 10.5, fontWeight: 800 }}>
                          Cần chú ý
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>Chờ duyệt thanh toán</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 4 }}>{String(pendingOrdersCount).padStart(2, '0')}</div>
                    <div style={{ fontSize: 11, color: '#b45309', fontWeight: 600 }}>
                      {pendingOrdersCount > 0 ? 'Hệ thống đang kiểm tra đơn hàng mới' : 'Tất cả đơn đã xử lý xong'}
                    </div>
                  </div>

                  {/* Card 4: Chứng chỉ đạt được */}
                  <div style={{ background: '#ffe4e6', border: '1px solid #fecdd3', borderRadius: 20, padding: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ffffff', color: '#e11d48', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <Award size={18} />
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>Chứng chỉ đạt được</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>04</div>
                    <span style={{ color: '#e11d48', fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}>
                      Tải về tất cả 📥
                    </span>
                  </div>
                </div>

                {/* Hoạt động gần đây */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                      Hoạt động gần đây
                    </h3>
                    <button onClick={() => setActiveTab('courses')} style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}>
                      Xem tất cả <ChevronRight size={14} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PlayCircle size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Tiếp tục: Lập trình Web ReactJS</div>
                          <div style={{ fontSize: 11.5, color: '#64748b' }}>Đã xem 45/60 phút · 2 giờ trước</div>
                        </div>
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 12, background: '#dbeafe', color: '#1d4ed8', fontSize: 11, fontWeight: 800 }}>ĐANG HỌC</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Hoàn thành bài tập: Ngân hàng câu hỏi</div>
                          <div style={{ fontSize: 11.5, color: '#64748b' }}>Điểm số: 10/10 · Hôm qua</div>
                        </div>
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 12, background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 800 }}>HOÀN THÀNH</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* ── TAB 2: BẢO MẬT & ĐỔI MẬT KHẨU ── */}
        {activeTab === 'security' && (
          <div>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.03em' }}>
                Bảo mật & Đổi mật khẩu
              </h1>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
                Quản lý các thiết lập bảo mật và cập nhật mật khẩu để bảo vệ tài khoản của bạn.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 20 }}>
              
              {/* Form Đổi mật khẩu */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 28, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={20} color="#2563eb" /> Đổi mật khẩu
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Mật khẩu hiện tại</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                      <button type="button" onClick={() => setShowCurrentPw(!showCurrentPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                        {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Mật khẩu mới</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                        {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Yêu cầu tối thiểu 6 ký tự, bao gồm cả chữ và số.</div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Xác nhận mật khẩu mới</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showConfirmPw ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                      <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                        {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {pwError && (
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: '#ffe4e6', color: '#e11d48', fontSize: 13, fontWeight: 600 }}>
                      {pwError}
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword} disabled={pwLoading || !newPassword || !confirmPassword}
                    style={{
                      height: 48, width: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: '#ffffff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800,
                      cursor: pwLoading || !newPassword || !confirmPassword ? 'not-allowed' : 'pointer', marginTop: 10,
                      boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)'
                    }}
                  >
                    {pwLoading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Cập nhật mật khẩu'}
                  </button>
                </div>
              </div>

              {/* Right Security Advice & Active Devices */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Lời khuyên bảo mật */}
                <div style={{ background: '#edf5ff', border: '1px solid #dbeafe', borderRadius: 24, padding: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1d4ed8', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldCheck size={20} /> Lời khuyên bảo mật
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5, color: '#334155', lineHeight: 1.45 }}>
                    <div style={{ display: 'flex', gap: 8 }}>✓ Sử dụng mật khẩu mạnh kết hợp chữ hoa, chữ thường và ký tự đặc biệt.</div>
                    <div style={{ display: 'flex', gap: 8 }}>✓ Không bao giờ chia sẻ mật khẩu của bạn với bất kỳ ai.</div>
                    <div style={{ display: 'flex', gap: 8 }}>✓ Nên thay đổi mật khẩu định kỳ mỗi 3-6 tháng.</div>
                  </div>
                </div>

                {/* Thiết bị đang đăng nhập */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
                    Thiết bị đang đăng nhập
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Laptop size={20} color="#2563eb" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Chrome on Windows</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>Đang hoạt động · Hà Nội, VN</div>
                        </div>
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: 10, background: '#dcfce7', color: '#15803d', fontSize: 10.5, fontWeight: 800 }}>HIỆN TẠI</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Smartphone size={20} color="#64748b" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>iPhone 13 Pro</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>2 giờ trước · Đà Nẵng, VN</div>
                        </div>
                      </div>
                      <button style={{ border: 'none', background: 'none', color: '#e11d48', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Đăng xuất</button>
                    </div>
                  </div>

                  <button style={{ width: '100%', padding: '9px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, fontSize: 12.5, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                    Đăng xuất tất cả thiết bị
                  </button>
                </div>
              </div>

            </div>

            {/* Success Toast Floating Notification */}
            {pwSuccess && (
              <div style={{
                position: 'fixed', bottom: 28, right: 28, background: '#0f172a', color: '#ffffff',
                padding: '14px 20px', borderRadius: 16, boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 700, zIndex: 1000
              }}>
                <CheckCircle2 size={18} color="#10b981" /> Mật khẩu đã được cập nhật thành công!
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: LỊCH SỬ ĐƠN HÀNG ── */}
        {activeTab === 'orders' && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.03em' }}>
                  Lịch sử đơn hàng
                </h1>
                <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
                  Quản lý và theo dõi các giao dịch đăng ký khóa học của bạn.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, border: '1.5px solid #cbd5e1', background: '#ffffff', fontSize: 13, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                  <Calendar size={15} /> Lọc theo ngày
                </button>
                <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 12, border: '1.5px solid #cbd5e1', background: '#ffffff', fontSize: 13, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>
                  <Download size={15} /> Xuất báo cáo
                </button>
              </div>
            </div>

            {/* 3 Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>TỔNG ĐƠN HÀNG</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>{orders.length}</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', marginBottom: 6 }}>ĐÃ HOÀN THÀNH</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>{approvedOrdersCount}</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', marginBottom: 6 }}>ĐANG CHỜ XỬ LÝ</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a' }}>{pendingOrdersCount}</div>
              </div>
            </div>

            {/* Orders Table */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 22, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', marginBottom: 24 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>MÃ ĐƠN HÀNG</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>NGÀY TẠO</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>TỔNG TIỀN</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>TRẠNG THÁI</th>
                    <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>HÀNH ĐỘNG</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Bạn chưa tạo đơn hàng nào</td>
                    </tr>
                  ) : orders.map(order => (
                    <React.Fragment key={order.id}>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '16px 20px', fontWeight: 800, color: '#2563eb', fontFamily: 'monospace' }}>
                          #{order.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td style={{ padding: '16px 20px', color: '#64748b' }}>
                          {formatDate(order.created_at)}
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: 800, color: '#0f172a' }}>
                          {formatPrice(Number(order.final_amount))}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          {statusBadge(order.status)}
                        </td>
                        <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => loadOrderItems(order.id)}
                            style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            Chi tiết <ChevronDown size={14} style={{ transform: expandedOrderId === order.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Order Items */}
                      {expandedOrderId === order.id && (
                        <tr>
                          <td colSpan={5} style={{ background: '#f8fafc', padding: '16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                            <div style={{ fontWeight: 800, fontSize: 12.5, color: '#0f172a', marginBottom: 10 }}>DANH SÁCH MÔN HỌC TRONG ĐƠN:</div>
                            {loadingItemsOrderId === order.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13 }}>
                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải danh sách môn...
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {(orderItemsMap[order.id] || []).map((item, idx) => (
                                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#ffffff', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <span style={{ width: 22, height: 22, borderRadius: 6, background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{idx + 1}</span>
                                      <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 13.5 }}>{item.subject_name}</span>
                                    </div>
                                    <span style={{ fontWeight: 800, color: '#2563eb', fontSize: 13 }}>{formatPrice(item.price)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Support & Upgrade Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>Cần hỗ trợ thanh toán?</h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px 0' }}>Đội ngũ kỹ thuật của TQMaster luôn sẵn sàng giải đáp thắc mắc 24/7.</p>
                <button style={{ padding: '10px 18px', background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={16} /> Chat với hỗ trợ
                </button>
              </div>

              <div style={{ background: '#edf5ff', border: '1px solid #dbeafe', borderRadius: 24, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1d4ed8', margin: '0 0 6px 0' }}>Đặc quyền Premium</h3>
                <p style={{ fontSize: 13, color: '#475569', margin: '0 0 16px 0' }}>Mở khóa tất cả 500+ khóa học với gói Premium theo năm. Tiết kiệm tới 40%.</p>
                <button style={{ padding: '10px 18px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                  ⚡ Nâng cấp ngay
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: KHÓA HỌC CỦA TÔI ── */}
        {activeTab === 'courses' && (
          <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.03em' }}>
                  Khóa học của tôi
                </h1>
                <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
                  Quản lý và theo dõi tiến độ các môn học bạn đang tham gia.
                </p>
              </div>

              <button onClick={() => setCurrentView('home')} style={{ padding: '10px 18px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 12, fontSize: 13.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                + Đăng ký thêm
              </button>
            </div>

            {/* 4 Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>TỔNG SỐ MÔN</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{subjects.length}</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', marginBottom: 4 }}>HOÀN THÀNH</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{Math.round(subjects.length * 0.6)}</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', marginBottom: 4 }}>ĐANG HỌC</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{Math.round(subjects.length * 0.4)}</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', marginBottom: 4 }}>GPA HIỆN TẠI</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>3.8</div>
              </div>
            </div>

            {/* Semester Filter Pills */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
              {(['all', 1, 2, 3] as const).map(s => (
                <button
                  key={String(s)}
                  onClick={() => setSemFilter(s as any)}
                  style={{
                    padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    background: semFilter === s ? '#2563eb' : '#ffffff',
                    color: semFilter === s ? '#ffffff' : '#475569',
                    boxShadow: semFilter === s ? '0 3px 10px rgba(37, 99, 235, 0.3)' : 'none',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  {s === 'all' ? 'Tất cả' : s === 3 ? 'Đồ án tốt nghiệp' : `Học kỳ ${s}`}
                </button>
              ))}
            </div>

            {/* Course Cards Grid */}
            {subjects.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 48, textAlign: 'center', color: '#64748b' }}>
                <BookOpen size={40} style={{ margin: '0 auto 12px auto', color: '#cbd5e1' }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Bạn chưa đăng ký môn học nào</div>
                <p style={{ fontSize: 13, margin: '0 0 20px 0' }}>Khám phá kho khóa học để bắt đầu ôn thi ngay hôm nay.</p>
                <button onClick={() => setCurrentView('home')} style={{ padding: '10px 20px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 12, fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>
                  Khám phá khóa học
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20 }}>
                {subjects
                  .filter(s => semFilter === 'all' || s.semester === semFilter)
                  .map(subject => (
                    <div
                      key={subject.id}
                      style={{
                        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 22,
                        overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column'
                      }}
                    >
                      {/* Course Header Banner */}
                      <div style={{ height: 120, background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', padding: 18, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.2)', color: '#ffffff', fontSize: 11, fontWeight: 800, alignSelf: 'flex-start' }}>
                          Học kỳ {subject.semester}
                        </span>
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {subject.name}
                        </div>
                      </div>

                      {/* Course Content Body */}
                      <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 6 }}>Tiến độ học tập</div>
                          <div style={{ height: 6, width: '100%', background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                            <div style={{ height: '100%', width: '65%', background: '#2563eb', borderRadius: 4 }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: '#64748b', fontWeight: 700 }}>
                            <span>Bài tiếp: Module 4</span>
                            <span style={{ color: '#2563eb' }}>65%</span>
                          </div>
                        </div>

                        <button
                          onClick={() => { setSelectedSubjectId(subject.id); setCurrentView('subject-detail'); }}
                          style={{
                            width: '100%', padding: '10px', background: '#eff6ff', color: '#2563eb',
                            border: '1.5px solid #dbeafe', borderRadius: 12, fontSize: 13.5, fontWeight: 800,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                          }}
                        >
                          Vào học <ArrowRight size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
