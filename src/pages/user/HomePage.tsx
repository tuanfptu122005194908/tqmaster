import React, { useEffect, useState, useMemo } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { SEMESTERS, subjectColor, subjectInitials, formatPrice } from '@/lib/mockData';
import { optimizedImage } from '@/lib/imageOpt';
import { ShoppingCart, BookOpen, Loader2, CheckCircle, Star } from 'lucide-react';

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

  const filtered = subjects.filter(s => {
    const isMine = currentView === 'my-courses';
    if (isMine && !isPurchased(s.id)) return false;
    
    const matchSem = semFilter === 'all' || s.semester === semFilter;
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSem && matchSearch;
  });

  const openDetail = (s: Subject) => {
    if (s.id === '9d863b0b-22fa-4cb5-b467-15103a8904e5' && isPurchased(s.id)) {
      window.location.href = '/google-cloud-study-hub.html';
      return;
    }
    setSelectedSubjectId(s.id);
    setCurrentView('subject-detail');
  };



  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))', margin: '0 auto var(--space-4)' }} />
        <p style={{ color: 'hsl(var(--muted-fg))', fontSize: '0.875rem' }}>Đang tải tài liệu...</p>
      </div>
    </div>
  );

  return (
    <div className="page-shell" style={{ margin: '0 auto' }}>
      {currentView === 'my-courses' && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'hsl(var(--foreground))' }}>Khóa học của bạn</h1>
          <p style={{ color: 'hsl(var(--muted-fg))', marginTop: 'var(--space-1)' }}>Danh sách các môn học bạn đã sở hữu.</p>
        </div>
      )}

      {/* ════════════════════════════════════════════
          SEMESTER SELECTOR
          ════════════════════════════════════════════ */}
      <div style={{ 
        marginBottom: 'var(--space-8)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'hsl(var(--muted-fg))' }}>Chọn kỳ:</span>
        <div style={{ 
          display: 'flex', 
          gap: 'var(--space-2)', 
          flexWrap: 'wrap',
          overflowX: 'auto', 
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'var(--space-1)',
        }}>
          <button 
            className={`touch-target`} 
            style={{ 
              flexShrink: 0,
              padding: '8px 16px',
              borderRadius: 999,
              fontWeight: 600,
              fontSize: '0.875rem',
              border: '2px solid',
              background: semFilter === 'all' ? 'hsl(var(--primary))' : 'transparent',
              color: semFilter === 'all' ? 'white' : 'hsl(var(--primary))',
              borderColor: 'hsl(var(--primary))',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }} 
            onClick={() => setSemFilter('all')}
          >
            Tất cả
          </button>
          {SEMESTERS.map(s => (
            <button 
              key={s} 
              className={`touch-target`}
              style={{ 
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: 999,
                fontWeight: 600,
                fontSize: '0.875rem',
                border: '2px solid',
                background: semFilter === s ? 'hsl(var(--primary))' : 'transparent',
                color: semFilter === s ? 'white' : 'hsl(var(--primary))',
                borderColor: 'hsl(var(--primary))',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }} 
              onClick={() => setSemFilter(s)}
            >
              Kỳ {s}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════
          EMPTY STATE
          ════════════════════════════════════════════ */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', 
          padding: 'var(--space-20) var(--space-8)',
          color: 'hsl(var(--muted-fg))',
          background: 'hsl(var(--primary-subtle))',
          border: '1px solid hsl(var(--primary) / 0.1)',
          borderRadius: 'calc(var(--radius) * 3)',
          boxShadow: 'inset 0 0 40px hsl(var(--primary) / 0.03)',
        }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: '50%', 
            background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-6)', boxShadow: 'var(--shadow-sm)'
          }}>
            <BookOpen size={32} style={{ color: 'hsl(var(--primary))', opacity: 0.8 }} />
          </div>
          <h3 style={{ fontWeight: 800, marginBottom: 'var(--space-3)', fontSize: '1.25rem', color: 'hsl(var(--foreground))' }}>
            {currentView === 'my-courses' ? 'Bạn chưa sở hữu khóa học nào' : 'Không tìm thấy tài liệu'}
          </h3>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto' }}>
            {currentView === 'my-courses' 
              ? 'Hãy khám phá các khóa học và chọn cho mình những tài liệu phù hợp nhất để bắt đầu học tập.' 
              : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để tìm thấy nội dung bạn cần.'}
          </p>
        </div>
      ) : (
        <>
          {/* ════════════════════════════════════════════
              SUBJECTS GRID
              ════════════════════════════════════════════ */}
          <div className="product-grid">
            {filtered.map((subject, index) => {
              const color    = subjectColor(subject.name);
              const initials = subjectInitials(subject.name);
              const owned    = isPurchased(subject.id);
              const inCart   = isInCart(subject.id);

              return (
                <div 
                  key={subject.id} 
                  className="subject-card animate-fade-in" 
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'calc(var(--radius) * 2.5)',
                    overflow: 'hidden',
                    background: 'hsl(var(--background))',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.4s var(--ease-out-quart)',
                    animationDelay: `${index * 0.05}s`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.3)';
                    e.currentTarget.style.transform = 'translateY(-6px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    e.currentTarget.style.borderColor = 'hsl(var(--border))';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Thumbnail - Flush to top/left/right */}
                  <div
                    onClick={() => openDetail(subject)}
                    style={{
                      aspectRatio: '16/10',
                      width: '100%',
                      background: `linear-gradient(135deg, ${color}08 0%, ${color}15 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden', position: 'relative',
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                  >
                    {subject.thumbnail_url ? (
                      <div style={{ width: '100%', height: '100%', padding: 'var(--space-3)' }}>
                        <img 
                          src={optimizedImage(subject.thumbnail_url, 480)}
                          alt={subject.name}
                          loading={index < 4 ? 'eager' : 'lazy'}
                          decoding="async"
                          fetchPriority={index < 4 ? 'high' : 'low'}
                          width={480}
                          height={300}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.08))',
                            transition: 'transform 0.5s var(--ease-out-quart)',
                          }} 
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        />
                      </div>
                    ) : (
                      <div style={{ 
                        width: 80, height: 80, borderRadius: '24px', 
                        background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 16px ' + color + '15',
                        transform: 'rotate(-5deg)',
                        transition: 'transform 0.4s var(--ease-out-quart)',
                      }}>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color, opacity: 0.8, letterSpacing: '-0.02em' }}>
                          {initials}
                        </span>
                      </div>
                    )}
                    
                    {/* Floating Badges */}
                    <div style={{
                      position: 'absolute', top: 'var(--space-3)', left: 'var(--space-3)', right: 'var(--space-3)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      zIndex: 10,
                    }}>
                      <span style={{
                        background: 'rgba(255, 255, 255, 0.9)', 
                        color: 'hsl(var(--foreground))',
                        backdropFilter: 'blur(8px)',
                        fontSize: '0.7rem', 
                        fontWeight: 800,
                        padding: '4px 10px', 
                        borderRadius: 10,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        border: '1px solid rgba(0,0,0,0.03)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}>
                        Kỳ {subject.semester}
                      </span>

                      {owned && (
                        <span style={{
                          background: 'hsl(var(--success))',
                          color: 'white',
                          fontSize: '0.7rem', 
                          fontWeight: 700,
                          padding: '4px 10px', 
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          boxShadow: '0 4px 12px hsl(var(--success) / 0.3)',
                        }}>
                          <CheckCircle size={12} /> Đã mua
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content area */}
                  <div style={{ padding: 'var(--space-5)', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 'var(--space-5)' }}>
                      <h3 style={{ 
                        fontWeight: 800, 
                        fontSize: '1.125rem', 
                        lineHeight: 1.3, 
                        marginBottom: 'var(--space-2)',
                        color: 'hsl(var(--foreground))',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '2.6em',
                      }}>
                        {subject.name}
                      </h3>

                      {/* 10 Stars */}
                      <div style={{ display: 'flex', gap: 2, marginBottom: 'var(--space-3)' }}>
                        {[...Array(10)].map((_, i) => (
                          <Star key={i} size={14} fill="#FFD700" color="#FFD700" />
                        ))}
                      </div>

                      <p style={{
                        fontSize: '0.875rem', 
                        color: 'hsl(var(--muted-fg))', 
                        lineHeight: 1.5,
                        display: '-webkit-box', 
                        WebkitLineClamp: 2, 
                        WebkitBoxOrient: 'vertical', 
                        overflow: 'hidden',
                        marginBottom: 'var(--space-1)',
                      }}>
                        {subject.description || `Tài liệu ôn thi và đề thi thử môn ${subject.name} giúp bạn đạt kết quả cao.`}
                      </p>
                    </div>

                    {/* Footer - Price and Actions */}
                    <div style={{
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      paddingTop: 'var(--space-4)',
                      borderTop: '1px solid hsl(var(--border) / 0.5)',
                      marginTop: 'auto',
                      gap: 'var(--space-2)',
                      flexWrap: 'wrap',
                    }}>
                      <div style={{ flex: '1 0 auto', minWidth: 'fit-content' }}>
                        {owned ? (
                          <div style={{ color: 'hsl(var(--success))', fontWeight: 800, fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={14} /> <span>SỞ HỮU</span>
                          </div>
                        ) : (
                          <div>
                            <div style={{ fontWeight: 950, color: 'hsl(var(--primary))', fontSize: '1.125rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
                              {formatPrice(subject.price)}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: 'hsl(var(--subtle-fg))', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>
                              Mở khóa vĩnh viễn
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0, marginLeft: 'auto' }}>
                        {!owned && (
                          <button 
                            className="touch-target"
                            style={{ 
                              width: 38, height: 38,
                              borderRadius: 10,
                              border: 'none',
                              cursor: 'pointer',
                              background: inCart ? 'hsl(var(--danger-light))' : 'hsl(var(--primary-muted))',
                              color: inCart ? 'hsl(var(--danger))' : 'hsl(var(--primary))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              inCart ? removeFromCart(subject.id) : addToCart(subject);
                            }}
                            title={inCart ? 'Bỏ khỏi giỏ' : 'Thêm vào giỏ'}
                          >
                            <ShoppingCart size={18} strokeWidth={2.5} />
                          </button>
                        )}
                        <button 
                          className="btn-primary"
                          style={{ 
                            padding: '0 var(--space-4)', 
                            borderRadius: 10,
                            fontSize: '0.8125rem',
                            height: 38,
                            fontWeight: 800,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetail(subject);
                          }}
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
