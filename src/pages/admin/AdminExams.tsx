import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useApp } from '@/lib/AppContext';
import { Plus, Trash2, ChevronRight, X, Check, Loader2, HelpCircle, ImagePlus, Pencil, Search, AlertTriangle, FileText } from 'lucide-react';

type Exam    = Tables<'exams'>;
type Subject = Pick<Tables<'subjects'>, 'id' | 'name' | 'semester'>;
type ExamWithSubjects = Exam & { exam_subjects: { subject_id: string, subjects: Subject }[] };
type Question = Tables<'questions'> & { options: Array<Tables<'question_options'>> };

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #cbd5e1', borderRadius: 12,
  fontSize: '0.875rem', outline: 'none', background: '#ffffff',
  color: '#0f172a', transition: 'all 0.15s ease',
  boxSizing: 'border-box'
};

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

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', duration_min: 60, subject_ids: [] as string[], is_active: true });

  const [importText,  setImportText]  = useState('');
  const [importCount, setImportCount] = useState(0);
  const [importing,   setImporting]   = useState(false);

  const [answerText, setAnswerText] = useState('');
  const [applyingAns, setApplyingAns] = useState(false);

  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const imgInputRef = useRef<HTMLInputElement>(null);

  const fetchExams = async () => {
    const { data } = await supabase
      .from('exams')
      .select('*, exam_subjects(subject_id, subjects(id, name, semester))')
      .order('created_at', { ascending: false });
    setExams((data as any) ?? []);
    setLoading(false);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, name, semester').order('semester').order('name');
    setSubjects(data ?? []);
  };

  useEffect(() => {
    fetchExams();
    fetchSubjects();
  }, []);

  const selectExam = async (exam: Exam) => {
    setSelExam(exam);
    fetchQuestions(exam.id);
  };

  const fetchQuestions = async (examId: string) => {
    const { data } = await supabase
      .from('questions')
      .select('*, question_options(*)')
      .eq('exam_id', examId)
      .order('order_num');

    const formatted: Question[] = (data ?? []).map((q: any) => ({
      ...q,
      options: (q.question_options ?? q.options ?? []).sort((a: any, b: any) => (a.label || '').localeCompare(b.label || '')),
    }));
    setQuestions(formatted);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', description: '', duration_min: 60, subject_ids: [], is_active: true });
    setShowForm(true);
  };

  const openEdit = (exam: ExamWithSubjects) => {
    setEditingId(exam.id);
    setForm({
      title: exam.title,
      description: exam.description ?? '',
      duration_min: exam.duration_min,
      subject_ids: exam.exam_subjects.map(es => es.subject_id),
      is_active: exam.is_active ?? true,
    });
    setShowForm(true);
  };

  const saveExam = async () => {
    if (!form.title.trim()) return;
    setSaving(true);

    if (editingId) {
      const { error } = await supabase.from('exams').update({
        title: form.title,
        description: form.description || null,
        duration_min: form.duration_min,
        is_active: form.is_active,
      }).eq('id', editingId);

      if (!error) {
        await supabase.from('exam_subjects').delete().eq('exam_id', editingId);
        if (form.subject_ids.length > 0) {
          await supabase.from('exam_subjects').insert(
            form.subject_ids.map(id => ({ exam_id: editingId, subject_id: id }))
          );
        }
      }
    } else {
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
      if (!q) continue;
      for (const opt of q.options) {
        const isCorrect = correctLabels.includes(opt.label.toUpperCase());
        if (opt.is_correct !== isCorrect) {
          await supabase.from('question_options').update({ is_correct: isCorrect }).eq('id', opt.id);
        }
      }
    }
    setAnswerText('');
    await fetchQuestions(selExam.id);
    setApplyingAns(false);
  };

  const uploadQuestionImages = async (files: FileList | null) => {
    if (!selExam || !files || files.length === 0) return;
    setUploadingImg(true);
    setUploadProgress({ done: 0, total: files.length });
    let startNum = questions.length + 1;
    const defaultLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${selExam.id}/${Date.now()}_${i}.${ext}`;
      const { error: upErr } = await supabase.storage.from('exam-images').upload(path, file);
      if (upErr) { console.error('Upload image failed:', upErr); continue; }
      const { data: pubData } = supabase.storage.from('exam-images').getPublicUrl(path);
      const publicUrl = pubData.publicUrl;

      const { data: q } = await supabase.from('questions').insert({
        exam_id: selExam.id, order_num: startNum++,
        content: null, type: 'image', image_url: publicUrl,
        chapter_name: 'Hình ảnh',
      }).select().single();

      if (q) {
        await supabase.from('question_options').insert(
          defaultLabels.map(label => ({
            question_id: q.id, label, content: '', is_correct: false,
          }))
        );
      }
      setUploadProgress({ done: i + 1, total: files.length });
    }

    await fetchQuestions(selExam.id);
    setUploadingImg(false);
    if (imgInputRef.current) imgInputRef.current.value = '';
  };

  const setOptionAsCorrect = async (questionId: string, optionId: string) => {
    const targetQ = questions.find(q => q.id === questionId);
    if (!targetQ) return;

    const targetOpt = targetQ.options.find(o => o.id === optionId);
    if (!targetOpt) return;

    const isAlreadyCorrect = targetOpt.is_correct;

    // Optimistic UI update: set clicked option as correct, reset all other options of this question to false
    setQuestions(prevQs => prevQs.map(q => {
      if (q.id !== questionId) return q;
      return {
        ...q,
        options: q.options.map(o => ({
          ...o,
          is_correct: o.id === optionId ? !isAlreadyCorrect : false
        }))
      };
    }));

    // DB update: reset all options of this question to false
    await supabase
      .from('question_options')
      .update({ is_correct: false })
      .eq('question_id', questionId);

    if (!isAlreadyCorrect) {
      const { error } = await supabase
        .from('question_options')
        .update({ is_correct: true })
        .eq('id', optionId);

      if (error) {
        toast.error('Lỗi khi chuyển đáp án: ' + error.message);
        if (selExam) fetchQuestions(selExam.id);
      } else {
        toast.success(`Đã đổi đáp án đúng thành ${targetOpt.label}`);
      }
    } else {
      toast.success(`Đã bỏ chọn đáp án ${targetOpt.label}`);
    }
  };

  const clearAllAnswers = async () => {
    if (!selExam) return;
    if (!confirm('Xoá tất cả đáp án đúng đã tích? Các câu hỏi và lựa chọn vẫn giữ nguyên.')) return;
    const qIds = questions.map(q => q.id);
    if (qIds.length > 0) {
      await supabase.from('question_options').update({ is_correct: false }).in('question_id', qIds);
      fetchQuestions(selExam.id);
    }
  };

  const deleteAllQuestions = async () => {
    if (!selExam) return;
    if (!confirm('CẢNH BÁO: Xoá TOÀN BỘ câu hỏi của đề thi này? Hành động không thể hoàn tác.')) return;
    await supabase.from('questions').delete().eq('exam_id', selExam.id);
    fetchQuestions(selExam.id);
  };

  const filteredExams = exams.filter(e => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return e.title.toLowerCase().includes(q) || (e.exam_subjects ?? []).some(es => es.subjects?.name?.toLowerCase().includes(q));
  });

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 450, background: '#f4f7fc' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );

  return (
    <div className="admin-exams-root" style={{ display: 'flex', height: '100vh', background: '#f4f7fc', fontFamily: "'Inter', -apple-system, sans-serif", color: '#0f172a' }}>
      
      {/* Sidebar — exam list */}
      <div className="admin-exams-sidebar" style={{ width: 340, borderRight: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>Đề thi</h1>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{exams.length} đề thi hệ thống</p>
          </div>
          <button
            onClick={openCreate}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#ffffff',
              border: 'none', borderRadius: 12, fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Plus size={15} /> Tạo đề
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên đề, môn..."
              style={{
                width: '100%', padding: '7px 10px 7px 30px', borderRadius: 10,
                border: '1px solid #cbd5e1', fontSize: 12.5, outline: 'none', background: '#ffffff',
                color: '#0f172a', boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        {/* List grouped by Semester */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredExams.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
              Không tìm thấy đề thi nào
            </div>
          )}

          {[1,2,3,4,5,6,7,8].map(sem => {
            const subjectsInSem = subjects.filter(s => s.semester === sem);
            if (subjectsInSem.length === 0) return null;
            
            const examsInSem = filteredExams.filter(e => (e.exam_subjects ?? []).some(es => es.subjects?.semester === sem));
            if (examsInSem.length === 0) return null;

            return (
              <div key={sem}>
                <div style={{ padding: '8px 16px', background: '#f1f5f9', fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Kỳ {sem}
                </div>
                {subjectsInSem.map(subj => {
                  const examsInSubj = filteredExams.filter(e => (e.exam_subjects ?? []).some(es => es.subject_id === subj.id));
                  if (examsInSubj.length === 0) return null;

                  return (
                    <div key={subj.id}>
                      <div style={{ padding: '6px 16px', fontSize: 12, fontWeight: 800, color: '#2563eb', background: '#eff6ff' }}>
                        {subj.name}
                      </div>
                      {examsInSubj.map(exam => (
                        <div
                          key={exam.id}
                          onClick={() => selectExam(exam)}
                          style={{
                            padding: '12px 16px 12px 24px', cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            background: selExam?.id === exam.id ? '#edf5ff' : 'transparent',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ fontWeight: selExam?.id === exam.id ? 800 : 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: selExam?.id === exam.id ? '#2563eb' : '#0f172a' }}>
                              {exam.title}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#64748b' }}>{exam.duration_min} phút</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <button style={{ border: 'none', background: 'transparent', padding: 4, cursor: 'pointer', color: '#475569' }} onClick={e => { e.stopPropagation(); openEdit(exam); }}><Pencil size={13} /></button>
                            <button style={{ border: 'none', background: 'transparent', padding: 4, cursor: 'pointer', color: '#e11d48' }} onClick={e => { e.stopPropagation(); deleteExam(exam.id); }}><Trash2 size={13} /></button>
                            <ChevronRight size={14} style={{ color: '#94a3b8' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right — question management */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f4f7fc' }}>
        {!selExam ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexDirection: 'column', gap: 12 }}>
            <HelpCircle size={48} style={{ color: '#cbd5e1' }} />
            <p style={{ fontWeight: 600, fontSize: 14 }}>Chọn đề thi bên trái để quản lý câu hỏi</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ fontWeight: 900, fontSize: 22, color: '#0f172a', margin: '0 0 4px 0' }}>{selExam.title}</h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>{questions.length} câu hỏi · {selExam.duration_min} phút làm bài</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #fde68a', background: '#fef3c7', color: '#b45309', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }} onClick={clearAllAnswers}>Xóa đáp án</button>
                <button style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #fecdd3', background: '#ffe4e6', color: '#e11d48', fontSize: 12.5, fontWeight: 800, cursor: 'pointer' }} onClick={deleteAllQuestions}>Xóa toàn bộ câu hỏi</button>
              </div>
            </div>

            {/* Unanswered Questions Alert */}
            {(() => {
              const unanswered = questions.map((q, i) => (!((q.options ?? []).some(o => o.is_correct)) ? (i + 1) : null)).filter(Boolean) as number[];
              if (unanswered.length === 0 || questions.length === 0) return null;
              return (
                <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 20, padding: 18, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <AlertTriangle size={20} style={{ color: '#d97706', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: 14, color: '#d97706', margin: '0 0 4px 0' }}>Câu chưa có đáp án ({unanswered.length})</h4>
                    <p style={{ fontSize: 13, color: '#475569', margin: 0, lineHeight: 1.5 }}>
                      {unanswered.join(', ')}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Import section */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 22, padding: 22, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', margin: '0 0 4px 0' }}>Nhập câu hỏi hàng loạt</h3>
              <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 12 }}>
                Định dạng: <code>Câu 1: &lt;nội dung&gt;</code> → <code>A. &lt;lựa chọn&gt;</code> → cuối dòng <code>Đáp án: 1A 2BC</code>
              </p>
              <textarea
                style={{ ...inputStyle, height: 130, resize: 'vertical', fontFamily: 'monospace', fontSize: 12.5 }}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={'Câu 1: Câu hỏi đây\nA. Lựa chọn A\nB. Lựa chọn B\nC. Lựa chọn C\nD. Lựa chọn D\n\nĐáp án: 1A'}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                {importCount > 0 && <span style={{ fontSize: 13, color: '#15803d', fontWeight: 800 }}>✓ Đã nhập {importCount} câu</span>}
                <button
                  style={{
                    marginLeft: 'auto', padding: '10px 18px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#ffffff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', display: 'flex', alignItems: 'center', gap: 6
                  }}
                  onClick={importQuestions} disabled={importing || !importText.trim()}
                >
                  {importing ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                  {importing ? 'Đang nhập...' : 'Nhập câu hỏi'}
                </button>
              </div>
            </div>

            {/* Upload images as questions */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 22, padding: 22, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', margin: '0 0 4px 0' }}>Tải ảnh đề thi (1 ảnh = 1 câu)</h3>
              <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 12 }}>
                Mỗi ảnh sẽ tạo 1 câu hỏi mới với các lựa chọn từ A đến H. Bấm chọn trực tiếp vào ô A, B, C, D... bên dưới để đổi đáp án đúng!
              </p>
              <input ref={imgInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                onChange={e => uploadQuestionImages(e.target.files)} />
              <button
                style={{
                  padding: '10px 18px', background: '#eff6ff', color: '#2563eb', border: '1px solid #dbeafe',
                  borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
                }}
                disabled={uploadingImg} onClick={() => imgInputRef.current?.click()}
              >
                {uploadingImg
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải {uploadProgress.done}/{uploadProgress.total}</>
                  : <><ImagePlus size={15} /> Chọn nhiều ảnh đề thi</>}
              </button>
            </div>

            {/* Bulk Answers Input */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 22, padding: 22, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', margin: '0 0 4px 0' }}>Cập nhật đáp án hàng loạt</h3>
              <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 12 }}>
                Nhập đáp án cho các câu đã có: <code>1A 2B 3CD 4A 5E</code> (Hoặc click trực tiếp vào nút A, B, C, D của từng câu bên dưới để chuyển đáp án)
              </p>
              <textarea
                style={{ ...inputStyle, height: 60, resize: 'vertical', fontFamily: 'monospace', fontSize: 12.5 }}
                value={answerText}
                onChange={e => setAnswerText(e.target.value)}
                placeholder="Ví dụ: 1A 2B 3CD 4A 5E..."
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  style={{
                    padding: '10px 18px', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#ffffff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)', display: 'flex', alignItems: 'center', gap: 6
                  }}
                  onClick={applyAnswers} disabled={applyingAns || !answerText.trim()}
                >
                  {applyingAns ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                  {applyingAns ? 'Đang lưu...' : 'Lưu đáp án'}
                </button>
              </div>
            </div>

            {/* Question list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {questions.length === 0 && (
                <div style={{ textAlign: 'center', padding: 48, color: '#94a3b8', background: '#ffffff', borderRadius: 22, border: '1px solid #e2e8f0', fontSize: 13.5 }}>
                  Chưa có câu hỏi nào trong đề thi này
                </div>
              )}
              {questions.map((q, i) => {
                const opts = q.options ?? [];
                return (
                  <div key={q.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: (opts.length > 0 || q.image_url) ? 12 : 0 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontWeight: 900, fontSize: 13.5, color: '#2563eb', background: '#eff6ff', padding: '3px 10px', borderRadius: 8 }}>Câu {i + 1}</span>
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
                              fontSize: 12, padding: '3px 10px', borderRadius: 8,
                              border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a',
                              fontWeight: 700, maxWidth: 220,
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 14, color: '#0f172a', fontWeight: 600 }}>{q.content ?? (q.image_url ? '' : '[Trống]')}</span>
                      </div>
                      <button style={{ border: 'none', background: '#fff1f2', color: '#e11d48', padding: 6, borderRadius: 8, cursor: 'pointer', flexShrink: 0 }} onClick={() => deleteQuestion(q.id)}><Trash2 size={15} /></button>
                    </div>

                    {q.image_url && (
                      <img src={q.image_url} alt={`Câu ${i + 1}`} style={{ maxWidth: '100%', maxHeight: 340, borderRadius: 14, border: '1px solid #e2e8f0', marginBottom: opts.length > 0 ? 12 : 0 }} />
                    )}

                    {/* Clean & Fast Answer Switcher Buttons */}
                    {opts.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 10 }}>
                        {opts.map(o => (
                          <div
                            key={o.id || o.label}
                            onClick={() => setOptionAsCorrect(q.id, o.id)}
                            style={{
                              fontSize: 13, cursor: 'pointer', userSelect: 'none',
                              color: o.is_correct ? '#15803d' : '#475569',
                              fontWeight: o.is_correct ? 800 : 600,
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 14px',
                              background: o.is_correct ? '#dcfce7' : '#ffffff',
                              borderRadius: 14,
                              border: o.is_correct ? '2px solid #22c55e' : '1.5px solid #e2e8f0',
                              boxShadow: o.is_correct ? '0 4px 12px rgba(34, 197, 94, 0.2)' : '0 2px 6px rgba(0,0,0,0.02)',
                              transition: 'all 0.15s ease'
                            }}
                            title={`Bấm để chọn đáp án ${o.label} làm đáp án đúng`}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                              <span style={{
                                width: 26, height: 26, borderRadius: 8,
                                background: o.is_correct ? '#15803d' : '#f1f5f9',
                                color: o.is_correct ? '#ffffff' : '#475569',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 13, fontWeight: 900, flexShrink: 0
                              }}>
                                {o.label}
                              </span>
                              <span style={{
                                fontSize: 13, fontWeight: o.is_correct ? 800 : 600,
                                color: o.is_correct ? '#15803d' : '#0f172a',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                              }}>
                                {o.content || `Đáp án ${o.label}`}
                              </span>
                            </div>

                            {o.is_correct ? (
                              <span style={{ color: '#15803d', fontWeight: 900, fontSize: 16, flexShrink: 0 }}>✓</span>
                            ) : (
                              <span style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', flexShrink: 0 }}>Chưa chọn</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create Exam modal */}
      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 440, background: '#ffffff', boxShadow: '-10px 0 30px rgba(0,0,0,0.15)', zIndex: 201, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 900, fontSize: 18, color: '#0f172a', margin: 0 }}>{editingId ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}</h2>
              <button style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }} onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Tên đề thi *</label>
                <input style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="VD: Đề thi giữa kỳ - Lần 1" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Mô tả</label>
                <textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Thời gian (phút)</label>
                <input style={inputStyle} type="number" min={1} value={form.duration_min} onChange={e => setForm(p => ({ ...p, duration_min: +e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Gắn vào môn học</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 150, overflowY: 'auto', background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  {subjects.map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#0f172a' }}>
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
                        style={{ width: 15, height: 15, accentColor: '#2563eb' }} 
                      />
                      Kỳ {(s as any).semester} · {s.name}
                    </label>
                  ))}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
                Kích hoạt ngay
              </label>
            </div>
            <div style={{ padding: 20, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, padding: 12, borderRadius: 12, border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 800, cursor: 'pointer' }} onClick={() => setShowForm(false)}>Hủy</button>
              <button style={{ flex: 2, padding: 12, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#ffffff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={saveExam} disabled={saving}>
                {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} strokeWidth={3} />}
                {editingId ? 'Lưu thay đổi' : 'Tạo đề thi'}
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .admin-exams-root {
            flex-direction: column !important;
            height: auto !important;
            min-height: 100vh;
          }
          .admin-exams-sidebar {
            width: 100% !important;
            max-height: 280px !important;
            border-right: none !important;
            border-bottom: 1px solid #e2e8f0 !important;
          }
        }
      `}</style>
    </div>
  );
}
