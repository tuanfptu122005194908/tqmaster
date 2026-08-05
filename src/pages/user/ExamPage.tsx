import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { X, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Flag, RotateCcw, Loader2, BarChart3, AlertTriangle, MousePointerClick, ZoomIn } from 'lucide-react';
import { playSound } from '@/lib/sound';

type Exam    = Tables<'exams'>;
type Question = Tables<'questions'> & { options: Array<Tables<'question_options'>> };

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

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

  // Load exam + questions + options
  useEffect(() => {
    if (!selectedExamId) return;
    const load = async () => {
      const [examRes, questionsRes] = await Promise.all([
        supabase.from('exams').select('*').eq('id', selectedExamId).single(),
        supabase.from('questions')
          .select('*, question_options(*)')
          .eq('exam_id', selectedExamId)
          .order('order_num'),
      ]);
      const e = examRes.data;
      setExam(e ?? null);
      const qs: Question[] = (questionsRes.data ?? []).map((q: any) => ({
        ...q,
        options: q.question_options ?? [],
      }));
      // Sort options by label
      qs.forEach(q => { q.options.sort((a, b) => a.label.localeCompare(b.label)); });
      setQuestions(qs);
      
      let initialTimeLeft = e ? e.duration_min * 60 : 0;
      const draftStr = localStorage.getItem(`exam_draft_${selectedExamId}_${examMode}`);
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          if (draft.answers) setAnswers(draft.answers);
          if (draft.flagged) setFlagged(new Set(draft.flagged));
          if (draft.timeLeft !== undefined) initialTimeLeft = draft.timeLeft;
        } catch (err) {}
      }

      if (e) setTimeLeft(initialTimeLeft);
      setLoading(false);
    };
    load();
  }, [selectedExamId]);

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

  // Keyboard shortcuts
  useEffect(() => {
    if (loading || !exam || questions.length === 0) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in some input (though there are no inputs here)
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

        {/* ═══ IMAGE PREVIEW MODAL (for Results) ═══ */}
        {previewImage && (
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
              style={{ position: 'absolute', top: 20, right: 20, background: 'white', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
            >
              <X size={24} />
            </button>
            <img 
              src={previewImage} 
              alt="Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain', 
                borderRadius: 8,
                boxShadow: '0 0 40px rgba(0,0,0,0.5)'
              }} 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
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

  // ── Main exam UI (Modern 2-column layout) ──────────────────────
  
  if (examMode === 'flashcard') {
    const q = questions[currentIndex];
    const correctOpts = q.options.filter(o => o.is_correct);
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', background: 'white', borderBottom: '1px solid #e2e8f0' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14, color: '#0f172a' }}
          >
            <ChevronLeft size={20} /> Quay lại
          </button>
          <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: '0.05em', color: '#64748b' }}>
            STUDY <span style={{ margin: '0 8px' }}>|</span> EXAMS
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', position: 'relative' }}>
          {/* Title & Progress */}
          <div style={{ width: '100%', maxWidth: 1400, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, borderBottom: '2px solid #e2e8f0', paddingBottom: 12 }}>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', margin: 0 }}>{exam.title}</h2>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>
              {currentIndex + 1} / {questions.length} CÂU
            </div>
          </div>

          {/* Flashcard Area */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '0 24px', gap: 40 }}>
            {/* Left Nav */}
            <button 
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              style={{
                width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: currentIndex === 0 ? '#f8fafc' : 'white', 
                color: currentIndex === 0 ? '#cbd5e1' : '#0f172a',
                border: '1px solid #e2e8f0', cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                boxShadow: currentIndex === 0 ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.2s', flexShrink: 0
              }}
            >
              <ChevronLeft size={28} />
            </button>

            {/* Flashcard */}
            <div 
              onClick={() => { setIsFlipped(!isFlipped); playSound.flip(); }}
              style={{ 
                width: '100%', maxWidth: 1400, minHeight: 400, 
                background: 'white', borderRadius: 24, 
                boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                display: 'flex', flexDirection: 'column',
                padding: '24px', cursor: 'pointer',
                border: '1px solid #f1f5f9',
                transition: 'transform 0.3s ease',
              }}
            >
              {!isFlipped ? (
                // Front: Question
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 24, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', letterSpacing: '0.1em' }}>CÂU HỎI</div>
                  {q.image_url && (
                     <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                       <img 
                         src={q.image_url} 
                         alt="Question" 
                         onClick={(e) => { e.stopPropagation(); setPreviewImage(q.image_url); }}
                         style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8, cursor: 'zoom-in' }} 
                       />
                       <div 
                         style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(15, 23, 42, 0.6)', color: 'white', padding: 8, borderRadius: 8, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}
                       >
                         <ZoomIn size={16} /> Phóng to
                       </div>
                     </div>
                  )}
                  {q.content?.trim() && (
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1.4 }}>
                      {q.content}
                    </div>
                  )}
                  {q.options.some(o => o.content?.trim()) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 24 }}>
                      {q.options.map(opt => (
                        <div key={opt.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px', color: '#334155', fontWeight: 600, fontSize: 16, textAlign: 'left' }}>
                          <span style={{ fontWeight: 800, marginRight: 8, color: '#0f172a' }}>{opt.label}.</span>
                          {opt.content}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#94a3b8', opacity: 0.8, paddingTop: 40 }}>
                    <MousePointerClick size={24} style={{ opacity: 0.5 }} />
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>CLICK VÀO THẺ ĐỂ LẬT MẶT SAU</span>
                  </div>
                </div>
              ) : (
                // Back: Answer
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', gap: 24, flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#22c55e', letterSpacing: '0.1em' }}>ĐÁP ÁN ĐÚNG</div>
                  {q.image_url && (
                     <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                       <img 
                         src={q.image_url} 
                         alt="Question" 
                         onClick={(e) => { e.stopPropagation(); setPreviewImage(q.image_url); }}
                         style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 8, cursor: 'zoom-in' }} 
                       />
                       <div 
                         style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(15, 23, 42, 0.6)', color: 'white', padding: 8, borderRadius: 8, pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}
                       >
                         <ZoomIn size={16} /> Phóng to
                       </div>
                     </div>
                  )}
                  {q.content?.trim() && (
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1.4 }}>
                      {q.content}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 24 }}>
                    {correctOpts.map(opt => (
                      <div key={opt.label} style={{ background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: 12, padding: '16px', color: '#15803d', fontWeight: 700, fontSize: 16 }}>
                        {opt.label}. {opt.content}
                      </div>
                    ))}
                    {correctOpts.length === 0 && (
                       <div style={{ color: '#ef4444', fontWeight: 600 }}>Chưa có đáp án đúng được thiết lập.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Nav */}
            <button 
              onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
              disabled={currentIndex === questions.length - 1}
              style={{
                width: 56, height: 56, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: currentIndex === questions.length - 1 ? '#f8fafc' : 'white', 
                color: currentIndex === questions.length - 1 ? '#cbd5e1' : '#0f172a',
                border: '1px solid #e2e8f0', cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer',
                boxShadow: currentIndex === questions.length - 1 ? 'none' : '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.2s', flexShrink: 0
              }}
            >
              <ChevronRight size={28} />
            </button>
          </div>

          {/* Tips */}
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>
              💡 Mẹo: Bấm phím <kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: 4, margin: '0 4px', fontFamily: 'inherit' }}>Space</kbd> hoặc click vào thẻ để lật, dùng phím mũi tên <kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: 4, margin: '0 4px', fontFamily: 'inherit' }}>←</kbd> <kbd style={{ padding: '2px 6px', background: '#e2e8f0', borderRadius: 4, margin: '0 4px', fontFamily: 'inherit' }}>→</kbd> để chuyển câu.
            </div>
          </div>
        </div>

        {/* ═══ IMAGE PREVIEW MODAL ═══ */}
        {previewImage && (
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
                boxShadow: '0 0 40px rgba(0,0,0,0.5)'
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
        )}
      </div>
    );
  }

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

          {/* Navigation Buttons Moved to Top */}
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
            
            {/* Flag Button Moved Here */}
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

      {/* ═══ PROGRESS BAR (THANH MÁU) ═══ */}
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
        {/* LEFT COLUMN - Question & Answers (Scrollable) */}
        <div className="exam-main-content">
          {!currentQ.image_url ? (
            <div style={{ padding: '32px 40px', maxWidth: 900, margin: '0 auto', width: '100%' }}>
               {/* Badges */}
               <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                 <span style={{ background: '#0f172a', color: 'white', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                   CÂU HỎI {currentIndex + 1} / {questions.length}
                 </span>
                 <span style={{ background: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: '1px solid #e2e8f0' }}>
                   MỨC ĐỘ: {(currentQ as any).difficulty || 'Trung bình'}
                 </span>
               </div>
               
               {/* Question text */}
               {!!currentQ.content?.trim() && (
                 <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a', lineHeight: 1.6, marginBottom: 40, fontFamily: '"Merriweather", "Lora", serif' }}>
                   {currentQ.content}
                 </div>
               )}

               {/* Options list */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                 {currentQ.options.map(opt => {
                   const cls = getOptionCls(opt.label);
                   const isSelected = cls === 'selected' || cls === 'correct' || cls === 'incorrect';
                   const isCorrect = cls === 'correct';
                   const isIncorrect = cls === 'incorrect';

                   let bgColor = 'white';
                   let borderColor = '#e2e8f0';
                   let circleBorder = '#cbd5e1';
                   let circleBg = 'white';
                   let textColor = '#475569';

                   if (isSelected) {
                     borderColor = '#0f172a';
                     circleBorder = '#0f172a';
                     circleBg = '#0f172a';
                     textColor = '#0f172a';
                   }

                   if (isCorrect) {
                     borderColor = '#22c55e';
                     circleBorder = '#22c55e';
                     circleBg = '#22c55e';
                   } else if (isIncorrect) {
                     borderColor = '#ef4444';
                     circleBorder = '#ef4444';
                     circleBg = '#ef4444';
                   }

                   return (
                     <div 
                       key={opt.label}
                       onClick={() => { if (examMode === 'exam' && !submitted) toggleAnswer(opt.label); }}
                       style={{
                         display: 'flex', alignItems: 'center', gap: 16,
                         padding: '16px 20px',
                         background: bgColor,
                         border: `1px solid ${borderColor}`,
                         borderRadius: 8,
                         cursor: examMode === 'exam' && !submitted ? 'pointer' : 'default',
                         transition: 'all 0.2s ease',
                         boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.05)' : 'none'
                       }}
                     >
                       <div style={{
                         width: 20, height: 20, borderRadius: '50%',
                         border: `2px solid ${circleBorder}`,
                         background: circleBg,
                         display: 'flex', alignItems: 'center', justifyContent: 'center',
                         flexShrink: 0
                       }}>
                         {circleBg !== 'white' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />}
                       </div>
                       
                       <div style={{ fontSize: 16, fontWeight: 500, color: textColor, lineHeight: 1.5 }}>
                         {opt.content}
                       </div>

                       {(isCorrect || (examMode === 'practice' && isCorrect)) && (
                         <CheckCircle size={20} style={{ color: '#22c55e', marginLeft: 'auto' }} />
                       )}
                       {isIncorrect && (
                         <XCircle size={20} style={{ color: '#ef4444', marginLeft: 'auto' }} />
                       )}
                     </div>
                   );
                 })}
               </div>
               
               {/* Bottom Navigation Buttons */}
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
                 <button 
                   disabled={currentIndex === 0}
                   onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                   style={{
                     display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                     background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
                     fontSize: 14, fontWeight: 700, color: currentIndex === 0 ? '#cbd5e1' : '#0f172a',
                     cursor: currentIndex === 0 ? 'not-allowed' : 'pointer'
                   }}
                 >
                   <ChevronLeft size={18} /> QUAY LẠI
                 </button>

                 <div style={{ display: 'flex', gap: 16 }}>
                   <button 
                     disabled={currentIndex === questions.length - 1}
                     onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
                     style={{
                       display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                       background: currentIndex === questions.length - 1 ? '#f1f5f9' : '#0f172a', 
                       border: 'none', borderRadius: 8,
                       fontSize: 14, fontWeight: 700, color: currentIndex === questions.length - 1 ? '#cbd5e1' : 'white',
                       cursor: currentIndex === questions.length - 1 ? 'not-allowed' : 'pointer'
                     }}
                   >
                     CÂU TIẾP THEO <ChevronRight size={18} />
                   </button>
                   
                   {examMode === 'exam' && !submitted && (
                     <button 
                       onClick={() => setShowSubmitConfirm(true)}
                       style={{
                         padding: '10px 24px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8,
                         fontSize: 14, fontWeight: 800, cursor: 'pointer'
                       }}
                     >
                       NỘP BÀI
                     </button>
                   )}
                 </div>
               </div>
            </div>
          ) : (
            <>
              {/* Main Question Split View */}
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
                    whiteSpace: 'pre-wrap',
                    marginBottom: '16px'
                  }}>
                    {currentQ.content}
                  </div>
                )}
                
                {/* Detailed Options Rendered Here */}
                {currentQ.options.some(opt => !!opt.content?.trim()) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {currentQ.options.map((opt) => opt.content?.trim() ? (
                      <div key={opt.label} style={{ fontSize: 14, fontWeight: 500, color: '#000' }}>
                        {opt.label}. {opt.content}
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>
            )}

            {/* Image Side */}
            {currentQ.image_url && (
              <div 
                className="exam-q-image"
                onClick={() => setPreviewImage(currentQ.image_url)}
              >
                <img
                  src={currentQ.image_url}
                  alt={`câu ${currentIndex + 1}`}
                  loading="eager"
                  decoding="sync"
                  fetchPriority="high"
                  style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
                />
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
              let borderColor = '#ccc'; // Darker border for better definition
              let textColor = '#000'; // Darker text
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
          </>
          )}

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

          {/* Legend (Highlighted) */}
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

      {/* REMOVED STICKY BOTTOM NAVIGATION */}
      
      {/* ═══ CONFIRM SUBMIT MODAL ═══ */}
      {showSubmitConfirm && (
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
      )}

      {/* ═══ IMAGE PREVIEW MODAL ═══ */}
      {previewImage && (
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
      )}
    </div>
  );
}
