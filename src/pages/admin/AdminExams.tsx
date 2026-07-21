import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useApp } from '@/lib/AppContext';
import { Plus, Trash2, ChevronRight, X, Check, Loader2, HelpCircle, ImagePlus, Pencil, Search, AlertTriangle } from 'lucide-react';

type Exam    = Tables<'exams'>;
type Subject = Pick<Tables<'subjects'>, 'id' | 'name' | 'semester'>;
type ExamWithSubjects = Exam & { exam_subjects: { subject_id: string, subjects: Subject }[] };
type Question = Tables<'questions'> & { options: Array<Tables<'question_options'>> };

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)',
  fontSize: '0.875rem', outline: 'none', background: 'hsl(var(--surface-raised))',
};

// ── Parse question text format ─────────────────────────────
// Supports:
//   Câu 1: <question text>
//   A. <option>
//   B. <option>
//   ...
// Answer line: "Đáp án: 1A 2BC 3C ..."
function parseQuestions(text: string): Array<{
  content: string;
  chapter_name: string;
  options: Array<{ label: string; content: string }>;
  correctAnswers: string[];
}> {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const questions: ReturnType<typeof parseQuestions> = [];
  let cur: (typeof questions)[0] | null = null;
  let currentChapter = 'Tổng hợp';

  const answerLine = lines.find(l => /^(đáp án|answer)[:\s]/i.test(l));
  const answerMap: Record<number, string[]> = {};
  if (answerLine) {
    const tokens = answerLine.replace(/^(đáp án|answer)[:\s]*/i, '').trim().split(/\s+/);
    tokens.forEach(tok => {
      const m = tok.match(/^(\d+)([A-Za-z]+)$/);
      if (m) answerMap[parseInt(m[1])] = m[2].toUpperCase().split('');
    });
  }

  let qNum = 0;
  for (const line of lines) {
    if (/^(đáp án|answer)[:\s]/i.test(line)) continue;

    // Detect chapter header like "Chương 1: Ma trận" or "[Chương 1: Ma trận]"
    const chapMatch = line.match(/^(?:#+|\[)?\s*(chương\s+\d+[^\]\n]*)/i);
    if (chapMatch && !line.match(/^(?:câu\s+)?\d+[.:)]/i)) {
      currentChapter = chapMatch[1].replace(/\]$/, '').trim();
      continue;
    }

    const qMatch = line.match(/^(?:câu\s+)?(\d+)[.:)]\s*(.*)/i);
    if (qMatch) {
      if (cur) questions.push(cur);
      qNum++;
      cur = { content: qMatch[2] || '', chapter_name: currentChapter, options: [], correctAnswers: answerMap[qNum] ?? [] };
      continue;
    }
    const optMatch = line.match(/^([A-Za-z])(?:[.)]+\s+(.*)|\s*$)/);
    if (optMatch && cur) {
      cur.options.push({ label: optMatch[1].toUpperCase(), content: optMatch[2] || '' });
      continue;
    }
    if (cur && !cur.content) cur.content += '\n' + line;
    else if (cur && cur.content) cur.content += '\n' + line;
  }
  if (cur) questions.push(cur);
  return questions;
}

