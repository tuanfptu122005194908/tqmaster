import React, { useState } from 'react';
import { Tables } from '@/lib/supabase';

// Assuming we have optimizedImage in utils, otherwise we can just use subject.thumbnail_url
function optimizedImage(url: string, width: number) {
  return url; // fallback if not imported
}

interface SubjectCardProps {
  subject: Tables<'subjects'>;
  color: string;
  initials: string;
  owned: boolean;
  inCart: boolean;
  idx: number;
  onOpen: () => void;
  onCart: (e: React.MouseEvent) => void;
  onBuyNow: (e: React.MouseEvent) => void;
}

export function SubjectCard({
  subject,
  color,
  initials,
  owned,
  inCart,
  idx,
  onOpen,
  onCart,
  onBuyNow
}: SubjectCardProps) {
  const price = Number(subject.price);
  const oldPrice = price > 0 ? price * 1.5 : 0; // Fake old price for UI

  return (
    <article 
      onClick={onOpen}
      className="group bg-iba-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer border border-iba-hairline hover:border-iba-primary"
      style={{ animation: `cardReveal 0.4s ease both`, animationDelay: `${Math.min(idx * 50, 300)}ms` }}
    >
      <div>
        {/* Thumbnail Graphic Wrapper */}
        <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-iba-surface-container-low to-iba-secondary-container/20 p-4 flex flex-col justify-between overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-iba-primary/10 rounded-full blur-xl pointer-events-none"></div>
          
          <div className="flex items-center justify-between z-10">
            {owned ? (
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 font-iba-label-badge text-iba-label-badge font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span> Đã sở hữu
              </span>
            ) : price <= 0 ? (
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-iba-label-badge text-iba-label-badge font-bold flex items-center gap-1">
                Miễn phí
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-iba-error-container text-iba-on-error-container font-iba-label-badge text-iba-label-badge font-bold">
                -33% GIẢM
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-iba-surface-container-lowest/80 backdrop-blur text-iba-on-surface font-iba-label-badge text-iba-label-badge font-bold shadow-sm">
              Kỳ {subject.semester}
            </span>
          </div>

          {/* Thumbnail Image or Gradient Icon */}
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
             {subject.thumbnail_url ? (
                <img
                  src={subject.thumbnail_url}
                  alt={subject.name}
                  loading={idx < 4 ? 'eager' : 'lazy'}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div style={{ color }} className="opacity-20 flex items-center justify-center font-black text-6xl tracking-widest drop-shadow-md transition-transform duration-500 group-hover:scale-110">
                  {initials}
                </div>
              )}
          </div>

          {/* Stylized Brand Banner Mockup */}
          {!subject.thumbnail_url && (
            <div className="z-10 flex flex-col items-center justify-center text-center py-2 mt-auto">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-iba-surface-container-lowest shadow-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-iba-secondary text-[18px]">menu_book</span>
                </div>
                <span className="font-iba-headline-sm text-iba-headline-sm font-bold text-iba-secondary drop-shadow-sm">
                  FPT University
                </span>
              </div>
              <div className="font-iba-label-badge text-iba-label-badge font-extrabold uppercase tracking-wider text-iba-primary bg-iba-primary/10 px-2 py-0.5 rounded backdrop-blur">
                Tài liệu & Đề thi chuẩn
              </div>
            </div>
          )}
        </div>

        {/* Product Details Body */}
        <div className="p-4 space-y-3">
          <div>
            <h2 className="font-iba-headline-sm text-iba-headline-sm font-bold text-iba-on-surface group-hover:text-iba-primary transition-colors line-clamp-1">
              {subject.name}
            </h2>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-iba-headline-md text-iba-headline-md font-extrabold text-iba-error">
                {price > 0 ? price.toLocaleString('vi-VN') + ' đ' : 'Miễn phí'}
              </span>
              {price > 0 && (
                <span className="font-iba-body-sm text-iba-body-sm line-through text-iba-outline">
                  {oldPrice.toLocaleString('vi-VN')} đ
                </span>
              )}
            </div>
          </div>

          <p className="font-iba-body-sm text-iba-body-sm text-iba-on-surface-variant line-clamp-2 min-h-[40px]">
            {subject.description || `Khóa học ${subject.name} - Đầy đủ tài liệu, bài tập và đề thi thử mới nhất.`}
          </p>

          {/* Rating & Sales Status */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between font-iba-body-sm text-iba-body-sm">
              <div className="flex items-center gap-1 text-iba-tertiary">
                <div className="flex items-center text-amber-500">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
                  ))}
                </div>
                <span className="font-bold text-iba-on-surface text-[13px]">5.0</span>
                <span className="text-iba-outline text-[12px]">({Math.floor(Math.random() * 200) + 50})</span>
              </div>
              <div className="flex items-center gap-1 font-iba-label-code text-iba-label-code text-iba-outline">
                <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                <span>Đã bán {Math.floor(Math.random() * 500) + 100}</span>
              </div>
            </div>
            {/* Product Tags */}
            <div className="flex flex-wrap gap-1">
              <span className="px-2 py-0.5 rounded bg-iba-surface-container text-iba-on-surface font-iba-label-badge text-iba-label-badge">
                Tài liệu
              </span>
              <span className="px-2 py-0.5 rounded bg-iba-primary-fixed/50 text-iba-on-primary-fixed-variant font-iba-label-badge text-iba-label-badge">
                Kỳ {subject.semester}
              </span>
              <span className="px-2 py-0.5 rounded bg-iba-surface-container text-iba-outline font-iba-label-badge text-iba-label-badge">
                Cấp tốc
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {!owned && (
        <div className="p-4 pt-0 grid grid-cols-2 gap-2 mt-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onCart(e);
            }}
            className={`w-full py-2 px-3 rounded-lg font-iba-body-sm text-iba-body-sm font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
              inCart 
                ? 'bg-iba-surface-container text-iba-primary' 
                : 'bg-iba-surface-container-low hover:bg-iba-surface-container text-iba-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[18px] text-iba-secondary">
              {inCart ? 'remove_shopping_cart' : 'add_shopping_cart'}
            </span>
            <span>{inCart ? 'Đã thêm' : 'Thêm giỏ'}</span>
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onBuyNow(e);
            }}
            className="w-full py-2 px-3 rounded-lg bg-iba-primary-container hover:bg-iba-primary text-iba-on-primary font-iba-body-sm text-iba-body-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
            <span>Mua ngay</span>
          </button>
        </div>
      )}
      {owned && (
        <div className="p-4 pt-0 mt-2">
           <button 
            className="w-full py-2 px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-iba-body-sm text-iba-body-sm font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">play_circle</span>
            <span>Học ngay</span>
          </button>
        </div>
      )}
    </article>
  );
}
