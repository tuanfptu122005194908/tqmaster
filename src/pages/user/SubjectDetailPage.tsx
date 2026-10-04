import React, { useEffect, useState } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { formatPrice, formatDate } from '@/lib/mockData';
import { sortExams } from '@/lib/utils';
import { signStorageUrls } from '@/lib/signedImage';
import { parseTheoryDescription } from '@/lib/theoryMetadata';
import { ExamImageViewerModal } from '@/components/common/ExamImageViewerModal';
import {
  ArrowLeft, ShoppingCart, CheckCircle, Clock,
  BookOpen, Bell, FileText, ExternalLink,
  Download, Image as ImageIcon, Play, Eye, Loader2, Lock, Star, Layers
} from 'lucide-react';

type Subject       = Tables<'subjects'>;
type Exam          = Tables<'exams'>;
type Theory        = Tables<'theories'>;
type Announcement  = Tables<'announcements'>;
import { ProductReviews } from '@/components/ProductReviews';
type Tab = 'exams' | 'theory' | 'pe' | 'announcements' | 'reviews';

import { useParams, useNavigate } from 'react-router-dom';

export default function SubjectDetailPage() {
  const { id: selectedSubjectId } = useParams();
  const navigate = useNavigate();
  const {
    isPurchased, isInCart, addToCart, removeFromCart, isAdmin,
  } = useApp();

  const [activeTab,      setActiveTab]      = useState<Tab>('exams');
  const [subject,        setSubject]        = useState<Subject | null>(null);
  const [exams,          setExams]          = useState<Exam[]>([]);
  const [theories,       setTheories]       = useState<any[]>([]);
  const [announcements,  setAnnouncements]  = useState<Announcement[]>([]);
  const [loading,        setLoading]        = useState(true);

  // Full-screen Image Viewer State for PE Exam Images
  const [viewerImages, setViewerImages] = useState<string[] | null>(null);
  const [viewerTitle, setViewerTitle] = useState<string>('');
  const [viewerZipUrl, setViewerZipUrl] = useState<string | undefined>(undefined);
  const [viewerZipName, setViewerZipName] = useState<string | undefined>(undefined);
  const [viewerInitialIndex, setViewerInitialIndex] = useState<number>(0);

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
      const examsData = (examRes.data ?? []).map((r: any) => r.exams).filter(Boolean);
      setExams(sortExams(examsData));
      const theoryData = (theoryRes.data ?? []).map((r: any) => r.theories).filter(Boolean);

      // Collect all storage URLs (file URL + all preview images) for batch signing
      const urlsToSign: string[] = [];
      for (const t of theoryData) {
        if (t.url) urlsToSign.push(t.url);
        const meta = parseTheoryDescription(t.description);
        for (const img of meta.preview_images) {
          urlsToSign.push(img);
        }
      }

      const signMap = await signStorageUrls(urlsToSign);
      setTheories(theoryData.map((t: any) => {
        const meta = parseTheoryDescription(t.description);
        const signedPreviewImages = meta.preview_images.map(img => signMap.get(img) ?? img);
        return {
          ...t,
          url: signMap.get(t.url) ?? t.url,
          clean_description: meta.description,
          preview_images: signedPreviewImages,
        };
      }));
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

  const purchased = isAdmin || isPurchased(subject.id);
  const inCart    = isInCart(subject.id);

  const startExam = (examId: string, mode: 'practice' | 'exam' | 'flashcard') => {
    navigate(`/exams/${examId}?mode=${mode}`);
  };

  const TypeIcon = ({ type }: { type: string }) => {
    if (type === 'image') return <ImageIcon size={15} />;
    if (type === 'link')  return <ExternalLink size={15} />;
    return <Download size={15} />;
  };

  const PeFilmstripThumb = ({
    imgUrl,
    imgIdx,
    onClick,
  }: {
    imgUrl: string;
    imgIdx: number;
    onClick: () => void;
  }) => {
    const [hasError, setHasError] = useState(false);

    return (
      <div
        onClick={onClick}
        style={{
          width: 100,
          height: 72,
          borderRadius: 8,
          overflow: 'hidden',
          border: '1.5px solid #cbd5e1',
          background: '#ffffff',
          position: 'relative',
          cursor: 'pointer',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
          transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        }}
        title={`Câu ${imgIdx + 1} - Bấm để phóng to`}
      >
        {hasError ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
            color: '#64748b',
            gap: 2,
          }}>
            <ImageIcon size={18} />
            <span style={{ fontSize: 10, fontWeight: 700 }}>Ảnh {imgIdx + 1}</span>
          </div>
        ) : (
          <img
            src={imgUrl}
            alt={`Câu ${imgIdx + 1}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
            onError={() => setHasError(true)}
          />
        )}
        <div style={{
          position: 'absolute',
          bottom: 0,
          insetInline: 0,
          background: 'linear-gradient(to top, rgba(15,23,42,0.85), transparent)',
          padding: '2px 4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ color: '#ffffff', fontSize: 9, fontWeight: 800 }}>
            Câu {imgIdx + 1}
          </span>
          <Eye size={10} color="#ffffff" style={{ opacity: 0.8 }} />
        </div>
      </div>
    );
  };

  const theoryDocs = theories.filter(t => ((t as any).category ?? 'theory') !== 'pe');
  const peDocs     = theories.filter(t => ((t as any).category ?? 'theory') === 'pe');

  const getDisplayDesc = (item: any): string => {
    if (typeof item.clean_description === 'string') return item.clean_description.trim();
    return parseTheoryDescription(item?.description).description.trim();
  };

  const renderDocs = (list: Theory[], lockedText: string, emptyText: string) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {!purchased && (
        <div className="empty-state">
          <BookOpen size={40} />
          <p>{lockedText}</p>
        </div>
      )}
      {purchased && list.length === 0 && (
        <div className="empty-state">
          <BookOpen size={40} />
          <p>{emptyText}</p>
        </div>
      )}
      {purchased && list.map(item => (
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
              marginBottom: getDisplayDesc(item) ? 2 : 0,
              lineHeight: 'var(--lh-snug)',
            }}>
              {item.title}
            </div>
            {getDisplayDesc(item) ? (
              <div style={{ fontSize: 'var(--text-sm)', color: 'hsl(var(--muted-fg))', lineHeight: 'var(--lh-base)' }}>
                {getDisplayDesc(item)}
              </div>
            ) : null}
          </div>
          <a
            href={item.type === 'link' || !item.file_name
              ? item.url
              : `${item.url}${item.url.includes('?') ? '&' : '?'}download=${encodeURIComponent(item.file_name)}`}
            target="_blank"
            rel="noreferrer"
            download={item.type !== 'link' ? (item.file_name || undefined) : undefined}
            className="btn-primary"
            style={{ textDecoration: 'none', flexShrink: 0 }}
          >
            {item.type === 'link' ? <><ExternalLink size={14} /> Mở link</> : <><Download size={14} /> Tải về</>}
          </a>
        </div>
      ))}
    </div>
  );

  const renderPeDocs = (list: any[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {!purchased && (
        <div className="empty-state">
          <BookOpen size={40} />
          <p>Mua môn học để xem tài liệu PE / Video</p>
        </div>
      )}
      {purchased && list.length === 0 && (
        <div className="empty-state">
          <BookOpen size={40} />
          <p>Chưa có tài liệu PE / Video nào</p>
        </div>
      )}
      {purchased && list.map(item => {
        const hasImages = item.preview_images && item.preview_images.length > 0;

        return (
          <div
            key={item.id}
            className="panel"
            style={{
              padding: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              background: '#ffffff',
              borderRadius: 20,
              border: hasImages ? '1.5px solid #dbeafe' : '1px solid #e2e8f0',
              boxShadow: hasImages ? '0 4px 16px rgba(37, 99, 235, 0.05)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {/* Top row: Title, Badges & Download Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flex: 1, minWidth: 260 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: hasImages ? 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)' : 'hsl(var(--primary-muted))',
                  color: hasImages ? '#1d4ed8' : 'hsl(var(--primary))',
                  border: hasImages ? '1px solid #bfdbfe' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {hasImages ? <Layers size={18} /> : <TypeIcon type={item.type} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h3 style={{
                      fontWeight: 800, fontSize: '1rem',
                      lineHeight: 'var(--lh-snug)', color: '#0f172a', margin: 0,
                    }}>
                      {item.title}
                    </h3>
                    {hasImages && (
                      <span style={{
                        background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
                        fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 9999,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        <Layers size={12} /> {item.preview_images.length} ảnh câu hỏi
                      </span>
                    )}
                  </div>

                  {getDisplayDesc(item) ? (
                    <p style={{ fontSize: '0.85rem', color: 'hsl(var(--muted-fg))', lineHeight: 1.5, margin: 0 }}>
                      {getDisplayDesc(item)}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Action Buttons: View Exam Images & Download Original ZIP */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center', flexWrap: 'wrap' }}>
                {hasImages && (
                  <button
                    onClick={() => {
                      setViewerImages(item.preview_images);
                      setViewerTitle(item.title);
                      setViewerZipUrl(item.url);
                      setViewerZipName(item.file_name);
                      setViewerInitialIndex(0);
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: '#ffffff', padding: '9px 16px', borderRadius: 12,
                      fontSize: '0.85rem', fontWeight: 800, border: 'none',
                      cursor: 'pointer', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    <Eye size={15} /> Xem đề thi ({item.preview_images.length} ảnh)
                  </button>
                )}

                {/* Original Download / Link button preserved 100% */}
                <a
                  href={item.type === 'link' || !item.file_name
                    ? item.url
                    : `${item.url}${item.url.includes('?') ? '&' : '?'}download=${encodeURIComponent(item.file_name)}`}
                  target="_blank"
                  rel="noreferrer"
                  download={item.type !== 'link' ? (item.file_name || undefined) : undefined}
                  className={hasImages ? "btn-ghost" : "btn-primary"}
                  style={{
                    textDecoration: 'none', flexShrink: 0,
                    borderRadius: 12, fontSize: '0.85rem', fontWeight: 700,
                    border: hasImages ? '1.5px solid #cbd5e1' : undefined,
                  }}
                  title="Tải file ZIP gốc về máy"
                >
                  {item.type === 'link' ? (
                    <><ExternalLink size={14} /> Mở link</>
                  ) : (
                    <><Download size={14} /> {hasImages ? 'Tải file ZIP gốc' : 'Tải về'}</>
                  )}
                </a>
              </div>
            </div>

            {/* Bottom: Inline Image Gallery / Filmstrip */}
            {hasImages && (
              <div style={{
                marginTop: 'var(--space-2)',
                background: '#f8fafc',
                borderRadius: 14,
                padding: '12px 14px',
                border: '1px solid #e2e8f0',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Ảnh xem trước câu hỏi đề thi (Click để phóng to):
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6' }}>
                    {item.preview_images.length} trang
                  </span>
                </div>

                <div style={{
                  display: 'flex',
                  gap: 10,
                  overflowX: 'auto',
                  paddingBottom: 6,
                  WebkitOverflowScrolling: 'touch',
                }}>
                  {item.preview_images.map((imgUrl: string, imgIdx: number) => (
                    <PeFilmstripThumb
                      key={imgIdx}
                      imgUrl={imgUrl}
                      imgIdx={imgIdx}
                      onClick={() => {
                        setViewerImages(item.preview_images);
                        setViewerTitle(item.title);
                        setViewerZipUrl(item.url);
                        setViewerZipName(item.file_name);
                        setViewerInitialIndex(imgIdx);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const TABS: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'exams',         label: 'Đề thi',    icon: <FileText size={14} />,   count: purchased ? exams.length : undefined },
    { key: 'theory',        label: 'Lý thuyết', icon: <BookOpen size={14} />,   count: purchased ? theoryDocs.length : undefined },
    { key: 'pe',            label: 'Tài liệu PE / Video', icon: <Layers size={14} />, count: purchased ? peDocs.length : undefined },
    { key: 'announcements', label: 'Thông báo', icon: <Bell size={14} />,       count: announcements.length },
    { key: 'reviews',       label: 'Đánh giá & Phản hồi', icon: <Star size={14} />, count: 101 },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Back Button */}
      <nav className="flex items-center gap-2 font-iba-body-sm text-iba-body-sm text-iba-outline mb-6">
        <button 
          onClick={() => navigate(-1)} 
          className="hover:text-iba-primary transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Quay lại</span>
        </button>
      </nav>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Lõi bên trái: Nội dung */}
        <div className="flex-1 min-w-0">
          {/* Header Thông tin môn học */}
          <div className="bg-iba-surface-container-lowest rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-iba-secondary/10 text-iba-secondary font-iba-label-badge text-iba-label-badge uppercase tracking-wider font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-iba-secondary animate-pulse"></span>
                KỲ {subject.semester}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-iba-primary/10 text-iba-primary font-iba-label-badge text-iba-label-badge font-bold uppercase tracking-wider">
                CHÍNH HÃNG 100%
              </span>
            </div>

            <h1 className="font-iba-headline-lg text-iba-headline-lg text-iba-on-surface font-extrabold tracking-tight m-0">
              {subject.name}
            </h1>

            <div className="flex items-center gap-3">
              <div className="flex items-center text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-[18px]" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                ))}
              </div>
              <span className="font-iba-body-sm text-iba-body-sm text-iba-on-surface font-bold">5.0</span>
              <span className="font-iba-body-sm text-iba-body-sm text-iba-outline">({Math.floor(Math.random() * 200) + 50} đánh giá)</span>
            </div>

            {subject.description && (
              <p className="font-iba-body-md text-iba-body-md text-iba-on-surface-variant leading-relaxed m-0 mt-2">
                {subject.description}
              </p>
            )}
          </div>

          {/* Cảnh báo chưa mua */}
          {!purchased && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <Lock size={20} className="text-amber-500 shrink-0" />
              <span className="font-iba-body-sm text-iba-body-sm text-amber-800">
                Mua môn học để mở khóa toàn bộ đề thi, lý thuyết, video và tài liệu tải về.
              </span>
            </div>
          )}

          {/* Tabs */}
          <div className="flex overflow-x-auto border-b-2 border-iba-surface-container mb-6 gap-4 scrollbar-none pb-1">
            {TABS.map(tab => (
              <button
                key={tab.key}
                id={`tab-${tab.key}`}
                className={`flex items-center gap-2 pb-3 font-iba-body-sm text-iba-body-sm font-semibold whitespace-nowrap transition-colors border-b-2 bg-transparent cursor-pointer ${
                  activeTab === tab.key 
                    ? 'border-iba-primary text-iba-primary' 
                    : 'border-transparent text-iba-on-surface-variant hover:text-iba-on-surface hover:border-iba-outline'
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`inline-flex items-center justify-center min-w-[20px] h-5 rounded-full text-xs font-bold px-1.5 ${
                    activeTab === tab.key ? 'bg-iba-primary text-iba-on-primary' : 'bg-iba-surface-container-high text-iba-on-surface-variant'
                  }`}>
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
                      id={`flashcard-${exam.id}`}
                      className="btn-ghost"
                      onClick={() => startExam(exam.id, 'flashcard')}
                    >
                      <Layers size={14} /> Flashcard
                    </button>
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
        {activeTab === 'theory' && renderDocs(
          theoryDocs,
          'Mua môn học để xem tài liệu lý thuyết',
          'Chưa có tài liệu nào',
        )}

        {/* PE materials / Video */}
        {activeTab === 'pe' && renderPeDocs(peDocs)}

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
        
        {activeTab === 'reviews' && (
          <ProductReviews purchased={purchased} />
        )}
      </div>

      </div> {/* <-- Đóng cột trái flex-1 */}

      {/* Right Column: Checkout Sticky Card */}
      <div className="w-full lg:w-[340px] shrink-0">
        <div className="sticky top-24 bg-iba-surface-container-lowest rounded-xl shadow-sm border border-iba-hairline overflow-hidden">
          {/* Cover Image in Sidebar */}
          <div className="w-full aspect-[16/10] bg-iba-surface-container-low flex items-center justify-center relative">
            {subject.thumbnail_url ? (
              <img src={subject.thumbnail_url} alt={subject.name} className="w-full h-full object-cover" />
            ) : (
              <BookOpen size={48} className="text-iba-outline opacity-30" />
            )}
          </div>
          
          <div className="p-5">
            {purchased ? (
              <div className="text-center">
                 <div className="flex items-center justify-center gap-2 text-green-600 font-iba-headline-sm text-iba-headline-sm font-bold mb-2">
                   <CheckCircle size={20} /> {Number(subject.price) <= 0 ? 'MIỄN PHÍ' : 'ĐÃ SỞ HỮU'}
                 </div>
                 <p className="font-iba-body-sm text-iba-body-sm text-iba-on-surface-variant">Bạn đã có quyền truy cập vĩnh viễn vào môn học này.</p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <div className="font-iba-headline-lg text-iba-headline-lg text-iba-primary font-extrabold tracking-tight">
                    {formatPrice(Number(subject.price))}
                  </div>
                  {Number(subject.price) > 0 && (
                    <div className="font-iba-body-sm text-iba-body-sm text-iba-outline line-through mt-1">
                      {formatPrice(Number(subject.price) * 1.5)}
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => inCart ? removeFromCart(subject.id) : addToCart(subject)}
                    className={`w-full py-3 px-4 rounded-lg font-iba-body-sm text-iba-body-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer ${
                      inCart ? 'bg-iba-surface-container text-iba-primary' : 'bg-iba-surface-container-low hover:bg-iba-surface-container text-iba-on-surface'
                    }`}
                  >
                    <ShoppingCart size={20} />
                    {inCart ? 'Đã thêm vào giỏ' : 'Thêm vào giỏ'}
                  </button>
                  <button
                    onClick={() => {
                      if (!inCart) addToCart(subject);
                      navigate('/cart');
                    }}
                    className="w-full py-3 px-4 rounded-lg bg-iba-primary-container hover:bg-iba-primary text-iba-on-primary font-iba-body-sm text-iba-body-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer border-none"
                  >
                    Mua ngay
                  </button>
                </div>

                {/* Assurances */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-iba-surface-container-low text-iba-primary flex items-center justify-center border border-iba-hairline shrink-0">
                      <span className="material-symbols-outlined text-[16px]">flash_on</span>
                    </div>
                    <div className="font-iba-body-sm text-iba-body-sm font-bold text-iba-on-surface">Kích hoạt ngay lập tức</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-iba-surface-container-low text-iba-secondary flex items-center justify-center border border-iba-hairline shrink-0">
                      <span className="material-symbols-outlined text-[16px]">verified_user</span>
                    </div>
                    <div className="font-iba-body-sm text-iba-body-sm font-bold text-iba-on-surface">Cập nhật đề thi mới nhất</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-iba-surface-container-low text-iba-tertiary flex items-center justify-center border border-iba-hairline shrink-0">
                      <span className="material-symbols-outlined text-[16px]">headset_mic</span>
                    </div>
                    <div className="font-iba-body-sm text-iba-body-sm font-bold text-iba-on-surface">Hỗ trợ 24/7</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      </div> {/* <-- Đóng container flex-row */}

      {/* Full-Screen Exam Image Viewer Modal */}
      {viewerImages && (
        <ExamImageViewerModal
          isOpen={Boolean(viewerImages)}
          onClose={() => setViewerImages(null)}
          images={viewerImages}
          initialIndex={viewerInitialIndex}
          title={viewerTitle}
          zipDownloadUrl={viewerZipUrl}
          zipFileName={viewerZipName}
        />
      )}
    </div>
  );
}
