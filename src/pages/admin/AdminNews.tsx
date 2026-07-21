import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/lib/AppContext';
import { Plus, Trash2, Pencil, X, Newspaper, Loader2, Image as ImageIcon, Upload, Clock, Eye, Calendar, TrendingUp, ChevronRight, FilePlus } from 'lucide-react';

interface NewsPost {
  id: string;
  title: string;
  content: string;
  images: string[];
  created_at: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #cbd5e1', borderRadius: 12,
  fontSize: '0.875rem', outline: 'none', background: '#ffffff',
  color: '#0f172a',
};

export default function AdminNews() {
  const { profile } = useApp();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<{ title: string; content: string; images: string[] }>({ title: '', content: '', images: [] });

  const fetchPosts = async () => {
    const { data } = await supabase.from('news_posts' as any).select('*').order('created_at', { ascending: false });
    setPosts((data as any) ?? []);
    setLoading(false);
  };
  useEffect(() => { fetchPosts(); }, []);

  const openCreate = () => { setForm({ title: '', content: '', images: [] }); setEditing(null); setShowForm(true); };
  const openEdit = (p: NewsPost) => { setForm({ title: p.title, content: p.content, images: p.images || [] }); setEditing(p.id); setShowForm(true); };

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('news-images').upload(path, file, { contentType: file.type, cacheControl: '3600' });
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('news-images').getPublicUrl(path);
        urls.push(publicUrl);
      }
    }
    setForm(p => ({ ...p, images: [...p.images, ...urls] }));
    setUploading(false);
  };

  const removeImage = (idx: number) => setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== idx) }));

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    if (editing) {
      await supabase.from('news_posts' as any).update({ title: form.title, content: form.content, images: form.images }).eq('id', editing);
    } else {
      await supabase.from('news_posts' as any).insert({ title: form.title, content: form.content, images: form.images, created_by: profile?.id });
    }
    await fetchPosts();
    setSaving(false);
    setShowForm(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Xoá bài viết này?')) return;
    await supabase.from('news_posts' as any).delete().eq('id', id);
    fetchPosts();
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, background: '#f4f7fc' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );

  return (
    <div className="admin-news-container" style={{ padding: '28px 36px', flex: 1, minWidth: 0, background: '#f4f7fc', minHeight: '100vh', color: '#0f172a', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 6px 0' }}>
            Tin tức
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13.5, color: '#64748b', fontWeight: 500 }}>
            <span>🌐</span> {posts.length} bài viết công khai
          </div>
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
          <Plus size={18} /> Đăng bài mới
        </button>
      </div>

      {/* ── NEWS POSTS LIST ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
        {posts.length === 0 ? (
          <div style={{
            background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24,
            padding: '56px 24px', textAlign: 'center', color: '#64748b'
          }}>
            <Newspaper size={48} style={{ margin: '0 auto 12px auto', color: '#cbd5e1' }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Chưa có bài viết tin tức nào</div>
            <p style={{ fontSize: 13, margin: 0 }}>Nhấn nút "Đăng bài mới" ở trên để phát hành tin tức đầu tiên.</p>
          </div>
        ) : (
          posts.map(p => {
            const hasImg = p.images && p.images.length > 0;
            const createdDate = new Date(p.created_at);
            const formattedTime = `${createdDate.toLocaleTimeString('vi-VN')} ${createdDate.toLocaleDateString('vi-VN')}`;

            return (
              <div key={p.id} className="admin-news-card" style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 22,
                padding: '24px 28px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                gap: 24,
                position: 'relative',
                alignItems: 'flex-start',
              }}>
                {/* Featured Image Thumbnail */}
                <div style={{
                  width: 200,
                  height: 135,
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#f1f5f9',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #e2e8f0',
                }}>
                  {hasImg ? (
                    <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Newspaper size={36} style={{ color: '#cbd5e1' }} />
                  )}
                </div>

                {/* Right Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div>
                      {/* Badge Nổi bật */}
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 12,
                        background: '#e0e7ff', color: '#4f46e5', fontSize: 11, fontWeight: 800,
                        marginBottom: 8
                      }}>
                        Nổi bật
                      </span>

                      {/* Post Title */}
                      <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                        {p.title}
                      </h2>

                      {/* Metadata */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 12 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={14} /> {formattedTime}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Eye size={14} /> 1.2k lượt xem
                        </span>
                      </div>
                    </div>

                    {/* Edit & Delete Action Buttons */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button onClick={() => openEdit(p)} style={{ padding: 8, background: '#f1f5f9', border: 'none', borderRadius: 10, color: '#475569', cursor: 'pointer' }}>
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => remove(p.id)} style={{ padding: 8, background: '#ffe4e6', border: 'none', borderRadius: 10, color: '#e11d48', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Content snippet */}
                  <p style={{
                    fontSize: 13.5, color: '#475569', margin: '0 0 16px 0', lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {p.content}
                  </p>

                  {/* Author avatar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13
                    }}>
                      A
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.1 }}>Quản trị viên</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>System Admin</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── BOTTOM 2 CARDS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: Lên lịch bài viết tiếp theo (Dashed Border Card) */}
        <div style={{
          background: '#ffffff',
          border: '2px dashed #cbd5e1',
          borderRadius: 22,
          padding: '28px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f1f5f9', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <FilePlus size={24} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
            Lên lịch bài viết tiếp theo
          </div>
          <div style={{ fontSize: 12.5, color: '#64748b', maxWidth: 320, lineHeight: 1.4 }}>
            Thu hút thêm học viên bằng những tin tức mới nhất về khóa học.
          </div>
        </div>

        {/* Right: Thống kê tin tức (Solid White Card) */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: 22,
          padding: '24px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
          cursor: 'pointer',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 50, height: 50, borderRadius: 16, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 3 }}>
                Thống kê tin tức
              </div>
              <div style={{ fontSize: 12.5, color: '#64748b', fontWeight: 500 }}>
                Tăng trưởng 15% so với tháng trước
              </div>
            </div>
          </div>
          <ChevronRight size={20} style={{ color: '#94a3b8' }} />
        </div>
      </div>

      {/* ── CREATE / EDIT FORM MODAL ── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#ffffff', width: '100%', maxWidth: 540, borderRadius: 24,
            padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {editing ? 'Sửa bài viết tin tức' : 'Đăng bài viết tin tức mới'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Tiêu đề bài viết</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="VD: Nhận Rush Coursera cấp tốc" style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Hình ảnh bài viết</label>
                <input type="file" accept="image/*" multiple onChange={e => onUpload(e.target.files)} style={{ display: 'none' }} id="news-img-upload" />
                <label htmlFor="news-img-upload" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px', border: '2px dashed #cbd5e1', borderRadius: 12,
                  cursor: 'pointer', color: '#2563eb', fontWeight: 700, fontSize: 13, background: '#f8fafc'
                }}>
                  <Upload size={18} /> {uploading ? 'Đang tải ảnh...' : 'Tải ảnh bìa bài viết lên'}
                </label>
                {form.images.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                    {form.images.map((img, i) => (
                      <div key={i} style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Nội dung bài viết</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={5} placeholder="Nhập nội dung chi tiết bài viết..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <button
                onClick={save} disabled={saving || uploading}
                style={{
                  height: 48, width: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800,
                  cursor: saving ? 'not-allowed' : 'pointer', marginTop: 10, boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)'
                }}
              >
                {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : (editing ? 'Lưu thay đổi' : 'Đăng bài viết')}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .admin-news-container {
            padding: 16px !important;
          }
          .admin-news-card {
            flex-direction: column !important;
          }
          .admin-news-card > div:first-child {
            width: 100% !important;
            height: 180px !important;
          }
        }
      `}</style>
    </div>
  );
}
