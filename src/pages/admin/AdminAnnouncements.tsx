import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useApp } from '@/lib/AppContext';
import { formatDate } from '@/lib/mockData';
import { Plus, Trash2, Pencil, X, Bell, BellOff, Loader2, Filter, Clock, BarChart2, Tag } from 'lucide-react';
import FileUploader from '@/components/FileUploader';

type Announcement = Tables<'announcements'>;
type Subject = Pick<Tables<'subjects'>, 'id' | 'name'>;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #cbd5e1', borderRadius: 12,
  fontSize: '0.875rem', outline: 'none', background: '#ffffff',
  color: '#0f172a',
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

  const openCreate = () => { setForm({ title: '', content: '', subject_id: '', image_url: '' }); setEditing(null); setShowForm(true); };
  const openEdit   = (a: Announcement) => { setForm({ title: a.title, content: a.content ?? '', subject_id: a.subject_id ?? '', image_url: a.image_url ?? '' }); setEditing(a.id); setShowForm(true); };

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

  const subjectName = (id: string | null) => id ? (subjects.find(s => s.id === id)?.name ?? '—') : 'Tất cả sinh viên';

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, background: '#f4f7fc' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );

  return (
    <div className="admin-announcements-container" style={{ padding: '32px 40px', background: '#f4f7fc', minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", color: '#0f172a' }}>
      
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 6px 0' }}>
            Thông báo
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
            Quản lý và điều phối các thông báo hệ thống đến người dùng.
          </p>
        </div>

        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#ffffff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800,
            cursor: 'pointer', boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)'
          }}
        >
          <Plus size={18} /> Đăng thông báo
        </button>
      </div>

      {/* ── FILTER BAR CARD ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '20px 24px',
        border: '1px solid #e2e8f0',
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 800, color: '#2563eb' }}>
            <Filter size={16} /> Lọc theo môn học
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '4px 12px', borderRadius: 14 }}>
            {subjects.length} Môn học
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterSubj('all')}
            style={{
              padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              background: filterSubj === 'all' ? '#2563eb' : '#f1f5f9',
              color: filterSubj === 'all' ? '#ffffff' : '#475569',
              boxShadow: filterSubj === 'all' ? '0 3px 10px rgba(37, 99, 235, 0.3)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Tất cả
          </button>
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => setFilterSubj(s.id)}
              style={{
                padding: '7px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                background: filterSubj === s.id ? '#2563eb' : '#f1f5f9',
                color: filterSubj === s.id ? '#ffffff' : '#475569',
                boxShadow: filterSubj === s.id ? '0 3px 10px rgba(37, 99, 235, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── ANNOUNCEMENTS LIST / DASHED EMPTY STATE ── */}
      {filtered.length === 0 ? (
        <div style={{
          background: '#ffffff',
          border: '2px dashed #cbd5e1',
          borderRadius: 24,
          padding: '48px 32px 32px 32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        }}>
          {/* Bell Icon Circle Badge */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#f1f5f9', color: '#94a3b8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px auto'
          }}>
            <BellOff size={36} />
          </div>

          <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', textAlign: 'center', marginBottom: 8 }}>
            Chưa có thông báo nào
          </h2>
          <p style={{ fontSize: 13.5, color: '#64748b', textAlign: 'center', maxWidth: 480, margin: '0 auto 36px auto', lineHeight: 1.5 }}>
            Hiện tại chưa có thông báo nào được đăng cho các môn học này. Hãy nhấn nút "Đăng thông báo" để bắt đầu.
          </p>

          {/* 3 Feature Insight Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
            {/* Feature 1 */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <Clock size={22} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                Lên lịch gửi
              </div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
                Gửi thông báo vào thời điểm thích hợp cho sinh viên.
              </div>
            </div>

            {/* Feature 2 */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#f3eefd', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <Tag size={22} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                Phân loại
              </div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
                Gắn thẻ thông báo theo mức độ quan trọng: Gấp, Thường.
              </div>
            </div>

            {/* Feature 3 */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: '#eafaf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <BarChart2 size={22} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                Theo dõi
              </div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.45 }}>
                Xem số lượng sinh viên đã đọc thông báo của bạn.
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {filtered.map(ann => (
            <div key={ann.id} style={{
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '22px 26px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ padding: '3px 10px', borderRadius: 12, background: '#e0e7ff', color: '#2563eb', fontSize: 11, fontWeight: 800 }}>
                    {subjectName(ann.subject_id)}
                  </span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>
                    {formatDate(ann.created_at)}
                  </span>
                </div>

                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                  {ann.title}
                </h3>

                {ann.content && (
                  <p style={{ fontSize: 14, color: '#475569', margin: '0 0 12px 0', lineHeight: 1.5 }}>
                    {ann.content}
                  </p>
                )}

                {ann.image_url && (
                  <div style={{ maxWidth: 320, borderRadius: 12, overflow: 'hidden', border: '1px solid #e2e8f0', marginTop: 8 }}>
                    <img src={ann.image_url} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <button onClick={() => openEdit(ann)} style={{ padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 10, color: '#475569', cursor: 'pointer' }}>
                  <Pencil size={16} />
                </button>
                <button onClick={() => remove(ann.id)} style={{ padding: 8, background: '#ffe4e6', border: 'none', borderRadius: 10, color: '#e11d48', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── CREATE / EDIT FORM MODAL ── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#ffffff', width: '100%', maxWidth: 500, borderRadius: 24,
            padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {editing ? 'Sửa thông báo' : 'Tạo thông báo mới'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Tiêu đề thông báo</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="VD: Thông báo lịch thi học kỳ" style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Dành cho môn học</label>
                <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })} style={inputStyle}>
                  <option value="">Tất cả sinh viên (Thông báo chung)</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Nội dung chi tiết</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={4} placeholder="Nhập nội dung chi tiết thông báo..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Hình ảnh đính kèm (URL)</label>
                <FileUploader onUploadComplete={(url) => setForm(f => ({ ...f, image_url: url }))} currentUrl={form.image_url} label="Tải ảnh đính kèm" />
              </div>

              <button
                onClick={save} disabled={saving}
                style={{
                  height: 48, width: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800,
                  cursor: saving ? 'not-allowed' : 'pointer', marginTop: 10, boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)'
                }}
              >
                {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : (editing ? 'Lưu thay đổi' : 'Đăng thông báo')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .admin-announcements-container {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
