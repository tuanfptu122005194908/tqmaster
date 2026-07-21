import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/AppContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { X, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, Flag, RotateCcw, Loader2, BarChart3, AlertTriangle } from 'lucide-react';

type Exam    = Tables<'exams'>;
type Question = Tables<'questions'> & { options: Array<Tables<'question_options'>> };

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ExamPage() {
  const { selectedExamId, examMode, setCurrentView, setExamMode, profile } = useApp();

  const [exam,      setExam]      = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading,   setLoading]   = useState(true);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers,  setAnswers]  = useState<Record<string, string[]>>({});
  const [flagged,  setFlagged]  = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft,  setTimeLeft]  = useState(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
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

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'hsl(var(--background))' }}>
      <Loader2 size={32} className="spinner" />
    </div>
  );

  if (!exam || questions.length === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 'var(--space-4)' }}>
      <p style={{ color: 'hsl(var(--muted-fg))' }}>Đề thi chưa có câu hỏi nào.</p>
      <button className="btn-primary" onClick={() => { setCurrentView('subject-detail'); setExamMode(null); }}>Quay lại</button>
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
    clearInterval(timerRef.current);
    setSubmitted(true);
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
    setExamMode('practice');
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
            onClick={() => { setCurrentView('subject-detail'); setExamMode(null); }}
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
                    onClick={() => { setCurrentView('subject-detail'); setExamMode(null); }}
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
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, color: '#333', fontSize: 20 }} onClick={() => { setCurrentView('subject-detail'); setExamMode(null); }}>
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
          <div className="exam-header-center">
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
                <button 
                  className="touch-target"
                  style={{
                  background: '#6C5CE7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8,
                  fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 0 #4a3eb3'
                }} onClick={handleSubmit}>
                  NỘP BÀI
                </button>
              </>
            )}
            {submitted && (
               <button className="touch-target" style={{
                background: '#6C5CE7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8,
                fontSize: 14, fontWeight: 800, cursor: 'pointer'
              }} onClick={() => { setCurrentView('subject-detail'); setExamMode(null); }}>
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
              boxShadow: '0 0 40px rgba(0,0,0,0.5)',
              transform: 'scale(1)',
              transition: 'transform 0.3s ease'
            }} 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
