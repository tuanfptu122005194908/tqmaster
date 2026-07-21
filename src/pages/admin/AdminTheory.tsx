import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useApp } from '@/lib/AppContext';
import { Plus, Trash2, X, Check, Loader2, FileText, Link as LinkIcon, Image as ImageIcon, Download, Pencil, Search, Filter } from 'lucide-react';
import FileUploader from '@/components/FileUploader';
import { toast } from 'sonner';

type Theory  = Tables<'theories'>;
type Subject = Pick<Tables<'subjects'>, 'id' | 'name' | 'semester'>;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid #cbd5e1', borderRadius: 12,
  fontSize: '0.875rem', outline: 'none', background: '#ffffff',
  color: '#0f172a', transition: 'all 0.15s ease',
  boxSizing: 'border-box'
};

const TYPE_OPTS: Array<{ value: Theory['type']; label: string; icon: React.ReactNode }> = [
  { value: 'file',  label: 'File PDF/Doc', icon: <FileText size={15} /> },
  { value: 'link',  label: 'Link ngoài',   icon: <LinkIcon size={15} /> },
  { value: 'image', label: 'Hình ảnh',     icon: <ImageIcon size={15} /> },
];

const TypeIcon = ({ type }: { type: string }) => {
  if (type === 'image') return <ImageIcon size={16} />;
  if (type === 'link')  return <LinkIcon size={16} />;
  return <FileText size={16} />;
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
  const [searchQuery, setSearchQuery] = useState('');
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

  const filtered = theories.filter(t => {
    const matchSubj = filterSubj === 'all' || getSubjectIds(t).includes(filterSubj);
    const q = searchQuery.toLowerCase();
    const matchQ = !q || t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q);
    return matchSubj && matchQ;
  });

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
    if (!form.title.trim()) { toast.error('Vui lòng nhập tiêu đề tài liệu'); return; }
    if (!form.url)          { toast.error('Vui lòng chọn hoặc dán đường dẫn file/link'); return; }

    setSaving(true);
    let theoryId = form.id;

    if (theoryId) {
      const { error } = await supabase.from('theories').update({
        title: form.title, description: form.description || null,
        type: form.type, url: form.url, file_name: form.file_name || null,
      }).eq('id', theoryId);
      if (error) { toast.error('Lỗi cập nhật: ' + error.message); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from('theories').insert({
        title: form.title, description: form.description || null,
        type: form.type, url: form.url, file_name: form.file_name || null,
        created_by: profile?.id,
      }).select().single();

      if (error || !data) { toast.error('Lỗi tạo mới: ' + (error?.message ?? '')); setSaving(false); return; }
      theoryId = data.id;
    }

    await supabase.from('theory_subjects').delete().eq('theory_id', theoryId);
    if (form.subject_ids.length > 0) {
      await supabase.from('theory_subjects').insert(
        form.subject_ids.map(sid => ({ theory_id: theoryId!, subject_id: sid }))
      );
    }

    toast.success(form.id ? 'Đã cập nhật tài liệu' : 'Đã thêm tài liệu mới');
    setSaving(false);
    setShowForm(false);
    fetchTheories();
  };

  const remove = async (id: string) => {
    if (!confirm('Xóa tài liệu này?')) return;
    const { error } = await supabase.from('theories').delete().eq('id', id);
    if (error) toast.error('Lỗi xóa: ' + error.message);
    else { toast.success('Đã xóa tài liệu'); fetchTheories(); }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 450, background: '#f4f7fc' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );

  return (
    <div style={{ padding: '32px 40px', background: '#f4f7fc', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", color: '#0f172a' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.03em' }}>
            Lý thuyết & Tài liệu
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
            Quản lý tài liệu tham khảo, bài giảng PDF, ảnh và liên kết cho các môn học TQMaster.
          </p>
        </div>

        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#ffffff',
            border: 'none', borderRadius: 14, fontSize: 13.5, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)', transition: 'transform 0.15s ease'
          }}
        >
          <Plus size={18} /> Thêm tài liệu
        </button>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        
        {/* Subject Filter Pills */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4, maxWidth: '100%' }}>
          <button
            onClick={() => setFilterSubj('all')}
            style={{
              padding: '8px 18px', borderRadius: 20, border: '1px solid #cbd5e1',
              fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
              background: filterSubj === 'all' ? '#2563eb' : '#ffffff',
              color: filterSubj === 'all' ? '#ffffff' : '#475569',
              boxShadow: filterSubj === 'all' ? '0 3px 10px rgba(37, 99, 235, 0.3)' : 'none',
            }}
          >
            Tất cả môn ({theories.length})
          </button>
          {subjects.map(s => {
            const count = theories.filter(t => getSubjectIds(t).includes(s.id)).length;
            if (count === 0) return null;
            return (
              <button
                key={s.id}
                onClick={() => setFilterSubj(s.id)}
                style={{
                  padding: '8px 18px', borderRadius: 20, border: '1px solid #cbd5e1',
                  fontSize: 13, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap',
                  background: filterSubj === s.id ? '#2563eb' : '#ffffff',
                  color: filterSubj === s.id ? '#ffffff' : '#475569',
                  boxShadow: filterSubj === s.id ? '0 3px 10px rgba(37, 99, 235, 0.3)' : 'none',
                }}
              >
                {s.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: 280 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm tiêu đề tài liệu..."
            style={{
              width: '100%', padding: '10px 14px 10px 40px', borderRadius: 14,
              border: '1.5px solid #cbd5e1', fontSize: 13.5, outline: 'none', background: '#ffffff',
              color: '#0f172a', boxSizing: 'border-box'
            }}
          />
        </div>
      </div>

      {/* Grid of Theory Items */}
      {filtered.length === 0 ? (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: 60, textAlign: 'center', color: '#94a3b8' }}>
          <FileText size={44} style={{ margin: '0 auto 12px', color: '#cbd5e1' }} />
          <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#475569' }}>Chưa có tài liệu nào</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filtered.map(t => {
            const attachedSubjects = subjects.filter(s => getSubjectIds(t).includes(s.id));
            const isFile = t.type === 'file';
            const isLink = t.type === 'link';
            const isImg  = t.type === 'image';

            const badgeBg = isFile ? '#edf5ff' : isLink ? '#eafaf5' : '#f3eefd';
            const badgeColor = isFile ? '#2563eb' : isLink ? '#059669' : '#8b5cf6';
            const badgeBorder = isFile ? '#dbeafe' : isLink ? '#d1fae5' : '#ede9fe';

            return (
              <div
                key={t.id}
                style={{
                  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 22,
                  padding: 22, boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex',
                  flexDirection: 'column', justifyContent: 'space-between', gap: 14
                }}
              >
                <div>
                  {/* Top Bar: Icon Type & Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{
                      padding: '6px 14px', borderRadius: 16, background: badgeBg, color: badgeColor,
                      border: `1px solid ${badgeBorder}`, fontSize: 12, fontWeight: 800,
                      display: 'inline-flex', alignItems: 'center', gap: 6
                    }}>
                      <TypeIcon type={t.type} />
                      {t.type === 'file' ? 'File tài liệu' : t.type === 'link' ? 'Liên kết' : 'Hình ảnh'}
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => openEdit(t)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: '1.5px solid #cbd5e1',
                          background: '#ffffff', color: '#475569', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Chỉnh sửa"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => remove(t.id)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, border: '1px solid #fecdd3',
                          background: '#fff1f2', color: '#e11d48', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                        title="Xóa tài liệu"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 style={{ fontSize: 16, fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                    {t.title}
                  </h3>
                  {t.description && (
                    <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 12px 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.description}
                    </p>
                  )}
                </div>

                {/* Bottom: Subject Tags & Open URL */}
                <div>
                  {attachedSubjects.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                      {attachedSubjects.map(s => (
                        <span key={s.id} style={{ fontSize: 11.5, fontWeight: 700, padding: '3px 10px', background: '#f1f5f9', color: '#475569', borderRadius: 8 }}>
                          {s.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <a
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      width: '100%', padding: '10px', borderRadius: 12, border: '1.5px solid #dbeafe',
                      background: '#eff6ff', color: '#2563eb', fontSize: 13, fontWeight: 800,
                      textDecoration: 'none', boxSizing: 'border-box'
                    }}
                  >
                    <Download size={15} /> Mở / Tải tài liệu
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Slide-over for Add/Edit */}
      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 200, backdropFilter: 'blur(3px)' }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(460px, 100vw)', background: '#ffffff', boxShadow: '-10px 0 30px rgba(0,0,0,0.15)', zIndex: 201, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#ffffff', zIndex: 2 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {form.id ? 'Chỉnh sửa tài liệu' : 'Thêm tài liệu mới'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ border: 'none', background: '#f1f5f9', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Tiêu đề tài liệu *</label>
                <input style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="VD: Slide Bài giảng Chương 1 - Giải tích" />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Mô tả ngắn</label>
                <textarea style={{ ...inputStyle, height: 72, resize: 'vertical' }} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Tóm tắt nội dung tài liệu..." />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Loại tài liệu</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {TYPE_OPTS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(p => ({ ...p, type: opt.value }))}
                      style={{
                        padding: '10px 8px', borderRadius: 12, border: form.type === opt.value ? '2px solid #2563eb' : '1.5px solid #cbd5e1',
                        background: form.type === opt.value ? '#eff6ff' : '#ffffff', color: form.type === opt.value ? '#2563eb' : '#475569',
                        fontSize: 12.5, fontWeight: 800, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4
                      }}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.type === 'file' ? (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>File tài liệu (PDF/Doc/Zip)</label>
                  <FileUploader
                    bucket="theory-files"
                    value={form.url}
                    onChange={(url, name) => setForm(p => ({ ...p, url, file_name: name || p.file_name }))}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar"
                    preview="file"
                    label="Tải file tài liệu"
                  />
                </div>
              ) : form.type === 'image' ? (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Hình ảnh tài liệu</label>
                  <FileUploader
                    bucket="theory-files"
                    value={form.url}
                    onChange={(url, name) => setForm(p => ({ ...p, url, file_name: name || p.file_name }))}
                    accept="image/*"
                    preview="image"
                    label="Tải ảnh tài liệu"
                  />
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Đường dẫn liên kết (URL)</label>
                  <input style={inputStyle} value={form.url} onChange={e => setForm(p => ({ ...p, url: e.target.value }))} placeholder="https://drive.google.com/..." />
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Thuộc môn học (chọn nhiều)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto', background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  {subjects.map(s => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', color: '#0f172a' }}>
                      <input
                        type="checkbox"
                        checked={form.subject_ids.includes(s.id)}
                        onChange={() => toggleSubject(s.id)}
                        style={{ width: 15, height: 15, accentColor: '#2563eb' }}
                      />
                      Kỳ {s.semester} · {s.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Modal Footer */}
            <div style={{ padding: 20, borderTop: '1px solid #e2e8f0', background: '#ffffff', sticky: 'bottom', display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, padding: 12, borderRadius: 12, border: '1.5px solid #cbd5e1', background: '#ffffff', color: '#475569', fontWeight: 800, cursor: 'pointer' }} onClick={() => setShowForm(false)}>Hủy</button>
              <button style={{ flex: 2, padding: 12, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', color: '#ffffff', fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={save} disabled={saving}>
                {saving ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} strokeWidth={3} />}
                {form.id ? 'Lưu thay đổi' : 'Tạo tài liệu'}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
