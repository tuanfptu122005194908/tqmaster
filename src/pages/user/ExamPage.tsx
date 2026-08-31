import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { 
  X, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Flag, 
  RotateCcw, Loader2, BarChart3, AlertTriangle, MousePointerClick, 
  ZoomIn, MessageSquareWarning, ZoomOut, Maximize2, Minimize2, MessageSquare 
} from 'lucide-react';
import { playSound } from '@/lib/sound';
import { RichContent } from '@/components/exam/RichContent';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

type Exam = Tables<'exams'>;
type Question = Tables<'questions'> & { options: Array<Tables<'question_options'>> };

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return 'tuần trước';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = Math.max(0, now.getTime() - past.getTime());
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffMonth > 0) return `${diffMonth} tháng trước`;
  if (diffWeek > 0) return `${diffWeek} tuần trước`;
  if (diffDay > 0) return `${diffDay} ngày trước`;
  if (diffHour > 0) return `${diffHour} giờ trước`;
  if (diffMin > 0) return `${diffMin} phút trước`;
  return 'vừa xong';
}

export default function ExamPage() {
  const { id: selectedExamId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const examMode = searchParams.get('mode');
  const navigate = useNavigate();
  const { profile } = useApp();

  const [exam,      setExam]      = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading,   setLoading]   = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers,  setAnswers]  = useState<Record<string, string[]>>({});
  const [flagged,  setFlagged]  = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [timeLeft,  setTimeLeft]  = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  // Viewer Controls State for Text Exams
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // In-Place Zoom & Drag-to-Pan for Image Exams
  const [imageZoom, setImageZoom] = useState(100);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const dragStartPosRef = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const didDragRef = useRef(false);

  const handleImageMouseDown = (e: React.MouseEvent) => {
    didDragRef.current = false;
    if (imageZoom <= 100) return;
    const container = imageContainerRef.current;
    if (!container) return;
    setIsDraggingImage(true);
    dragStartPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
    };
  };

  const handleImageMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingImage) return;
    const container = imageContainerRef.current;
    if (!container) return;
    const dx = e.clientX - dragStartPosRef.current.x;
    const dy = e.clientY - dragStartPosRef.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      didDragRef.current = true;
    }
    container.scrollLeft = dragStartPosRef.current.scrollLeft - dx;
    container.scrollTop = dragStartPosRef.current.scrollTop - dy;
  };

  const handleImageMouseUp = () => {
    setIsDraggingImage(false);
  };

  // Report State
  const [reportingQuestion, setReportingQuestion] = useState<Question | null>(null);
  const [reportNote, setReportNote] = useState('');
  const [reportOptionIds, setReportOptionIds] = useState<string[]>([]);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Reset states when question changes
  useEffect(() => {
    setIsFlipped(false);
    setImageZoom(100);
    setIsDraggingImage(false);
    didDragRef.current = false;
    if (imageContainerRef.current) {
      imageContainerRef.current.scrollLeft = 0;
      imageContainerRef.current.scrollTop = 0;
    }
    setReportOptionIds([]);
    setReportNote('');
  }, [currentIndex]);

  // Flashcard keyboard shortcuts
  useEffect(() => {
    if (examMode !== 'flashcard') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (['INPUT', 'TEXTAREA'].includes(activeEl?.tagName || '')) return;

      if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar' || e.keyCode === 32) {
        e.preventDefault();
        e.stopPropagation();
        if (activeEl instanceof HTMLElement && activeEl.tagName === 'BUTTON') {
          activeEl.blur();
        }
        setIsFlipped(prev => !prev);
        playSound.flip();
      } else if (e.code === 'ArrowLeft' || e.key === 'ArrowLeft' || e.keyCode === 37) {
        e.preventDefault();
        if (activeEl instanceof HTMLElement && activeEl.tagName === 'BUTTON') {
          activeEl.blur();
        }
        setCurrentIndex(i => Math.max(0, i - 1));
      } else if (e.code === 'ArrowRight' || e.key === 'ArrowRight' || e.keyCode === 39) {
        e.preventDefault();
        if (activeEl instanceof HTMLElement && activeEl.tagName === 'BUTTON') {
          activeEl.blur();
        }
        setCurrentIndex(i => Math.min(questions.length - 1, i + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [examMode, questions.length]);

  // Load exam + questions + options
  useEffect(() => {
    if (!selectedExamId) return;
    const load = async () => {
      let examData = null;
      try {
        const { data, error } = await supabase
          .from('exams')
          .select('*, exam_subjects(subject_id, subjects(*)), profiles:created_by(*)')
          .eq('id', selectedExamId)
          .single();
        if (!error && data) {
          examData = data;
        } else {
          const fallback = await supabase.from('exams').select('*').eq('id', selectedExamId).single();
          examData = fallback.data;
        }
      } catch (e) {
        const fallback = await supabase.from('exams').select('*').eq('id', selectedExamId).single();
        examData = fallback.data;
      }

      const questionsRes = await supabase.from('questions')
        .select('*, question_options(*)')
        .eq('exam_id', selectedExamId)
        .order('order_num');

      setExam(examData ?? null);
      const qs: Question[] = (questionsRes.data ?? []).map((q: any) => ({
        ...q,
        options: q.question_options ?? [],
      }));
      // Sort options by label
      qs.forEach(q => { q.options.sort((a, b) => a.label.localeCompare(b.label)); });
      setQuestions(qs);
      
      let initialTimeLeft = examData ? examData.duration_min * 60 : 0;
      const draftStr = localStorage.getItem(`exam_draft_${selectedExamId}_${examMode}`);
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          if (draft.answers) setAnswers(draft.answers);
          if (draft.flagged) setFlagged(new Set(draft.flagged));
          if (draft.timeLeft !== undefined) initialTimeLeft = draft.timeLeft;
        } catch (err) {}
      }

      if (examData) setTimeLeft(initialTimeLeft);
      setLoading(false);
    };
    load();
  }, [selectedExamId, examMode]);

  // Preload ALL question images on load — instant prev/next
  useEffect(() => {
    if (!questions.length) return;
    const imgs: HTMLImageElement[] = [];
    questions.forEach(q => {
      if (q.image_url) {
        const img = new Image();
        img.decoding = 'async';
        img.src = q.image_url;
        imgs.push(img);
      }
    });
    return () => { imgs.forEach(i => { i.src = ''; }); };
  }, [questions]);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (loading || !exam || questions.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in some input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'Space' && examMode === 'flashcard') {
        e.preventDefault();
        setIsFlipped(prev => {
          playSound.flip();
          return !prev;
        });
      } else if (e.code === 'ArrowLeft') {
        setCurrentIndex(i => { if (i > 0) playSound.click(); return Math.max(0, i - 1); });
      } else if (e.code === 'ArrowRight') {
        setCurrentIndex(i => { if (i < questions.length - 1) playSound.click(); return Math.min(questions.length - 1, i + 1); });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [examMode, loading, exam, questions.length]);

  // Reset flip when question changes
  useEffect(() => {
    setIsFlipped(false);
    // Sync preview image if it's open
    if (previewImage) {
      if (questions[currentIndex]?.image_url) {
        setPreviewImage(questions[currentIndex].image_url);
      } else {
        setPreviewImage(null);
      }
    }
  }, [currentIndex, questions, previewImage]);

  // Timer
  useEffect(() => {
    if (examMode === 'exam' && !submitted && !loading && exam) {
      timerRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [examMode, submitted, loading, exam]);

  // Auto-save
  useEffect(() => {
    if (!exam || submitted || loading) return;
    const draft = {
      answers,
      flagged: Array.from(flagged),
      timeLeft,
    };
    localStorage.setItem(`exam_draft_${exam.id}_${examMode}`, JSON.stringify(draft));
  }, [answers, flagged, timeLeft, exam, submitted, loading, examMode]);

  // Close preview image on Escape key
  useEffect(() => {
    if (!previewImage) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewImage]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'hsl(var(--background))' }}>
      <Loader2 size={32} className="spinner" />
    </div>
  );

  if (!exam || questions.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 'var(--space-4)' }}>
      <p style={{ color: 'hsl(var(--muted-fg))' }}>Đề thi chưa có câu hỏi nào.</p>
      <button className="btn-primary" onClick={() => navigate(-1)}>Quay lại</button>
    </div>
  );

  const currentQ    = questions[currentIndex];
  const totalTime   = exam.duration_min * 60;
  const timePercent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 100;
  const isTimeLow   = timeLeft < 300;

  const currentAnswers = answers[currentQ.id] ?? [];
  const answeredCount  = Object.values(answers).filter(a => a.length > 0).length;

  // Determine if this is a text-based exam
  const isTextExam = questions.length > 0 && (
    questions.filter(q => q.image_url).length < questions.length / 2 ||
    questions.some(q => q.options.some(o => o.content?.trim())) ||
    questions.every(q => !q.image_url)
  );

  const toggleAnswer = (label: string) => {
    if (submitted) return;
    
    if (examMode === 'exam') {
      playSound.click();
    } else if (examMode === 'practice') {
      const currentlySelected = (answers[currentQ.id] ?? []).includes(label);
      if (currentlySelected) {
        playSound.click();
      } else {
        const isCorrectOption = currentQ.options.find(o => o.label === label)?.is_correct;
        if (isCorrectOption) {
          playSound.correct();
        } else {
          playSound.incorrect();
        }
      }
    }

    setAnswers(prev => {
      const cur = prev[currentQ.id] ?? [];
      const next = cur.includes(label) ? cur.filter(l => l !== label) : [...cur, label];
      return { ...prev, [currentQ.id]: next };
    });
  };

  const toggleFlag = () => {
    setFlagged(prev => {
      const next = new Set(prev);
      next.has(currentIndex) ? next.delete(currentIndex) : next.add(currentIndex);
      return next;
    });
  };

  const handleSubmit = async () => {
    setShowSubmitConfirm(false);
    clearInterval(timerRef.current);
    setSubmitted(true);
    playSound.success();
    if (exam) {
      localStorage.removeItem(`exam_draft_${exam.id}_${examMode}`);
    }

    // Save attempt to Supabase
    if (profile) {
      const { data: attempt } = await supabase.from('exam_attempts').insert({
        user_id: profile.id, exam_id: exam.id,
        mode: examMode === 'practice' ? 'practice' : 'test',
        submitted_at: new Date().toISOString(),
        total_q: questions.length,
      }).select().single();

      if (attempt) {
        // Save answers
        const answerRows = questions.map(q => {
          const given = answers[q.id] ?? [];
          const correctLabels = q.options.filter(o => o.is_correct).map(o => o.label);
          const isCorrect = given.length === correctLabels.length && given.every(l => correctLabels.includes(l));
          return { attempt_id: attempt.id, question_id: q.id, selected: given, is_correct: isCorrect };
        });
        const correctCount = answerRows.filter(r => r.is_correct).length;
        await supabase.from('attempt_answers').insert(answerRows);
        await supabase.from('exam_attempts').update({
          correct_q: correctCount,
          score: Math.round((correctCount / questions.length) * 100),
        }).eq('id', attempt.id);
      }
    }
  };

  const getCorrectLabels = (q: Question) => q.options.filter(o => o.is_correct).map(o => o.label);

  const calcScore = () => {
    let correct = 0;
    questions.forEach(q => {
      const given   = answers[q.id] ?? [];
      const correct_labels = getCorrectLabels(q);
      if (given.length === correct_labels.length && given.every(l => correct_labels.includes(l))) correct++;
    });
    return { correct, total: questions.length, pct: Math.round((correct / questions.length) * 100) };
  };

  const getChapterAnalytics = () => {
    const chapters: Record<string, { total: number; correct: number; incorrect: number }> = {};
    questions.forEach(q => {
      const chap = (q as any).chapter_name?.trim() || 'Tổng hợp';
      if (!chapters[chap]) {
        chapters[chap] = { total: 0, correct: 0, incorrect: 0 };
      }
      chapters[chap].total += 1;
      const given = answers[q.id] ?? [];
      const correct_labels = getCorrectLabels(q);
      const isQCorrect = given.length === correct_labels.length && given.every(l => correct_labels.includes(l));
      if (isQCorrect) {
        chapters[chap].correct += 1;
      } else {
        chapters[chap].incorrect += 1;
      }
    });

    return Object.entries(chapters).map(([name, data]) => ({
      name,
      ...data,
      pct: Math.round((data.correct / data.total) * 100),
      isWeak: data.incorrect > 0 && (data.correct / data.total) < 0.6,
    }));
  };

  const handleRedoIncorrect = () => {
    const incorrectQuestions = questions.filter(q => {
      const given = answers[q.id] ?? [];
      const correct_labels = getCorrectLabels(q);
      return !(given.length === correct_labels.length && given.every(l => correct_labels.includes(l)));
    });

    if (incorrectQuestions.length === 0) {
      alert('🎉 Bạn đã làm đúng 100% tất cả các câu hỏi! Không có câu sai nào.');
      return;
    }

    setQuestions(incorrectQuestions);
    setAnswers({});
    setSubmitted(false);
    setCurrentIndex(0);
    setFlagged(new Set());
    setSearchParams({ mode: 'practice' });
  };

  const submitReport = async () => {
    const targetQ = isTextExam ? currentQ : reportingQuestion;
    if (!targetQ || reportOptionIds.length === 0 || !profile) {
      if (!profile) alert('Vui lòng đăng nhập để gửi báo cáo.');
      else if (reportOptionIds.length === 0) alert('Vui lòng chọn ít nhất một đáp án bạn cho là đúng.');
      return;
    }
    setIsSubmittingReport(true);
    try {
      const rows = reportOptionIds.map(optId => ({
        question_id: targetQ.id,
        user_id: profile.id,
        suggested_option_id: optId,
        note: reportNote || null,
      }));
      const { error } = await supabase.from('question_reports').insert(rows);
      if (error) throw error;
      alert('Cảm ơn bạn đã báo cáo. Chúng tôi sẽ kiểm tra và cập nhật sớm nhất!');
      setReportingQuestion(null);
      setReportNote('');
      setReportOptionIds([]);
    } catch (err: any) {
      alert('Có lỗi xảy ra khi gửi báo cáo: ' + err.message);
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const reportModal = reportingQuestion ? (
    <div 
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReportingQuestion(null); }}
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(15, 23, 42, 0.6)', 
        backdropFilter: 'blur(4px)',
        zIndex: 9999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 24
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          background: '#ffffff', 
          borderRadius: 24, 
          width: '100%', 
          maxWidth: 500, 
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 28, 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
              <MessageSquareWarning size={20} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>Báo cáo đáp án sai</h3>
          </div>
          <button onClick={() => setReportingQuestion(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={24} />
          </button>
        </div>
        
        <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.5, background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', maxHeight: 120, overflowY: 'auto' }}>
          <strong style={{ color: '#0f172a' }}>Câu hỏi: </strong>
          {reportingQuestion.content}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
            Theo bạn, đáp án nào mới là đáp án đúng? (Có thể chọn nhiều) *
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {reportingQuestion.options.map(opt => {
              const isAlreadyCorrect = opt.is_correct;
              const isChecked = reportOptionIds.includes(opt.id);

              return (
                <div 
                  key={opt.id} 
                  onClick={() => {
                    setReportOptionIds(prev => prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id]);
                  }}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, 
                    border: `1px solid ${isChecked ? '#3b82f6' : isAlreadyCorrect ? '#a7f3d0' : '#e2e8f0'}`, 
                    background: isChecked ? '#eff6ff' : isAlreadyCorrect ? '#f0fdf4' : 'white', 
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: 4, border: `1.5px solid ${isChecked ? '#3b82f6' : '#cbd5e1'}`, background: isChecked ? '#3b82f6' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isChecked && <CheckCircle size={14} color="white" />}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: isChecked ? 700 : 500, color: isChecked ? '#1e40af' : '#334155', flex: 1 }}>
                    {opt.label}. {opt.content}
                  </span>
                  {isAlreadyCorrect && (
                    <span style={{ fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4 }}>
                      Hiện tại: Đúng
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Ghi chú thêm (không bắt buộc)</label>
          <textarea 
            value={reportNote}
            onChange={e => setReportNote(e.target.value)}
            placeholder="Vui lòng cung cấp thêm giải thích hoặc lý do tại sao bạn cho rằng đáp án này đúng..."
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, minHeight: 80, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <button
            onClick={() => setReportingQuestion(null)}
            style={{ flex: 1, padding: '12px 16px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 12, fontSize: 14, fontWeight: 800, color: '#334155', cursor: 'pointer' }}
          >
            Hủy
          </button>
          <button
            onClick={submitReport}
            disabled={reportOptionIds.length === 0 || isSubmittingReport}
            style={{ flex: 1, padding: '12px 16px', background: reportOptionIds.length === 0 ? '#94a3b8' : '#3b82f6', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 800, color: 'white', cursor: reportOptionIds.length === 0 ? 'not-allowed' : 'pointer' }}
          >
            {isSubmittingReport ? <Loader2 size={20} className="spinner" /> : `Gửi báo cáo ${reportOptionIds.length > 0 ? `(${reportOptionIds.length})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const submitConfirmModal = showSubmitConfirm ? (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(15, 23, 42, 0.6)', 
        backdropFilter: 'blur(4px)',
        zIndex: 9999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 24
      }}
      onClick={() => setShowSubmitConfirm(false)}
    >
      <div 
        style={{ 
          background: '#ffffff', 
          borderRadius: 24, 
          width: '100%', 
          maxWidth: 460, 
          padding: 28, 
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: 20
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: 14, 
            background: (questions.length - answeredCount) > 0 ? '#fff7ed' : '#edf5ff', 
            border: `1px solid ${(questions.length - answeredCount) > 0 ? '#ffedd5' : '#dbeafe'}`,
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: (questions.length - answeredCount) > 0 ? '#d97706' : '#3b82f6',
            flexShrink: 0
          }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
              Xác nhận nộp bài thi
            </h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0 0', lineHeight: 1.4 }}>
              Bạn có chắc chắn muốn kết thúc bài thi thử ngay bây giờ?
            </p>
          </div>
        </div>

        {/* Stats Summary */}
        <div style={{ background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', padding: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          <div style={{ textAlign: 'center', padding: '8px 4px', background: 'white', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Đã làm</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>{answeredCount}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 4px', background: (questions.length - answeredCount) > 0 ? '#fef2f2' : 'white', borderRadius: 10, border: `1px solid ${(questions.length - answeredCount) > 0 ? '#fecdd3' : '#e2e8f0'}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: (questions.length - answeredCount) > 0 ? '#e11d48' : '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Chưa làm</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: (questions.length - answeredCount) > 0 ? '#e11d48' : '#64748b' }}>{questions.length - answeredCount}</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 4px', background: flagged.size > 0 ? '#fffbeb' : 'white', borderRadius: 10, border: `1px solid ${flagged.size > 0 ? '#fde68a' : '#e2e8f0'}` }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: flagged.size > 0 ? '#b45309' : '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Đánh dấu</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: flagged.size > 0 ? '#b45309' : '#64748b' }}>{flagged.size}</div>
          </div>
        </div>

        {(questions.length - answeredCount) > 0 && (
          <div style={{ fontSize: 12, color: '#c2410c', background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 10, padding: '10px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, color: '#ea580c' }} />
            <span>Bạn vẫn còn <strong>{questions.length - answeredCount}</strong> câu chưa làm.</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <button
            onClick={() => setShowSubmitConfirm(false)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'white',
              border: '1px solid #cbd5e1',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              color: '#334155',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Tiếp tục làm bài
          </button>
          <button
            onClick={() => {
              setShowSubmitConfirm(false);
              handleSubmit();
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            Nộp bài ngay
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const previewImageModal = previewImage ? (
    <div 
      onClick={() => setPreviewImage(null)}
      style={{ 
        position: 'fixed', 
        inset: 0, 
        background: 'rgba(0,0,0,0.85)', 
        zIndex: 9999, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: 40,
        cursor: 'zoom-out'
      }}
    >
      <button 
        onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
        style={{ position: 'absolute', top: 20, right: 20, background: 'white', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 10000 }}
      >
        <X size={24} />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => Math.max(0, i - 1)); }}
        disabled={currentIndex === 0}
        style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: currentIndex === 0 ? 'rgba(255,255,255,0.5)' : 'white', border: 'none', borderRadius: '50%', width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 10000 }}
      >
        <ChevronLeft size={30} />
      </button>
      <img 
        src={previewImage} 
        alt="Preview" 
        style={{ 
          maxWidth: '90%', 
          maxHeight: '90%', 
          objectFit: 'contain', 
          borderRadius: 8,
          boxShadow: '0 0 40px rgba(0,0,0,0.5)',
          transform: 'scale(1)',
          transition: 'transform 0.3s ease'
        }} 
        onClick={(e) => e.stopPropagation()}
      />
      <button 
        onClick={(e) => { e.stopPropagation(); setCurrentIndex(i => Math.min(questions.length - 1, i + 1)); }}
        disabled={currentIndex === questions.length - 1}
        style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: currentIndex === questions.length - 1 ? 'rgba(255,255,255,0.5)' : 'white', border: 'none', borderRadius: '50%', width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 10000 }}
      >
        <ChevronRight size={30} />
      </button>
    </div>
  ) : null;

  // ── Results screen (Modern design) ────────────────────────────
  if (submitted && examMode === 'exam') {
    const { correct, total, pct } = calcScore();
    const isPassed = pct >= 50;

    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f7', padding: '24px' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Top Back Button */}
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
              background: 'white', border: '2px solid #000', borderRadius: 8,
              fontSize: 14, fontWeight: 800, color: '#000', cursor: 'pointer',
              marginBottom: 24, transition: 'all 0.2s'
            }}
          >
            <ChevronLeft size={18} /> QUAY LẠI
          </button>
          {/* Score Card */}
          <div
            style={{
              background: isPassed ? 'linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fef2f2 100%)',
              border: `2px solid ${isPassed ? '#22c55e' : '#ef4444'}`,
              borderRadius: 16,
              padding: 40,
              textAlign: 'center',
              marginBottom: 32,
            }}
          >
            <div style={{
              fontSize: 64,
              fontWeight: 700,
              color: isPassed ? '#22c55e' : '#ef4444',
              letterSpacing: '-2px',
              marginBottom: 8,
            }}>
              {pct}%
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#000', marginBottom: 8 }}>
              {correct}/{total} câu đúng
            </div>
            <div style={{ fontSize: 14, color: isPassed ? '#4a7c4e' : '#7f1d1d', lineHeight: '1.6' }}>
              {pct >= 80 ? '🎉 Xuất sắc! Bạn đã nắm rất tốt kiến thức.' : pct >= 50 ? '👍 Khá tốt! Hãy ôn thêm những phần còn yếu.' : '💪 Cần cố gắng hơn! Hãy xem lại lý thuyết.'}
            </div>
          </div>

          {/* Exam Analytics & Knowledge Gap Section */}
          {(() => {
            const chapterStats = getChapterAnalytics();
            const weakChapters = chapterStats.filter(c => c.isWeak);
            const totalIncorrect = questions.length - correct;

            return (
              <div style={{ background: 'white', borderRadius: 16, border: '2px solid #e2e8f0', padding: 24, marginBottom: 32, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ padding: 8, background: '#e0e7ff', borderRadius: 10, color: '#4f46e5' }}>
                      <BarChart3 size={22} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>Phân tích lỗ hổng kiến thức theo Chương</h2>
                      <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Xem kết quả từng chương để lên kế hoạch ôn tập trọng tâm</p>
                    </div>
                  </div>
                  {totalIncorrect > 0 && (
                    <button
                      onClick={handleRedoIncorrect}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                        background: '#4f46e5', color: 'white', border: 'none', borderRadius: 10,
                        fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <RotateCcw size={16} /> Luyện lại {totalIncorrect} câu làm sai
                    </button>
                  )}
                </div>

                {/* Weak Chapter Warnings */}
                {weakChapters.length > 0 && (
                  <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <AlertTriangle size={20} style={{ color: '#ea580c', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <span style={{ fontWeight: 700, fontSize: 14, color: '#9a3412', display: 'block', marginBottom: 4 }}>Cảnh báo lỗ hổng kiến thức!</span>
                      <div style={{ fontSize: 13, color: '#c2410c', lineHeight: 1.5 }}>
                        {weakChapters.map((w, idx) => (
                          <div key={idx}>• Bạn đang bị hổng ở <strong>{w.name}</strong> (làm sai {w.incorrect}/{w.total} câu - tỷ lệ đúng {w.pct}%)</div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Chapter Breakdown Progress Bars */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {chapterStats.map((chap, idx) => (
                    <div key={idx} style={{ background: '#f8fafc', borderRadius: 12, padding: 16, border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{chap.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 800, color: chap.isWeak ? '#dc2626' : '#16a34a', background: chap.isWeak ? '#fee2e2' : '#dcfce7', padding: '2px 8px', borderRadius: 20 }}>
                          {chap.correct}/{chap.total} đúng ({chap.pct}%)
                        </span>
                      </div>
                      <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${chap.pct}%`, background: chap.isWeak ? '#ef4444' : '#22c55e', borderRadius: 4, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Review Section - 2 Column Layout */}
          <div className="exam-results-layout">
            {/* Left: Detailed Review */}
            <div className="exam-results-details">
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#000', marginBottom: 20 }}>Chi tiết đáp án</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {questions.map((q, i) => {
                  const given = answers[q.id] ?? [];
                  const correct_labels = getCorrectLabels(q);
                  const isQCorrect = given.length === correct_labels.length && given.every(l => correct_labels.includes(l));

                  return (
                    <div
                      key={q.id}
                      id={`review-q-${q.id}`}
                      style={{
                        background: 'white',
                        border: `2px solid ${isQCorrect ? '#dcfce7' : '#fef2f2'}`,
                        borderRadius: 12,
                        padding: 24,
                        scrollMargin: '120px',
                      }}
                    >
                      {/* Header */}
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 20 }}>
                        <div style={{
                          flexShrink: 0,
                          width: 36,
                          height: 36,
                          borderRadius: 50,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isQCorrect ? '#dcfce7' : '#fef2f2',
                        }}>
                          {isQCorrect ? (
                            <CheckCircle size={20} style={{ color: '#22c55e' }} />
                          ) : (
                            <XCircle size={20} style={{ color: '#ef4444' }} />
                          )}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: 16, color: '#000', marginBottom: 6 }}>
                            Câu {i + 1}: {q.content?.trim() ? q.content : '[Câu hình ảnh]'}
                          </div>
                          <div style={{ fontSize: 13, color: '#666', fontWeight: 600 }}>
                            {isQCorrect ? 'TRẢ LỜI ĐÚNG' : 'TRẢ LỜI SAI'}
                          </div>
                        </div>
                      </div>

                      {/* Image */}
                      {q.image_url && (
                        <div 
                          style={{ marginBottom: 20, borderRadius: 12, overflow: 'hidden', border: '1px solid #eee', cursor: 'zoom-in' }}
                          onClick={() => setPreviewImage(q.image_url)}
                        >
                          <img src={q.image_url} alt={`q${i + 1}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                        </div>
                      )}

                      {/* Detailed Options List */}
                      {q.options.some(opt => opt.content?.trim()) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', padding: '0 10px' }}>
                          {q.options.map((opt) => opt.content?.trim() ? (
                            <div key={opt.label} style={{ fontSize: 14, fontWeight: 500, color: '#000' }}>
                              {opt.label}. {opt.content}
                            </div>
                          ) : null)}
                        </div>
                      )}

                      {/* Options Display */}
                      <div style={{ padding: '20px', background: '#f9fafb', borderRadius: 12, border: '1px solid #eee' }}>
                        <div style={{ marginBottom: 12 }}>
                          <span style={{ fontWeight: 800, color: '#059669', fontSize: 15 }}>ĐÁP ÁN ĐÚNG: </span>
                          <span style={{ fontWeight: 800, color: '#059669', fontSize: 15 }}>{correct_labels.join(', ')}</span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 800, color: isQCorrect ? '#059669' : '#dc2626', fontSize: 15 }}>BẠN ĐÃ CHỌN: </span>
                          <span style={{ fontWeight: 800, color: isQCorrect ? '#059669' : '#dc2626', fontSize: 15 }}>
                            {given.length > 0 ? given.join(', ') : 'Chưa chọn'}
                          </span>
                        </div>
                      </div>

                      {/* Report Section */}
                      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12, background: '#fffbeb', padding: 16, borderRadius: 12, border: '1px solid #fde68a' }}>
                        <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
                          Trong quá trình nhập liệu đáp án có thể xảy ra sai sót. Nếu bạn thấy đáp án chưa chính xác, có thể phản hồi lại với chúng tôi.
                        </div>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReportingQuestion(q); }}
                          style={{
                            alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
                            background: '#f59e0b', color: 'white', border: 'none', borderRadius: 8,
                            padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                          }}
                        >
                          <MessageSquareWarning size={16} /> Báo cáo lỗi
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Sticky Summary (Narrower) */}
            <div className="exam-results-summary">
              <div style={{ background: 'white', padding: '16px 12px', borderRadius: 12, border: '1px solid #e5e5ea', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <h2 style={{ fontSize: 13, fontWeight: 800, color: '#000', marginBottom: 12, textAlign: 'center' }}>TÓM TẮT</h2>
                <div className="questions-grid-wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, maxHeight: '55vh', overflowY: 'auto', paddingRight: 4 }}>
                  {questions.map((q, i) => {
                    const given = answers[q.id] ?? [];
                    const correct_labels = getCorrectLabels(q);
                    const isQCorrect = given.length === correct_labels.length && given.every(l => correct_labels.includes(l));

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          document.getElementById(`review-q-${q.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        style={{
                          aspectRatio: '1',
                          borderRadius: 6,
                          border: 'none',
                          background: isQCorrect ? '#22c55e' : '#ef4444',
                          color: 'white',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.1s',
                          padding: 0,
                        }}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
                
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #eee' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: '#22c55e' }} />
                      <span style={{ fontSize: 10, color: '#666', fontWeight: 700 }}>{correct} ĐÚNG</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: '#ef4444' }} />
                      <span style={{ fontSize: 10, color: '#666', fontWeight: 700 }}>{total - correct} SAI</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                  {total - correct > 0 && (
                    <button
                      style={{ width: '100%', padding: '8px', background: '#4f46e5', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'white' }}
                      onClick={handleRedoIncorrect}
                    >
                      🔄 ÔN CÂU SAI ({total - correct})
                    </button>
                  )}
                  <button
                    style={{ width: '100%', padding: '8px', background: 'white', border: '2px solid #e5e5ea', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', color: '#1a1a1a' }}
                    onClick={() => { setSubmitted(false); setAnswers({}); setCurrentIndex(0); setFlagged(new Set()); setTimeLeft(totalTime); }}
                  >
                    LÀM LẠI TOÀN BỘ
                  </button>
                  <button
                    style={{ width: '100%', padding: '8px', background: '#6C5CE7', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', color: 'white' }}
                    onClick={() => navigate(-1)}
                  >
                    THOÁT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {previewImageModal}
        {reportModal}
      </div>
    );
  }

  // ── Practice mode option style ──────────────────────────────
  const getOptionCls = (label: string) => {
    if (examMode === 'practice') {
      const correct_labels = getCorrectLabels(currentQ);
      if (correct_labels.includes(label)) return 'correct';
      return '';
    }
    if (submitted) {
      const given = answers[currentQ.id] ?? [];
      const correct_labels = getCorrectLabels(currentQ);
      if (correct_labels.includes(label)) return 'correct';
      if (given.includes(label)) return 'incorrect';
      return '';
    }
    if (currentAnswers.includes(label)) return 'selected';
    return '';
  };

  // ── Flashcard UI ─────────────────────────────────────────────
  if (examMode === 'flashcard') {
    const q = questions[currentIndex];
    const isImageQ = Boolean(q?.image_url);
    const correctOpts = q.options.filter(o => o.is_correct);
    const progressPercent = ((currentIndex + 1) / questions.length) * 100;
    const cardMaxWidth = isImageQ ? 1400 : 820;
    const headerMaxWidth = isImageQ ? 1400 : 960;

    return (
      <div style={{ minHeight: '100vh', background: '#f4f7fc', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {/* Top Sticky Header */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          {/* Progress Bar (Green Success Gradient) */}
          <div style={{ height: 3, width: '100%', background: '#e2e8f0' }}>
            <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', transition: 'width 0.3s ease' }} />
          </div>
          
          <div style={{ maxWidth: headerMaxWidth, margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, transition: 'max-width 0.25s ease' }}>
            <button 
              tabIndex={-1}
              onClick={(e) => { e.currentTarget.blur(); navigate(-1); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 12, cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#334155', transition: 'all 0.15s' }}
            >
              <ChevronLeft size={16} /> Quay lại
            </button>
            
            <div style={{ textAlign: 'center', flex: 1, padding: '0 12px' }}>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {exam.title}
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginTop: 1 }}>
                CHẾ ĐỘ THẺ GHI NHỚ (FLASHCARD)
              </div>
            </div>
            
            <div style={{ fontSize: 12, fontWeight: 800, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 14px', borderRadius: 20, flexShrink: 0 }}>
              {currentIndex + 1} / {questions.length}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', maxWidth: cardMaxWidth, width: '100%', margin: '0 auto', transition: 'max-width 0.25s ease' }}>
          
          {/* Flashcard Card Container */}
          <div 
            onClick={() => { setIsFlipped(!isFlipped); playSound.flip(); }}
            style={{ 
              width: '100%', 
              minHeight: isImageQ ? 560 : 400,
              background: '#ffffff', 
              borderRadius: 24, 
              border: `1.5px solid ${isFlipped ? '#86efac' : '#e2e8f0'}`,
              boxShadow: isFlipped ? '0 16px 40px -8px rgba(22, 163, 74, 0.12)' : '0 16px 40px -8px rgba(15, 23, 42, 0.05)',
              display: 'flex', 
              flexDirection: 'column',
              padding: isImageQ ? '24px 32px' : '28px 24px', 
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              userSelect: 'none'
            }}
          >
            {/* Top Badge Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              {!isFlipped ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: '0.02em' }}>
                  <span>CÂU HỎI {currentIndex + 1}</span>
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800 }}>
                  <CheckCircle size={14} /> <span>ĐÁP ÁN ĐÚNG</span>
                </div>
              )}

              <div style={{ fontSize: 12, fontWeight: 600, color: isFlipped ? '#16a34a' : '#64748b', display: 'flex', alignItems: 'center', gap: 5, background: isFlipped ? '#f0fdf4' : '#f8fafc', padding: '4px 10px', borderRadius: 8, border: `1px solid ${isFlipped ? '#dcfce7' : '#e2e8f0'}` }}>
                <RotateCcw size={13} />
                <span>{isFlipped ? 'Mặt sau (Đáp án)' : 'Mặt trước (Câu hỏi)'}</span>
              </div>
            </div>

            {/* Question / Answer Content */}
            {!isFlipped ? (
              // FRONT SIDE: Question & Options
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  {q.image_url && (
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      <img 
                        src={q.image_url} 
                        alt="Question" 
                        onClick={(e) => { e.stopPropagation(); setPreviewImage(q.image_url); }}
                        style={{ maxWidth: '100%', maxHeight: '74vh', objectFit: 'contain', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }} 
                      />
                    </div>
                  )}

                  {q.content?.trim() && (
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', lineHeight: 1.6, marginBottom: 16 }}>
                      <RichContent content={q.content} />
                    </div>
                  )}

                  {q.options.some(o => o.content?.trim()) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.options.map(opt => (
                        <div 
                          key={opt.label} 
                          style={{ 
                            background: '#ffffff', 
                            border: '1px solid #e2e8f0', 
                            borderRadius: 12, 
                            padding: '10px 14px', 
                            color: '#334155', 
                            fontWeight: 500, 
                            fontSize: 14, 
                            lineHeight: 1.5,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                          }}
                        >
                          <span style={{ fontWeight: 700, color: '#059669', flexShrink: 0 }}>{opt.label}.</span>
                          <span style={{ flex: 1 }}><RichContent content={opt.content} /></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Flip Hint */}
                <div style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>
                  <MousePointerClick size={15} />
                  <span>Click vào thẻ hoặc bấm phím Space để lật xem đáp án</span>
                </div>
              </div>
            ) : (
              // BACK SIDE: Correct Answer Highlight
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                <div>
                  {q.image_url && (
                    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                      <img 
                        src={q.image_url} 
                        alt="Question" 
                        onClick={(e) => { e.stopPropagation(); setPreviewImage(q.image_url); }}
                        style={{ maxWidth: '100%', maxHeight: '74vh', objectFit: 'contain', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }} 
                      />
                    </div>
                  )}

                  {q.content?.trim() && (
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#475569', lineHeight: 1.5, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
                      <RichContent content={q.content} />
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {correctOpts.map(opt => (
                      <div 
                        key={opt.label} 
                        style={{ 
                          background: '#f0fdf4', 
                          border: '1.5px solid #86efac', 
                          borderRadius: 14, 
                          padding: '12px 16px', 
                          color: '#15803d', 
                          fontWeight: 600, 
                          fontSize: 14.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          boxShadow: '0 2px 8px rgba(34, 197, 94, 0.08)'
                        }}
                      >
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#16a34a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <CheckCircle size={14} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 800, marginRight: 6 }}>{opt.label}.</span>
                          <RichContent content={opt.content} />
                        </div>
                      </div>
                    ))}

                    {correctOpts.length === 0 && (
                      <div style={{ color: '#ef4444', fontWeight: 600, padding: 14, background: '#fef2f2', borderRadius: 12, border: '1px solid #fecdd3', fontSize: 14 }}>
                        Chưa có đáp án đúng được thiết lập.
                      </div>
                    )}
                  </div>
                </div>

                {/* Return Hint */}
                <div style={{ marginTop: 24, paddingTop: 14, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#16a34a', fontSize: 12, fontWeight: 600 }}>
                  <RotateCcw size={15} />
                  <span>Click vào thẻ để lật lại câu hỏi</span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Control Bar Below Card */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 18 }}>
            {/* Prev Button */}
            <button 
              tabIndex={-1}
              onClick={(e) => { e.currentTarget.blur(); setCurrentIndex(i => Math.max(0, i - 1)); }}
              disabled={currentIndex === 0}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '12px 16px',
                background: currentIndex === 0 ? '#f1f5f9' : '#ffffff',
                color: currentIndex === 0 ? '#94a3b8' : '#0f172a',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 13.5,
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                boxShadow: currentIndex === 0 ? 'none' : '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.15s'
              }}
            >
              <ChevronLeft size={18} /> Câu trước
            </button>

            {/* Flip Button (Center CTA) */}
            <button 
              tabIndex={-1}
              onClick={(e) => { e.currentTarget.blur(); setIsFlipped(!isFlipped); playSound.flip(); }}
              style={{
                flex: 1.4,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 20px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 14,
                fontWeight: 800,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 6px 18px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s'
              }}
            >
              <RotateCcw size={16} />
              <span>{isFlipped ? 'Xem lại câu hỏi' : 'Lật xem đáp án'}</span>
            </button>

            {/* Next Button */}
            <button 
              tabIndex={-1}
              onClick={(e) => { e.currentTarget.blur(); setCurrentIndex(i => Math.min(questions.length - 1, i + 1)); }}
              disabled={currentIndex === questions.length - 1}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '12px 16px',
                background: currentIndex === questions.length - 1 ? '#f1f5f9' : '#ffffff',
                color: currentIndex === questions.length - 1 ? '#94a3b8' : '#0f172a',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 13.5,
                cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer',
                boxShadow: currentIndex === questions.length - 1 ? 'none' : '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.15s'
              }}
            >
              Câu sau <ChevronRight size={18} />
            </button>
          </div>

          {/* Bottom Footer Info & Report */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: 16, padding: '0 4px' }}>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
              💡 Phím tắt: <kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: 4, margin: '0 2px', fontFamily: 'inherit', fontWeight: 700 }}>Space</kbd> lật thẻ, <kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: 4, margin: '0 2px', fontFamily: 'inherit', fontWeight: 700 }}>←</kbd> <kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: 4, margin: '0 2px', fontFamily: 'inherit', fontWeight: 700 }}>→</kbd> chuyển câu
            </div>
            
            <button
              tabIndex={-1}
              onClick={(e) => { e.currentTarget.blur(); e.preventDefault(); e.stopPropagation(); setReportingQuestion(q); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: 10,
                padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              <MessageSquareWarning size={14} /> Báo lỗi câu này
            </button>
          </div>

        </div>

        {previewImageModal}
        {reportModal}
      </div>
    );
  }

  // ── DEDICATED TEXT EXAM UI (Matching modern viewer design) ────
  if (isTextExam) {
    const examMeta = (() => {
      const title = exam?.title || '';
      const subj = (exam as any)?.exam_subjects?.[0]?.subjects;
      const parts = title.split('_');
      const code = parts[0] || subj?.name || '';
      const sem = parts.find((p: string) => /^(SP|FA|SU|SE|WS)\d+/i.test(p)) || (subj?.semester ? `SP${subj.semester}` : 'SP26');
      const type = parts.find((p: string) => /^(FE|PE|PT|QUIZ|FINAL|TEST)/i.test(p)) || 'FE';
      const name = subj?.name ? `${code ? code + ' — ' : ''}${subj.name}` : code ? `${code} — Chuyên ngành` : title;
      return { code, sem, type, name };
    })();

    const creator = (exam as any)?.profiles;
    const creatorName = creator?.full_name || creator?.username || 'Admin Test';
    const creatorAvatar = creator?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';
    const timeAgo = formatRelativeTime(exam?.created_at);

    return (
      <div className={`text-gray-800 font-sans ${isFullscreen ? 'fixed inset-0 w-screen h-screen z-50 p-0 m-0 bg-white flex flex-col overflow-hidden' : 'bg-gray-100 min-h-screen flex flex-col items-center justify-center p-2 sm:p-4 md:p-6'}`}>
        {/* BEGIN: MainContainer */}
        <div 
          className={`bg-white flex flex-col overflow-hidden relative ${
            isFullscreen 
              ? 'w-full h-full max-w-none rounded-none border-none shadow-none' 
              : 'rounded-lg shadow-lg w-full max-w-6xl lg:max-w-7xl xl:max-w-[1480px] h-[calc(100vh-48px)] md:h-[660px] lg:h-[700px] max-h-[750px] border border-gray-200'
          }`} 
          data-purpose="exam-interface-container"
        >
          
          {/* Top Close Button */}
          <button 
            onClick={() => {
              if (isFullscreen) {
                if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
              }
              navigate(-1);
            }}
            aria-label="Đóng"
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 cursor-pointer z-50 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Main Content Area: Split into Left (Exam) and Right (Sidebar) */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* BEGIN: LeftExamArea */}
            <main className="flex-1 flex flex-col relative bg-white overflow-hidden" data-purpose="exam-content-area">
              {/* Navigation Arrows */}
              <button 
                aria-label="Previous Page"
                disabled={currentIndex === 0}
                onClick={() => {
                  if (currentIndex > 0) {
                    setCurrentIndex(i => i - 1);
                    playSound.click();
                  }
                }}
                className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 bg-gray-300 hover:bg-gray-400 disabled:opacity-30 disabled:hover:bg-gray-300 text-white rounded-full p-2 z-10 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5 md:h-6 md:w-6" />
              </button>
              
              <button 
                aria-label="Next Page"
                disabled={currentIndex === questions.length - 1}
                onClick={() => {
                  if (currentIndex < questions.length - 1) {
                    setCurrentIndex(i => i + 1);
                    playSound.click();
                  }
                }}
                className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 bg-gray-300 hover:bg-gray-400 disabled:opacity-30 disabled:hover:bg-gray-300 text-white rounded-full p-2 z-10 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5 md:h-6 md:w-6" />
              </button>

              {/* Exam Content Container */}
              <div 
                className="flex-1 overflow-y-auto px-8 py-6 sm:px-12 sm:py-8 md:px-20 md:py-8"
                style={{ 
                  transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined, 
                  transformOrigin: 'top left',
                  width: zoomLevel !== 100 ? `${(100 / zoomLevel) * 100}%` : '100%'
                }}
              >
                <div className="max-w-4xl">
                  {/* Header Info */}
                  <header className="mb-6 md:mb-8">
                    <h1 className="text-2xl md:text-3xl font-semibold mb-3 text-gray-900 leading-tight">{exam.title}</h1>
                    <div className="bg-gray-50 border-l-2 border-blue-600 px-3.5 py-2.5 text-xs sm:text-sm text-gray-600 rounded-r-md">
                      Môn: <span className="font-medium text-gray-800">{examMeta.name}</span> · Kỳ: <span className="font-medium text-gray-800">{examMeta.sem}</span> · Loại: <span className="font-medium text-gray-800">{examMeta.type}</span> · {questions.length} câu
                    </div>
                  </header>

                  {/* Question Section */}
                  <section>
                    <div className="flex items-center gap-2 mb-4 sm:mb-5">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Trang {currentIndex + 1}/{questions.length}</h2>
                      <span className="text-gray-400 font-bold">#</span>
                    </div>

                    <div className="text-sm sm:text-base leading-relaxed mb-5 sm:mb-6 text-gray-800">
                      <p>
                        <span className="font-bold text-gray-900">Câu {currentIndex + 1}. </span>
                        <RichContent content={currentQ.content || ''} />
                      </p>
                      {currentQ.image_url && (
                        <div 
                          className="mt-3 rounded-lg overflow-hidden border border-gray-200 inline-block max-w-full cursor-zoom-in"
                          onClick={() => setPreviewImage(currentQ.image_url)}
                        >
                          <img src={currentQ.image_url} alt={`Câu ${currentIndex + 1}`} className="max-h-[45vh] object-contain rounded" />
                        </div>
                      )}
                      {((currentQ as any).extra_images as string[] | undefined)?.map((url, xi) => (
                        <div 
                          key={xi} 
                          className="mt-2 rounded-lg overflow-hidden border border-gray-200 inline-block max-w-full cursor-zoom-in"
                          onClick={() => setPreviewImage(url)}
                        >
                          <img src={url} alt={`Ảnh ${xi + 1}`} className="max-h-[35vh] object-contain rounded" />
                        </div>
                      ))}
                    </div>

                    {/* Options (Reading Mode) */}
                    <div className="space-y-3 sm:space-y-3.5 text-sm sm:text-base text-gray-800">
                      {currentQ.options.map(opt => (
                        <div key={opt.label} className="leading-relaxed flex items-start gap-2.5 py-0.5">
                          <span className="font-bold text-gray-900 shrink-0">{opt.label}.</span>
                          <div className="flex-1">
                            <RichContent content={opt.content || ''} />
                            {(opt as any).image_url && (
                              <img src={(opt as any).image_url} alt={`opt ${opt.label}`} className="max-h-24 rounded mt-1.5 block" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </main>
            {/* END: LeftExamArea */}

            {/* BEGIN: RightSidebarArea */}
            <aside className="w-72 md:w-84 lg:w-88 border-l border-gray-200 bg-white flex flex-col flex-shrink-0 overflow-hidden" data-purpose="sidebar-controls">
              {/* Sidebar Header */}
              <div className="p-3.5 sm:p-4 border-b border-gray-100 shrink-0">
                <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate" title={exam.title}>{exam.title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Bộ đề gồm {questions.length} {questions.every(q => !q.image_url) ? 'câu' : 'ảnh'}</p>
                <div className="flex items-center justify-between mt-3 sm:mt-3.5">
                  <div className="flex items-center gap-2">
                    <img 
                      alt="Admin Avatar" 
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 object-cover" 
                      src={creatorAvatar} 
                    />
                    <span className="font-medium text-xs sm:text-sm text-gray-800">{creatorName}</span>
                    <span className="text-[11px] sm:text-xs text-gray-400">{timeAgo}</span>
                  </div>
                  {(submitted || examMode === 'practice') && (
                    <div className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 sm:py-1 rounded flex items-center gap-1 font-medium">
                      <MessageSquare className="h-3 w-3" />
                      <span>1</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar Body: Mode Dependent */}
              {examMode === 'exam' && !submitted ? (
                /* ─── Taking Exam Mode: Multi-Select Answer Selection & Question Map ─── */
                <>
                  <div className="flex-1 overflow-y-auto p-3.5 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-xs sm:text-sm text-gray-900">
                        Chọn đáp án của bạn:
                      </h4>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        Câu {currentIndex + 1}/{questions.length}
                      </span>
                    </div>

                    {/* Options Selection Cards - Checkbox style supporting multi-select */}
                    <div className="space-y-2.5 mb-4">
                      {currentQ.options.map(opt => {
                        const isChecked = currentAnswers.includes(opt.label);
                        return (
                          <div 
                            key={opt.label}
                            onClick={() => toggleAnswer(opt.label)}
                            className={`flex items-center p-2.5 sm:p-3 border rounded-lg cursor-pointer transition-all select-none ${
                              isChecked 
                                ? 'border-blue-500 bg-blue-50/80 text-blue-950 font-semibold shadow-xs' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center mr-2.5 shrink-0 border transition-all ${
                              isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'
                            }`}>
                              {isChecked && (
                                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <span className="text-xs sm:text-sm">
                              <span className="font-bold mr-1">{opt.label}.</span> {opt.content || ''}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Row: Flag button + Progress count */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setFlagged(prev => {
                            const next = new Set(prev);
                            if (next.has(currentIndex)) next.delete(currentIndex);
                            else next.add(currentIndex);
                            return next;
                          });
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          flagged.has(currentIndex)
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        <Flag className="w-3.5 h-3.5" />
                        <span>{flagged.has(currentIndex) ? 'Đã đánh dấu' : 'Đánh dấu câu hỏi'}</span>
                      </button>
                      <span className="text-xs text-gray-500 font-medium">
                        Đã làm: <b className="text-gray-900 font-bold">{answeredCount}</b>/{questions.length}
                      </span>
                    </div>

                    {/* Question Navigation Map */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Danh sách câu hỏi</span>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Đã làm</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span> Đánh dấu</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-6 sm:grid-cols-7 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-gray-50 rounded-lg border border-gray-200">
                        {questions.map((q, idx) => {
                          const isDone = (answers[q.id] ?? []).length > 0;
                          const isCur = idx === currentIndex;
                          const isFlag = flagged.has(idx);

                          let btnStyle = 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100';
                          if (isCur) btnStyle = 'bg-blue-600 text-white border-blue-600 font-bold shadow-xs';
                          else if (isFlag) btnStyle = 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
                          else if (isDone) btnStyle = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-medium';

                          return (
                            <button
                              key={idx}
                              onClick={() => setCurrentIndex(idx)}
                              className={`h-7 text-xs rounded border flex items-center justify-center transition-colors cursor-pointer ${btnStyle}`}
                              title={`Câu ${idx + 1}`}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Submit Button */}
                  <div className="p-3.5 sm:p-4 border-t border-gray-100 bg-gray-50 shrink-0">
                    <button
                      onClick={() => setShowSubmitConfirm(true)}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>NỘP BÀI THI</span>
                      <span className="bg-emerald-800/40 px-2 py-0.5 rounded text-xs">({answeredCount}/{questions.length})</span>
                    </button>
                  </div>
                </>
              ) : (
                /* ─── Review / Practice Mode: Report Error Section ─── */
                <>
                  <div className="flex-1 overflow-y-auto p-3.5 sm:p-4">
                    <h4 className="font-semibold text-xs sm:text-sm mb-3 sm:mb-4 text-gray-900">
                      Theo bạn, đáp án nào mới là đáp án đúng? (Có thể chọn nhiều) <span className="text-red-600">*</span>
                    </h4>
                    <div className="space-y-2.5 mb-4 sm:mb-6">
                      {currentQ.options.map(opt => {
                        const isAlreadyCorrect = opt.is_correct;
                        const isChecked = reportOptionIds.includes(opt.id);

                        return (
                          <div 
                            key={opt.label}
                            onClick={() => {
                              setReportOptionIds(prev => 
                                prev.includes(opt.id) ? prev.filter(x => x !== opt.id) : [...prev, opt.id]
                              );
                            }}
                            className={`flex items-center p-2.5 sm:p-3 border rounded-lg cursor-pointer transition-all select-none ${
                              isChecked 
                                ? 'border-blue-500 bg-blue-50/80 text-blue-950 font-semibold shadow-xs' 
                                : isAlreadyCorrect
                                  ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-gray-800'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-800'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded flex items-center justify-center mr-2.5 shrink-0 border transition-all ${
                              isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'
                            }`}>
                              {isChecked && (
                                <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <span className="text-xs sm:text-sm font-medium flex-1">
                              <span className="font-bold mr-1">{opt.label}.</span> {opt.content || ''}
                            </span>
                            {isAlreadyCorrect && (
                              <span className="ml-2 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                                Hiện tại: Đúng
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comment Input Box for Reporting */}
                  <div className="p-3.5 sm:p-4 border-t border-gray-100 bg-gray-50 shrink-0">
                    <div className="mb-3">
                      <h4 className="font-semibold text-xs sm:text-sm mb-1.5 text-gray-800">Ghi chú thêm (không bắt buộc)</h4>
                      <textarea 
                        value={reportNote}
                        onChange={e => setReportNote(e.target.value)}
                        className="w-full text-xs sm:text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-blue-400 focus:border-blue-400 resize-none outline-none h-20 bg-white" 
                        placeholder="Vui lòng cung cấp thêm giải thích hoặc lý do tại sao bạn cho rằng đáp án này đúng..."
                      />
                    </div>
                    <div className="flex gap-2.5">
                      <button 
                        onClick={() => { setReportNote(''); setReportOptionIds([]); }}
                        className="flex-1 py-2 border border-gray-300 rounded-lg font-semibold text-xs sm:text-sm hover:bg-gray-100 transition-colors bg-white text-gray-700 cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button 
                        onClick={submitReport}
                        disabled={reportOptionIds.length === 0 || isSubmittingReport}
                        className={`flex-1 py-2 rounded-lg font-semibold text-xs sm:text-sm text-white transition-colors flex items-center justify-center gap-1.5 ${
                          reportOptionIds.length === 0 || isSubmittingReport 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 cursor-pointer shadow-sm'
                        }`}
                      >
                        {isSubmittingReport ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : `Gửi báo cáo ${reportOptionIds.length > 0 ? `(${reportOptionIds.length})` : ''}`}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </aside>
            {/* END: RightSidebarArea */}
          </div>

          {/* BEGIN: BottomToolbar */}
          <footer className="bg-black text-white px-4 py-2 flex items-center justify-between text-xs sm:text-sm flex-shrink-0" data-purpose="bottom-viewer-controls">
            <div className="flex items-center gap-4 text-gray-200 font-medium">
              <span>{currentIndex + 1}/{questions.length}</span>
              {examMode === 'exam' && !submitted && (
                <span className={`flex items-center gap-1.5 font-bold ${isTimeLow ? 'text-red-400 animate-pulse' : 'text-amber-300'}`}>
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {formatTime(timeLeft)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <button 
                aria-label="Zoom Out" 
                onClick={() => setZoomLevel(z => Math.max(70, z - 10))}
                className="hover:text-gray-300 text-gray-300 transition-colors cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <span className="font-medium w-10 sm:w-12 text-center text-gray-200 text-xs sm:text-sm">{zoomLevel}%</span>
              <button 
                aria-label="Zoom In" 
                onClick={() => setZoomLevel(z => Math.min(150, z + 10))}
                className="hover:text-gray-300 text-gray-300 transition-colors cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button 
                aria-label="Fullscreen" 
                onClick={toggleFullscreen}
                className="hover:text-gray-300 text-gray-300 ml-1 sm:ml-2 transition-colors cursor-pointer"
                title="Toàn màn hình"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4 sm:h-5 sm:w-5" /> : <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5" />}
              </button>
            </div>
          </footer>
          {/* END: BottomToolbar */}
        </div>

        {submitConfirmModal}
        {previewImageModal}
      </div>
    );
  }

  // ── DEFAULT IMAGE EXAM UI (2-column layout preserved) ─────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f5f5f7' }}>
      {/* ═══ HEADER ═══ */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'white', borderBottom: '1px solid #e5e5ea' }}>
        {examMode === 'exam' && (
          <div style={{ height: 3, background: '#e5e5ea' }}>
            <div style={{ height: '100%', width: `${timePercent}%`, background: isTimeLow ? '#ef4444' : '#6C5CE7', transition: 'width 1s linear, background 0.3s' }} />
          </div>
        )}
        <div className="exam-header-inner" style={{ padding: '0 24px' }}>
          <div className="exam-header-left">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#333', fontSize: 20 }} onClick={() => navigate(-1)}>
              <X size={24} />
            </button>
            <div style={{ borderLeft: '2px solid #eee', paddingLeft: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#000' }} className="truncate-2">{exam.title}</div>
              <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>
                {examMode === 'practice' ? 'CHẾ ĐỘ ÔN TẬP' : 'CHẾ ĐỘ THI THỬ'}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="exam-header-center" style={{ display: !currentQ.image_url ? 'none' : 'flex' }}>
            <button
              className="touch-target"
              disabled={currentIndex === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px',
                background: currentIndex === 0 ? '#f0f0f0' : 'white',
                border: `2px solid ${currentIndex === 0 ? '#eee' : '#333'}`,
                borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                color: currentIndex === 0 ? '#ccc' : '#000',
              }}
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            >
              <ChevronLeft size={18} /> <span className="hide-on-mobile">Câu trước</span>
            </button>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#000', minWidth: 60, textAlign: 'center' }}>
              {currentIndex + 1} / {questions.length}
            </div>
            <button
              className="touch-target"
              disabled={currentIndex === questions.length - 1}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px',
                background: currentIndex === questions.length - 1 ? '#f0f0f0' : '#000',
                border: `2px solid ${currentIndex === questions.length - 1 ? '#eee' : '#000'}`,
                borderRadius: 8, fontSize: 13, fontWeight: 700,
                cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer',
                color: currentIndex === questions.length - 1 ? '#ccc' : 'white',
              }}
              onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
            >
              <span className="hide-on-mobile">Câu sau</span> <ChevronRight size={18} />
            </button>
            
            {/* Flag Button */}
            {examMode === 'exam' && !submitted && (
              <button
                className="touch-target"
                onClick={toggleFlag}
                style={{
                  background: flagged.has(currentIndex) ? '#fbbf24' : 'white',
                  border: `2px solid ${flagged.has(currentIndex) ? '#d97706' : '#e5e7eb'}`,
                  padding: '8px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: flagged.has(currentIndex) ? 'white' : '#9ca3af',
                  transition: 'all 0.2s',
                  marginLeft: 8,
                  boxShadow: flagged.has(currentIndex) ? '0 0 10px rgba(251, 191, 36, 0.4)' : 'none',
                }}
                title={flagged.has(currentIndex) ? 'Bỏ đánh dấu' : 'Đánh dấu câu này'}
              >
                <Flag size={20} fill={flagged.has(currentIndex) ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>

          <div className="exam-header-right">
            {examMode === 'exam' && !submitted && (
              <>
                <div 
                  className={isTimeLow ? 'animate-pulse-danger' : ''}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, color: isTimeLow ? '#ef4444' : '#000', fontWeight: 800, fontSize: 18, fontVariantNumeric: 'tabular-nums' }}
                >
                  <Clock size={20} /> {formatTime(timeLeft)}
                </div>
                {!currentQ.image_url ? null : (
                  <button 
                    className="touch-target"
                    style={{
                    background: '#6C5CE7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8,
                    fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 0 #4a3eb3'
                  }} onClick={() => setShowSubmitConfirm(true)}>
                    NỘP BÀI
                  </button>
                )}
              </>
            )}
            {submitted && (
               <button className="touch-target" style={{
                background: '#6C5CE7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8,
                fontSize: 14, fontWeight: 800, cursor: 'pointer'
              }} onClick={() => navigate(-1)}>
                THOÁT
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══ PROGRESS BAR ═══ */}
      <div style={{ 
        width: '100%', 
        height: 14, 
        background: '#e5e5ea', 
        position: 'relative',
        zIndex: 40,
        overflow: 'hidden',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <div style={{ 
          height: '100%', 
          width: `${(answeredCount / questions.length) * 100}%`, 
          background: 'linear-gradient(90deg, #22c55e 0%, #4ade80 100%)', 
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 0 10px rgba(34, 197, 94, 0.4)'
        }} />
      </div>

      {/* ═══ MAIN CONTENT (2 COLUMNS) ═══ */}
      <div className="exam-main-layout">
        {/* LEFT COLUMN - Question & Answers */}
        <div className="exam-main-content">
          {/* Main Question Area */}
          <div className="exam-q-split">
            {/* Text Side */}
            {(!!currentQ.content?.trim() || currentQ.options.some(opt => !!opt.content?.trim())) && (
              <div className="exam-q-text" style={{ 
                borderRight: currentQ.image_url ? '2px solid #dc2626' : 'none'
              }}>
                {!!currentQ.content?.trim() && (
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 500, 
                    color: '#000', 
                    lineHeight: '1.6', 
                    marginBottom: '16px'
                  }}>
                    <RichContent content={currentQ.content} />
                  </div>
                )}
                
                {/* Detailed Options */}
                {currentQ.options.some(opt => !!opt.content?.trim()) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentQ.options.map((opt) => opt.content?.trim() ? (
                      <div key={opt.label} style={{ fontSize: 14, fontWeight: 500, color: '#000' }}>
                        <span style={{ fontWeight: 800 }}>{opt.label}.</span> <RichContent content={opt.content} />
                        {(opt as any).image_url && (
                          <img src={(opt as any).image_url} alt={`opt ${opt.label}`} style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 6, marginTop: 4, display: 'block' }} />
                        )}
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>
            )}

            {/* Image Side with In-Place Zoom & Drag-to-Pan Controls */}
            {(currentQ.image_url || (((currentQ as any).extra_images as string[] | undefined)?.length ?? 0) > 0) && (
              <div 
                ref={imageContainerRef}
                className="exam-q-image"
                onMouseDown={handleImageMouseDown}
                onMouseMove={handleImageMouseMove}
                onMouseUp={handleImageMouseUp}
                onMouseLeave={handleImageMouseUp}
                style={{
                  position: 'relative',
                  overflow: 'auto',
                  maxHeight: '62vh',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: imageZoom > 100 ? 'flex-start' : 'center',
                  justifyContent: imageZoom > 100 ? 'flex-start' : 'center',
                  padding: '16px',
                  background: '#ffffff',
                  cursor: imageZoom > 100 ? (isDraggingImage ? 'grabbing' : 'grab') : 'default',
                  userSelect: 'none'
                }}
              >
                {/* Floating In-Place Zoom Bar */}
                <div 
                  style={{ 
                    position: 'sticky', 
                    top: 0, 
                    right: 0,
                    zIndex: 20, 
                    alignSelf: 'flex-end', 
                    marginBottom: 8,
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 4, 
                    background: 'rgba(255, 255, 255, 0.95)', 
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #cbd5e1', 
                    borderRadius: 20, 
                    padding: '3px 8px', 
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)' 
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {imageZoom > 100 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: 12, marginRight: 4 }}>
                      Kéo rê để xem góc
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => setImageZoom(z => Math.max(80, z - 20))}
                    disabled={imageZoom <= 80}
                    style={{
                      background: 'none', border: 'none', cursor: imageZoom <= 80 ? 'not-allowed' : 'pointer',
                      padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: imageZoom <= 80 ? '#cbd5e1' : '#475569'
                    }}
                    title="Thu nhỏ (-20%)"
                  >
                    <ZoomOut size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageZoom(100)}
                    style={{
                      background: imageZoom !== 100 ? '#eff6ff' : 'none',
                      border: 'none', cursor: 'pointer',
                      padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 800,
                      color: imageZoom !== 100 ? '#2563eb' : '#334155'
                    }}
                    title="Đặt lại 100%"
                  >
                    {imageZoom}%
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageZoom(z => Math.min(300, z + 20))}
                    disabled={imageZoom >= 300}
                    style={{
                      background: 'none', border: 'none', cursor: imageZoom >= 300 ? 'not-allowed' : 'pointer',
                      padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: imageZoom >= 300 ? '#cbd5e1' : '#475569'
                    }}
                    title="Phóng to (+20%)"
                  >
                    <ZoomIn size={16} />
                  </button>

                  {imageZoom !== 100 && (
                    <button
                      type="button"
                      onClick={() => setImageZoom(100)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#64748b', borderLeft: '1px solid #e2e8f0', marginLeft: 2
                      }}
                      title="Khôi phục 100%"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>

                {/* Main Image */}
                {currentQ.image_url && (
                  <img
                    src={currentQ.image_url}
                    alt={`câu ${currentIndex + 1}`}
                    loading="eager"
                    decoding="sync"
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    style={{ 
                      width: imageZoom > 100 ? `${imageZoom}%` : 'auto',
                      maxWidth: imageZoom > 100 ? 'none' : '100%', 
                      maxHeight: imageZoom > 100 ? 'none' : '58vh', 
                      objectFit: 'contain', 
                      cursor: imageZoom > 100 ? (isDraggingImage ? 'grabbing' : 'grab') : 'zoom-in',
                      borderRadius: 6,
                      alignSelf: imageZoom > 100 ? 'flex-start' : 'center',
                      transition: isDraggingImage ? 'none' : 'width 0.15s ease-out',
                      boxShadow: imageZoom > 100 ? '0 4px 16px rgba(0,0,0,0.06)' : 'none'
                    }}
                    onClick={(e) => {
                      if (didDragRef.current) {
                        e.stopPropagation();
                        return;
                      }
                      setImageZoom(prev => (prev === 100 ? 140 : prev === 140 ? 180 : 100));
                    }}
                    title={imageZoom > 100 ? "Kéo rê để di chuyển ảnh" : "Click để phóng to trực tiếp"}
                  />
                )}
                {/* Extra images below main */}
                {((currentQ as any).extra_images as string[] | undefined)?.map((url: string, xi: number) => (
                  <img 
                    key={xi} 
                    src={url} 
                    alt={`ảnh ${xi + 1}`} 
                    draggable={false}
                    onDragStart={(e) => e.preventDefault()}
                    style={{ 
                      width: imageZoom > 100 ? `${imageZoom}%` : 'auto',
                      maxWidth: imageZoom > 100 ? 'none' : '100%', 
                      maxHeight: imageZoom > 100 ? 'none' : '30vh', 
                      objectFit: 'contain', 
                      marginTop: 12, 
                      borderRadius: 6, 
                      alignSelf: imageZoom > 100 ? 'flex-start' : 'center',
                      cursor: imageZoom > 100 ? (isDraggingImage ? 'grabbing' : 'grab') : 'zoom-in',
                      transition: isDraggingImage ? 'none' : 'width 0.15s ease-out'
                    }} 
                    onClick={(e) => {
                      if (didDragRef.current) {
                        e.stopPropagation();
                        return;
                      }
                      setImageZoom(prev => (prev === 100 ? 140 : prev === 140 ? 180 : 100));
                    }} 
                    title={imageZoom > 100 ? "Kéo rê để di chuyển ảnh" : "Click để phóng to trực tiếp"}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Answer Options - Grid */}
          <div className="exam-options-grid">
            {currentQ.options.map(opt => {
              const cls = getOptionCls(opt.label);
              const isSelected = cls === 'selected';
              const isCorrect = cls === 'correct';
              const isIncorrect = cls === 'incorrect';

              let bgColor = 'white';
              let borderColor = '#ccc';
              let labelBg = '#e0e0e0';
              let labelColor = '#333';

              if (isSelected) {
                bgColor = '#ede9fe';
                borderColor = '#6C5CE7';
                labelBg = '#6C5CE7';
                labelColor = 'white';
              } else if (isCorrect) {
                bgColor = '#dcfce7';
                borderColor = '#22c55e';
                labelBg = '#22c55e';
                labelColor = 'white';
              } else if (isIncorrect) {
                bgColor = '#fee2e2';
                borderColor = '#ef4444';
                labelBg = '#ef4444';
                labelColor = 'white';
              }

              return (
                <div
                  key={opt.label}
                  id={`answer-${opt.label}`}
                  onClick={() => { if (examMode === 'exam' && !submitted) toggleAnswer(opt.label); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    background: bgColor,
                    border: `2px solid ${borderColor}`,
                    borderRadius: 8,
                    cursor: examMode === 'exam' && !submitted ? 'pointer' : 'default',
                    transition: 'all 0.1s ease',
                    boxShadow: isSelected ? '0 0 0 2px rgba(108, 92, 231, 0.3)' : 'none',
                    minHeight: 42,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 13,
                      background: labelBg,
                      color: labelColor,
                      flexShrink: 0,
                    }}
                  >
                    {opt.label}
                  </div>
                  <div style={{ flex: 1 }} />
                  {(isCorrect || (examMode === 'practice' && isCorrect)) && (
                    <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
                  )}
                  {isIncorrect && (
                    <XCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN - Fixed Width Sidebar */}
        <div className="exam-sidebar">
          {/* Panel Header */}
          <div style={{ padding: '16px 12px', borderBottom: '1px solid #e5e5ea' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Danh sách
            </div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
              <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{answeredCount}</span>/{questions.length}
            </div>
          </div>

          {/* Questions Grid */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
              {questions.map((q, i) => {
                const isAnswered = (answers[q.id] ?? []).length > 0;
                const isFlagged = flagged.has(i);
                const isCurrent = i === currentIndex;

                let bgColor = '#f5f5f7';
                let textColor = '#999';

                if (isCurrent) {
                  bgColor = '#000';
                  textColor = 'white';
                } else if (isFlagged) {
                  bgColor = '#fef3c7';
                  textColor = '#d97706';
                } else if (isAnswered) {
                  bgColor = '#dcfce7';
                  textColor = '#16a34a';
                }

                return (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      borderRadius: 6,
                      border: isCurrent ? '2px solid #000' : '1px solid #ddd',
                      background: bgColor,
                      color: textColor,
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: isCurrent ? '0 4px 8px rgba(0,0,0,0.2)' : 'none',
                    }}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div style={{ margin: 12, padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chú thích</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: '#dcfce7', border: '1px solid #16a34a' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#16a34a' }}>ĐÃ TRẢ LỜI</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: '#fef3c7', border: '1px solid #d97706' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>ĐANG ĐÁNH DẤU</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: '#f1f5f9', border: '1px solid #cbd5e1' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>CHƯA LÀM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {submitConfirmModal}
      {previewImageModal}
      {reportModal}
    </div>
  );
}

