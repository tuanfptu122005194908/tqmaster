import React, { useState } from 'react';
import type { Tables } from '@/integrations/supabase/types';
import { formatPrice } from '@/lib/mockData';
import { optimizedImage } from '@/lib/imageOpt';
import { ShoppingCart, Check, Star, ArrowRight, BookOpen } from 'lucide-react';

interface CourseListItemProps {
  subject: Tables<'subjects'>;
  color: string;
  initials: string;
  owned: boolean;
  inCart: boolean;
  idx: number;
  onOpen: () => void;
  onCart: (e: React.MouseEvent) => void;
}

export default function CourseListItem({
  subject,
  color,
  initials,
  owned,
  inCart,
  idx,
  onOpen,
  onCart,
}: CourseListItemProps) {
  const [hovered, setHovered] = useState(false);
  const isFree = Number(subject.price || 0) <= 0;

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px 18px',
        background: '#ffffff',
        border: hovered ? '1px solid rgba(37, 99, 235, 0.4)' : '1px solid #e2e8f0',
        borderRadius: 18,
        boxShadow: hovered
          ? '0 8px 24px rgba(37, 99, 235, 0.08), 0 2px 6px rgba(0,0,0,0.02)'
          : '0 2px 8px rgba(0, 0, 0, 0.02)',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Left: Thumbnail & Details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
        {/* Avatar / Thumbnail */}
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 14,
            overflow: 'hidden',
            flexShrink: 0,
            background: `linear-gradient(135deg, ${color}20 0%, ${color}40 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {subject.thumbnail_url ? (
            <img
              src={optimizedImage(subject.thumbnail_url, 120)}
              alt={subject.name}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <span style={{ color, fontWeight: 900, fontSize: 18 }}>{initials}</span>
          )}
        </div>

        {/* Text info */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            {/* Semester badge */}
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 6,
                background: '#eff6ff',
                color: '#2563eb',
                fontSize: 11,
                fontWeight: 800,
              }}
            >
              KỲ {subject.semester}
            </span>

            {/* Title */}
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: hovered ? '#2563eb' : '#0f172a',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                transition: 'color 0.15s ease',
              }}
            >
              {subject.name}
            </h3>
          </div>

          {/* Description snippet & stars */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: '#64748b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#f59e0b' }}>
              <Star size={12} fill="#f59e0b" stroke="none" />
              <span style={{ fontWeight: 700, color: '#475569' }}>5.0</span>
            </div>
            <span
              style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 460,
              }}
            >
              {subject.description || `Tài liệu ôn thi và đề thi thử môn ${subject.name} chuẩn form Đại học.`}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Price & Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexShrink: 0,
        }}
      >
        {/* Price column */}
        <div style={{ textAlign: 'right' }}>
          {owned ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 8,
                background: isFree ? '#e0f2fe' : '#dcfce7',
                color: isFree ? '#0284c7' : '#15803d',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              <Check size={13} strokeWidth={3} /> {isFree ? 'Miễn phí' : 'Đã sở hữu'}
            </span>
          ) : (
            <div>
              <div style={{ fontWeight: 900, color: '#0f172a', fontSize: 15 }}>
                {isFree ? 'Miễn phí' : formatPrice(Number(subject.price))}
              </div>
              <div style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600 }}>Trọn đời</div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {owned ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen();
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>{isFree ? 'Học ngay' : 'Vào học'}</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen();
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: 12,
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Chi tiết
              </button>
              <button
                type="button"
                onClick={onCart}
                style={{
                  padding: '8px 14px',
                  borderRadius: 12,
                  border: inCart ? '1px solid #16a34a' : 'none',
                  background: inCart
                    ? '#dcfce7'
                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: inCart ? '#15803d' : '#ffffff',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: inCart ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.3)',
                }}
              >
                <ShoppingCart size={14} />
                <span>{inCart ? 'Đã thêm' : 'Thêm giỏ'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
