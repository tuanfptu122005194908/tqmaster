import React from 'react';

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

/** Màn hình khởi động — logo nhịp thở, không phải spinner trơ */
export function BootScreen({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'hsl(var(--background))',
      }}
    >
      <style>{`
        @keyframes bootPulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.07); opacity: .82 } }
        @keyframes bootBar { 0% { transform: translateX(-100%) } 100% { transform: translateX(320%) } }
      `}</style>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ animation: 'bootPulse 1.4s ease-in-out infinite' }}>
          <img src="/favicon.png" alt="" width={56} height={56} style={{ borderRadius: 16 }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        </div>
        <div style={{ width: 160, height: 4, borderRadius: 999, background: 'hsl(var(--muted, 210 40% 94%))', overflow: 'hidden' }}>
          <div
            style={{
              width: '35%', height: '100%', borderRadius: 999,
              background: 'linear-gradient(90deg, hsl(var(--primary) / 0.4), hsl(var(--primary)))',
              animation: 'bootBar 1.1s ease-in-out infinite',
            }}
          />
        </div>
        <p style={{ color: 'hsl(var(--muted-fg))', fontSize: '0.875rem', fontWeight: 600 }}>{label}</p>
      </div>
    </div>
  );
}
