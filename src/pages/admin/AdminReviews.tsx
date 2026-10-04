import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Trash2, Edit2, MessageCircle } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quản lý Đánh giá</h2>
          <p className="text-sm text-slate-500 mt-1">Duyệt và phản hồi các đánh giá từ người dùng (Dữ liệu giả lập).</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium">
          <Shield size={16} />
          {reviews.filter(r => r.status === 'pending').length} chờ duyệt
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-4 py-3">Người dùng</th>
                <th className="px-4 py-3">Đánh giá</th>
                <th className="px-4 py-3">Nội dung</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Phản hồi</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reviews.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{r.userName}</div>
                    <div className="text-xs text-slate-500">{r.date}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center text-amber-500">
                      {r.rating} <span className="material-symbols-outlined text-[16px] ml-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate text-slate-700" title={r.content}>{r.content}</p>
                    {r.adminReply && (
                      <div className="mt-1 text-xs text-blue-600 truncate border-l-2 border-blue-200 pl-2">
                        Admin: {r.adminReply.content}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      r.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      r.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {r.status === 'approved' ? 'Đã duyệt' : r.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {!r.adminReply ? (
                      <div className="flex items-center gap-2">
                        <input 
                          type="text" 
                          placeholder="Nhập phản hồi..."
                          className="border border-slate-200 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:border-blue-400"
                          value={replyText[r.id] || ''}
                          onChange={(e) => setReplyText({ ...replyText, [r.id]: e.target.value })}
                        />
                        <button onClick={() => handleReply(r.id)} className="text-blue-600 hover:text-blue-700">
                          <MessageCircle size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Đã phản hồi</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {r.status !== 'approved' && (
                        <button onClick={() => handleStatusChange(r.id, 'approved')} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded" title="Duyệt">
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button onClick={() => handleStatusChange(r.id, 'rejected')} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded" title="Từ chối">
                          <XCircle size={18} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(r.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded" title="Xoá">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
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