export default function AdminExams() {
  const { profile } = useApp();
  const [exams,    setExams]    = useState<ExamWithSubjects[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selExam,  setSelExam]  = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Create exam form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', duration_min: 60, subject_ids: [] as string[], is_active: true });

  // Import panel
  const [importText,  setImportText]  = useState('');
  const [importCount, setImportCount] = useState(0);
  const [importing,   setImporting]   = useState(false);

  // Bulk answers
  const [answerText, setAnswerText] = useState('');
  const [applyingAns, setApplyingAns] = useState(false);

  // Image upload (1 image = 1 question)
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });

  const uploadQuestionImages = async (files: FileList | null) => {
    if (!selExam || !files || files.length === 0) return;
    setUploadingImg(true);
    setUploadProgress({ done: 0, total: files.length });
    let startNum = questions.length + 1;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const ext = f.name.split('.').pop() || 'png';
      const path = `${selExam.id}/${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage.from('question-images').upload(path, f, { contentType: f.type });
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('question-images').getPublicUrl(path);
        const { data: newQ } = await supabase.from('questions').insert({
          exam_id: selExam.id, order_num: startNum++,
          type: 'image', image_url: publicUrl,
        }).select().single();
        if (newQ) {
          const opts = ['A','B','C','D','E','F','G','H'].map(label => ({
            question_id: newQ.id, label, content: '', is_correct: false
          }));
          await supabase.from('question_options').insert(opts);
        }
      }
      setUploadProgress(p => ({ ...p, done: p.done + 1 }));
    }
    await fetchQuestions(selExam.id);
    setUploadingImg(false);
    setUploadProgress({ done: 0, total: 0 });
    if (imgInputRef.current) imgInputRef.current.value = '';
  };


  const fetchExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*, exam_subjects(subject_id, subjects(id, name, semester))')
      .order('created_at', { ascending: false });
    setExams((data as any) ?? []);
    setLoading(false);
  };
  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, name, semester');
    setSubjects(data ?? []);
  };
  const fetchQuestions = async (examId: string) => {
    const { data } = await supabase.from('questions')
      .select('*, question_options(*)')
      .eq('exam_id', examId)
      .order('order_num');
    const qs: Question[] = (data ?? []).map((q: any) => ({ ...q, options: q.question_options ?? [] }));
    qs.forEach(q => q.options.sort((a, b) => a.label.localeCompare(b.label)));
    setQuestions(qs);
  };

  useEffect(() => { fetchExams(); fetchSubjects(); }, []);

  const selectExam = (exam: Exam) => {
    setSelExam(exam);
    fetchQuestions(exam.id);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', description: '', duration_min: 60, subject_ids: [], is_active: true });
    setShowForm(true);
  };

  const openEdit = async (exam: ExamWithSubjects) => {
    setEditingId(exam.id);
    setForm({
      title: exam.title,
      description: exam.description || '',
      duration_min: exam.duration_min,
      is_active: exam.is_active,
      subject_ids: exam.exam_subjects.map(es => es.subject_id),
    });
    setShowForm(true);
  };

  const saveExam = async () => {
    if (!form.title.trim()) return;
    setSaving(true);

    if (editingId) {
      // Update
      const { error } = await supabase.from('exams').update({
        title: form.title,
        description: form.description || null,
        duration_min: form.duration_min,
        is_active: form.is_active,
      }).eq('id', editingId);

      if (!error) {
        // Update subjects - delete old and insert new
        await supabase.from('exam_subjects').delete().eq('exam_id', editingId);
        if (form.subject_ids.length > 0) {
          await supabase.from('exam_subjects').insert(
            form.subject_ids.map(id => ({ exam_id: editingId, subject_id: id }))
          );
        }
      }
    } else {
      // Create
      const { data: newExam } = await supabase.from('exams').insert({
        title: form.title, description: form.description || null,
        duration_min: form.duration_min, is_active: form.is_active,
        created_by: profile?.id,
      }).select().single();
      
      if (newExam && form.subject_ids.length > 0) {
        await supabase.from('exam_subjects').insert(
          form.subject_ids.map(id => ({ exam_id: newExam.id, subject_id: id }))
        );
      }
      if (newExam) selectExam(newExam);
    }

    await fetchExams();
    setSaving(false);
    setShowForm(false);
    setForm({ title: '', description: '', duration_min: 60, subject_ids: [], is_active: true });
    setEditingId(null);
  };

  const deleteExam = async (id: string) => {
    if (!confirm('Xóa đề thi này? Tất cả câu hỏi sẽ bị xóa.')) return;
    await supabase.from('exams').delete().eq('id', id);
    if (selExam?.id === id) { setSelExam(null); setQuestions([]); }
    fetchExams();
  };

  const deleteQuestion = async (id: string) => {
    await supabase.from('questions').delete().eq('id', id);
    if (selExam) fetchQuestions(selExam.id);
  };

  const importQuestions = async () => {
    if (!selExam || !importText.trim()) return;
    setImporting(true);
    const parsed = parseQuestions(importText);
    let startNum = questions.length + 1;

    for (const p of parsed) {
      const { data: q } = await supabase.from('questions').insert({
        exam_id: selExam.id, order_num: startNum++,
        content: p.content || null, type: 'text',
        chapter_name: p.chapter_name || 'Tổng hợp',
      }).select().single();
      if (q && p.options.length > 0) {
        await supabase.from('question_options').insert(
          p.options.map(o => ({
            question_id: q.id, label: o.label, content: o.content,
            is_correct: p.correctAnswers.includes(o.label),
          }))
        );
      }
    }
    setImportCount(parsed.length);
    setImportText('');
    await fetchQuestions(selExam.id);
    setImporting(false);
    setTimeout(() => setImportCount(0), 3000);
  };

  const applyAnswers = async () => {
    if (!selExam || !answerText.trim()) return;
    setApplyingAns(true);
    const regex = /(\d+)[:.\s]*([A-Za-z]+)/g;
    const ansMap: Record<number, string[]> = {};
    let m;
    while ((m = regex.exec(answerText)) !== null) {
      ansMap[parseInt(m[1])] = m[2].toUpperCase().split('');
    }
    for (const [qNumStr, correctLabels] of Object.entries(ansMap)) {
      const qNum = parseInt(qNumStr);
      const q = questions.find(q => q.order_num === qNum);
      if (q) {
        for (const opt of q.options) {
          const isCorrect = correctLabels.includes(opt.label);
          if (opt.is_correct !== isCorrect) {
            await supabase.from('question_options').update({ is_correct: isCorrect }).eq('id', opt.id);
          }
        }
      }
    }
    await fetchQuestions(selExam.id);
    setAnswerText('');
    setApplyingAns(false);
    alert('Đã cập nhật đáp án thành công!');
  };

  const deleteAllQuestions = async () => {
    if (!selExam) return;
    if (!confirm('Xóa TẤT CẢ câu hỏi của đề thi này?')) return;
    await supabase.from('questions').delete().eq('exam_id', selExam.id);
    fetchQuestions(selExam.id);
  };

  const clearAllAnswers = async () => {
    if (!selExam) return;
    if (!confirm('Xóa TẤT CẢ đáp án? Các câu hỏi sẽ vẫn được giữ lại.')) return;
    const qIds = questions.map(q => q.id);
    if (qIds.length === 0) return;
    await supabase.from('question_options').update({ is_correct: false }).in('question_id', qIds);
    fetchQuestions(selExam.id);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))' }} /></div>;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      {/* Left — exam list */}
      <div style={{ width: 280, borderRight: '1px solid hsl(var(--border))', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>Đề thi ({exams.length})</h2>
          <button id="create-exam-btn" className="btn-primary" style={{ fontSize: '0.75rem', padding: '5px 10px' }} onClick={openCreate}><Plus size={13} /> Tạo</button>
        </div>
        <div style={{ padding: 'var(--space-3) var(--space-5)', borderBottom: '1px solid hsl(var(--border))', position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 'calc(var(--space-5) + 8px)', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-fg))', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Tìm kiếm đề thi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 32, fontSize: '0.8125rem' }}
          />
        </div>
        {(() => {
          const q = searchQuery.trim().toLowerCase();
          const filteredExams = q ? exams.filter(e => e.title.toLowerCase() === q) : exams;
          return (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {filteredExams.length === 0 && <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'hsl(var(--muted-fg))', fontSize: '0.875rem' }}>{q ? 'Không tìm thấy đề thi' : 'Chưa có đề thi'}</div>}
          
          {/* Grouped Exam List */}
          {[1,2,3,4,5,6,7,8].map(sem => {
            const subjectsInSem = subjects.filter(s => s.semester === sem);
            if (subjectsInSem.length === 0) return null;
            
            // Check if there are any exams in this semester
            const examsInSem = filteredExams.filter(e => e.exam_subjects.some(es => es.subjects?.semester === sem));
            if (examsInSem.length === 0) return null;

            return (
              <div key={sem}>
                <div style={{ padding: '8px 20px', background: 'hsl(var(--muted))', fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--muted-fg))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Kỳ {sem}
                </div>
                {subjectsInSem.map(subj => {
                  const examsInSubj = filteredExams.filter(e => e.exam_subjects.some(es => es.subject_id === subj.id));
                  if (examsInSubj.length === 0) return null;

                  return (
                    <div key={subj.id}>
                      <div style={{ padding: '6px 20px', fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(var(--primary))', background: 'hsl(var(--primary-muted) / 0.3)' }}>
                        {subj.name}
                      </div>
                      {examsInSubj.map(exam => (
                        <div
                          key={exam.id}
                          onClick={() => selectExam(exam)}
                          style={{
                            padding: 'var(--space-3) var(--space-5) var(--space-3) var(--space-8)', cursor: 'pointer',
                            borderBottom: '1px solid hsl(var(--border))',
                            background: selExam?.id === exam.id ? 'hsl(var(--primary-muted))' : 'transparent',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            transition: 'background var(--duration-fast)',
                          }}
                        >
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: selExam?.id === exam.id ? 700 : 500, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selExam?.id === exam.id ? 'hsl(var(--primary))' : undefined }}>
                              {exam.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>{exam.duration_min} phút</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <button className="btn-ghost" style={{ padding: 5 }} onClick={e => { e.stopPropagation(); openEdit(exam); }}><Pencil size={13} /></button>
                            <button className="btn-ghost" style={{ padding: 5, color: 'hsl(var(--danger))' }} onClick={e => { e.stopPropagation(); deleteExam(exam.id); }}><Trash2 size={13} /></button>
                            <ChevronRight size={14} style={{ color: 'hsl(var(--muted-fg))' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Uncategorized Exams */}
          {(() => {
            const uncategorized = filteredExams.filter(e => e.exam_subjects.length === 0);
            if (uncategorized.length === 0) return null;
            return (
              <>
                <div style={{ padding: '8px 20px', background: 'hsl(var(--muted))', fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--muted-fg))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Chưa phân loại
                </div>
                {uncategorized.map(exam => (
                  <div
                    key={exam.id}
                    onClick={() => selectExam(exam)}
                    style={{
                      padding: 'var(--space-4) var(--space-5)', cursor: 'pointer',
                      borderBottom: '1px solid hsl(var(--border))',
                      background: selExam?.id === exam.id ? 'hsl(var(--primary-muted))' : 'transparent',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'background var(--duration-fast)',
                    }}
                  >
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: selExam?.id === exam.id ? 700 : 500, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selExam?.id === exam.id ? 'hsl(var(--primary))' : undefined }}>
                        {exam.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>{exam.duration_min} phút</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <button className="btn-ghost" style={{ padding: 5 }} onClick={e => { e.stopPropagation(); openEdit(exam); }}><Pencil size={13} /></button>
                      <button className="btn-ghost" style={{ padding: 5, color: 'hsl(var(--danger))' }} onClick={e => { e.stopPropagation(); deleteExam(exam.id); }}><Trash2 size={13} /></button>
                      <ChevronRight size={14} style={{ color: 'hsl(var(--muted-fg))' }} />
                    </div>
                  </div>
                ))}
              </>
            );
          })()}
        </div>
          );
        })()}
      </div>

      {/* Right — question management */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!selExam ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--muted-fg))', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <HelpCircle size={40} style={{ opacity: 0.2 }} />
            <p>Chọn đề thi để quản lý câu hỏi</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
              <div>
                <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>{selExam.title}</h2>
                <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>{questions.length} câu hỏi · {selExam.duration_min} phút</p>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button className="btn-ghost" style={{ fontSize: '0.75rem', color: 'hsl(var(--warning))' }} onClick={clearAllAnswers}>Xóa đáp án</button>
                <button className="btn-ghost" style={{ fontSize: '0.75rem', color: 'hsl(var(--danger))' }} onClick={deleteAllQuestions}>Xóa toàn bộ câu hỏi</button>
              </div>
            </div>

            {/* Unanswered Questions Alert */}
            {(() => {
              const unanswered = questions.map((q, i) => (!q.options.some(o => o.is_correct) ? (i + 1) : null)).filter(Boolean) as number[];
              if (unanswered.length === 0 || questions.length === 0) return null;
              return (
                <div style={{ background: 'hsl(var(--warning) / 0.1)', border: '1px solid hsl(var(--warning) / 0.3)', borderRadius: 'calc(var(--radius) * 1.5)', padding: 'var(--space-4) var(--space-5)', marginBottom: 'var(--space-6)', display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} style={{ color: 'hsl(var(--warning))', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 600, fontSize: '0.875rem', color: 'hsl(var(--warning))', marginBottom: 'var(--space-1)' }}>Câu chưa có đáp án ({unanswered.length})</h4>
                    <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--foreground))', lineHeight: 1.5, wordBreak: 'break-word' }}>
                      {unanswered.join(', ')}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Import section */}
            <div style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 1.5)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>Nhập câu hỏi hàng loạt</h3>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))', marginBottom: 'var(--space-3)' }}>
                Định dạng: <code>Câu 1: &lt;nội dung&gt;</code> → <code>A. &lt;lựa chọn&gt;</code> → cuối dòng <code>Đáp án: 1A 2BC</code>
              </p>
              <textarea
                style={{ ...inputStyle, height: 140, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8125rem' }}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={'Câu 1: Câu hỏi đây\nA. Lựa chọn A\nB. Lựa chọn B\nC. Lựa chọn C\nD. Lựa chọn D\n\nĐáp án: 1A'}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-3)' }}>
                {importCount > 0 && <span style={{ fontSize: '0.8125rem', color: 'hsl(var(--success))' }}>✓ Đã nhập {importCount} câu</span>}
                <button id="import-questions-btn" className="btn-primary" style={{ marginLeft: 'auto', fontSize: '0.875rem' }}
                  onClick={importQuestions} disabled={importing || !importText.trim()}>
                  {importing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                  {importing ? 'Đang nhập...' : 'Nhập câu hỏi'}
                </button>
              </div>
            </div>

            {/* Upload images as questions */}
            <div style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 1.5)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>Tải ảnh đề thi (1 ảnh = 1 câu)</h3>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))', marginBottom: 'var(--space-3)' }}>
                Mỗi ảnh sẽ tạo 1 câu hỏi mới với các lựa chọn mặc định từ A đến H. Sau đó bạn có thể dùng công cụ nhập đáp án ở dưới.
              </p>
              <input ref={imgInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => uploadQuestionImages(e.target.files)} />
              <button className="btn-primary" style={{ fontSize: '0.875rem' }}
                disabled={uploadingImg} onClick={() => imgInputRef.current?.click()}>
                {uploadingImg
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải {uploadProgress.done}/{uploadProgress.total}</>
                  : <><ImagePlus size={14} /> Chọn nhiều ảnh</>}
              </button>
            </div>

            {/* Bulk Answers Input */}
            <div style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 1.5)', padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
              <h3 style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 'var(--space-1)' }}>Cập nhật đáp án hàng loạt</h3>
              <p style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))', marginBottom: 'var(--space-3)' }}>
                Nhập đáp án cho các câu đã có (đặc biệt hữu ích khi vừa upload ảnh). Hỗ trợ: <code>1A 2B 3C</code>, <code>1AB 2CD</code>, <code>1:A 1:B 2:C</code>, <code>5E 6F</code>
              </p>
              <textarea
                style={{ ...inputStyle, height: 60, resize: 'vertical', fontFamily: 'monospace', fontSize: '0.8125rem' }}
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                placeholder="Ví dụ: 1A 2B 3CD 4A 5E..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-3)' }}>
                <button className="btn-primary" style={{ fontSize: '0.875rem' }}
                  onClick={applyAnswers} disabled={applyingAns || !answerText.trim()}>
                  {applyingAns ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                  {applyingAns ? 'Đang lưu...' : 'Lưu đáp án'}
                </button>
              </div>
            </div>

            {/* Question list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {questions.length === 0 && <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'hsl(var(--muted-fg))', background: 'hsl(var(--muted))', borderRadius: 'var(--radius)', fontSize: '0.875rem' }}>Chưa có câu hỏi nào</div>}
              {questions.map((q, i) => (
                <div key={q.id} style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: (q.options.length > 0 || q.image_url) ? 'var(--space-3)' : 0 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'hsl(var(--primary))' }}>Câu {i + 1}</span>
                        <input
                          type="text"
                          defaultValue={q.chapter_name || 'Tổng hợp'}
                          onBlur={async e => {
                            const val = e.target.value.trim() || 'Tổng hợp';
                            if (val !== q.chapter_name) {
                              await supabase.from('questions').update({ chapter_name: val }).eq('id', q.id);
                              if (selExam) fetchQuestions(selExam.id);
                            }
                          }}
                          placeholder="Tên chương..."
                          style={{
                            fontSize: '0.75rem',
                            padding: '2px 8px',
                            borderRadius: 4,
                            border: '1px solid hsl(var(--border))',
                            background: 'hsl(var(--muted))',
                            color: 'hsl(var(--foreground))',
                            fontWeight: 600,
                            maxWidth: 220,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.875rem' }}>{q.content ?? (q.image_url ? '' : '[Trống]')}</span>
                    </div>
                    <button className="btn-ghost" style={{ padding: 5, color: 'hsl(var(--danger))', flexShrink: 0 }} onClick={() => deleteQuestion(q.id)}><Trash2 size={13} /></button>
                  </div>
                  {q.image_url && (
                    <img src={q.image_url} alt={`Câu ${i + 1}`} style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', marginBottom: q.options.length > 0 ? 'var(--space-3)' : 0 }} />
                  )}
                  {q.options.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, paddingLeft: 'var(--space-4)' }}>
                      {q.options.map(o => (
                        <div key={o.label} style={{ fontSize: '0.8125rem', color: o.is_correct ? 'hsl(var(--success))' : 'hsl(var(--muted-fg))', display: 'flex', gap: 4 }}>
                          <strong style={{ minWidth: 14 }}>{o.label}.</strong>
                          <span>{o.content}</span>
                          {o.is_correct && <span style={{ marginLeft: 'auto', color: 'hsl(var(--success))' }}>✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Exam modal */}
      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'hsl(240 20% 12% / 0.4)', zIndex: 200 }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, background: 'hsl(var(--surface-raised))', boxShadow: 'var(--shadow-lg)', zIndex: 201, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>{editingId ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}</h2>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Tên đề thi *</label>
                <input id="exam-title-input" style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="VD: Đề thi giữa kỳ - Lần 1" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Mô tả</label>
                <textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Thời gian (phút)</label>
                <input style={inputStyle} type="number" min={1} value={form.duration_min} onChange={e => setForm(p => ({ ...p, duration_min: +e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Gắn vào môn học (có thể chọn nhiều)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto', background: 'hsl(var(--background))', padding: 'var(--space-3)', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }}>
                  {subjects.map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={form.subject_ids.includes(s.id)} 
                        onChange={e => {
                          const checked = e.target.checked;
                          setForm(p => ({
                            ...p,
                            subject_ids: checked ? [...p.subject_ids, s.id] : p.subject_ids.filter(id => id !== s.id)
                          }));
                        }} 
                        style={{ width: 14, height: 14, accentColor: 'hsl(var(--primary))' }} 
                      />
                      Kỳ {(s as any).semester} · {s.name}
                    </label>
                  ))}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'hsl(var(--primary))' }} />
                Kích hoạt ngay
              </label>
            </div>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Hủy</button>
              <button id="save-exam-btn" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={saveExam} disabled={saving}>
                {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={15} />}
                {editingId ? 'Lưu thay đổi' : 'Tạo đề thi'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
