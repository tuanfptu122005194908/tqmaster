import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { SEMESTERS, subjectColor, subjectInitials, formatPrice } from '@/lib/mockData';
import { optimizedImage } from '@/lib/imageOpt';
import { ShoppingCart, BookOpen, Loader2, Check, Star, ArrowRight, Zap, Sparkles, Award, ShieldCheck, Flame, Layers, Clock, RotateCcw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import HeroSection from '@/components/home/HeroSection';
import { SubjectGridSkeleton } from '@/components/Skeleton';
import ProductFilterBar from '@/components/home/ProductFilterBar';
import CourseListItem from '@/components/home/CourseListItem';
import {
  type FilterState,
  INITIAL_FILTER_STATE,
  filterAndSortSubjects,
} from '@/lib/subjectClassification';

type Subject = Tables<'subjects'>;

export default function HomePage() {
  const { addToCart, removeFromCart, isInCart, isPurchased, searchQuery, setSearchQuery, purchasedIds } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const isMyCourses = location.pathname === '/my-courses';
  const [subjects,  setSubjects]  = useState<Subject[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filterState, setFilterState] = useState<FilterState>(() => ({
    ...INITIAL_FILTER_STATE,
    search: searchQuery || '',
  }));
  const gridRef = useRef<HTMLDivElement>(null);

  // Đồng bộ hai chiều giữa TopNav searchQuery và local filterState.search
  useEffect(() => {
    if (searchQuery !== filterState.search) {
      setFilterState((prev) => ({ ...prev, search: searchQuery }));
    }
  }, [searchQuery]);

  const handleFilterChange = (updates: Partial<FilterState>) => {
    if ('search' in updates && updates.search !== undefined) {
      setSearchQuery(updates.search);
    }
    setFilterState((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterState({
      ...INITIAL_FILTER_STATE,
      viewMode: filterState.viewMode,
    });
  };

  useEffect(() => {
    let active = true;
    const cacheKey = 'tqmaster_active_subjects_v1';
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as Subject[];
        if (Array.isArray(parsed)) {
          setSubjects(parsed);
          setLoading(false);
        }
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }

    // Hiện cache ngay, đồng thời lấy bản mới ở nền để lần mở sau luôn nhanh.
    supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('semester')
      .order('sort_order')
      .then(({ data }) => {
        if (!active) return;
        const fresh = (data ?? []) as Subject[];
        setSubjects(fresh);
        setLoading(false);
        sessionStorage.setItem(cacheKey, JSON.stringify(fresh));
      });

    return () => { active = false; };
  }, []);

  const semesterCounts = useMemo(() => {
    const counts: Record<number | 'all', number> = {
      all: subjects.length,
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
    };
    subjects.forEach((s) => {
      if (s.semester >= 1 && s.semester <= 9) {
        counts[s.semester] = (counts[s.semester] || 0) + 1;
      }
    });
    return counts;
  }, [subjects]);

  const filtered = useMemo(() => {
    return filterAndSortSubjects(
      subjects,
      filterState,
      isPurchased,
      isInCart,
      isMyCourses
    );
  }, [subjects, filterState, isPurchased, isInCart, isMyCourses]);

  const myCoursesCount = useMemo(() => {
    return subjects.filter(s => isPurchased(s.id)).length;
  }, [subjects, isPurchased]);

  const openDetail = (s: Subject) => {
    if (s.id === '9d863b0b-22fa-4cb5-b467-15103a8904e5' && isPurchased(s.id)) {
      navigate('/study-hub');
      return;
    }
    navigate(`/subjects/${s.id}`);
  };

  const scrollToGrid = () => {
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return <SubjectGridSkeleton count={8} />;

  return (
    <div
      className="home-page-container page-shell"
      style={{
        maxWidth: '100%',
        padding: '24px 30px',
        margin: 0,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ════════════════════════════════════════
          3D HERO — only on main "/" route
          ════════════════════════════════════════ */}
      {!isMyCourses && !searchQuery && (
        <HeroSection onScrollToGrid={scrollToGrid} />
      )}

      {/* ════════════════════════════════════════
          3 FEATURE HIGHLIGHTS CARDS
          ════════════════════════════════════════ */}
      {!isMyCourses && !searchQuery && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
            marginBottom: 36,
          }}
        >
          <FeatureCard
            icon={<Award size={24} color="#3b82f6" />}
            title="Đề Thi Chuẩn Định Dạng"
            desc="Cập nhật sát 100% đề thi thực tế tại các trường đại học hàng đầu kèm đáp án giải thích chi tiết."
            badge="CẬP NHẬT 2024-2025"
            badgeBg="#eff6ff"
            badgeColor="#2563eb"
          />
          <FeatureCard
            icon={<Sparkles size={24} color="#8b5cf6" />}
            title="Hệ Thống Luyện Thi Thông Minh"
            desc="Tự động chấm điểm, bấm giờ thực tế và phân tích những phần kiến thức bạn cần cải thiện."
            badge="TÍNH NĂNG MỚI"
            badgeBg="#f5f3ff"
            badgeColor="#7c3aed"
          />
          <FeatureCard
            icon={<ShieldCheck size={24} color="#10b981" />}
            title="Bảo Đảm Điểm Số & Hỗ Trợ 24/7"
            desc="Đội ngũ trợ giảng hỗ trợ giải đáp mọi bài tập khó trong quá trình ôn thi qua group cộng đồng."
            badge="CAM KẾT CHẤT LƯỢNG"
            badgeBg="#ecfdf5"
            badgeColor="#059669"
          />
        </div>
      )}

      {/* ════════════════════════════════════════
          MY COURSES TOP HEADER & STATS
          ════════════════════════════════════════ */}
      {isMyCourses ? (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16
          }}>
            <div>
              <h1 style={{
                fontSize: 28, fontWeight: 900, color: '#0f172a',
                margin: '0 0 6px 0', letterSpacing: '-0.03em'
              }}>
                Khóa học của tôi
              </h1>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
                Quản lý và theo dõi tiến độ các môn học bạn đang tham gia.
              </p>
            </div>

            <button
              onClick={() => navigate('/')}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff', border: 'none', borderRadius: 14,
                fontSize: 14, fontWeight: 800, cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              + Đăng ký thêm
            </button>
          </div>

          {/* 4 TOP STAT CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard label="TỔNG SỐ MÔN" value={myCoursesCount} color="#3b82f6" bg="#edf5ff" border="#dbeafe" />
            <StatCard label="HOÀN THÀNH" value={Math.round(myCoursesCount * 0.6)} color="#16a34a" bg="#eafaf5" border="#d1fae5" />
            <StatCard label="ĐANG HỌC" value={Math.round(myCoursesCount * 0.4)} color="#d97706" bg="#fff7ed" border="#ffedd5" />
            <StatCard label="ĐỀ THI ĐÃ LÀM" value={`${myCoursesCount * 3} bài`} color="#8b5cf6" bg="#f3eefd" border="#ede9fe" />
          </div>
        </div>
      ) : (
        /* Normal home page section header */
        <div ref={gridRef} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 5, height: 26, borderRadius: 4,
                background: 'linear-gradient(180deg, #2563eb, #7c3aed)',
              }} />
              <h2 style={{
                fontSize: 22, fontWeight: 900, color: '#0f172a',
                margin: 0, letterSpacing: '-0.02em'
              }}>
                Kho Khóa Học & Đề Thi Tuyển Chọn
              </h2>
            </div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
              Hiển thị <span style={{ color: '#2563eb', fontWeight: 800 }}>{filtered.length}</span> môn học
            </div>
          </div>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: '0 0 0 15px', fontWeight: 500 }}>
            Khám phá tài liệu ôn thi chất lượng cao chuẩn Đại học cho các môn học.
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════
          PRODUCT FILTER BAR & VIEW TOGGLE
          ════════════════════════════════════════ */}
      <ProductFilterBar
        filterState={filterState}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        totalCount={subjects.length}
        filteredCount={filtered.length}
        semesterCounts={semesterCounts}
        isMyCourses={isMyCourses}
      />

      {/* ════════════════════════════════════════
          EMPTY STATE
          ════════════════════════════════════════ */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 24px',
          color: '#64748b',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 24,
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#eff6ff', color: '#2563eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <BookOpen size={32} />
          </div>
          <h3 style={{ fontWeight: 800, marginBottom: 8, fontSize: '1.25rem', color: '#0f172a' }}>
            {filterState.search
              ? `Không tìm thấy khóa học nào khớp với từ khóa "${filterState.search}"`
              : filterState.semester !== 'all'
                ? `Không tìm thấy môn học nào trong Học kỳ ${filterState.semester}`
                : isMyCourses
                  ? 'Bạn chưa sở hữu khóa học nào phù hợp với bộ lọc'
                  : 'Không tìm thấy môn học nào phù hợp với bộ lọc hiện tại'}
          </h3>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '460px', margin: '0 auto 24px auto' }}>
            Hãy thử kiểm tra lại từ khóa tìm kiếm hoặc bấm nút đặt lại bên dưới để khám phá tất cả các môn học.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleResetFilters}
              style={{
                padding: '10px 20px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#ffffff',
                fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <RotateCcw size={14} />
              <span>Đặt lại bộ lọc để xem tất cả</span>
            </button>
            {isMyCourses && (
              <button
                onClick={() => navigate('/')}
                style={{
                  padding: '10px 20px', borderRadius: 12, border: '1px solid #cbd5e1',
                  background: '#ffffff', color: '#334155',
                  fontWeight: 700, fontSize: 13.5, cursor: 'pointer'
                }}
              >
                Khám phá môn học mới
              </button>
            )}
          </div>
        </div>
      ) : filterState.viewMode === 'grid' ? (
        /* ════════════════════════════════════════
            SUBJECTS GRID VIEW (CARD 3D)
            ════════════════════════════════════════ */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
          {filtered.map((subject, idx) => {
            const color    = subjectColor(subject.name);
            const initials = subjectInitials(subject.name);
            const owned    = isPurchased(subject.id);
            const inCart   = isInCart(subject.id);

            return (
              <CourseCard
                key={subject.id}
                subject={subject}
                color={color}
                initials={initials}
                owned={owned}
                inCart={inCart}
                idx={idx}
                onOpen={() => openDetail(subject)}
                onCart={(e) => {
                  e.stopPropagation();
                  if (inCart) removeFromCart(subject.id);
                  else addToCart(subject);
                }}
              />
            );
          })}
        </div>
      ) : (
        /* ════════════════════════════════════════
            SUBJECTS LIST VIEW (COMPACT ROWS)
            ════════════════════════════════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((subject, idx) => {
            const color    = subjectColor(subject.name);
            const initials = subjectInitials(subject.name);
            const owned    = isPurchased(subject.id);
            const inCart   = isInCart(subject.id);

            return (
              <CourseListItem
                key={subject.id}
                subject={subject}
                color={color}
                initials={initials}
                owned={owned}
                inCart={inCart}
                idx={idx}
                onOpen={() => openDetail(subject)}
                onCart={(e) => {
                  e.stopPropagation();
                  if (inCart) removeFromCart(subject.id);
                  else addToCart(subject);
                }}
              />
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .home-page-container {
            padding: 16px !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes cardReveal {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── Feature Card Component ───────────────────────────── */

function FeatureCard({
  icon, title, desc, badge, badgeBg, badgeColor
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
}) {
  const [hov, setHov] = useState(false);

  return (
    <div
      style={{
        background: '#ffffff',
        border: hov ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid #e2e8f0',
        borderRadius: 22,
        padding: '24px 22px',
        boxShadow: hov ? '0 12px 30px rgba(37, 99, 235, 0.08)' : '0 2px 10px rgba(0, 0, 0, 0.02)',
        transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transform: hov ? 'translateY(-3px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        <span
          style={{
            padding: '3px 10px',
            borderRadius: 999,
            background: badgeBg,
            color: badgeColor,
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: '0.03em',
          }}
        >
          {badge}
        </span>
      </div>
      <h3 style={{ fontSize: 16.5, fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
        {title}
      </h3>
      <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0 }}>
        {desc}
      </p>
    </div>
  );
}

/* ─── Stat Card Component ──────────────────────────────── */

function StatCard({
  label, value, color, bg, border,
}: {
  label: string; value: string | number; color: string; bg: string; border: string;
}) {
  return (
    <div style={{
      background: bg, border: `1px solid ${border}`,
      borderRadius: 20, padding: 18,
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
    }}>
      <div style={{ fontSize: 11, fontWeight: 800, color, textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{value}</div>
    </div>
  );
}


/* ─── Course Card Component ────────────────────────────── */

function CourseCard({
  subject, color, initials, owned, inCart, idx, onOpen, onCart,
}: {
  subject: Tables<'subjects'>;
  color: string;
  initials: string;
  owned: boolean;
  inCart: boolean;
  idx: number;
  onOpen: () => void;
  onCart: (e: React.MouseEvent) => void;
}) {
  const [hov, setHov] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: hov ? '1px solid rgba(37, 99, 235, 0.35)' : '1px solid #e2e8f0',
        borderRadius: 22,
        overflow: 'hidden',
        background: '#ffffff',
        boxShadow: hov
          ? '0 18px 45px rgba(37, 99, 235, 0.14), 0 4px 12px rgba(0,0,0,0.04)'
          : '0 2px 10px rgba(0,0,0,0.02)',
        transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transform: hov ? 'translateY(-6px)' : 'translateY(0)',
        animation: `cardReveal 0.4s ease both`,
        animationDelay: `${Math.min(idx * 50, 300)}ms`,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* Thumbnail Banner */}
      <div
        onClick={onOpen}
        style={{
          aspectRatio: '16/10',
          width: '100%',
          background: `linear-gradient(135deg, ${color}15 0%, ${color}35 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative',
          flexShrink: 0, cursor: 'pointer',
        }}
      >
        {subject.thumbnail_url ? (
          <img
            src={optimizedImage(subject.thumbnail_url, 480)}
            alt={subject.name}
            loading={idx < 4 ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={idx < 2 ? 'high' : 'auto'}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', transform: hov ? 'scale(1.05)' : 'scale(1)' }}
          />
        ) : (
          <div style={{
            width: 58, height: 58, borderRadius: 18,
            background: '#ffffff', color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 20,
            boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
            transition: 'transform 0.3s ease',
            transform: hov ? 'scale(1.08)' : 'scale(1)',
          }}>
            {initials}
          </div>
        )}

        {/* Semester badge */}
        <span style={{
          position: 'absolute', top: 12, left: 12,
          padding: '4px 10px', borderRadius: 8,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          color: '#0f172a', fontSize: 11, fontWeight: 900,
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        }}>
          KỲ {subject.semester}
        </span>

        {/* Owned badge */}
        {owned && (
          <span style={{
            position: 'absolute', top: 12, right: 12,
            padding: '4px 10px', borderRadius: 8,
            background: Number(subject.price) <= 0 ? '#0ea5e9' : '#15803d', color: '#ffffff',
            fontSize: 11, fontWeight: 800,
            display: 'flex', alignItems: 'center', gap: 4,
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          }}>
            <Check size={12} strokeWidth={3} /> {Number(subject.price) <= 0 ? 'Miễn phí' : 'Đã sở hữu'}
          </span>
        )}

        {/* Hot / Featured Tag for popular subjects */}
        {!owned && (
          <span style={{
            position: 'absolute', top: 12, right: 12,
            padding: '3px 8px', borderRadius: 6,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            color: '#fef08a', fontSize: 10.5, fontWeight: 800,
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Flame size={11} fill="#fef08a" /> HOT
          </span>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h3
            onClick={onOpen}
            style={{
              fontSize: 16, fontWeight: 900, color: '#0f172a',
              margin: '0 0 6px 0', letterSpacing: '-0.02em', cursor: 'pointer',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              transition: 'color 0.15s',
              ...(hov ? { color: '#2563eb' } : {}),
            }}
          >
            {subject.name}
          </h3>

          {/* Stars & Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 2, color: '#f59e0b' }}>
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} fill="#f59e0b" stroke="none" />
              ))}
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b' }}>5.0 (120+ đánh giá)</span>
          </div>

          {/* Description */}
          <p style={{
            fontSize: 12.5, color: '#64748b', lineHeight: 1.5,
            margin: '0 0 14px 0',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {subject.description || `Tài liệu ôn thi và đề thi thử môn ${subject.name} chuẩn form Đại học.`}
          </p>
        </div>

        {/* Footer Actions */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingTop: 14, borderTop: '1px solid #f1f5f9'
        }}>
          {owned ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: Number(subject.price) <= 0 ? '#0284c7' : '#16a34a', fontWeight: 800, fontSize: 12.5 }}>
                <Check size={14} strokeWidth={3} /> {Number(subject.price) <= 0 ? 'MIỄN PHÍ' : 'SỞ HỮU'}
              </div>
              <ActionButton primary onClick={onOpen}>
                {Number(subject.price) <= 0 ? 'Học ngay' : 'Xem chi tiết'}
              </ActionButton>
            </>
          ) : (
            <>
              <div>
                <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 15 }}>
                  {formatPrice(Number(subject.price))}
                </div>
                <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600 }}>Truy cập trọn đời</div>
              </div>
              <ActionButton
                cart
                inCart={inCart}
                onClick={onCart}
              >
                <ShoppingCart size={13} />
                {inCart ? 'Đã thêm' : 'Thêm giỏ'}
              </ActionButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  children, onClick, primary = false, cart = false, inCart = false,
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  primary?: boolean;
  cart?: boolean;
  inCart?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '9px 16px', borderRadius: 12,
        fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 5,
        transition: 'all 0.18s ease',
        transform: hov ? 'scale(1.04)' : 'scale(1)',
        ...(cart && inCart ? {
          background: '#ffe4e6', color: '#e11d48',
          border: '1px solid #fecdd3', boxShadow: 'none',
        } : primary || (cart && !inCart) ? {
          background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: '#ffffff', border: 'none',
          boxShadow: hov ? '0 6px 16px rgba(37, 99, 235, 0.4)' : '0 3px 8px rgba(37, 99, 235, 0.25)',
        } : {
          background: '#f1f5f9', color: '#475569', border: 'none',
        }),
      }}
    >
      {children}
    </button>
  );
}
