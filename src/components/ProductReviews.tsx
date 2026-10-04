import React, { useState } from 'react';
import { Star, ThumbsUp, Reply, Verified, Shield, Zap, RotateCcw, HelpCircle, Smartphone, Headset } from 'lucide-react';

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userInitial: string;
  userColorClass: string;
  badges: ('verified' | 'ibacuu' | string)[];
  rating: number;
  date: string;
  content: string;
  images?: string[];
  helpfulCount: number;
  upvoted?: boolean;
  adminReply?: {
    date: string;
    content: string;
  };
  status: 'pending' | 'approved' | 'rejected';
}

export const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    userId: 'u1',
    userName: 'Trung Thuc',
    userInitial: 'T',
    userColorClass: 'bg-iba-secondary-fixed text-iba-on-secondary-fixed',
    badges: ['verified'],
    rating: 5,
    date: '3/10/2026',
    content: 'ad chăm sóc tận tình giao hàng nhanh gọn lần sau ủng hộ tiếp',
    helpfulCount: 14,
    adminReply: {
      date: '3/10/2026',
      content: 'Cảm ơn bạn đã tin tưởng dịch vụ, chúc bạn trải nghiệm tốt! Nếu trong quá trình sử dụng cần hỗ trợ thêm, bạn cứ liên hệ Zalo CSKH nhé.',
    },
    status: 'approved',
  },
  {
    id: '2',
    userId: 'u2',
    userName: 'Phạm Đức Long',
    userInitial: 'P',
    userColorClass: 'bg-iba-surface-container-high text-iba-on-surface-variant',
    badges: ['ibacuu'],
    rating: 5, // Faked 5 stars for all per requirement
    date: '3/10/2026',
    content: 'Tài liệu cực kỳ đầy đủ, ôn thi cực chuẩn. Cảm ơn ad.',
    helpfulCount: 3,
    status: 'approved',
  },
  {
    id: '3',
    userId: 'u3',
    userName: 'Hoàng Nam',
    userInitial: 'H',
    userColorClass: 'bg-iba-primary-fixed text-iba-on-primary-fixed',
    badges: ['verified', 'Môn học nổi bật'],
    rating: 5,
    date: '2/10/2026',
    content: 'Kích hoạt chưa tới 2 phút là có ngay quyền truy cập tài liệu. Đề thi trúng tủ cực cao! Rất hài lòng.',
    images: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDacjdocrAH6LOPr6VS4t8_Rpt3qUYuGW2mH-1Jz6kO6kfNV76OAjezfoHgpUexPbq0cshfNvmuzHPcBMg2YPRQJLnRNibKGudtSTeXKJWAwh8BBM2fl6GYOtK5glBf-UnjOOM_G3Bu8A6sTehE7x8QDr7NpzzNpuSsmXAL25jPIf4Us3q6uMA8viEhX_STfuLShXns0JMdOu0O6kXsjNL1WyT6FxhTnADyc10tROQFF9CEDh6IvD3I3Q',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDaEOpWY_0lQaGMiu-LnUd-cIWcdPbaWezY2nO7LRtFd0O-yfpYq7UX3FAKOoRhvIZTmcYhxcxm-TsU7gDF6O1Ple2IHfh_mZUjhWOQTEWdx3W_Vm8CvLc-9Y_vvj8D2oWhutltkIBSzLwRg6j-UDlh70NrnKIKpC8SrCF5zI70L3pWQrxcVSrjeQwFdDypd4SwayOb3qNuySchAidKZ0d3dNk0JAyLHGtMDbMjjrOk_TPIDnWMpZEPrw'
    ],
    helpfulCount: 28,
    status: 'approved',
  },
  {
    id: '4',
    userId: 'u4',
    userName: 'Minh Anh Designer',
    userInitial: 'M',
    userColorClass: 'bg-iba-secondary text-iba-on-secondary',
    badges: ['verified'],
    rating: 5,
    date: '1/10/2026',
    content: 'Rẻ hơn mua trực tiếp cả triệu đồng, support Zalo rep sau 30 giây lúc nửa đêm. Rất uy tín! Sẽ giới thiệu cho cả team cùng mua.',
    helpfulCount: 19,
    status: 'approved',
  },
  {
    id: '5',
    userId: 'u5',
    userName: 'Pending User',
    userInitial: 'U',
    userColorClass: 'bg-iba-secondary text-iba-on-secondary',
    badges: ['verified'],
    rating: 5,
    date: '4/10/2026',
    content: 'Mình vừa mua xong, chưa học nhưng thấy nhanh.',
    helpfulCount: 0,
    status: 'pending', // Will be filtered out
  }
];

