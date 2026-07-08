import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useApp } from '@/lib/AppContext';
import { formatDate } from '@/lib/mockData';
import { Plus, Trash2, Pencil, X, Check, Bell, Loader2 } from 'lucide-react';
import FileUploader from '@/components/FileUploader';

type Announcement = Tables<'announcements'>;
type Subject = Pick<Tables<'subjects'>, 'id' | 'name'>;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px',
  border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)',
  fontSize: '0.875rem', outline: 'none', background: 'hsl(var(--surface-raised))',
};

export default function AdminAnnouncements() {
  const { profile } = useApp();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [subjects,      setSubjects]      = useState<Subject[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [showForm,      setShowForm]      = useState(false);
  const [editing,       setEditing]       = useState<string | null>(null);
  const [filterSubj,    setFilterSubj]    = useState<string>('all');
  const [form, setForm] = useState({ title: '', content: '', subject_id: '', image_url: '' });

  const fetchAnn = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
    setAnnouncements(data ?? []);
    setLoading(false);
  };
  const fetchSubjects = async () => {
    const { data } = await supabase.from('subjects').select('id, name');
    setSubjects(data ?? []);
  };

  useEffect(() => { fetchAnn(); fetchSubjects(); }, []);

  const filtered = filterSubj === 'all'
    ? announcements
    : announcements.filter(a => a.subject_id === filterSubj);

  const openCreate = () => { setForm({ title: '', content: '', subject_id: subjects[0]?.id ?? '', image_url: '' }); setEditing(null); setShowForm(true); };
  const openEdit   = (a: Announcement) => { setForm({ title: a.title, content: a.content ?? '', subject_id: a.subject_id, image_url: a.image_url ?? '' }); setEditing(a.id); setShowForm(true); };

  const save = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = { title: form.title, content: form.content || null, subject_id: form.subject_id || null, image_url: form.image_url || null };
    if (editing) {
      await supabase.from('announcements').update(payload).eq('id', editing);
    } else {
      await supabase.from('announcements').insert({ ...payload, created_by: profile?.id });
    }
    await fetchAnn();
    setSaving(false);
    setShowForm(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa thông báo này?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    fetchAnn();
  };

  const subjectName = (id: string) => subjects.find(s => s.id === id)?.name ?? '—';

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Thông báo</h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>{announcements.length} thông báo</p>
        </div>
        <button id="create-ann-btn" className="btn-primary" onClick={openCreate}><Plus size={15} /> Đăng thông báo</button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-5)', flexWrap: 'wrap' }}>
        <button className={`tab-pill ${filterSubj === 'all' ? 'active' : ''}`} onClick={() => setFilterSubj('all')}>Tất cả</button>
        {subjects.map(s => <button key={s.id} className={`tab-pill ${filterSubj === s.id ? 'active' : ''}`} onClick={() => setFilterSubj(s.id)}>{s.name}</button>)}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'hsl(var(--muted-fg))' }}>
            <Bell size={40} style={{ margin: '0 auto var(--space-3)', opacity: 0.2 }} />
            <p>Chưa có thông báo nào</p>
          </div>
        )}
        {filtered.map(ann => (
          <div key={ann.id} style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 1.5)', padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                  <span className="badge badge-primary">{subjectName(ann.subject_id)}</span>
                  <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>{formatDate(ann.created_at)}</span>
                </div>
                <h3 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{ann.title}</h3>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button id={`edit-ann-${ann.id}`} className="btn-ghost" style={{ padding: 6 }} onClick={() => openEdit(ann)}><Pencil size={14} /></button>
                <button className="btn-ghost" style={{ padding: 6, color: 'hsl(var(--danger))' }} onClick={() => remove(ann.id)}><Trash2 size={14} /></button>
              </div>
            </div>
            {ann.image_url && <img src={ann.image_url} alt="" style={{ maxHeight: 180, borderRadius: 'var(--radius)', marginBottom: 8, border: '1px solid hsl(var(--border))' }} />}
            {ann.content && <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-fg))', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{ann.content}</p>}
          </div>
        ))}
      </div>

      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'hsl(240 20% 12% / 0.4)', zIndex: 200 }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 420, background: 'hsl(var(--surface-raised))', boxShadow: 'var(--shadow-lg)', zIndex: 201, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>{editing ? 'Sửa thông báo' : 'Đăng thông báo mới'}</h2>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Môn học *</label>
                <select id="ann-subject-select" style={inputStyle} value={form.subject_id} onChange={e => setForm(p => ({ ...p, subject_id: e.target.value }))}>
                  <option value="">-- Chọn môn học --</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Tiêu đề *</label>
                <input id="ann-title-input" style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Tiêu đề thông báo" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Nội dung</label>
                <textarea style={{ ...inputStyle, height: 140, resize: 'vertical' }} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Nội dung thông báo..." />
              </div>
              <FileUploader
                bucket="announcement-images"
                value={form.image_url}
                onChange={url => setForm(p => ({ ...p, image_url: url }))}
                accept="image/*"
                preview="image"
                label="Ảnh đính kèm (tùy chọn)"
              />
            </div>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Hủy</button>
              <button id="save-ann-btn" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={save} disabled={saving}>
                {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={15} />}
                {editing ? 'Lưu' : 'Đăng thông báo'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
