import React, { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { formatPrice, formatDate } from '@/lib/mockData';
import {
  ArrowLeft, ShoppingCart, CheckCircle, Clock,
  BookOpen, Bell, FileText, ExternalLink,
  Download, Image as ImageIcon, Play, Eye, Loader2, Lock, Star,
} from 'lucide-react';

type Subject       = Tables<'subjects'>;
type Exam          = Tables<'exams'>;
type Theory        = Tables<'theories'>;
type Announcement  = Tables<'announcements'>;
type Tab = 'exams' | 'theory' | 'announcements';

export default function SubjectDetailPage() {
  const {
    selectedSubjectId, setCurrentView,
    setSelectedExamId, setExamMode,
    isPurchased, isInCart, addToCart, removeFromCart,
  } = useApp();

  const [activeTab,      setActiveTab]      = useState<Tab>('exams');
  const [subject,        setSubject]        = useState<Subject | null>(null);
  const [exams,          setExams]          = useState<Exam[]>([]);
  const [theories,       setTheories]       = useState<Theory[]>([]);
  const [announcements,  setAnnouncements]  = useState<Announcement[]>([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    if (!selectedSubjectId) return;
    const load = async () => {
      const [subjRes, examRes, theoryRes, annRes] = await Promise.all([
        supabase.from('subjects').select('*').eq('id', selectedSubjectId).single(),
        supabase.from('exam_subjects').select('exam_id, exams(*)').eq('subject_id', selectedSubjectId),
        supabase.from('theory_subjects').select('theory_id, theories(*)').eq('subject_id', selectedSubjectId),
        supabase.from('announcements').select('*').eq('subject_id', selectedSubjectId).order('created_at', { ascending: false }),
      ]);
      setSubject(subjRes.data);
      setExams((examRes.data ?? []).map((r: any) => r.exams).filter(Boolean));
      setTheories((theoryRes.data ?? []).map((r: any) => r.theories).filter(Boolean));
      setAnnouncements(annRes.data ?? []);
      setLoading(false);
    };
    load();
  }, [selectedSubjectId]);

  if (loading || !subject) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'var(--space-16)' }}>
      <Loader2 size={28} className="spinner" />
    </div>
  );

  const purchased = isPurchased(subject.id);
  const inCart    = isInCart(subject.id);

  const startExam = (examId: string, mode: 'practice' | 'exam') => {
    setSelectedExamId(examId);
    setExamMode(mode);
    setCurrentView('exam');
  };

  const TypeIcon = ({ type }: { type: string }) => {
    if (type === 'image') return <ImageIcon size={15} />;
    if (type === 'link')  return <ExternalLink size={15} />;
    return <Download size={15} />;
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'exams',         label: 'Đề thi',    icon: <FileText size={14} />,   count: purchased ? exams.length : undefined },
    { key: 'theory',        label: 'Lý thuyết', icon: <BookOpen size={14} />,   count: purchased ? theories.length : undefined },
    { key: 'announcements', label: 'Thông báo', icon: <Bell size={14} />,       count: announcements.length },
  ];

  return (
    <div className="page-shell" style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Back */}
      <button
        className="btn-ghost"
        style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-2) 0', gap: 'var(--space-2)' }}
        onClick={() => setCurrentView('home')}
      >
        <ArrowLeft size={15} /> Quay lại
      </button>

      {/* ── Subject header banner ── */}
      <div style={{
        background: 'hsl(var(--surface-raised))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'calc(var(--radius) * 3)',
        marginBottom: 'var(--space-8)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Cover Image */}
        {subject.thumbnail_url ? (
          <div className="subject-hero-cover" style={{ 
            width: '100%', 
            height: 450, 
            background: 'hsl(var(--muted))', 
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img 
              src={subject.thumbnail_url} 
              alt={subject.name} 
              loading="eager"
              decoding="async"
              fetchPriority="high"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'cover',
              }} 
            />
            <div style={{ 
              position: 'absolute', inset: 0, 
              background: 'linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.4))' 
            }} />
          </div>
        ) : (
          <div style={{ 
            width: '100%', height: 160, 
            background: 'linear-gradient(135deg, hsl(var(--primary-light)) 0%, hsl(var(--primary)) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
             <BookOpen size={64} color="white" style={{ opacity: 0.2 }} />
          </div>
        )}

        {/* Content */}
        <div className="subject-hero-content" style={{
          padding: 'var(--space-8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-6)',
          background: 'white',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
              <span style={{
                background: 'hsl(var(--primary-muted))',
                color: 'hsl(var(--primary))',
                fontSize: '0.7rem',
                fontWeight: 800,
                padding: '4px 12px',
                borderRadius: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>Kỳ {subject.semester}</span>
              {purchased && (
                <span style={{
                  background: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-fg))',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '4px 12px',
                  borderRadius: 8,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>{exams.length} đề thi</span>
              )}
            </div>
            <h1 className="subject-hero-title" style={{ 
              fontSize: '2rem', 
              fontWeight: 900, 
              letterSpacing: '-0.03em', 
              marginBottom: 'var(--space-2)', 
              lineHeight: 1.1,
              color: 'hsl(var(--foreground))'
            }}>
              {subject.name}
            </h1>

            {/* 10 Stars */}
            <div style={{ display: 'flex', gap: 3, marginBottom: 'var(--space-4)' }}>
              {[...Array(10)].map((_, i) => (
                <Star key={i} size={18} fill="#FFD700" color="#FFD700" />
              ))}
              <span style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-fg))', marginLeft: 'var(--space-2)', fontWeight: 600 }}> (10/10 đánh giá)</span>
            </div>
            {subject.description && (
              <p style={{ 
                color: 'hsl(var(--muted-fg))', 
                fontSize: '1rem', 
                lineHeight: 1.6, 
                maxWidth: '60ch' 
              }}>
                {subject.description}
              </p>
            )}
          </div>

          <div className="subject-hero-price" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-end', 
            gap: 'var(--space-3)', 
            flexShrink: 0,
            background: 'hsl(var(--primary-subtle))',
            padding: 'var(--space-5)',
            borderRadius: 'calc(var(--radius) * 2)',
            border: '1px solid hsl(var(--primary) / 0.05)',
            minWidth: 200,
          }}>
            {purchased ? (
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  color: 'hsl(var(--success))', fontWeight: 800,
                  fontSize: '0.875rem',
                  marginBottom: 4,
                }}>
                  <CheckCircle size={18} /> ĐÃ SỞ HỮU
                </span>
                <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>Bạn đã có quyền truy cập vĩnh viễn</p>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontSize: '2rem', fontWeight: 950,
                    color: 'hsl(var(--primary))', letterSpacing: '-0.03em',
                    lineHeight: 1,
                  }}>
                    {formatPrice(Number(subject.price))}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--subtle-fg))', fontWeight: 700, marginTop: 4 }}>THANH TOÁN MỘT LẦN</div>
                </div>
                <button
                  id={`detail-cart-${subject.id}`}
                  className="btn-primary"
                  style={{ 
                    width: '100%', 
                    justifyContent: 'center', 
                    padding: 'var(--space-3) var(--space-8)',
                    height: 48,
                    fontSize: '1rem',
                    background: inCart ? 'hsl(var(--danger))' : undefined,
                    boxShadow: inCart ? '0 8px 20px hsl(var(--danger) / 0.3)' : undefined,
                  }}
                  onClick={() => inCart ? removeFromCart(subject.id) : addToCart(subject)}
                >
                  <ShoppingCart size={18} strokeWidth={2.5} />
                  {inCart ? 'Bỏ khỏi giỏ' : 'Thêm vào giỏ'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Lock notice ── */}
      {!purchased && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
          background: 'hsl(var(--warning-light))',
          border: '1px solid hsl(var(--warning) / 0.25)',
          borderRadius: 'var(--radius)',
          padding: 'var(--space-3) var(--space-4)',
          marginBottom: 'var(--space-5)',
        }}>
          <Lock size={14} style={{ color: 'hsl(var(--warning))', flexShrink: 0 }} />
          <span style={{ fontSize: 'var(--text-sm)', color: 'hsl(36 60% 32%)' }}>
            Mua môn học để xem nội dung đề thi, lý thuyết và thông báo
          </span>
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '2px solid hsl(var(--border))', marginBottom: 'var(--space-6)', gap: 2 }}>
        {TABS.map(tab => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            className={`tab-underline${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 18, height: 18, borderRadius: 9999,
                background: activeTab === tab.key ? 'hsl(var(--primary))' : 'hsl(var(--muted))',
                color: activeTab === tab.key ? 'white' : 'hsl(var(--muted-fg))',
                fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)',
                padding: '0 5px',
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="animate-fade-in" key={activeTab}>

        {/* Exams */}
        {activeTab === 'exams' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {!purchased ? (
              <div className="empty-state" style={{ background: 'white', padding: 'var(--space-12)' }}>
                <Lock size={48} color="hsl(var(--muted-fg))" />
                <h3 style={{ marginTop: 'var(--space-4)', fontWeight: 800 }}>Nội dung bị khóa</h3>
                <p style={{ color: 'hsl(var(--muted-fg))', fontSize: '0.9rem', marginTop: 4 }}>Vui lòng mua môn học để truy cập danh sách đề thi</p>
              </div>
            ) : exams.length === 0 ? (
              <div className="empty-state">
                <FileText size={40} />
                <p>Chưa có đề thi nào</p>
              </div>
            ) : (
              exams.map(exam => (
                <div
                  key={exam.id}
                  className="panel"
                  style={{
                    padding: 'var(--space-5)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--space-4)',
                    transition: 'box-shadow var(--duration-base), border-color var(--duration-base)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-base)',
                      marginBottom: exam.description ? 'var(--space-1)' : 0,
                      lineHeight: 'var(--lh-snug)',
                    }}>
                      {exam.title}
                    </h3>
                    {exam.description && (
                      <p style={{
                        fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-fg))',
                        marginBottom: 'var(--space-2)', lineHeight: 'var(--lh-base)',
                      }}>
                        {exam.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-fg))' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 'var(--fw-medium)' }}>
                        <Clock size={12} /> {exam.duration_min} phút
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
                    <button
                      id={`practice-${exam.id}`}
                      className="btn-ghost"
                      onClick={() => startExam(exam.id, 'practice')}
                    >
                      <Eye size={14} /> Ôn tập
                    </button>
                    <button
                      id={`exam-${exam.id}`}
                      className="btn-primary"
                      onClick={() => startExam(exam.id, 'exam')}
                    >
                      <Play size={14} /> Thi thử
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Theory */}
        {activeTab === 'theory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {!purchased && (
              <div className="empty-state">
                <BookOpen size={40} />
                <p>Mua môn học để xem tài liệu lý thuyết</p>
              </div>
            )}
            {purchased && theories.length === 0 && (
              <div className="empty-state">
                <BookOpen size={40} />
                <p>Chưa có tài liệu nào</p>
              </div>
            )}
            {purchased && theories.map(item => (
              <div
                key={item.id}
                className="panel"
                style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                  background: 'hsl(var(--primary-muted))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'hsl(var(--primary))',
                }}>
                  <TypeIcon type={item.type} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-base)',
                    marginBottom: item.description ? 2 : 0,
                    lineHeight: 'var(--lh-snug)',
                  }}>
                    {item.title}
                  </div>
                  {item.description && (
                    <div style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-fg))', lineHeight: 'var(--lh-base)' }}>
                      {item.description}
                    </div>
                  )}
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary"
                  style={{ textDecoration: 'none', flexShrink: 0 }}
                >
                  {item.type === 'link' ? <><ExternalLink size={14} /> Mở link</> : <><Download size={14} /> Tải về</>}
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Announcements */}
        {activeTab === 'announcements' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {announcements.length === 0 && (
              <div className="empty-state">
                <Bell size={40} />
                <p>Chưa có thông báo nào</p>
              </div>
            )}
            {announcements.map(ann => (
              <div
                key={ann.id}
                className="panel"
                style={{ padding: 'var(--space-5)' }}
              >
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'flex-start', gap: 'var(--space-4)',
                  marginBottom: ann.content ? 'var(--space-3)' : 0,
                }}>
                  <h3 style={{
                    fontWeight: 'var(--fw-semibold)', fontSize: 'var(--text-base)',
                    lineHeight: 'var(--lh-snug)',
                  }}>
                    {ann.title}
                  </h3>
                  <span style={{
                    fontSize: 'var(--text-xs)', color: 'hsl(var(--muted-fg))',
                    flexShrink: 0, fontVariantNumeric: 'tabular-nums',
                  }}>
                    {formatDate(ann.created_at)}
                  </span>
                </div>
                {ann.image_url && (
                  <img src={ann.image_url} alt="" style={{ maxWidth: '100%', maxHeight: 240, borderRadius: 'var(--radius)', marginBottom: 'var(--space-3)' }} />
                )}
                {ann.content && (
                  <p style={{
                    fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-fg))',
                    lineHeight: 'var(--lh-base)', whiteSpace: 'pre-line'
                  }}>
                    {ann.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
