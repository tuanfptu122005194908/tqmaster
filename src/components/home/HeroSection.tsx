import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, Zap, Star, Award, ShieldCheck, Flame, Users, Sparkles, CheckCircle2 } from 'lucide-react';

// Lazy-load 3D scene to not block initial render
const HeroScene = React.lazy(() => import('@/components/home3d/HeroScene'));

const STATS = [
  { value: '50+', label: 'Môn Học Đại Học', icon: <BookOpen size={16} className="text-cyan-400" /> },
  { value: '10,000+', label: 'Đề Thi Thử Có Đáp Án', icon: <Flame size={16} className="text-amber-400" /> },
  { value: '99.4%', label: 'Sinh Viên Qua Môn', icon: <ShieldCheck size={16} className="text-emerald-400" /> },
  { value: '50K+', label: 'Học Viên Tin Tưởng', icon: <Users size={16} className="text-indigo-400" /> },
];

const UNIVERSITIES = [
  'Đại học FPT', 'Bách Khoa', 'Kinh Tế Quốc Dân (NEU)', 'Ngoại Thương (FTU)', 'ĐHQG Hà Nội', 'ĐHQG TP.HCM'
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
        background: 'radial-gradient(120% 120% at 75% 20%, #1e1b4b 0%, #0b0f19 50%, #030712 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        boxShadow: '0 25px 60px -15px rgba(2, 6, 23, 0.7), 0 0 40px rgba(56, 189, 248, 0.15)',
      }}
    >
      {/* ── Background Cyber Grid & Glowing Orbs ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(to right, rgba(99, 102, 241, 0.07) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(99, 102, 241, 0.07) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 70%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, #000 70%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Radiant Glow Lights */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '15%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, rgba(99, 102, 241, 0.18) 40%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '5%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Main Container Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
          minHeight: isMobile ? 'auto' : '640px',
          position: 'relative',
          zIndex: 10,
        }}
      >
        {/* ── Left Content Column ── */}
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
                background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(147, 51, 234, 0.25) 100%)',
                border: '1px solid rgba(147, 197, 253, 0.35)',
                backdropFilter: 'blur(12px)',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)',
              }}
            >
              <span style={{ display: 'flex', width: 8, height: 8, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 10px #38bdf8' }} />
              <span style={{ color: '#bae6fd', fontSize: 12.5, fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                TQMaster EduTech 3.0
              </span>
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
              <span style={{ color: '#fef08a', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Sparkles size={13} fill="#fef08a" /> Chuẩn Đề Kì Mới Nhất
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
            Chinh Phục Mọi Đề Thi{' '}
            <span
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 4px 16px rgba(56, 189, 248, 0.35))',
              }}
            >
              Điểm 9+ Đại Học
            </span>
          </h1>

          {/* Subtext Description */}
          <p
            style={{
              fontSize: isMobile ? 14 : 15.5,
              color: '#cbd5e1',
              lineHeight: 1.65,
              margin: '0 0 24px 0',
              maxWidth: '520px',
              fontWeight: 450,
            }}
          >
            Hệ thống ngân hàng đề thi thử trắc nghiệm, bài tập tự luận có lời giải chi tiết và lý thuyết cô đọng giúp bạn tự tin đạt GPA xuất sắc.
          </p>

          {/* Feature Highlights Bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 30 }}>
            {[
              '100% đề thi có lời giải thích cặn kẽ từng bước',
              'Kho tài liệu ôn luyện được cập nhật liên tục theo từng kỳ học',
              'Hỗ trợ giải đáp thắc mắc trực tuyến 24/7 cùng giảng viên',
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <CheckCircle2 size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
                <span style={{ color: '#e2e8f0', fontSize: 13.5, fontWeight: 600 }}>{text}</span>
              </div>
            ))}
          </div>

          {/* CTA Action Buttons */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 36 }}>
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
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 25px -4px rgba(79, 70, 229, 0.5), 0 0 20px rgba(56, 189, 248, 0.3)',
                transition: 'all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                e.currentTarget.style.boxShadow = '0 15px 35px -4px rgba(79, 70, 229, 0.7), 0 0 25px rgba(56, 189, 248, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 10px 25px -4px rgba(79, 70, 229, 0.5), 0 0 20px rgba(56, 189, 248, 0.3)';
              }}
            >
              <BookOpen size={17} />
              Khám Phá Khóa Học
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
              Khóa Học Của Tôi
            </button>
          </div>

          {/* Social Proof & Trusted Universities */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
              Được sinh viên tin dùng tại các trường:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {UNIVERSITIES.map((uni, i) => (
                <span
                  key={i}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.09)',
                    color: '#cbd5e1',
                    fontSize: 11.5,
                    fontWeight: 600,
                  }}
                >
                  {uni}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right 3D Scene + Floating Glass Badges ── */}
        <div
          style={{
            position: 'relative',
            minHeight: isMobile ? '400px' : 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* 3D Canvas Canvas Scene */}
          <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }}>
            <React.Suspense fallback={
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/hero-3d-core.jpg" alt="3D Core" style={{ width: '60%', borderRadius: '50%', opacity: 0.8 }} />
              </div>
            }>
              <HeroScene />
            </React.Suspense>
          </div>

          {/* Floating Glassmorphic Badge 1: Top Right Award */}
          <div
            style={{
              position: 'absolute',
              top: '12%',
              right: isMobile ? '8%' : '10%',
              zIndex: 20,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              borderRadius: 20,
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(245, 158, 11, 0.15)',
              animation: 'floatBadgeA 4s ease-in-out infinite',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                overflow: 'hidden',
                border: '1.5px solid #f59e0b',
                flexShrink: 0,
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
              }}
            >
              <img src="/hero-trophy-3d.jpg" alt="Top 1 Trophy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontSize: 13, fontWeight: 900 }}>
                <Award size={15} /> Top 1 Ôn Thi Đại Học
              </div>
              <div style={{ color: '#94a3b8', fontSize: 11.5, fontWeight: 600 }}>
                98.6% Đạt điểm A & B
              </div>
            </div>
          </div>

          {/* Floating Glassmorphic Badge 2: Bottom Left Rating */}
          <div
            style={{
              position: 'absolute',
              bottom: '12%',
              left: isMobile ? '8%' : '5%',
              zIndex: 20,
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: 20,
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(56, 189, 248, 0.2)',
              animation: 'floatBadgeB 5s ease-in-out infinite',
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: 16,
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)',
              }}
            >
              4.9★
            </div>
            <div>
              <div style={{ color: '#ffffff', fontSize: 13, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
                <Star size={13} fill="#f59e0b" color="#f59e0b" />
              </div>
              <div style={{ color: '#94a3b8', fontSize: 11.5, fontWeight: 600 }}>
                12,500+ sinh viên đánh giá
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Stats Counter Bar ── */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.75)',
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
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        @keyframes floatBadgeB {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(8px) rotate(-1deg); }
        }
      `}</style>
    </div>
  );
}
