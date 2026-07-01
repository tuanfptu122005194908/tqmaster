import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/lib/AppContext';
import { Heart, MessageCircle, Send, Trash2, Loader2, Newspaper } from 'lucide-react';

interface NewsPost {
  id: string;
  title: string;
  content: string;
  images: string[];
  created_at: string;
}
interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
}

export default function NewsPage() {
  const { profile, isAdmin } = useApp();
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedByMe, setLikedByMe] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const { data: postsData } = await supabase.from('news_posts' as any).select('*').order('created_at', { ascending: false });
    const list: NewsPost[] = (postsData as any) ?? [];
    setPosts(list);

    const { data: likes } = await supabase.from('news_likes' as any).select('post_id, user_id');
    const counts: Record<string, number> = {};
    const mine: Record<string, boolean> = {};
    (likes as any[] ?? []).forEach(l => {
      counts[l.post_id] = (counts[l.post_id] || 0) + 1;
      if (profile && l.user_id === profile.id) mine[l.post_id] = true;
    });
    setLikeCounts(counts);
    setLikedByMe(mine);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const toggleLike = async (postId: string) => {
    if (!profile) return;
    if (likedByMe[postId]) {
      setLikedByMe(s => ({ ...s, [postId]: false }));
      setLikeCounts(s => ({ ...s, [postId]: Math.max(0, (s[postId] || 1) - 1) }));
      await supabase.from('news_likes' as any).delete().eq('post_id', postId).eq('user_id', profile.id);
    } else {
      setLikedByMe(s => ({ ...s, [postId]: true }));
      setLikeCounts(s => ({ ...s, [postId]: (s[postId] || 0) + 1 }));
      await supabase.from('news_likes' as any).insert({ post_id: postId, user_id: profile.id });
    }
  };

  const loadComments = async (postId: string) => {
    const { data } = await supabase.from('news_comments' as any).select('*').eq('post_id', postId).order('created_at', { ascending: true });
    const list: Comment[] = (data as any) ?? [];
    const userIds = [...new Set(list.map(c => c.user_id))];
    if (userIds.length) {
      const { data: profs } = await supabase.from('profiles').select('id, full_name, username, avatar_url').in('id', userIds);
      const map = new Map((profs ?? []).map(p => [p.id, p]));
      list.forEach(c => {
        const p = map.get(c.user_id);
        c.author_name = p?.full_name || p?.username || 'Người dùng';
        c.author_avatar = p?.avatar_url || undefined;
      });
    }
    setComments(s => ({ ...s, [postId]: list }));
  };

  const toggleComments = async (postId: string) => {
    const isOpen = openComments[postId];
    setOpenComments(s => ({ ...s, [postId]: !isOpen }));
    if (!isOpen && !comments[postId]) await loadComments(postId);
  };

  const submitComment = async (postId: string) => {
    if (!profile) return;
    const content = (drafts[postId] || '').trim();
    if (!content) return;
    setDrafts(s => ({ ...s, [postId]: '' }));
    await supabase.from('news_comments' as any).insert({ post_id: postId, user_id: profile.id, content });
    await loadComments(postId);
  };

  const deleteComment = async (postId: string, commentId: string) => {
    if (!confirm('Xoá bình luận này?')) return;
    await supabase.from('news_comments' as any).delete().eq('id', commentId);
    await loadComments(postId);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))' }} />
    </div>
  );

  return (
    <div className="page-shell" style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}>
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Newspaper size={28} style={{ color: 'hsl(var(--primary))' }} /> Tin tức
        </h1>
        <p style={{ color: 'hsl(var(--muted-fg))', marginTop: 4, fontSize: '0.875rem' }}>Cập nhật tin tức mới nhất từ TQMaster</p>
      </div>

      {posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'hsl(var(--muted-fg))' }}>
          <Newspaper size={48} style={{ margin: '0 auto var(--space-3)', opacity: 0.2 }} />
          <p>Chưa có bài viết nào</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {posts.map(post => {
          const liked = !!likedByMe[post.id];
          const count = likeCounts[post.id] || 0;
          const cList = comments[post.id] || [];
          return (
            <article key={post.id} style={{
              background: 'hsl(var(--surface-raised))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'calc(var(--radius) * 2)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-sm)',
            }}>
              {/* Header */}
              <div style={{ padding: 'var(--space-4) var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>T</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem' }}>TQMaster</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>{new Date(post.created_at).toLocaleString('vi-VN')}</div>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
                <h2 style={{ fontWeight: 700, fontSize: '1.0625rem', marginBottom: 'var(--space-2)' }}>{post.title}</h2>
                <p style={{ fontSize: '0.9375rem', color: 'hsl(var(--foreground))', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{post.content}</p>
              </div>

              {/* Images */}
              {post.images?.length > 0 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: post.images.length === 1 ? '1fr' : 'repeat(2, 1fr)',
                  gap: 2,
                }}>
                  {post.images.map((url, i) => (
                    <img key={i} src={url} alt="" loading="lazy" style={{
                      width: '100%',
                      maxHeight: post.images.length === 1 ? 500 : 280,
                      objectFit: 'cover',
                      display: 'block',
                    }} />
                  ))}
                </div>
              )}

              {/* Stats */}
              <div style={{ padding: 'var(--space-2) var(--space-5)', borderTop: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>
                <span>{count > 0 ? `❤️ ${count} lượt thích` : ''}</span>
                <span>{cList.length > 0 ? `${cList.length} bình luận` : ''}</span>
              </div>

              {/* Actions */}
              <div style={{ padding: 'var(--space-1) var(--space-3)', borderTop: '1px solid hsl(var(--border))', display: 'flex', gap: 4 }}>
                <button
                  onClick={() => toggleLike(post.id)}
                  disabled={!profile}
                  style={{
                    flex: 1, padding: '10px', border: 'none', background: 'transparent', cursor: profile ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 'var(--radius)',
                    color: liked ? 'hsl(var(--danger))' : 'hsl(var(--muted-fg))', fontWeight: 600, fontSize: '0.875rem',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Heart size={18} fill={liked ? 'currentColor' : 'none'} /> Thích
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  style={{
                    flex: 1, padding: '10px', border: 'none', background: 'transparent', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 'var(--radius)',
                    color: 'hsl(var(--muted-fg))', fontWeight: 600, fontSize: '0.875rem',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'hsl(var(--muted))'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <MessageCircle size={18} /> Bình luận
                </button>
              </div>

              {/* Comments */}
              {openComments[post.id] && (
                <div style={{ padding: 'var(--space-4) var(--space-5)', borderTop: '1px solid hsl(var(--border))', background: 'hsl(var(--muted) / 0.3)' }}>
                  {cList.length === 0 && <div style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))', textAlign: 'center', padding: 'var(--space-3)' }}>Chưa có bình luận</div>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                    {cList.map(c => (
                      <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'hsl(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                          {(c.author_name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ background: 'hsl(var(--surface-raised))', padding: '8px 12px', borderRadius: 16, border: '1px solid hsl(var(--border))' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.8125rem', marginBottom: 2 }}>{c.author_name}</div>
                            <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-line' }}>{c.content}</div>
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'hsl(var(--muted-fg))', marginTop: 2, padding: '0 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span>{new Date(c.created_at).toLocaleString('vi-VN')}</span>
                            {(isAdmin || profile?.id === c.user_id) && (
                              <button onClick={() => deleteComment(post.id, c.id)} style={{ border: 'none', background: 'none', color: 'hsl(var(--danger))', cursor: 'pointer', fontSize: '0.6875rem', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                                <Trash2 size={11} /> Xoá
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {profile && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 'var(--space-3)' }}>
                      <input
                        type="text"
                        placeholder="Viết bình luận..."
                        value={drafts[post.id] || ''}
                        onChange={e => setDrafts(s => ({ ...s, [post.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') submitComment(post.id); }}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: 999, border: '1px solid hsl(var(--border))', background: 'hsl(var(--surface-raised))', fontSize: '0.875rem', outline: 'none' }}
                      />
                      <button onClick={() => submitComment(post.id)} className="btn-primary" style={{ borderRadius: '50%', width: 40, height: 40, padding: 0, justifyContent: 'center' }}>
                        <Send size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
