import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Trash2, Edit2, MessageCircle, Star } from 'lucide-react';
import { Review } from '@/components/ProductReviews';
import { getFakeReviews, saveFakeReviews } from '@/lib/reviewsStore';
import { toast } from 'sonner';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setReviews(getFakeReviews());
  }, []);

  const handleStatusChange = (id: string, status: 'approved' | 'rejected' | 'pending') => {
    const newReviews = reviews.map(r => r.id === id ? { ...r, status } : r);
    setReviews(newReviews);
    saveFakeReviews(newReviews);
    toast.success(`Đã chuyển trạng thái thành ${status}`);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xoá đánh giá này?")) {
      const newReviews = reviews.filter(r => r.id !== id);
      setReviews(newReviews);
      saveFakeReviews(newReviews);
      toast.success("Đã xoá đánh giá.");
    }
  };

  const handleReply = (id: string) => {
    const text = replyText[id];
    if (!text) {
      toast.error("Vui lòng nhập nội dung phản hồi.");
      return;
    }
    const newReviews = reviews.map(r => {
      if (r.id === id) {
        return {
          ...r,
          adminReply: {
            date: new Date().toLocaleDateString('vi-VN'),
            content: text,
          }
        };
      }
      return r;
    });
    setReviews(newReviews);
    saveFakeReviews(newReviews);
    toast.success("Đã lưu phản hồi.");
    setReplyText(prev => ({ ...prev, [id]: '' }));
  };

  const pendingCount = reviews.filter(r => r.status === 'pending').length;

  return (
    <div style={{ padding: '24px 32px', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      
      {/* ── HEADER TQMASTER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
            Quản lý Đánh giá
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: '6px 0 0 0', fontWeight: 500 }}>
            Duyệt và phản hồi các đánh giá từ người dùng (Dữ liệu giả lập).
          </p>
        </div>
      </div>

      {/* ── TOP STAT CARDS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 18,
        marginBottom: 24,
      }}>
        {/* Card 1: Tổng đánh giá */}
        <div style={{
          background: '#edf5ff',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #dbeafe',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#2563eb', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.15)'
            }}>
              <Star size={20} />
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
            Tổng Đánh Giá
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
            {reviews.length}
          </div>
        </div>

        {/* Card 2: Chờ duyệt */}
        <div style={{
          background: '#fff7ed',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #ffedd5',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#f59e0b', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.18)'
            }}>
              <Shield size={20} />
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
            Đang Chờ Duyệt
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
            {pendingCount}
          </div>
        </div>
      </div>

      {/* ── TABLE WRAPPER ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: 24,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 800 }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Người dùng</th>
                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Đánh giá</th>
                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Nội dung</th>
                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Trạng thái</th>
                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Phản hồi</th>
                <th style={{ padding: '16px 20px', fontSize: 13, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i === reviews.length - 1 ? 'none' : '1px solid #f1f5f9', transition: 'background 0.2s ease' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{r.userName}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, fontWeight: 500 }}>{r.date}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f59e0b', fontSize: 15, fontWeight: 800 }}>
                      {r.rating} <Star size={16} fill="currentColor" color="currentColor" />
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', maxWidth: 300 }}>
                    <div style={{ fontSize: 14, color: '#334155', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.content}
                    </div>
                    {r.adminReply && (
                      <div style={{ marginTop: 6, fontSize: 12, color: '#2563eb', fontWeight: 600, borderLeft: '2px solid #bfdbfe', paddingLeft: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        Admin: {r.adminReply.content}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 800,
                      backgroundColor: r.status === 'approved' ? '#dcfce7' : r.status === 'rejected' ? '#ffe4e6' : '#fef3c7',
                      color: r.status === 'approved' ? '#15803d' : r.status === 'rejected' ? '#e11d48' : '#b45309'
                    }}>
                      {r.status === 'approved' ? 'Đã duyệt' : r.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {!r.adminReply ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input 
                          type="text" 
                          placeholder="Nhập phản hồi..."
                          value={replyText[r.id] || ''}
                          onChange={(e) => setReplyText({ ...replyText, [r.id]: e.target.value })}
                          style={{
                            border: '1.5px solid #cbd5e1', borderRadius: 8, padding: '6px 12px',
                            fontSize: 13, outline: 'none', width: 140, fontWeight: 500,
                            transition: 'border 0.2s'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                          onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                        />
                        <button 
                          onClick={() => handleReply(r.id)}
                          style={{
                            background: '#eff6ff', color: '#2563eb', border: 'none',
                            padding: 6, borderRadius: 8, cursor: 'pointer'
                          }}
                        >
                          <MessageCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Đã phản hồi</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                      {r.status !== 'approved' && (
                        <button 
                          onClick={() => handleStatusChange(r.id, 'approved')}
                          style={{ background: '#ecfdf5', color: '#10b981', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer' }}
                          title="Duyệt"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button 
                          onClick={() => handleStatusChange(r.id, 'rejected')}
                          style={{ background: '#fff1f2', color: '#f43f5e', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer' }}
                          title="Từ chối"
                        >
                          <XCircle size={18} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(r.id)}
                        style={{ background: '#f1f5f9', color: '#64748b', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer' }}
                        title="Xoá"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: 14, fontWeight: 500 }}>
                    Chưa có đánh giá nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
