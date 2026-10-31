import React, { useState, useEffect } from 'react';

interface BrandLoaderProps {
  variant?: 'fullscreen' | 'page' | 'inline';
  label?: string;
  subtitle?: string;
  minHeight?: number | string;
  className?: string;
}

const DEFAULT_MESSAGES = [
  'Đang nạp kiến thức ôn thi…',
  'Chuẩn bị đề thi PE & FE Đại học FPT…',
  'Hệ thống TQMaster đang sẵn sàng…',
  'Bứt phá điểm số cùng Cóc Học Bá…',
];

export function BrandLoader({
  variant = 'fullscreen',
  label,
  subtitle = 'TQMaster • Nền tảng Ôn thi Đại học FPT',
  minHeight,
  className = '',
}: BrandLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  // Rotate helpful messages if custom label is not passed
  useEffect(() => {
    if (label) return;
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % DEFAULT_MESSAGES.length);
    }, 2400);
    return () => clearInterval(interval);
  }, [label]);

  const displayMessage = label || DEFAULT_MESSAGES[msgIndex];
  const isFullscreen = variant === 'fullscreen';
  const isInline = variant === 'inline';

  return (
    <div
      role="status"
      aria-label={displayMessage}
      className={`tq-loader-wrapper ${className}`}
      style={{
        width: '100%',
        minHeight: isFullscreen ? '100vh' : minHeight || (isInline ? 120 : 380),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: isFullscreen
          ? 'radial-gradient(circle at 50% 40%, #ffffff 0%, #f4f7fc 100%)'
          : isInline
          ? 'transparent'
          : 'rgba(244, 247, 252, 0.7)',
        padding: isInline ? 12 : 24,
        position: 'relative',
        boxSizing: 'border-box',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      <style>{`
        @keyframes tqMascotFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(1deg);
          }
        }

        @keyframes tqShadowPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.35;
          }
          50% {
            transform: scale(0.85);
            opacity: 0.18;
          }
        }

        @keyframes tqGlowAura {
          0%, 100% {
            opacity: 0.45;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.15);
          }
        }

        @keyframes tqProgressBarWave {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(250%);
          }
        }

        @keyframes tqTextFade {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Main Glassmorphic Container Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: isInline ? '100%' : 380,
          width: '100%',
          padding: isFullscreen ? '36px 32px' : isInline ? '10px' : '28px 24px',
          background: isInline ? 'transparent' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: isInline ? 'none' : 'blur(16px)',
          WebkitBackdropFilter: isInline ? 'none' : 'blur(16px)',
          borderRadius: 24,
          border: isInline ? 'none' : '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: isInline ? 'none' : '0 12px 36px -8px rgba(37, 99, 235, 0.08), 0 4px 16px rgba(0, 0, 0, 0.02)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Mascot & Ambient Glow Unit */}
        <div style={{ position: 'relative', marginBottom: isInline ? 8 : 16 }}>
          {/* Ambient Radial Glow behind mascot */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: isFullscreen ? 110 : 90,
              height: isFullscreen ? 110 : 90,
              marginLeft: isFullscreen ? -55 : -45,
              marginTop: isFullscreen ? -55 : -45,
              background: 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, rgba(37, 99, 235, 0.15) 50%, transparent 70%)',
              borderRadius: '50%',
              filter: 'blur(10px)',
              animation: 'tqGlowAura 2.4s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />

          {/* Floating Mascot Image */}
          <div
            style={{
              animation: 'tqMascotFloat 2s ease-in-out infinite',
              position: 'relative',
              zIndex: 2,
            }}
          >
            <img
              src="/tqmaster-logo.svg"
              alt="TQMaster Mascot"
              width={isFullscreen ? 68 : isInline ? 40 : 54}
              height={isFullscreen ? 68 : isInline ? 40 : 54}
              decoding="async"
              style={{
                borderRadius: isFullscreen ? 20 : 16,
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.22)',
                display: 'block',
              }}
            />
          </div>

          {/* Dynamic Ground Shadow */}
          <div
            style={{
              width: isFullscreen ? 48 : isInline ? 30 : 38,
              height: 7,
              background: 'radial-gradient(ellipse at center, rgba(15, 23, 42, 0.35) 0%, transparent 70%)',
              borderRadius: '50%',
              margin: '6px auto 0 auto',
              animation: 'tqShadowPulse 2s ease-in-out infinite',
            }}
          />
        </div>

        {/* Brand Name Title */}
        <div style={{ marginBottom: isInline ? 4 : 8 }}>
          <span
            style={{
              fontSize: isFullscreen ? '1.25rem' : isInline ? '0.95rem' : '1.1rem',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            TQMaster
          </span>
        </div>

        {/* Progress Bar Shimmer Track */}
        <div
          style={{
            width: isFullscreen ? 160 : isInline ? 100 : 130,
            height: 4.5,
            borderRadius: 999,
            background: '#e2e8f0',
            overflow: 'hidden',
            position: 'relative',
            marginBottom: isInline ? 6 : 14,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '45%',
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #38bdf8 0%, #2563eb 50%, #4f46e5 100%)',
              boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
              animation: 'tqProgressBarWave 1.3s cubic-bezier(0.4, 0, 0.2, 1) infinite',
            }}
          />
        </div>

        {/* Dynamic Status Label */}
        <div
          key={displayMessage}
          style={{
            fontSize: isFullscreen ? 13.5 : isInline ? 11.5 : 12.5,
            fontWeight: 600,
            color: '#475569',
            animation: 'tqTextFade 0.3s ease-out',
            lineHeight: 1.4,
            maxWidth: 280,
          }}
        >
          {displayMessage}
        </div>

        {/* Subtitle (only on fullscreen or large view) */}
        {!isInline && subtitle && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: '#94a3b8',
              marginTop: 6,
              letterSpacing: '0.01em',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

export default BrandLoader;
