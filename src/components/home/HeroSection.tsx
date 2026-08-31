import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Star,
  Award,
  ShieldCheck,
  Flame,
  Users,
  Sparkles,
  CheckCircle2,
  MapPin,
  Compass,
  Code2,
} from 'lucide-react';

// Lazy-load 3D scene to not block initial render
const HeroScene = React.lazy(() => import('@/components/home3d/HeroScene'));

const STATS = [
  { value: '50+', label: 'Môn Chuyên Ngành FPT', icon: <BookOpen size={16} className="text-cyan-400" /> },
  { value: '10,000+', label: 'Đề Thi Thử & Lab Chuẩn', icon: <Flame size={16} className="text-amber-400" /> },
  { value: '99.6%', label: 'Sinh Viên FPT Qua Môn', icon: <ShieldCheck size={16} className="text-emerald-400" /> },
  { value: '18K+', label: 'Cóc FPT Đang Ôn Luyện', icon: <Users size={16} className="text-orange-400" /> },
];

const FPT_CAMPUSES = [
  'Campus Hòa Lạc (Hà Nội)',
  'Campus TP. Hồ Chí Minh',
  'Campus Đà Nẵng',
  'Campus Quy Nhơn',
  'Campus Cần Thơ',
];

const POPULAR_FPT_SUBJECTS = [
  'PRF192 (C Program)',
  'PRO192 (Java OOP)',
  'MAD101 (Toán rời rạc)',
  'MAS291 (Xác suất thống kê)',
  'CEA201 (Kiến trúc máy tính)',
  'OSG202 (Hệ điều hành)',
  'CSD201 (Cấu trúc dữ liệu)',
  'SWE201c (Kỹ nghệ phần mềm)',
];

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

interface HeroSectionProps {
  onScrollToGrid: () => void;
}