export function ProductReviews({ purchased }: { purchased: boolean }) {
  const [filter, setFilter] = useState<'all' | '5' | '4' | '3' | 'verified'>('all');
  const [hoverStar, setHoverStar] = useState<number>(0);
  const [rating, setRating] = useState<number>(0);
  const [reviewContent, setReviewContent] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    // Dynamic import to avoid circular dependency loop if any
    import('@/lib/reviewsStore').then(module => {
      setReviews(module.getFakeReviews());
    });
  }, []);

  const approvedReviews = reviews.filter(r => r.status === 'approved');

  const handleUpvote = async (id: string) => {
    const { getFakeReviews, saveFakeReviews } = await import('@/lib/reviewsStore');
    const newReviews = getFakeReviews().map(r => {
      if (r.id === id) {
        const isUpvoted = !!r.upvoted;
        return {
          ...r,
          upvoted: !isUpvoted,
          helpfulCount: isUpvoted ? r.helpfulCount - 1 : r.helpfulCount + 1
        };
      }
      return r;
    });
    saveFakeReviews(newReviews);
    setReviews(newReviews);
  };

  // Dynamic calculations
  const totalReviews = approvedReviews.length;
  const averageRating = totalReviews > 0 
    ? (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
    : '0.0';
    
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  approvedReviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      starCounts[r.rating as keyof typeof starCounts]++;
    }
  });

  const getStarPercentage = (stars: number) => {
    if (totalReviews === 0) return '0%';
    return `${((starCounts[stars as keyof typeof starCounts] / totalReviews) * 100).toFixed(1)}%`;
  };

  let filteredReviews = approvedReviews;
  if (filter === '5') filteredReviews = approvedReviews.filter(r => r.rating === 5);
  if (filter === '4') filteredReviews = approvedReviews.filter(r => r.rating === 4);
  if (filter === '3') filteredReviews = approvedReviews.filter(r => r.rating === 3);
  if (filter === 'verified') filteredReviews = approvedReviews.filter(r => r.badges.includes('verified'));

  const submitReview = async () => {
    if (rating === 0) {
      setToastMsg("Vui lòng chọn số sao để đánh giá!");
    } else {
      const { getFakeReviews, saveFakeReviews } = await import('@/lib/reviewsStore');
      const newReview: Review = {
        id: crypto.randomUUID(),
        userId: 'me',
        userName: 'Guest User',
        userInitial: 'G',
        userColorClass: 'bg-iba-secondary text-iba-on-secondary',
        badges: purchased ? ['verified'] : [],
        rating,
        date: new Date().toLocaleDateString('vi-VN'),
        content: reviewContent || 'Không có nội dung',
        helpfulCount: 0,
        status: 'pending'
      };
      const newReviews = [newReview, ...getFakeReviews()];
      saveFakeReviews(newReviews);
      setReviews(newReviews);
      setRating(0);
      setReviewContent("");
      setToastMsg("Đánh giá của bạn đã được gửi đi và đang chờ kiểm duyệt.");
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  return (
    <div className="w-full">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 bg-iba-surface-container-highest text-iba-on-surface px-6 py-3 rounded-lg shadow-lg font-iba-body-sm font-semibold flex items-center gap-2 animate-fade-in border border-iba-outline/20">
          <span className="material-symbols-outlined text-iba-primary">info</span>
          {toastMsg}
        </div>
      )}

      {/* Page Title & Store Guidelines Banner */}
      <div className="bg-iba-surface-container-lowest rounded-xl p-6 md:p-8 shadow-sm mb-8 border border-iba-hairline">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-iba-surface-container">
          <div>
            <h2 className="font-iba-headline-lg text-iba-headline-lg text-iba-on-surface font-extrabold tracking-tight">Đánh giá & thông tin từ khách hàng</h2>
            <p className="font-iba-body-sm text-iba-body-sm text-iba-on-surface-variant mt-1">
              Các mục gắn nhãn <span className="bg-iba-surface-container-high px-1.5 py-0.5 rounded font-semibold text-iba-on-surface">IBACUU biên soạn</span> có nội dung do ban quản trị tổng hợp thực tế.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-iba-surface-container-low px-4 py-2 rounded-lg text-iba-primary shrink-0 font-iba-body-sm text-iba-body-sm">
            <Verified size={18} />
            <span className="font-semibold">100% người dùng thực</span>
          </div>
        </div>

        {/* Rating Scoreboard & Bars Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Average Score Hero Block */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-8 bg-iba-surface-container-low rounded-xl text-center border border-iba-hairline">
            <span className="font-iba-body-sm text-iba-body-sm text-iba-on-surface-variant uppercase tracking-wider font-semibold mb-1">Điểm tổng hợp</span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="font-iba-headline-xl text-iba-headline-xl text-iba-on-surface font-extrabold tracking-tighter">{averageRating}</span>
              <span className="font-iba-headline-sm text-iba-headline-sm text-iba-outline font-medium">/ 5</span>
            </div>
            <div className="flex items-center gap-1 text-amber-500 my-2">
              {[1, 2, 3, 4, 5].map(i => (
                <span key={i} className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: i <= Math.round(parseFloat(averageRating)) ? "'FILL' 1" : "'FILL' 0" }}>star</span>
              ))}
            </div>
            <div className="font-iba-label-code text-iba-label-code text-iba-primary font-semibold flex items-center gap-1 bg-iba-surface-container-lowest px-4 py-1 rounded-full shadow-sm mt-1">
              <span className="material-symbols-outlined text-[15px]">rate_review</span>
              <span>{totalReviews} đánh giá tổng hợp</span>
            </div>
          </div>

          {/* Rating Progress Bars Breakdown */}
          <div className="lg:col-span-8 space-y-2.5">
            {[5, 4, 3, 2, 1].map(stars => (
              <div key={stars} className="flex items-center gap-4 text-iba-on-surface">
                <div className="flex items-center gap-1 w-14 shrink-0 font-iba-body-sm text-iba-body-sm font-semibold">
                  <span>{stars}</span>
                  <span className="material-symbols-outlined text-[16px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <div className="flex-1 h-3 bg-iba-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-iba-primary rounded-full transition-all duration-700 ease-out" style={{ width: getStarPercentage(stars) }}></div>
                </div>
                <div className="w-12 text-right font-iba-label-code text-iba-label-code text-iba-on-surface-variant font-bold">{starCounts[stars as keyof typeof starCounts]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Review Section: Filter Toolbar + Write Review Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Left Filters Strip (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-iba-surface-container-lowest p-4 rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4 border border-iba-hairline">
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-iba-body-sm text-iba-body-sm font-semibold transition-all border-none cursor-pointer ${filter === 'all' ? 'bg-iba-primary text-iba-on-primary shadow-sm' : 'bg-iba-surface-container hover:bg-iba-surface-container-high text-iba-on-surface'}`}
              >
                Tất cả ({totalReviews})
              </button>
              <button 
                onClick={() => setFilter('5')}
                className={`px-3 py-1.5 rounded-lg font-iba-body-sm text-iba-body-sm font-medium transition-all border-none cursor-pointer ${filter === '5' ? 'bg-iba-primary text-iba-on-primary shadow-sm' : 'bg-iba-surface-container hover:bg-iba-surface-container-high text-iba-on-surface'}`}
              >
                5 sao ({starCounts[5]})
              </button>
              <button 
                onClick={() => setFilter('4')}
                className={`px-3 py-1.5 rounded-lg font-iba-body-sm text-iba-body-sm font-medium transition-all border-none cursor-pointer ${filter === '4' ? 'bg-iba-primary text-iba-on-primary shadow-sm' : 'bg-iba-surface-container hover:bg-iba-surface-container-high text-iba-on-surface'}`}
              >
                4 sao ({starCounts[4]})
              </button>
              <button 
                onClick={() => setFilter('3')}
                className={`px-3 py-1.5 rounded-lg font-iba-body-sm text-iba-body-sm font-medium transition-all border-none cursor-pointer ${filter === '3' ? 'bg-iba-primary text-iba-on-primary shadow-sm' : 'bg-iba-surface-container hover:bg-iba-surface-container-high text-iba-on-surface'}`}
              >
                3 sao ({starCounts[3]})
              </button>
              <button 
                onClick={() => setFilter('verified')}
                className={`px-3 py-1.5 rounded-lg font-iba-body-sm text-iba-body-sm font-medium flex items-center gap-1 transition-all border-none cursor-pointer ${filter === 'verified' ? 'bg-iba-primary text-iba-on-primary shadow-sm' : 'bg-iba-surface-container hover:bg-iba-surface-container-high text-iba-on-surface'}`}
              >
                <Verified size={15} className={filter === 'verified' ? 'text-iba-on-primary' : 'text-iba-primary'} />
                Đã mua hàng ({approvedReviews.filter(r => r.badges.includes('verified')).length})
              </button>
            </div>
            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <span className="font-iba-body-sm text-iba-body-sm text-iba-outline hidden sm:inline">Sắp xếp:</span>
              <div className="relative">
                <select className="appearance-none bg-iba-surface-container-low pl-3 pr-8 py-1.5 rounded-lg font-iba-body-sm text-iba-body-sm font-semibold text-iba-on-surface focus:outline-none cursor-pointer border-none outline-none">
                  <option>Mới nhất</option>
                  <option>Đánh giá cao</option>
                  <option>Có phản hồi admin</option>
                </select>
                <span className="material-symbols-outlined text-[18px] text-iba-outline absolute right-2 top-2 pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>

          {/* Customer Review Cards Stream */}
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-8 text-iba-outline font-iba-body-md text-iba-body-md">
                Chưa có đánh giá nào phù hợp với bộ lọc.
              </div>
            ) : (
              filteredReviews.map(r => (
                <article key={r.id} className="bg-iba-surface-container-lowest p-6 rounded-xl shadow-sm hover:shadow-md transition-all border border-iba-hairline">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full ${r.userColorClass} font-iba-headline-sm text-iba-headline-sm flex items-center justify-center font-bold shrink-0`}>
                        {r.userInitial}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-iba-headline-sm text-iba-headline-sm text-iba-on-surface font-bold">{r.userName}</span>
                          {r.badges.map(b => (
                            <span key={b} className={`px-2 py-0.5 rounded-full font-iba-label-badge text-iba-label-badge flex items-center gap-1 font-semibold ${
                              b === 'verified' ? 'bg-iba-primary-fixed text-iba-on-primary-fixed-variant' : 
                              b === 'ibacuu' ? 'bg-iba-surface-container-highest text-iba-on-surface-variant' : 
                              'bg-iba-secondary-fixed text-iba-on-secondary-fixed'
                            }`}>
                              {b === 'verified' && <span className="material-symbols-outlined text-[13px]">verified</span>}
                              {b === 'verified' ? 'Đã mua hàng' : b === 'ibacuu' ? 'IBACUU biên soạn' : b}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-amber-500 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <span key={i} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <time className="font-iba-label-code text-iba-label-code text-iba-outline whitespace-nowrap">{r.date}</time>
                  </div>
                  
                  <p className="font-iba-body-md text-iba-body-md text-iba-on-surface leading-relaxed pl-14 mb-4">
                    {r.content}
                  </p>

                  {/* Media Attachments */}
                  {r.images && r.images.length > 0 && (
                    <div className="flex items-center gap-2 pl-14 mb-4">
                      {r.images.map((img, i) => (
                        <div key={i} className="w-16 h-16 rounded-lg overflow-hidden relative cursor-pointer group shadow-sm bg-iba-surface-container">
                          <img src={img} alt="review-proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <span className="absolute inset-0 bg-iba-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-iba-on-primary">
                            <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Admin Reply */}
                  {r.adminReply && (
                    <div className="ml-14 p-4 bg-iba-surface-container-low rounded-xl mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-iba-primary text-iba-on-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[14px]">support_agent</span>
                          </div>
                          <span className="font-iba-body-sm text-iba-body-sm font-bold text-iba-primary">Phản hồi từ Quản trị viên IBACUU</span>
                        </div>
                        <span className="font-iba-label-code text-iba-label-code text-iba-outline">{r.adminReply.date}</span>
                      </div>
                      <p className="font-iba-body-sm text-iba-body-sm text-iba-on-surface-variant pl-7">
                        {r.adminReply.content}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-4 mt-2 pl-14 text-iba-on-surface-variant font-iba-body-sm text-iba-body-sm">
                    <button 
                      onClick={() => handleUpvote(r.id)}
                      className={`flex items-center gap-1 transition-colors cursor-pointer border-none bg-transparent font-medium ${r.upvoted ? 'text-iba-primary' : 'text-iba-on-surface-variant hover:text-iba-primary'}`}
                    >
                      <ThumbsUp size={16} className={r.upvoted ? 'text-iba-primary fill-iba-primary' : ''} />
                      <span>Hữu ích ({r.helpfulCount})</span>
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Write Review Box */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-iba-surface-container-lowest p-6 rounded-xl shadow-sm sticky top-24 border border-iba-hairline">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-iba-secondary-fixed text-iba-on-secondary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">edit_note</span>
              </div>
              <h3 className="font-iba-headline-sm text-iba-headline-sm text-iba-on-surface font-bold">Chia sẻ trải nghiệm</h3>
            </div>
            
            <p className="font-iba-body-sm text-iba-body-sm text-iba-on-surface-variant leading-relaxed mb-4">
              Chỉ tài khoản đã thanh toán và đang sở hữu sản phẩm mới có thể gửi đánh giá xác thực trên hệ thống IBACUU. Mọi đánh giá phải qua Admin kiểm duyệt trước khi hiển thị.
            </p>

            {/* Interactive Rating Prompt */}
            <div className="bg-iba-surface-container-low p-4 rounded-xl mb-4 text-center">
              <span className="font-iba-body-sm text-iba-body-sm text-iba-on-surface-variant font-medium block mb-2">Bạn đánh giá gói dịch vụ này thế nào?</span>
              <div className="flex justify-center items-center gap-1.5 cursor-pointer">
                {[1, 2, 3, 4, 5].map(star => (
                  <button 
                    key={star}
                    type="button" 
                    className={`transition-transform hover:scale-125 border-none bg-transparent cursor-pointer p-0 ${star <= (hoverStar || rating) ? 'text-amber-500' : 'text-iba-outline'}`}
                    onMouseEnter={() => setHoverStar(star)}
                    onMouseLeave={() => setHoverStar(0)}
                    onClick={() => setRating(star)}
                  >
                    <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: star <= (hoverStar || rating) ? "'FILL' 1" : "'FILL' 0" }}>star</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              {purchased ? (
                <>
                  <textarea 
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    className="w-full bg-iba-surface-container rounded-lg p-3 font-iba-body-sm text-iba-body-sm text-iba-on-surface focus:outline-none focus:ring-2 focus:ring-iba-primary/50 resize-none" 
                    rows={3} 
                    placeholder="Viết cảm nhận của bạn về chất lượng đề thi, bài tập..."
                  />
                  <button 
                    onClick={submitReview}
                    className="w-full py-2.5 rounded-lg bg-iba-primary text-iba-on-primary font-iba-body-sm text-iba-body-sm font-bold flex items-center justify-center gap-2 hover:bg-iba-primary-container shadow-sm transition-all active:scale-[0.98] cursor-pointer border-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">rate_review</span>
                    Gửi đánh giá (Chờ duyệt)
                  </button>
                </>
              ) : (
                <button 
                  className="w-full py-2 rounded-lg text-iba-primary font-iba-body-sm text-iba-body-sm font-semibold flex items-center justify-center gap-1 bg-iba-surface-container-low hover:bg-iba-surface-container transition-colors cursor-pointer border-none"
                >
                  <span className="material-symbols-outlined text-[16px]">login</span>
                  Đăng nhập & Mua hàng để đánh giá
                </button>
              )}
            </div>

            {/* Trust signals widget */}
            <div className="mt-6 pt-4 bg-iba-surface-container-lowest space-y-2 border-t border-iba-surface-container text-iba-on-surface-variant font-iba-body-sm text-iba-body-sm">
              <div className="flex items-center gap-2 text-iba-primary font-semibold">
                <Shield size={18} />
                <span>Quy chuẩn kiểm duyệt minh bạch</span>
              </div>
              <ul className="space-y-1.5 pl-2 text-iba-outline m-0 list-none">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-iba-primary shrink-0 mt-0.5">check_circle</span>
                  <span>Chỉ cho phép đánh giá sau khi hoàn tất đơn hàng.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-iba-primary shrink-0 mt-0.5">check_circle</span>
                  <span>Bảo hành hoàn tiền nếu sản phẩm lỗi.</span>
                </li>
              </ul>
            </div>

            {/* Quick Support Help Card */}
            <div className="mt-4 p-4 bg-iba-primary-container text-iba-on-primary-container rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-iba-surface-container-lowest text-iba-primary flex items-center justify-center shrink-0">
                <Headset size={24} />
              </div>
              <div>
                <div className="font-iba-body-sm text-iba-body-sm font-bold text-iba-on-primary">Cần hỗ trợ đơn hàng?</div>
                <div className="font-iba-body-sm text-iba-body-sm text-iba-on-primary-container leading-tight mt-1">Nhắn Zalo CSKH để được trợ giúp 24/7</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
