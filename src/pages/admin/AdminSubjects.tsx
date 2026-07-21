import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { SEMESTERS, subjectColor, subjectInitials, formatPrice } from '@/lib/mockData';
import { Plus, Pencil, Trash2, Copy, ToggleLeft, ToggleRight, X, Check, Loader2, BookOpen, Layers, CheckCircle2, EyeOff } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import FileUploader from '@/components/FileUploader';

type Subject = Tables<'subjects'>;

const emptyForm = () => ({
  name: '', semester: 1, price: 79000, description: '', thumbnail_url: '', is_active: true,
});

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1px solid #cbd5e1', borderRadius: 12,
  fontSize: '0.875rem', outline: 'none', background: '#f8fafc', color: '#0f172a',
  boxSizing: 'border-box', fontWeight: 600,
};

export default function AdminSubjects() {
  const { profile } = useApp();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading]  = useState(true);
  const [saving,  setSaving]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState<string | null>(null);
  const [form,     setForm]     = useState(emptyForm());
  const [filterSem, setFilterSem] = useState<number | 'all'>('all');

  const fetch = async () => {
    const { data } = await supabase.from('subjects').select('*').order('semester').order('sort_order');
    setSubjects(data ?? []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const filtered = filterSem === 'all' ? subjects : subjects.filter(s => s.semester === filterSem);

  const activeCount = subjects.filter(s => s.is_active).length;
  const hiddenCount = subjects.filter(s => !s.is_active).length;

  const openCreate = () => { setForm(emptyForm()); setEditing(null); setShowForm(true); };
  const openEdit   = (s: Subject) => {
    setForm({ name: s.name, semester: s.semester, price: s.price, description: s.description ?? '', thumbnail_url: s.thumbnail_url ?? '', is_active: s.is_active });
    setEditing(s.id); setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editing) {
      await supabase.from('subjects').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing);
    } else {
      await supabase.from('subjects').insert({ ...form, created_by: profile?.id });
    }
    await fetch();
    setSaving(false);
    setShowForm(false);
  };

  const duplicate = async (s: Subject) => {
    if (!confirm('Sao chép môn học này cùng toàn bộ đề thi và lý thuyết?')) return;
    setSaving(true);
    try {
      const { data: newSubj } = await supabase.from('subjects').insert({ name: s.name + ' (Bản sao)', semester: s.semester, price: s.price, description: s.description, is_active: false, created_by: profile?.id }).select().single();
      if (!newSubj) return;

      // 1. Copy theories
      const { data: ts } = await supabase.from('theory_subjects').select('theory_id').eq('subject_id', s.id);
      if (ts && ts.length > 0) {
        const { data: theories } = await supabase.from('theories').select('*').in('id', ts.map(t => t.theory_id));
        if (theories) {
          for (const theory of theories) {
            const { id, created_at, ...rest } = theory;
            const { data: newTheory } = await supabase.from('theories').insert(rest).select().single();
            if (newTheory) await supabase.from('theory_subjects').insert({ theory_id: newTheory.id, subject_id: newSubj.id });
          }
        }
      }

      // 2. Copy exams
      const { data: es } = await supabase.from('exam_subjects').select('exam_id').eq('subject_id', s.id);
      if (es && es.length > 0) {
        const { data: exams } = await supabase.from('exams').select('*').in('id', es.map(e => e.exam_id));
        if (exams) {
          for (const exam of exams) {
            const { id, created_at, ...restExam } = exam;
            const { data: newExam } = await supabase.from('exams').insert({ ...restExam, title: restExam.title + ' (Bản sao)' }).select().single();
            if (newExam) {
              await supabase.from('exam_subjects').insert({ exam_id: newExam.id, subject_id: newSubj.id });
              const { data: qs } = await supabase.from('questions').select('*').eq('exam_id', id);
              if (qs) {
                for (const q of qs) {
                  const { id: qId, created_at: qc, exam_id, ...restQ } = q;
                  const { data: newQ } = await supabase.from('questions').insert({ ...restQ, exam_id: newExam.id }).select().single();
                  if (newQ) {
                    const { data: ops } = await supabase.from('question_options').select('*').eq('question_id', qId);
                    if (ops && ops.length > 0) {
                      await supabase.from('question_options').insert(ops.map(o => {
                        const { id: oId, question_id, ...restO } = o;
                        return { ...restO, question_id: newQ.id };
                      }));
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
      alert('Đã xảy ra lỗi khi sao chép.');
    } finally {
      setSaving(false);
      fetch();
    }
  };

  const toggle = async (s: Subject) => {
    await supabase.from('subjects').update({ is_active: !s.is_active }).eq('id', s.id);
    fetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa môn học này? Hành động này không thể hoàn tác (các lịch sử đơn hàng chứa môn này cũng sẽ bị xóa).')) return;
    await supabase.from('order_items').delete().eq('subject_id', id);
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) {
      console.error(error);
      alert('Không thể xóa môn học: ' + error.message);
    }
    fetch();
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 450, background: '#f4f7fc' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );

  return (
    <div style={{ padding: '28px 36px', flex: 1, minWidth: 0, background: '#f4f7fc', minHeight: '100vh', color: '#0f172a', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 4px 0' }}>
            Quản lý môn học
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
            Quản lý danh sách các môn học, thiết lập học phí và trạng thái hiển thị trên TQMaster.
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#ffffff',
            border: 'none', borderRadius: 14, fontSize: 13.5, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)', transition: 'all 0.15s ease'
          }}
        >
          <Plus size={16} strokeWidth={3} /> Tạo môn học
        </button>
      </div>

      {/* ── TOP STAT CARDS PALETTE ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 18,
        marginBottom: 24,
      }}>
        {/* Card 1: Revenue / Total Subjects */}
        <div style={{ background: '#edf5ff', border: '1px solid #dbeafe', borderRadius: 20, padding: '18px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tổng môn học</span>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', boxShadow: '0 4px 10px rgba(16,185,129,0.15)' }}>
              <BookOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>{subjects.length} Môn</div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginTop: 4 }}>Trên hệ thống TQMaster</div>
        </div>

        {/* Card 2: Active Subjects */}
        <div style={{ background: '#eafaf5', border: '1px solid #d1fae5', borderRadius: 20, padding: '18px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Đang hoạt động</span>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', boxShadow: '0 4px 10px rgba(16,185,129,0.15)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>{activeCount} Môn</div>
          <div style={{ fontSize: 12, color: '#059669', fontWeight: 700, marginTop: 4 }}>Hiển thị công khai cho sinh viên</div>
        </div>

        {/* Card 3: Hidden Subjects */}
        <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 20, padding: '18px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Đã ẩn</span>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b', boxShadow: '0 4px 10px rgba(245,158,11,0.18)' }}>
              <EyeOff size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>{hiddenCount} Môn</div>
          <div style={{ fontSize: 12, color: '#d97706', fontWeight: 700, marginTop: 4 }}>Tạm ẩn khỏi trang chủ</div>
        </div>

        {/* Card 4: Avg Semesters */}
        <div style={{ background: '#f3eefd', border: '1px solid #ede9fe', borderRadius: 20, padding: '18px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Số kỳ học</span>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', boxShadow: '0 4px 10px rgba(139,92,246,0.15)' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>{SEMESTERS.length} Kỳ</div>
          <div style={{ fontSize: 12, color: '#8b5cf6', fontWeight: 700, marginTop: 4 }}>Từ Kỳ 1 đến Kỳ 8</div>
        </div>
      </div>

      {/* Semester Filter Pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setFilterSem('all')}
          style={{
            padding: '7px 16px', borderRadius: 12, border: filterSem === 'all' ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
            background: filterSem === 'all' ? '#eff6ff' : '#ffffff', color: filterSem === 'all' ? '#2563eb' : '#475569',
            fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: filterSem === 'all' ? '0 2px 8px rgba(37,99,235,0.15)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          Tất cả ({subjects.length})
        </button>
        {SEMESTERS.map(s => {
          const cnt = subjects.filter(sub => sub.semester === s).length;
          const isActive = filterSem === s;
          return (
            <button
              key={s}
              onClick={() => setFilterSem(s)}
              style={{
                padding: '7px 16px', borderRadius: 12, border: isActive ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                background: isActive ? '#eff6ff' : '#ffffff', color: isActive ? '#2563eb' : '#475569',
                fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: isActive ? '0 2px 8px rgba(37,99,235,0.15)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Kỳ {s} ({cnt})
            </button>
          );
        })}
      </div>

      {/* ── DESKTOP TABLE VIEW (With overflowX auto wrapper) ── */}
      <div className="hidden-mobile" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14, fontWeight: 600 }}>Chưa có môn học nào</div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', textAlign: 'left', fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>Môn học</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>Kỳ học</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>Học phí</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em' }}>Trạng thái</th>
                  <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const color = subjectColor(s.name);
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 900, color }}>{subjectInitials(s.name)}</span>
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{s.name}</div>
                            {s.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.description.slice(0, 55)}…</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 8, background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 800, border: '1px solid #dbeafe' }}>
                          Kỳ {s.semester}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 800, color: '#2563eb', fontSize: 14 }}>
                        {formatPrice(s.price)}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <button onClick={() => toggle(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                          {s.is_active
                            ? <><ToggleRight size={22} style={{ color: '#10b981' }} /><span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 800, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>Hoạt động</span></>
                            : <><ToggleLeft size={22} style={{ color: '#94a3b8' }} /><span style={{ padding: '3px 9px', borderRadius: 20, fontSize: 11.5, fontWeight: 800, background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>Ẩn</span></>}
                        </button>
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button title="Chỉnh sửa" style={{ border: 'none', background: '#f1f5f9', padding: 7, borderRadius: 8, cursor: 'pointer', color: '#475569' }} onClick={() => openEdit(s)}><Pencil size={14} /></button>
                          <button title="Sao chép" style={{ border: 'none', background: '#f1f5f9', padding: 7, borderRadius: 8, cursor: 'pointer', color: '#2563eb' }} onClick={() => duplicate(s)}><Copy size={14} /></button>
                          <button title="Xóa" style={{ border: 'none', background: '#fff1f2', padding: 7, borderRadius: 8, cursor: 'pointer', color: '#e11d48' }} onClick={() => remove(s.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MOBILE CARDS VIEW (For screens < 768px) ── */}
      <div className="visible-mobile" style={{ display: 'none', flexDirection: 'column', gap: 14 }}>
        {filtered.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13.5 }}>
            Chưa có môn học nào
          </div>
        ) : (
          filtered.map(s => {
            const color = subjectColor(s.name);
            return (
              <div key={s.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 18, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 12, fontWeight: 900, color }}>{subjectInitials(s.name)}</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{s.name}</div>
                      <span style={{ padding: '2px 8px', borderRadius: 6, background: '#eff6ff', color: '#2563eb', fontSize: 11, fontWeight: 800 }}>Kỳ {s.semester}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#2563eb' }}>{formatPrice(s.price)}</div>
                </div>

                {s.description && <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.4 }}>{s.description}</p>}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                  <button onClick={() => toggle(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {s.is_active
                      ? <><ToggleRight size={20} style={{ color: '#10b981' }} /><span style={{ fontSize: 12, fontWeight: 800, color: '#15803d' }}>Hoạt động</span></>
                      : <><ToggleLeft size={20} style={{ color: '#94a3b8' }} /><span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>Ẩn</span></>}
                  </button>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button style={{ border: 'none', background: '#f1f5f9', padding: 6, borderRadius: 8, cursor: 'pointer', color: '#475569' }} onClick={() => openEdit(s)}><Pencil size={14} /></button>
                    <button style={{ border: 'none', background: '#f1f5f9', padding: 6, borderRadius: 8, cursor: 'pointer', color: '#2563eb' }} onClick={() => duplicate(s)}><Copy size={14} /></button>
                    <button style={{ border: 'none', background: '#fff1f2', padding: 6, borderRadius: 8, cursor: 'pointer', color: '#e11d48' }} onClick={() => remove(s.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── CREATE / EDIT SUBJECT DRAWER ── */}
      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 440, maxWidth: '100vw', background: '#ffffff', boxShadow: '-10px 0 30px rgba(0,0,0,0.15)', zIndex: 201, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 900, fontSize: 18, color: '#0f172a', margin: 0 }}>{editing ? 'Sửa môn học' : 'Tạo môn học mới'}</h2>
              <button style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }} onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Tên môn học *</label>
                <input style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: CSI106 - Ôn thi FE" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Kỳ học *</label>
                  <select style={inputStyle} value={form.semester} onChange={e => setForm(p => ({ ...p, semester: +e.target.value }))}>
                    {SEMESTERS.map(s => <option key={s} value={s}>Kỳ {s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Giá (VND) *</label>
                  <input style={inputStyle} type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: +e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Mô tả</label>
                <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Mô tả môn học..." />
              </div>
              <FileUploader
                bucket="thumbnails"
                value={form.thumbnail_url}
                onChange={url => setForm(p => ({ ...p, thumbnail_url: url }))}
                accept="image/*"
                preview="image"
                label="Ảnh thumbnail"
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
                Hiển thị cho sinh viên
              </label>
            </div>
            <div style={{ padding: 20, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, padding: 12, borderRadius: 12, border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 800, cursor: 'pointer' }} onClick={() => setShowForm(false)}>Hủy</button>
              <button style={{ flex: 2, padding: 12, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#ffffff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={save} disabled={saving}>
                {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} strokeWidth={3} />}
                {editing ? 'Lưu thay đổi' : 'Tạo môn học'}
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
          .visible-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
