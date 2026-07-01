import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useApp } from '@/lib/AppContext';
import { Plus, Trash2, X, Check, Loader2, FileText, Link, Image, Download, Pencil } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import { toast } from 'sonner';

type Theory  = Tables<'theories'>;
type Subject = Pick<Tables<'subjects'>, 'id' | 'name' | 'semester'>;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)',
  fontSize: '0.875rem', outline: 'none', background: 'hsl(var(--surface-raised))',
};

const TYPE_OPTS: Array<{ value: Theory['type']; label: string; icon: React.ReactNode }> = [
  { value: 'file',  label: 'File PDF/Doc', icon: <FileText size={14} /> },
  { value: 'link',  label: 'Link ngoài',   icon: <Link size={14} /> },
  { value: 'image', label: 'Hình ảnh',     icon: <Image size={14} /> },
];

const TypeIcon = ({ type }: { type: string }) => {
  if (type === 'image') return <Image size={15} />;
  if (type === 'link')  return <Link size={15} />;
  return <FileText size={15} />;
};

type FormState = {
  id?: string;
  title: string;
  description: string;
  type: Theory['type'];
  url: string;
  file_name: string;
  subject_ids: string[];
};

const EMPTY_FORM: FormState = {
  title: '', description: '', type: 'file',
  url: '', file_name: '', subject_ids: [],
};

