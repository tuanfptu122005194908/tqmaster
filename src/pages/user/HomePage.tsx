import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { SEMESTERS, subjectColor, subjectInitials, formatPrice } from '@/lib/mockData';
import { optimizedImage } from '@/lib/imageOpt';
import { ShoppingCart, BookOpen, Loader2, Check, Star, ArrowRight, Zap, PlayCircle } from 'lucide-react';

type Subject = Tables<'subjects'>;

export default function HomePage() {
  const { addToCart, removeFromCart, isInCart, isPurchased, currentView, setCurrentView, setSelectedSubjectId, searchQuery, purchasedIds } = useApp();
  const [subjects,  setSubjects]  = useState<Subject[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [semFilter, setSemFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('semester')
      .order('sort_order')
      .then(({ data }) => { setSubjects(data ?? []); setLoading(false); });
  }, []);

  const filtered = useMemo(() => {
    return subjects.filter(s => {
      const isMine = currentView === 'my-courses';
      if (isMine && !isPurchased(s.id)) return false;
      
      const matchSem = semFilter === 'all' || s.semester === semFilter;
      const matchSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSem && matchSearch;
    });
  }, [subjects, currentView, isPurchased, semFilter, searchQuery]);

  const myCoursesCount = useMemo(() => {
    return subjects.filter(s => isPurchased(s.id)).length;
  }, [subjects, isPurchased]);

  const openDetail = (s: Subject) => {
    if (s.id === '9d863b0b-22fa-4cb5-b467-15103a8904e5' && isPurchased(s.id)) {
      setCurrentView('study-hub');
      return;
    }
    setSelectedSubjectId(s.id);
    setCurrentView('subject-detail');
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb', margin: '0 auto 16px auto' }} />
        <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Đang tải danh sách khóa học...</p>
      </div>
    </div>
  );

  const isMyCourses = currentView === 'my-courses';

  return (
    <div className="home-page-container page-shell" style={{ maxWidth: '100%', padding: '24px 30px', margin: 0, fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* ════════════════════════════════════════════
          MY COURSES TOP HEADER & STATS (MATCHES SCREENSHOT 2)
          ════════════════════════════════════════════ */}
      {isMyCourses ? (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
                Khóa học của tôi
              </h1>
              <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
                Quản lý và theo dõi tiến độ các môn học bạn đang tham gia.
              </p>
            </div>

            <button
              onClick={() => setCurrentView('home')}
              style={{
                padding: '10px 20px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800,
                cursor: 'pointer', boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              + Đăng ký thêm
            </button>
          </div>

          {/* 4 TOP STAT CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>TỔNG SỐ MÔN</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{myCoursesCount}</div>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', marginBottom: 4 }}>HOÀN THÀNH</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{Math.round(myCoursesCount * 0.6)}</div>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', marginBottom: 4 }}>ĐANG HỌC</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{Math.round(myCoursesCount * 0.4)}</div>
            </div>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', marginBottom: 4 }}>ĐỀ THI ĐÃ LÀM</div>
              <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a' }}>{myCoursesCount * 3} bài</div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
            Kho Khóa Học & Đề Thi
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
            Khám phá tài liệu ôn thi chất lượng cao chuẩn Đại học cho các môn học.
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════
          SEMESTER SELECTOR (PILLS 1 - 9)
          ════════════════════════════════════════════ */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button 
          style={{ 
            padding: '7px 18px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: semFilter === 'all' ? '#2563eb' : '#ffffff',
            color: semFilter === 'all' ? '#ffffff' : '#475569',
            boxShadow: semFilter === 'all' ? '0 3px 10px rgba(37, 99, 235, 0.3)' : 'none',
            border: '1px solid #cbd5e1'
          }} 
          onClick={() => setSemFilter('all')}
        >
          Tất cả
        </button>

        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(s => (
          <button 
            key={s} 
            style={{ 
              padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontWeight: 700,
              background: semFilter === s ? '#2563eb' : '#ffffff',
              color: semFilter === s ? '#ffffff' : '#475569',
              boxShadow: semFilter === s ? '0 3px 10px rgba(37, 99, 235, 0.3)' : 'none',
              border: '1px solid #cbd5e1'
            }} 
            onClick={() => setSemFilter(s)}
          >
            Học kỳ {s}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════
          EMPTY STATE
          ════════════════════════════════════════════ */}
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
            background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <BookOpen size={32} />
          </div>
          <h3 style={{ fontWeight: 800, marginBottom: 8, fontSize: '1.25rem', color: '#0f172a' }}>
            {searchQuery 
              ? `Không tìm thấy khóa học nào khớp với từ khóa "${searchQuery}"`
              : isMyCourses 
                ? 'Bạn chưa sở hữu khóa học nào trong học kỳ này' 
                : 'Không tìm thấy môn học nào trong học kỳ này'}
          </h3>
          <p style={{ fontSize: '0.95rem', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto 20px auto' }}>
            {searchQuery
              ? 'Hãy kiểm tra lại từ khóa tìm kiếm hoặc chọn lọc tất cả học kỳ.'
              : isMyCourses 
                ? 'Hãy đăng ký các môn học phù hợp để bắt đầu quá trình ôn thi.' 
                : 'Thử chọn học kỳ khác hoặc khám phá các môn học đang có sẵn.'}
          </p>

          {isMyCourses && (
            <button
              onClick={() => setCurrentView('home')}
              style={{
                padding: '10px 20px', borderRadius: 12, border: 'none', background: '#2563eb', color: '#ffffff',
                fontWeight: 800, fontSize: 13.5, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
              }}
            >
              Khám phá môn học ngay
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════
              HIGH-END SUBJECTS GRID (MATCHES SCREENSHOT 2 & 3)
              ════════════════════════════════════════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 22 }}>
            {filtered.map((subject) => {
              const color    = subjectColor(subject.name);
              const initials = subjectInitials(subject.name);
              const owned    = isPurchased(subject.id);
              const inCart   = isInCart(subject.id);

              return (
                <div 
                  key={subject.id} 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    border: '1px solid #e2e8f0',
                    borderRadius: 22,
                    overflow: 'hidden',
                    background: '#ffffff',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
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
                  {/* Thumbnail Banner + Badges */}
                  <div
                    onClick={() => openDetail(subject)}
                    style={{
                      aspectRatio: '16/10',
                      width: '100%',
                      background: `linear-gradient(135deg, ${color}15 0%, ${color}30 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', position: 'relative',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    {subject.thumbnail_url ? (
                      <img 
                        src={optimizedImage(subject.thumbnail_url, 480)}
                        alt={subject.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: 54, height: 54, borderRadius: 16,
                        background: '#ffffff', color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: 18,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}>
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

                    {/* Top Right Badge: Đã mua (if owned) */}
                    {owned && (
                      <span style={{
                        position: 'absolute', top: 12, right: 12,
                        padding: '4px 10px', borderRadius: 8,
                        background: '#15803d', color: '#ffffff',
                        fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                      }}>
                        <Check size={12} strokeWidth={3} /> Đã mua
                      </span>
                    )}
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: 18, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Course Title */}
                      <h3 
                        onClick={() => openDetail(subject)}
                        style={{ 
                          fontSize: 16, fontWeight: 900, color: '#0f172a',
                          margin: '0 0 6px 0', letterSpacing: '-0.02em', cursor: 'pointer',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}
                      >
                        {subject.name}
                      </h3>

                      {/* Rating Stars */}
                      <div style={{ display: 'flex', gap: 2, marginBottom: 8, color: '#f59e0b' }}>
                        <Star size={13} fill="#f59e0b" stroke="none" />
                        <Star size={13} fill="#f59e0b" stroke="none" />
                        <Star size={13} fill="#f59e0b" stroke="none" />
                        <Star size={13} fill="#f59e0b" stroke="none" />
                        <Star size={13} fill="#f59e0b" stroke="none" />
                      </div>

                      {/* Description */}
                      <p style={{ 
                        fontSize: 12, color: '#64748b', lineHeight: 1.45,
                        margin: '0 0 14px 0',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' 
                      }}>
                        {subject.description || `Tài liệu ôn thi và đề thi thử môn ${subject.name} giúp bạn đạt kết quả cao nhất.`}
                      </p>
                    </div>

                    {/* Footer Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                      {owned ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a', fontWeight: 800, fontSize: 12 }}>
                            <Check size={14} strokeWidth={3} /> SỞ HỮU
                          </div>
                          <button
                            onClick={() => openDetail(subject)}
                            style={{
                              padding: '8px 14px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: '#ffffff', border: 'none', borderRadius: 10,
                              fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
                            }}
                          >
                            Xem chi tiết
                          </button>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 14 }}>
                            {formatPrice(Number(subject.price))}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (inCart) removeFromCart(subject.id);
                              else addToCart(subject);
                            }}
                            style={{
                              padding: '8px 14px',
                              background: inCart ? '#ffe4e6' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: inCart ? '#e11d48' : '#ffffff',
                              border: inCart ? '1px solid #fecdd3' : 'none',
                              borderRadius: 10, fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 6,
                              boxShadow: inCart ? 'none' : '0 4px 10px rgba(37, 99, 235, 0.25)'
                            }}
                          >
                            <ShoppingCart size={14} />
                            {inCart ? 'Đã thêm' : 'Thêm giỏ'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      <style>{`
        @media (max-width: 768px) {
          .home-page-container {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
