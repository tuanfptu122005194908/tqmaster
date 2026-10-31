import React from 'react';
import { BrandLoader } from '@/components/common/BrandLoader';

/**
 * Bộ skeleton dùng chung — thay cho spinner "Đang tải..." xấu xí.
 * Hiệu ứng shimmer nhẹ, giữ đúng bố cục thật nên không bị giật layout.
 */

const SHIMMER_CSS = `
@keyframes skShimmer { 100% { transform: translateX(100%); } }
.sk {
  position: relative;
  overflow: hidden;
  background: hsl(var(--muted, 210 40% 96%));
  border-radius: 10px;
}
.sk::after {
  content: '';
  position: absolute; inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.65), transparent);
  animation: skShimmer 1.35s infinite;
}
@media (prefers-reduced-motion: reduce) { .sk::after { animation: none; } }
`;

export function SkeletonStyles() {
  return <style>{SHIMMER_CSS}</style>;
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 10,
  style,
}: { width?: number | string; height?: number | string; radius?: number | string; style?: React.CSSProperties }) {
  return <div className="sk" style={{ width, height, borderRadius: radius, ...style }} />;
}

/** Skeleton 1 thẻ môn học */
export function SubjectCardSkeleton() {
  return (
    <div
      style={{
        border: '1px solid hsl(var(--border))',
        borderRadius: 16,
        overflow: 'hidden',
        background: 'hsl(var(--surface-raised, 0 0% 100%))',
      }}
    >
      <Skeleton height={140} radius={0} />
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton height={18} width="80%" />
        <Skeleton height={12} width="60%" />
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          <Skeleton height={34} width="45%" radius={999} />
          <Skeleton height={34} width="35%" radius={999} />
        </div>
      </div>
    </div>
  );
}

/** Lưới skeleton cho danh sách môn học */
export function SubjectGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <>
      <SkeletonStyles />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 20,
          padding: '24px 30px',
        }}
      >
        {Array.from({ length: count }).map((_, i) => (
          <SubjectCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}

/** Skeleton toàn trang khi chuyển route (code-splitting) */
export function PageSkeleton() {
  return (
    <div style={{ padding: '28px 30px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SkeletonStyles />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Skeleton height={30} width="38%" />
        <Skeleton height={14} width="55%" />
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={92} width={180} radius={14} style={{ flex: '1 1 160px' }} />
        ))}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 20,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <SubjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/** Màn hình khởi động — Linh vật Cóc Vàng Học Bá FPT bồng bềnh sang trọng */
export function BootScreen({ label }: { label?: string }) {
  return <BrandLoader variant="fullscreen" label={label} />;
}
