import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { SEMESTERS, subjectColor, subjectInitials, formatPrice } from '@/lib/mockData';
import { Plus, Pencil, Trash2, Copy, ToggleLeft, ToggleRight, X, Check, Loader2 } from 'lucide-react';
import { useApp } from '@/lib/AppContext';
import FileUploader from '@/components/FileUploader';

type Subject = Tables<'subjects'>;
type SubjectInsert = Tables<'subjects'>;

const COLORS = ['#4F46E5','#0891B2','#059669','#D97706','#DC2626','#7C3AED','#0284C7','#15803D','#EA580C','#BE185D'];

const emptyForm = () => ({
  name: '', semester: 1, price: 79000, description: '', thumbnail_url: '', is_active: true,
});

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)',
  fontSize: '0.875rem', outline: 'none', background: 'hsl(var(--surface-raised))',
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
    
    // Xóa liên kết trong order_items trước để tránh lỗi 409 Conflict (Foreign Key Constraint)
    await supabase.from('order_items').delete().eq('subject_id', id);
    
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) {
      console.error(error);
      alert('Không thể xóa môn học: ' + error.message);
    }
    fetch();
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Quản lý môn học</h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>{subjects.length} môn học</p>
        </div>
        <button id="create-subject-btn" className="btn-primary" onClick={openCreate}><Plus size={15} /> Tạo môn học</button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <button className={`tab-pill ${filterSem === 'all' ? 'active' : ''}`} onClick={() => setFilterSem('all')}>Tất cả</button>
        {SEMESTERS.map(s => <button key={s} className={`tab-pill ${filterSem === s ? 'active' : ''}`} onClick={() => setFilterSem(s)}>Kỳ {s}</button>)}
      </div>

      <div style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 1.5)', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'hsl(var(--muted-fg))' }}>Chưa có môn học nào</div>
        ) : (
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th>Môn học</th><th>Kỳ</th><th>Giá</th><th>Trạng thái</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr></thead>
            <tbody>
              {filtered.map(s => {
                const color = subjectColor(s.name);
                return (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color }}>{subjectInitials(s.name)}</span>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.name}</div>
                          {s.description && <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>{s.description.slice(0, 60)}…</div>}
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-primary">Kỳ {s.semester}</span></td>
                    <td style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{formatPrice(s.price)}</td>
                    <td>
                      <button onClick={() => toggle(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {s.is_active
                          ? <><ToggleRight size={20} style={{ color: 'hsl(var(--success))' }} /><span style={{ fontSize: '0.75rem', color: 'hsl(var(--success))' }}>Hoạt động</span></>
                          : <><ToggleLeft size={20} style={{ color: 'hsl(var(--muted-fg))' }} /><span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>Ẩn</span></>}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <button id={`edit-${s.id}`} className="btn-ghost" style={{ padding: 6 }} onClick={() => openEdit(s)}><Pencil size={14} /></button>
                        <button className="btn-ghost" style={{ padding: 6 }} onClick={() => duplicate(s)}><Copy size={14} /></button>
                        <button className="btn-ghost" style={{ padding: 6, color: 'hsl(var(--danger))' }} onClick={() => remove(s.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'hsl(240 20% 12% / 0.4)', zIndex: 200 }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 440, background: 'hsl(var(--surface-raised))', boxShadow: 'var(--shadow-lg)', zIndex: 201, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>{editing ? 'Sửa môn học' : 'Tạo môn học mới'}</h2>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Tên môn học *</label>
                <input id="subject-name-input" style={inputStyle} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="VD: Toán Cao Cấp A1" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Kỳ học *</label>
                  <select style={inputStyle} value={form.semester} onChange={e => setForm(p => ({ ...p, semester: +e.target.value }))}>
                    {SEMESTERS.map(s => <option key={s} value={s}>Kỳ {s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Giá (VND) *</label>
                  <input style={inputStyle} type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: +e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Mô tả</label>
                <textarea style={{ ...inputStyle, height: 80, resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <FileUploader
                bucket="thumbnails"
                value={form.thumbnail_url}
                onChange={url => setForm(p => ({ ...p, thumbnail_url: url }))}
                accept="image/*"
                preview="image"
                label="Ảnh thumbnail"
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.875rem' }}>
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} style={{ width: 16, height: 16, accentColor: 'hsl(var(--primary))' }} />
                Hiển thị cho người dùng
              </label>
            </div>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Hủy</button>
              <button id="save-subject-btn" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={save} disabled={saving}>
                {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={15} />}
                {editing ? 'Lưu thay đổi' : 'Tạo môn học'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
