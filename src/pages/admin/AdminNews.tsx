import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/lib/AppContext';
import { Plus, Trash2, Pencil, X, Check, Newspaper, Loader2, Image as ImageIcon, Upload } from 'lucide-react';

interface NewsPost {
  id: string;
  title: string;
  content: string;
  images: string[];
  created_at: string;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)',
  fontSize: '0.875rem', outline: 'none', background: 'hsl(var(--surface-raised))',
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

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Tin tức</h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>{posts.length} bài viết công khai</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={15} /> Đăng bài mới</button>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        {posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'hsl(var(--muted-fg))' }}>
            <Newspaper size={40} style={{ margin: '0 auto var(--space-3)', opacity: 0.2 }} />
            <p>Chưa có bài viết nào</p>
          </div>
        )}
        {posts.map(p => (
          <div key={p.id} style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 1.5)', padding: 'var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{p.title}</h3>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>{new Date(p.created_at).toLocaleString('vi-VN')}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button className="btn-ghost" style={{ padding: 6 }} onClick={() => openEdit(p)}><Pencil size={14} /></button>
                <button className="btn-ghost" style={{ padding: 6, color: 'hsl(var(--danger))' }} onClick={() => remove(p.id)}><Trash2 size={14} /></button>
              </div>
            </div>
            {p.images?.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6, marginBottom: 8 }}>
                {p.images.slice(0, 4).map((url, i) => (
                  <img key={i} src={url} alt="" loading="lazy" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--radius)' }} />
                ))}
              </div>
            )}
            <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-fg))', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{p.content}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <>
          <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200 }} />
          <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(480px, 100%)', background: 'hsl(var(--surface-raised))', boxShadow: 'var(--shadow-lg)', zIndex: 201, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem' }}>{editing ? 'Sửa bài viết' : 'Đăng bài mới'}</h2>
              <button className="btn-ghost" style={{ padding: 6 }} onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Tiêu đề *</label>
                <input style={inputStyle} value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Tiêu đề bài viết" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Nội dung *</label>
                <textarea style={{ ...inputStyle, minHeight: 200, resize: 'vertical' }} value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder="Bạn đang nghĩ gì?..." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>Ảnh đính kèm</label>
                {form.images.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 8 }}>
                    {form.images.map((url, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={url} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }} />
                        <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: 4, right: 4, background: 'hsl(var(--danger))', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="btn-ghost" style={{ border: '1px dashed hsl(var(--border))', padding: '10px 14px', fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  {uploading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={14} />}
                  {uploading ? 'Đang tải...' : 'Tải ảnh lên'}
                  <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => onUpload(e.target.files)} />
                </label>
              </div>
            </div>
            <div style={{ padding: 'var(--space-5) var(--space-6)', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: 'var(--space-3)' }}>
              <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Hủy</button>
              <button className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} onClick={save} disabled={saving}>
                {saving ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={15} />}
                {editing ? 'Lưu thay đổi' : 'Đăng bài'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