export default function HeroSection({ onScrollToGrid }: HeroSectionProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 32,
        marginBottom: 40,
        overflow: 'hidden',
        background: 'radial-gradient(120% 120% at 75% 20%, #1c1917 0%, #0c0a09 50%, #030712 100%)',
        border: '1px solid rgba(255, 102, 0, 0.28)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 102, 0, 0.18)',
      }}
    >
      {/* ── Background Subtle Orange/Cyber Grid ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(255, 102, 0, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 102, 0, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 70%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 70%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Radiant FPT Orange & Amber Glow Lights */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '15%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 102, 0, 0.22) 0%, rgba(234, 88, 12, 0.12) 40%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '5%',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Main Container Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.05fr 0.95fr',
          minHeight: isMobile ? 'auto' : '680px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* ── Left Content Column (Strictly for FPT University) ── */}
        <div
          style={{
            padding: isMobile ? '36px 20px 24px 20px' : '56px 40px 48px 56px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
          }}
        >
          {/* Top Pill Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 14px',
                borderRadius: 999,
                background: 'linear-gradient(135deg, rgba(255, 102, 0, 0.28) 0%, rgba(234, 88, 12, 0.28) 100%)',
                border: '1px solid rgba(255, 154, 77, 0.45)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 14px rgba(255, 102, 0, 0.25)',
              }}
            >
              <span style={{ display: 'flex', width: 8, height: 8, borderRadius: '50%', background: '#ff6600', boxShadow: '0 0 10px #ff6600' }} />
              <span style={{ color: '#fed7aa', fontSize: 12.5, fontWeight: 900, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                TQMaster • Dành Riêng Cho Sinh Viên FPT
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
              <span style={{ color: '#fef08a', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Sparkles size={13} fill="#fef08a" /> Chuẩn Khung Đề FPTU
              </span>
            </div>
          </div>

          {/* Main Headline */}
          <h1
            style={{
              fontSize: isMobile ? 32 : 46,
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.15,
              letterSpacing: '-0.035em',
              margin: '0 0 16px 0',
              fontFamily: "'Inter', -apple-system, sans-serif",
            }}
          >
            Chinh Phục Mọi Môn Học{' '}
            <span
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #ff7a1a 0%, #fb923c 40%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Điểm 9+ Đại Học FPT
            </span>
          </h1>

          {/* Subtext Description */}
          <p
            style={{
              fontSize: isMobile ? 14 : 15.5,
              color: '#cbd5e1',
              lineHeight: 1.65,
              margin: '0 0 22px 0',
              maxWidth: '540px',
              fontWeight: 450,
            }}
          >
            Ngân hàng đề thi trắc nghiệm thử (Quiz), bài thực hành (PE) và đồ án (FE) có giải thích chi tiết, bám sát 100% giáo trình và format thi thực tế tại các Campus FPT.
          </p>

          {/* Popular Subject Tags for FPT */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
            {POPULAR_FPT_SUBJECTS.map((sub, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: '#fdba74',
                  background: 'rgba(255, 102, 0, 0.12)',
                  border: '1px solid rgba(255, 102, 0, 0.25)',
                  padding: '4px 10px',
                  borderRadius: 8,
                }}
              >
                {sub}
              </span>
            ))}
          </div>

          {/* Feature Highlights Bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 30 }}>
            {[
              '100% đề thi có giải thích cặn kẽ từng dòng code theo chuẩn chấm thi FPT',
              'Cập nhật tài liệu & đề thi thử mới nhất từng kỳ (Spring, Summer, Fall)',
              'Bảo đảm tiến độ qua môn và hỗ trợ giải đáp bài tập 24/7 cùng Mentor FPT',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <CheckCircle2 size={16} color="#ff6600" style={{ flexShrink: 0 }} />
                <span style={{ color: '#e2e8f0', fontSize: 13.5, fontWeight: 600 }}>{text}</span>
              </div>
            ))}
          </div>

          {/* CTA Action Buttons */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
            <button
              onClick={onScrollToGrid}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 28px',
                borderRadius: 16,
                fontSize: 14.5,
                fontWeight: 900,
                color: '#ffffff',
                background: 'linear-gradient(135deg, #ff6600 0%, #ea580c 50%, #c2410c 100%)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 25px -4px rgba(234, 88, 12, 0.5), 0 0 20px rgba(255, 102, 0, 0.35)',
                transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 15px 35px -4px rgba(234, 88, 12, 0.7), 0 0 25px rgba(255, 102, 0, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 25px -4px rgba(234, 88, 12, 0.5), 0 0 20px rgba(255, 102, 0, 0.35)';
              }}
            >
              <BookOpen size={17} />
              Xem Kho Khóa Học FPT
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => navigate('/my-courses')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '14px 24px',
                borderRadius: 16,
                fontSize: 14,
                fontWeight: 800,
                color: '#e2e8f0',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                backdropFilter: 'blur(10px)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.16)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Môn Học Của Tôi
            </button>
          </div>

          {/* FPT University Campus Network Proof */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#fb923c', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={13} color="#ff6600" />
              Áp dụng chuẩn chương trình cho toàn bộ Campus ĐH FPT:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {FPT_CAMPUSES.map((campus, i) => (
                <span
                  key={i}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#e2e8f0',
                    fontSize: 11.5,
                    fontWeight: 600,
                  }}
                >
                  {campus}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right Column: Photorealistic 360 FPT Tour Viewer ── */}
        <div
          style={{
            position: 'relative',
            minHeight: isMobile ? '460px' : 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            borderRadius: isMobile ? '0 0 32px 32px' : '0 32px 32px 0',
          }}
        >
          {/* 360 Canvas Scene with real photos from viewdaihoc.fpt.edu.vn */}
          <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }}>
            <React.Suspense fallback={
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#fed7aa' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Đang tải không gian 360° FPT Campus...</span>
              </div>
            }>
              <HeroScene onExploreExams={onScrollToGrid} />
            </React.Suspense>
          </div>

          {/* Floating Glassmorphic Badge 1: Top Right Trophy */}
          <div
            style={{
              position: 'absolute',
              top: '10%',
              right: isMobile ? '6%' : '6%',
              zIndex: 20,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(245, 158, 11, 0.45)',
              borderRadius: 18,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(245, 158, 11, 0.2)',
              animation: 'floatBadgeA 4s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                overflow: 'hidden',
                border: '1.5px solid #f59e0b',
                flexShrink: 0,
                boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)',
              }}
            >
              <img src="/hero-trophy-3d.jpg" alt="Top 1 Trophy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontSize: 12.5, fontWeight: 900 }}>
                <Award size={14} /> Số 1 Ôn Thi FPTU
              </div>
              <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>
                99.6% Đạt điểm A & B
              </div>
            </div>
          </div>

          {/* Floating Glassmorphic Badge 2: Bottom Left Rating */}
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              left: isMobile ? '6%' : '6%',
              zIndex: 20,
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(16px)',
              border: '1.5px solid rgba(255, 102, 0, 0.45)',
              borderRadius: 18,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 102, 0, 0.25)',
              animation: 'floatBadgeB 5s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #ff6600 0%, #ea580c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: 14,
                boxShadow: '0 4px 12px rgba(255, 102, 0, 0.4)',
              }}
            >
              4.9★
            </div>
            <div>
              <div style={{ color: '#ffffff', fontSize: 12, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Star size={11} fill="#f59e0b" color="#f59e0b" />
                <Star size={11} fill="#f59e0b" color="#f59e0b" />
                <Star size={11} fill="#f59e0b" color="#f59e0b" />
                <Star size={11} fill="#f59e0b" color="#f59e0b" />
                <Star size={11} fill="#f59e0b" color="#f59e0b" />
              </div>
              <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600 }}>
                18,000+ sinh viên FPT tin dùng
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Stats Counter Bar (Strictly for FPT University) ── */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          padding: '18px 32px',
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: 16,
          position: 'relative',
          zIndex: 10,
        }}
      >
        {STATS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 8px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: 19, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Animations CSS */}
      <style>{`
        @keyframes floatBadgeA {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(1deg); }
        }
        @keyframes floatBadgeB {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(6px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
}
