import React, { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { formatPrice, formatDate, subjectColor, subjectInitials } from '@/lib/mockData';
import {
  User, Package, BookOpen, Loader2, ChevronDown, Lock, Eye, EyeOff, CheckCircle2,
  GraduationCap, Award, PlayCircle, ShieldCheck, Download, Sparkles, Clock,
  Zap, Calendar, ChevronRight, Edit3, ArrowRight, Smartphone, Laptop, Facebook,
  Star, Check, Copy, ExternalLink, HelpCircle, FileText, CreditCard
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

// Helper to get real current browser and OS dynamically
function getCurrentDeviceInfo() {
  if (typeof window === 'undefined' || !navigator) return { browser: 'Chrome', os: 'Windows' };
  const ua = navigator.userAgent;
  let browser = 'Trình duyệt Web';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome/')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';

  let os = 'Windows';
  if (ua.includes('Windows NT')) os = 'Windows OS';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return { browser, os };
}

export default function ProfilePage() {
  const { profile, purchasedIds, setCurrentView, setSelectedSubjectId, signOut } = useApp();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [orders,   setOrders]   = useState<Order[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [bankInfo, setBankInfo] = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});
  const [loadingItemsOrderId, setLoadingItemsOrderId] = useState<string | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);

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

  // Course Semester filter inside tab 4 (Default: 'all', Options: 1 -> 9)
  const [semFilter, setSemFilter] = useState<'all' | number>('all');

  const deviceInfo = getCurrentDeviceInfo();

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
    const safePurchasedIds = (Array.isArray(purchasedIds) && purchasedIds.length > 0)
      ? purchasedIds
      : ['00000000-0000-0000-0000-000000000000'];

    Promise.all([
      supabase.from('orders').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('subjects').select('*').in('id', safePurchasedIds),
      supabase.from('system_settings').select('key, value'),
    ]).then(([ordersRes, subjectsRes, settingsRes]) => {
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
      const m: Record<string, string> = {};
      if (Array.isArray(settingsRes.data)) {
        settingsRes.data.forEach(r => { if (r && r.key && r.value) m[r.key] = r.value; });
      }
      setBankInfo(m);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching profile data:', err);
      setOrders([]);
      setSubjects([]);
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

  // Real Bank Transfer Copy Action
  const copyBankInfo = () => {
    const bankName = bankInfo['bank_name'] || 'TPBank';
    const bankAccount = bankInfo['bank_account'] || '0399888888';
    const bankOwner = bankInfo['bank_owner'] || 'TQMASTER';
    const content = bankInfo['bank_content'] || profile.full_name || profile.username;

    const text = `Ngân hàng: ${bankName}\nSTK: ${bankAccount}\nChủ TK: ${bankOwner}\nNội dung: ${content}`;
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 3000);
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
    <div className="profile-page-root" style={{ display: 'flex', minHeight: '100vh', background: '#f4f7fc', fontFamily: "'Inter', -apple-system, sans-serif", color: '#0f172a' }}>
      
      {/* ── LEFT SIDEBAR NAVIGATION ── */}
      <div className="profile-page-sidebar" style={{
        width: 260,
        background: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        padding: '24px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
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
          <div className="profile-page-nav" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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

        {/* Distinct Vivid Blue Primary Button: Đăng ký môn mới */}
        <button
          onClick={() => setCurrentView('home')}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '13px 16px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 14,
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            width: '100%',
            boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
            transition: 'transform 0.15s ease'
          }}
        >
          <Zap size={18} /> Đăng ký môn mới
        </button>
      </div>

      {/* ── RIGHT MAIN CONTENT AREA ── */}
      <div className="profile-page-main" style={{ flex: 1, padding: '28px 36px', overflowY: 'auto', minWidth: 0 }}>
        
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
            <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 20 }}>
              
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

                {/* Số tiền đã chi Card */}
                {(() => {
                  const totalSpent = orders
                    .filter(o => o.status === 'approved')
                    .reduce((sum, o) => sum + Number(o.final_amount), 0);

                  return (
                    <div style={{ background: '#edf5ff', border: '1px solid #dbeafe', borderRadius: 24, padding: 22, boxShadow: '0 2px 10px rgba(37, 99, 235, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 12, background: '#2563eb', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CreditCard size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Số tiền đã chi</div>
                          <div style={{ fontSize: 11, color: '#2563eb', fontWeight: 700 }}>Tổng thanh toán đã duyệt</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: '#2563eb', letterSpacing: '-0.03em' }}>
                        {formatPrice(totalSpent)}
                      </div>
                    </div>
                  );
                })()}
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

                  {/* Card 4: Đã hoàn thành môn */}
                  <div style={{ background: '#eafaf5', border: '1px solid #d1fae5', borderRadius: 20, padding: 20 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ffffff', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <Award size={18} />
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 2 }}>Môn học sở hữu</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>{String(subjects.length).padStart(2, '0')}</div>
                    <button onClick={() => setActiveTab('courses')} style={{ border: 'none', background: 'none', padding: 0, color: '#059669', fontSize: 11.5, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      Vào ôn thi ngay <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                {/* Hoạt động gần đây - DỮ LIỆU THỰC TẾ TỪ SUPABASE */}
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
                    {subjects.length === 0 && orders.length === 0 ? (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                        Bạn chưa có hoạt động học tập hoặc đơn hàng nào gần đây
                      </div>
                    ) : (
                      <>
                        {/* Render real purchased subjects */}
                        {subjects.slice(0, 2).map((subject) => (
                          <div key={subject.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <PlayCircle size={18} />
                              </div>
                              <div>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                                  Tiếp tục học: {subject.name}
                                </div>
                                <div style={{ fontSize: 11.5, color: '#64748b' }}>
                                  Học kỳ {subject.semester} · Đã sở hữu môn học
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => { setSelectedSubjectId(subject.id); setCurrentView('subject-detail'); }}
                              style={{ border: 'none', background: '#dbeafe', color: '#1d4ed8', padding: '6px 14px', borderRadius: 12, fontSize: 11.5, fontWeight: 800, cursor: 'pointer' }}
                            >
                              VÀO HỌC
                            </button>
                          </div>
                        ))}

                        {/* Render real recent orders */}
                        {orders.slice(0, 2).map((order) => (
                          <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 14, border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: order.status === 'approved' ? '#dcfce7' : '#fff7ed', color: order.status === 'approved' ? '#16a34a' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Package size={18} />
                              </div>
                              <div>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                                  Đơn hàng #{order.id.slice(0, 8).toUpperCase()} ({formatPrice(Number(order.final_amount))})
                                </div>
                                <div style={{ fontSize: 11.5, color: '#64748b' }}>
                                  Tạo ngày {formatDate(order.created_at)}
                                </div>
                              </div>
                            </div>
                            {statusBadge(order.status)}
                          </div>
                        ))}
                      </>
                    )}
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

              {/* Right Security Advice & Dynamic Active Devices */}
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

                {/* REAL DYNAMIC DEVICE DETECTION */}
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 16px 0' }}>
                    Thiết bị đang đăng nhập
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                    {/* Current Dynamic Session */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Laptop size={20} color="#2563eb" />
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                            {deviceInfo.browser} trên {deviceInfo.os}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>Đang hoạt động · Phiên làm việc hiện tại</div>
                        </div>
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: 10, background: '#dcfce7', color: '#15803d', fontSize: 10.5, fontWeight: 800 }}>HIỆN TẠI</span>
                    </div>
                  </div>

                  <button
                    onClick={() => signOut()}
                    style={{ width: '100%', padding: '9px', background: '#ffe4e6', border: '1px solid #fecdd3', borderRadius: 12, fontSize: 12.5, fontWeight: 700, color: '#e11d48', cursor: 'pointer' }}
                  >
                    Đăng xuất phiên làm việc này
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

            {/* ── REAL ADMIN BANK SETTINGS & FACEBOOK SUPPORT CARDS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Card 1: Direct Facebook Link Support */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Facebook size={18} color="#1877F2" /> Liên hệ Admin duyệt đơn nhanh
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                  Gửi mã đơn hoặc bill chuyển khoản qua Facebook Admin TQMaster để được xác nhận và cấp quyền truy cập môn học.
                </p>
                <a
                  href="https://www.facebook.com/tuanvaquan"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    background: '#1877F2', color: '#ffffff', textDecoration: 'none', borderRadius: 12,
                    fontSize: 13.5, fontWeight: 800, boxShadow: '0 4px 12px rgba(24, 119, 242, 0.25)'
                  }}
                >
                  <Facebook size={16} /> Nhắn tin Facebook Admin <ExternalLink size={14} />
                </a>
              </div>

              {/* Card 2: REAL ADMIN BANK SETTINGS FROM SUPABASE */}
              <div style={{ background: '#edf5ff', border: '1px solid #dbeafe', borderRadius: 24, padding: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1d4ed8', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <HelpCircle size={18} color="#2563eb" /> Thông tin ngân hàng TQMaster
                </h3>
                <div style={{ fontSize: 13, color: '#334155', margin: '0 0 16px 0', lineHeight: 1.6 }}>
                  <div><strong>Ngân hàng:</strong> {bankInfo['bank_name'] || 'TPBank'}</div>
                  <div><strong>Số tài khoản:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#2563eb' }}>{bankInfo['bank_account'] || bankInfo['account_number'] || '0399888888'}</span></div>
                  <div><strong>Chủ tài khoản:</strong> {bankInfo['bank_owner'] || bankInfo['account_holder'] || 'TQMASTER'}</div>
                  {bankInfo['bank_content'] && <div><strong>Nội dung:</strong> {bankInfo['bank_content']}</div>}
                </div>
                <button
                  onClick={copyBankInfo}
                  style={{
                    padding: '10px 20px', background: '#2563eb', color: '#ffffff', border: 'none',
                    borderRadius: 12, fontSize: 13.5, fontWeight: 800, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  {copiedBank ? <Check size={16} /> : <Copy size={16} />}
                  {copiedBank ? 'Đã sao chép!' : 'Sao chép thông tin chuyển khoản'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 4: KHÓA HỌC CỦA TÔI (WITH SEMESTER 1-9 FILTER & NO GPA) ── */}
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

            {/* 4 Stat Cards (NO GPA -> Replaced with ĐỀ THI ĐÃ LÀM) */}
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
                <div style={{ fontSize: 11, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', marginBottom: 4 }}>ĐỀ THI ĐÃ LÀM</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{subjects.length * 3} bài</div>
              </div>
            </div>

            {/* Semester Filter Pills (Default: Tất cả, Options: Học kỳ 1 -> 9) */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Tất cả pill */}
              <button
                onClick={() => setSemFilter('all')}
                style={{
                  padding: '7px 18px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                  background: semFilter === 'all' ? '#2563eb' : '#ffffff',
                  color: semFilter === 'all' ? '#ffffff' : '#475569',
                  boxShadow: semFilter === 'all' ? '0 3px 10px rgba(37, 99, 235, 0.3)' : 'none',
                  border: '1px solid #cbd5e1'
                }}
              >
                Tất cả
              </button>

              {/* Semester 1 -> 9 pills */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(semNum => (
                <button
                  key={semNum}
                  onClick={() => setSemFilter(semNum)}
                  style={{
                    padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    background: semFilter === semNum ? '#2563eb' : '#ffffff',
                    color: semFilter === semNum ? '#ffffff' : '#475569',
                    boxShadow: semFilter === semNum ? '0 3px 10px rgba(37, 99, 235, 0.3)' : 'none',
                    border: '1px solid #cbd5e1'
                  }}
                >
                  Học kỳ {semNum}
                </button>
              ))}
            </div>

            {/* Course Cards Grid */}
            {subjects.length === 0 ? (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 48, textAlign: 'center', color: '#64748b' }}>
                <BookOpen size={40} style={{ margin: '0 auto 12px auto', color: '#cbd5e1' }} />
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Bạn chưa sở hữu môn học nào</div>
                <p style={{ fontSize: 13, margin: '0 0 20px 0' }}>Khám phá kho khóa học để bắt đầu ôn thi ngay hôm nay.</p>
                <button onClick={() => setCurrentView('home')} style={{ padding: '10px 20px', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 12, fontSize: 13.5, fontWeight: 800, cursor: 'pointer' }}>
                  Khám phá khóa học
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
                {subjects
                  .filter(s => semFilter === 'all' || s.semester === semFilter)
                  .map(subject => {
                    const color = subjectColor(subject.name);
                    const initials = subjectInitials(subject.name);

                    return (
                      <div
                        key={subject.id}
                        style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 22,
                          overflow: 'hidden',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)';
                        }}
                      >
                        {/* Course Image & Badges */}
                        <div style={{
                          aspectRatio: '16/10', width: '100%', position: 'relative', overflow: 'hidden',
                          background: `linear-gradient(135deg, ${color}15 0%, ${color}30 100%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          {subject.thumbnail_url ? (
                            <img src={subject.thumbnail_url} alt={subject.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 54, height: 54, borderRadius: 16, background: '#ffffff', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                              {initials}
                            </div>
                          )}

                          {/* Top Left Badge: KỲ X */}
                          <span style={{
                            position: 'absolute', top: 12, left: 12,
                            padding: '4px 10px', borderRadius: 8,
                            background: '#ffffff', color: '#0f172a',
                            fontSize: 11, fontWeight: 900, boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                          }}>
                            KỲ {subject.semester}
                          </span>

                          {/* Top Right Badge: Đã mua */}
                          <span style={{
                            position: 'absolute', top: 12, right: 12,
                            padding: '4px 10px', borderRadius: 8,
                            background: '#15803d', color: '#ffffff',
                            fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                          }}>
                            <Check size={12} strokeWidth={3} /> Đã mua
                          </span>
                        </div>

                        {/* Course Details */}
                        <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <div>
                            {/* Course Name */}
                            <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                              {subject.name}
                            </h3>

                            {/* 5 Yellow Stars */}
                            <div style={{ display: 'flex', gap: 2, marginBottom: 8, color: '#f59e0b' }}>
                              <Star size={13} fill="#f59e0b" stroke="none" />
                              <Star size={13} fill="#f59e0b" stroke="none" />
                              <Star size={13} fill="#f59e0b" stroke="none" />
                              <Star size={13} fill="#f59e0b" stroke="none" />
                              <Star size={13} fill="#f59e0b" stroke="none" />
                            </div>

                            {/* Description text */}
                            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.45, margin: '0 0 14px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {subject.description || `Tài liệu ôn thi và đề thi thử môn ${subject.name} giúp bạn đạt kết quả cao nhất.`}
                            </p>
                          </div>

                          {/* Card Footer: Owned check + Xem chi tiết button */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a', fontWeight: 800, fontSize: 12 }}>
                              <Check size={14} strokeWidth={3} /> SỞ HỮU
                            </div>

                            <button
                              onClick={() => { setSelectedSubjectId(subject.id); setCurrentView('subject-detail'); }}
                              style={{
                                padding: '8px 14px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                color: '#ffffff', border: 'none', borderRadius: 10,
                                fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                                boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
                              }}
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        @media (max-width: 768px) {
          .profile-page-root {
            flex-direction: column !important;
          }
          .profile-page-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #e2e8f0 !important;
            padding: 16px !important;
          }
          .profile-page-nav {
            flex-direction: row !important;
            overflow-x: auto !important;
            padding-bottom: 6px !important;
            -webkit-overflow-scrolling: touch;
          }
          .profile-page-nav button {
            white-space: nowrap !important;
            padding: 8px 14px !important;
            font-size: 13px !important;
          }
          .profile-page-main {
            padding: 16px !important;
          }
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