export default function AdminTheory() {
  const { profile } = useApp();
  const [theories,    setTheories]    = useState<any[]>([]);
  const [subjects,    setSubjects]    = useState<Subject[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [showForm,    setShowForm]    = useState(false);
  const [filterSubj,  setFilterSubj]  = useState<string>('all');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const fetchTheories = async () => {
    const { data } = await supabase.from('theories')
      .select('*, theory_subjects(subject_id)')
      .order('sort_order').order('created_at', { ascending: false });
    setTheories(data ?? []);
    setLoading(false);
  };

  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, name, semester').order('semester').order('name');
    setSubjects(data ?? []);
  };

  useEffect(() => { fetchTheories(); fetchSubjects(); }, []);

  const getSubjectIds = (theory: any): string[] =>
    (theory.theory_subjects ?? []).map((ts: any) => ts.subject_id);

  const filtered = filterSubj === 'all'
    ? theories
    : theories.filter(t => getSubjectIds(t).includes(filterSubj));

  const openCreate = () => { setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (t: any) => {
    setForm({
      id: t.id,
      title: t.title,
      description: t.description ?? '',
      type: t.type,
      url: t.url,
      file_name: t.file_name ?? '',
      subject_ids: getSubjectIds(t),
    });
    setShowForm(true);
  };

  const toggleSubject = (id: string) => {
    setForm(p => ({
      ...p,
      subject_ids: p.subject_ids.includes(id)
        ? p.subject_ids.filter(x => x !== id)
        : [...p.subject_ids, id],
    }));
  };

  const save = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error('Vui lòng điền tên và tải lên/nhập URL');
      return;
    }
    setSaving(true);
    try {
      let theoryId = form.id;
      if (theoryId) {
        // Update
        const { error } = await supabase.from('theories').update({
          title: form.title, description: form.description || null,
          type: form.type, url: form.url, file_name: form.file_name || null,
        }).eq('id', theoryId);
        if (error) throw error;
        // Replace subject links
        await supabase.from('theory_subjects').delete().eq('theory_id', theoryId);
      } else {
        const { data: newTheory, error } = await supabase.from('theories').insert({
          title: form.title, description: form.description || null,
          type: form.type, url: form.url,
          file_name: form.file_name || null, created_by: profile?.id,
        }).select().single();
        if (error) throw error;
        theoryId = newTheory.id;
      }
      if (theoryId && form.subject_ids.length > 0) {
        await supabase.from('theory_subjects').insert(
          form.subject_ids.map(sid => ({ theory_id: theoryId!, subject_id: sid }))
        );
      }
      toast.success(form.id ? 'Đã cập nhật tài liệu' : 'Đã thêm tài liệu');
      await fetchTheories();
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (e: any) {
      toast.error('Lỗi: ' + e.message);
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa tài liệu này?')) return;
    await supabase.from('theories').delete().eq('id', id);
    fetchTheories();
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Tài liệu lý thuyết</h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>{theories.length} tài liệu</p>
        </div>
        <button id="create-theory-btn" className="btn-primary" onClick={openCreate}><Plus size={15} /> Thêm tài liệu</button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <button className={`tab-pill ${filterSubj === 'all' ? 'active' : ''}`} onClick={() => setFilterSubj('all')}>Tất cả</button>
        {subjects.map(s => <button key={s.id} className={`tab-pill ${filterSubj === s.id ? 'active' : ''}`} onClick={() => setFilterSubj(s.id)}>{s.name}</button>)}
      </div>

      <div style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 1.5)', overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'hsl(var(--muted-fg))' }}>Chưa có tài liệu nào</div>
        ) : (
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th>Tên tài liệu</th><th>Loại</th><th>Môn học</th><th>URL</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr></thead>
            <tbody>
              {filtered.map((t: any) => {
                const subjectIds = getSubjectIds(t);
                const linkedSubjects = subjects.filter(s => subjectIds.includes(s.id));
                return (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.title}</div>
                      {t.description && <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>{t.description}</div>}
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8125rem' }}>
                        <TypeIcon type={t.type} /> {TYPE_OPTS.find(o => o.value === t.type)?.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {linkedSubjects.map(s => <span key={s.id} className="badge badge-primary">{s.name}</span>)}
                        {linkedSubjects.length === 0 && <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>Chưa gắn</span>}
                      </div>
                    </td>
                    <td>
                      <a href={t.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8125rem', color: 'hsl(var(--primary))', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Download size={12} /> Xem
                      </a>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <button className="btn-ghost" style={{ padding: 6, color: 'hsl(var(--primary))' }} onClick={() => openEdit(t)} title="Chỉnh sửa"><Pencil size={14} /></button>
                        <button className="btn-ghost" style={{ padding: 6, color: 'hsl(var(--danger))' }} onClick={() => remove(t.id)} title="Xoá"><Trash2 size={14} /></button>
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
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(440px, 100vw)', background: 'hsl(var(--surface-raised))', boxShadow: 'var(--shadow-lg)', zIndex: 201, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>{form.id ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu'}</h2>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Tên tài liệu *</label>
                <input id="theory-title-input" style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Loại *</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {TYPE_OPTS.map(o => (
                    <button key={o.value} onClick={() => setForm(p => ({ ...p, type: o.value }))}
                      style={{ flex: 1, padding: 'var(--space-2)', border: `1px solid ${form.type === o.value ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`, borderRadius: 'var(--radius)', background: form.type === o.value ? 'hsl(var(--primary-muted))' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: '0.8125rem', color: form.type === o.value ? 'hsl(var(--primary))' : 'hsl(var(--muted-fg))' }}>
                      {o.icon} {o.label}
                    </button>
                  ))}
                </div>
              </div>
              {form.type === 'link' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>URL *</label>
                  <input style={inputStyle} value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://..." />
                </div>
              ) : (
                <FileUploader
                  bucket={form.type === 'image' ? 'theory-images' : 'theory-files'}
                  value={form.url}
                  onChange={url => setForm(p => ({
                    ...p,
                    url,
                    file_name: p.file_name || (url ? decodeURIComponent(url.split('/').pop() ?? '') : ''),
                  }))}
                  accept={form.type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt'}
                  preview={form.type === 'image' ? 'image' : 'file'}
                  maxSizeMB={20}
                  label={form.type === 'image' ? 'Tải ảnh lên *' : 'Tải file lên *'}
                />
              )}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Tên file hiển thị</label>
                <input style={inputStyle} value={form.file_name} onChange={e => setForm(p => ({ ...p, file_name: e.target.value }))} placeholder="VD: slide-chuong1.pdf" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>
                  Gắn vào môn học <span style={{ color: 'hsl(var(--muted-fg))', fontWeight: 400 }}>(có thể chọn nhiều)</span>
                </label>
                <div style={{
                  border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)',
                  background: 'hsl(var(--surface-raised))', maxHeight: 240, overflow: 'auto',
                  padding: 'var(--space-2)',
                }}>
                  {subjects.length === 0 ? (
                    <div style={{ padding: 'var(--space-3)', fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>Chưa có môn học</div>
                  ) : (
                    (() => {
                      // Group by semester
                      const bySem: Record<number, Subject[]> = {};
                      subjects.forEach(s => { (bySem[s.semester] ??= []).push(s); });
                      const sems = Object.keys(bySem).map(Number).sort((a, b) => a - b);
                      return sems.map(sem => (
                        <div key={sem} style={{ marginBottom: 'var(--space-2)' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'hsl(var(--muted-fg))', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 6px' }}>
                            Kỳ {sem}
                          </div>
                          {bySem[sem].map(s => {
                            const checked = form.subject_ids.includes(s.id);
                            return (
                              <label key={s.id} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                                background: checked ? 'hsl(var(--primary-muted))' : 'transparent',
                                fontSize: '0.875rem',
                              }}>
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSubject(s.id)}
                                  style={{ width: 16, height: 16, accentColor: 'hsl(var(--primary))', cursor: 'pointer' }}
                                />
                                <span style={{ color: checked ? 'hsl(var(--primary))' : 'inherit', fontWeight: checked ? 600 : 400 }}>{s.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      ));
                    })()
                  )}
                </div>
                {form.subject_ids.length > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))', marginTop: 6 }}>
                    Đã chọn {form.subject_ids.length} môn
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Mô tả</label>
                <textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Hủy</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={save} disabled={saving}>
                {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={15} />}
                {form.id ? 'Lưu thay đổi' : 'Thêm tài liệu'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
