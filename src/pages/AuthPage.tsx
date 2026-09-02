import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Eye, EyeOff, Loader2, Mail, Lock, User, CheckCircle, AlertCircle, Sparkles,
  ArrowRight, ArrowLeft, GraduationCap, Bot, TrendingUp, ShieldCheck, Zap
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import authMountainBg from '@/assets/auth-mountain-bg.png';
import { toast } from 'sonner';
import { parseFunctionError } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID = "968560504644-v4m2qqsi3v7cni3ao22rijquhmstvd7j.apps.googleusercontent.com";

type Mode = 'login' | 'register' | 'forgot';

// Enhanced Snow & Shimmer Particle Effect
function SnowEffect() {
  const snowflakes = useMemo(() => {
    return Array.from({ length: 35 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 4 + 2.5,
      duration: Math.random() * 8 + 7,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.4 + 0.3,
      color: Math.random() > 0.3 ? '#ffffff' : '#93c5fd',
      glow: Math.random() > 0.4
        ? '0 0 8px rgba(255, 255, 255, 0.9), 0 0 4px rgba(59, 130, 246, 0.4)'
        : '0 0 4px rgba(255, 255, 255, 0.7)',
    }));
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: `${flake.left}%`,
            width: flake.size,
            height: flake.size,
            backgroundColor: flake.color,
            borderRadius: '50%',
            opacity: flake.opacity,
            boxShadow: flake.glow,
            animation: `snowFall ${flake.duration}s linear infinite`,
            animationDelay: `${flake.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes snowFall {
          0% { transform: translateY(-20px) translateX(0) scale(0.8); opacity: 0; }
          12% { opacity: 0.9; }
          50% { transform: translateY(50vh) translateX(20px) scale(1.05); opacity: 0.85; }
          90% { opacity: 0.8; }
          100% { transform: translateY(105vh) translateX(-15px) scale(0.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle GIS Callback from Google Popup / One Tap
  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response?.credential) {
      toast.error('Không nhận được mã xác thực từ Google');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error: idTokenErr } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (idTokenErr) {
        toast.error('Lỗi xác thực Google với Supabase: ' + idTokenErr.message);
        setError('Google Auth Error: ' + idTokenErr.message);
      } else {
        toast.success('Đăng nhập bằng Google thành công!');
      }
    } catch (e: any) {
      toast.error('Lỗi đăng nhập Google: ' + (e?.message || 'Vui lòng thử lại'));
      setError(e?.message || 'Không thể xác thực với Google');
    } finally {
      setLoading(false);
    }
  };

  // Initialize GIS and render official Google button
  useEffect(() => {
    const setupGIS = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
          });

          const renderBtnInContainer = (id: string) => {
            const container = document.getElementById(id);
            if (container) {
              container.innerHTML = '';
              window.google.accounts.id.renderButton(container, {
                theme: 'outline',
                size: 'large',
                width: 340,
                text: mode === 'register' ? 'signup_with' : 'signin_with',
                shape: 'rectangular',
                logo_alignment: 'center',
              });
            }
          };

          renderBtnInContainer('googleButtonDivRegister');
          renderBtnInContainer('googleButtonDivLogin');
        } catch (err) {
          console.error('Failed to init Google GIS:', err);
        }
      }
    };

    setupGIS();
    const timer = setTimeout(setupGIS, 600);
    return () => clearTimeout(timer);
  }, [mode, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Vui lòng nhập email');
        return;
      }
      setLoading(true);
      const { data, error: err } = await supabase.functions.invoke('forgot-password', {
        body: { email: email.trim() },
      });
      setLoading(false);
      const errMsg = await parseFunctionError(data, err);
      if (errMsg || err) {
        setError(errMsg || 'Có lỗi xảy ra, vui lòng thử lại');
        return;
      }
      setSuccess(true);
      return;
    }

    if (mode === 'login') {
      if (!email.trim()) {
        setError('Vui lòng nhập email');
        return;
      }
      if (password.length < 8) {
        setError('Mật khẩu phải có ít nhất 8 ký tự');
        return;
      }
      setLoading(true);
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setLoading(false);
      if (err) {
        setError(err.message === 'Invalid login credentials' ? 'Email hoặc mật khẩu không đúng' : err.message);
      }
    }
  };

  const reset = (m: Mode) => {
    setMode(m);
    setError('');
    setSuccess(false);
    setEmail('');
    setPassword('');
  };

  if (!mounted) return null;

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${authMountainBg})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        fontFamily: "'Inter', -apple-system, sans-serif",
        overflowX: 'hidden',
        padding: '38px 16px 12px 16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Background Soft Light Tint */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(238, 245, 255, 0.45) 0%, rgba(243, 244, 246, 0.55) 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Dynamic Ambient Glowing Orbs */}
      <div
        style={{
          position: 'fixed',
          top: '12%',
          left: '18%',
          width: 420,
          height: 420,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.26) 0%, rgba(37, 99, 235, 0) 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 1,
          animation: 'pulseGlow 8s ease-in-out infinite alternate',
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: '12%',
          right: '18%',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(99, 102, 241, 0) 70%)',
          filter: 'blur(65px)',
          pointerEvents: 'none',
          zIndex: 1,
          animation: 'pulseGlow 10s ease-in-out infinite alternate-reverse',
        }}
      />

      {/* Snow Particles */}
      <SnowEffect />

      {/* Top Floating Glass Navigation */}
      <header
        style={{
          position: 'absolute',
          top: 10,
          left: 0,
          right: 0,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 20,
          maxWidth: 1300,
          margin: '0 auto',
        }}
      >
        {/* Brand Logo Pill */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '4px 14px 4px 6px',
            borderRadius: 999,
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.1)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(37, 99, 235, 0.16)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 99, 235, 0.1)';
          }}
        >
          <Logo style={{ width: 30, height: 30, borderRadius: 9 }} />
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              TQMaster
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', letterSpacing: '0.01em' }}>
              Study & Exam Portal
            </div>
          </div>
        </Link>

        {/* Back to Home Button */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: '#1e293b',
            textDecoration: 'none',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#ffffff';
            e.currentTarget.style.color = '#2563eb';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)';
            e.currentTarget.style.color = '#1e293b';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.04)';
          }}
        >
          <ArrowLeft size={14} />
          <span>Trang chủ</span>
        </Link>
      </header>

      {/* ── 3-COLUMN CENTERING WRAPPER (GUARANTEES ZERO OVERLAP) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 36,
          width: '100%',
          maxWidth: 1180,
          zIndex: 10,
          margin: 'auto 0',
        }}
      >
        {/* LEFT COLUMN: EDUCATIONAL BADGES */}
        <div
          className="auth-side-column"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            width: 240,
            flexShrink: 0,
          }}
        >
          {/* Badge 1: 10,000+ Students */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: 18,
              border: '1.5px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 10px 25px -4px rgba(37, 99, 235, 0.12)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px rgba(37, 99, 235, 0.12)',
                flexShrink: 0,
              }}
            >
              <GraduationCap size={20} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: '#0f172a' }}>10,000+ Học viên</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b' }}>Đang ôn luyện mỗi ngày</div>
            </div>
          </motion.div>

          {/* Badge 2: Pass rate */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: 18,
              border: '1.5px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 10px 25px -4px rgba(16, 185, 129, 0.12)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #eafaf5 0%, #d1fae5 100%)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px rgba(16, 185, 129, 0.12)',
                flexShrink: 0,
              }}
            >
              <TrendingUp size={19} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: '#0f172a' }}>98.6% Tỷ lệ đỗ</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b' }}>Chứng chỉ & Công chức</div>
            </div>
          </motion.div>
        </div>

        {/* ── CENTER AUTH CARD ── */}
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '100%',
            maxWidth: 420,
            flexShrink: 0,
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderRadius: 22,
            padding: '18px 28px 16px 28px',
            boxShadow:
              '0 20px 50px -10px rgba(37, 99, 235, 0.18), 0 6px 18px -4px rgba(15, 23, 42, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.95)',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            position: 'relative',
            boxSizing: 'border-box',
          }}
        >
          {/* Top Decorative Avatar */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(139, 92, 246, 0.2) 100%)',
                  filter: 'blur(5px)',
                  animation: 'pulseHalo 3s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
                  border: '2px solid #ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                  boxShadow: '0 6px 16px rgba(37, 99, 235, 0.14)',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {mode === 'register' ? (
                  <Sparkles size={20} style={{ color: '#2563eb' }} />
                ) : mode === 'forgot' ? (
                  <ShieldCheck size={20} style={{ color: '#2563eb' }} />
                ) : (
                  <User size={20} style={{ color: '#2563eb' }} />
                )}
              </div>
            </div>
          </div>

          {/* Heading & Subtitle */}
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '-0.03em',
                margin: '0 0 2px 0',
              }}
            >
              {mode === 'login' ? 'Chào mừng trở lại' : mode === 'register' ? 'Đăng ký tài khoản' : 'Khôi phục mật khẩu'}
            </h2>
            <p style={{ fontSize: 12, color: '#64748b', margin: 0, lineHeight: 1.35 }}>
              {mode === 'login'
                ? 'Đăng nhập để vào khoá học, làm bài thi và luyện tập AI'
                : mode === 'register'
                ? 'Đăng ký 1-Click nhanh chóng và bảo mật qua Google'
                : 'Nhập email để nhận liên kết đặt lại mật khẩu trong vài giây'}
            </p>
          </div>

          {/* ── SEGMENTED TAB SWITCHER (Login / Register) ── */}
          {mode !== 'forgot' && (
            <div
              style={{
                display: 'flex',
                background: '#f1f5f9',
                padding: 3,
                borderRadius: 12,
                marginBottom: 12,
                position: 'relative',
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                onClick={() => reset('login')}
                style={{
                  flex: 1,
                  position: 'relative',
                  padding: '5px 8px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: 12.5,
                  fontWeight: mode === 'login' ? 800 : 600,
                  color: mode === 'login' ? '#1d4ed8' : '#64748b',
                  cursor: 'pointer',
                  zIndex: 2,
                  transition: 'color 0.2s ease',
                }}
              >
                {mode === 'login' && (
                  <motion.div
                    layoutId="activeAuthTab"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 10,
                      background: '#ffffff',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                      zIndex: -1,
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                Đăng nhập
              </button>

              <button
                type="button"
                onClick={() => reset('register')}
                style={{
                  flex: 1,
                  position: 'relative',
                  padding: '5px 8px',
                  border: 'none',
                  background: 'transparent',
                  fontSize: 12.5,
                  fontWeight: mode === 'register' ? 800 : 600,
                  color: mode === 'register' ? '#1d4ed8' : '#64748b',
                  cursor: 'pointer',
                  zIndex: 2,
                  transition: 'color 0.2s ease',
                }}
              >
                {mode === 'register' && (
                  <motion.div
                    layoutId="activeAuthTab"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 10,
                      background: '#ffffff',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                      zIndex: -1,
                    }}
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                Đăng ký tài khoản
              </button>
            </div>
          )}

          {/* Error Notification Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                style={{
                  overflow: 'hidden',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '8px 12px',
                    background: '#ffe4e6',
                    border: '1px solid #fecdd3',
                    borderRadius: 10,
                    color: '#e11d48',
                    fontSize: 12.5,
                    fontWeight: 600,
                    lineHeight: 1.35,
                  }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Notification Banner */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -4 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                style={{
                  overflow: 'hidden',
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    padding: '8px 12px',
                    background: '#dcfce7',
                    border: '1px solid #bbf7d0',
                    borderRadius: 10,
                    color: '#15803d',
                    fontSize: 12.5,
                    fontWeight: 600,
                    lineHeight: 1.35,
                  }}
                >
                  <CheckCircle size={15} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Đã gửi hướng dẫn đặt lại mật khẩu về email của bạn!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── FORM CONTENT WITH SMOOTH TRANSITION ── */}
          <AnimatePresence mode="wait">
            {mode === 'register' ? (
              /* ── REGISTER MODE: GOOGLE FAST 1-CLICK ── */
              <motion.div
                key="register-box"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.18 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}
              >
                {/* Highlight Info Card */}
                <div
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    background: 'linear-gradient(135deg, #edf5ff 0%, #f0f7ff 100%)',
                    border: '1.5px solid #dbeafe',
                    borderRadius: 14,
                    fontSize: 12.5,
                    color: '#1e40af',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    boxShadow: '0 3px 10px rgba(37, 99, 235, 0.05)',
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#2563eb',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.1)',
                    }}
                  >
                    <Sparkles size={16} />
                  </div>
                  <div style={{ lineHeight: 1.45 }}>
                    <strong style={{ color: '#1d4ed8', display: 'block', marginBottom: 2, fontSize: 13 }}>
                      Đăng ký nhanh 1-Click
                    </strong>
                    TQMaster hỗ trợ tạo tài khoản bảo mật bằng Google. Chỉ cần 1 chạm để bắt đầu!
                  </div>
                </div>

                {/* Official GIS Button Container */}
                <div
                  id="googleButtonDivRegister"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    minHeight: 40,
                    width: '100%',
                    margin: '2px 0',
                  }}
                />

                {/* Feature Points */}
                <div
                  style={{
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    padding: '8px 10px',
                    background: 'rgba(248, 250, 252, 0.7)',
                    borderRadius: 10,
                    border: '1px solid #f1f5f9',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#475569', fontWeight: 600 }}>
                    <CheckCircle size={13} style={{ color: '#10b981' }} />
                    <span>Bảo mật tuyệt đối, không cần nhớ mật khẩu</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#475569', fontWeight: 600 }}>
                    <CheckCircle size={13} style={{ color: '#10b981' }} />
                    <span>Đồng bộ tiến độ học tập trên mọi thiết bị</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ── LOGIN & FORGOT PASSWORD FORM ── */
              <motion.form
                key="auth-form"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.18 }}
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 11 }}
              >
                <Field
                  icon={<Mail size={16} />}
                  label="Địa chỉ Email"
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={setEmail}
                  placeholder="tenban@gmail.com"
                />

                {mode === 'login' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <label
                        htmlFor="password"
                        style={{
                          display: 'block',
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#475569',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Mật khẩu
                      </label>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock
                        size={16}
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94a3b8',
                          pointerEvents: 'none',
                          transition: 'color 0.2s ease',
                        }}
                      />
                      <input
                        id="password"
                        type={showPass ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={8}
                        style={{
                          width: '100%',
                          height: 40,
                          paddingLeft: 38,
                          paddingRight: 38,
                          borderRadius: 10,
                          border: '1.5px solid #cbd5e1',
                          fontSize: 13.5,
                          color: '#0f172a',
                          background: '#ffffff',
                          outline: 'none',
                          transition: 'all 0.2s ease',
                          boxSizing: 'border-box',
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = '#2563eb';
                          e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.14)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = '#cbd5e1';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 6,
                          transition: 'color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                      >
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Remember Me & Forgot Password */}
                {mode === 'login' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        color: '#475569',
                        fontWeight: 600,
                        userSelect: 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{
                          width: 15,
                          height: 15,
                          accentColor: '#2563eb',
                          borderRadius: 3,
                          cursor: 'pointer',
                        }}
                      />
                      Ghi nhớ đăng nhập
                    </label>
                    <button
                      type="button"
                      onClick={() => reset('forgot')}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontWeight: 700,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                {/* Primary Submit Button with Shimmer */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.015, translateY: -1 } : {}}
                  whileTap={!loading ? { scale: 0.985 } : {}}
                  style={{
                    height: 42,
                    width: '100%',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 14.5,
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 16px -2px rgba(37, 99, 235, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    position: 'relative',
                    overflow: 'hidden',
                    marginTop: 2,
                  }}
                >
                  {/* Shimmer Light Beam Effect */}
                  {!loading && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        width: '60%',
                        background:
                          'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0) 100%)',
                        transform: 'skewX(-25deg)',
                        animation: 'shimmerSweep 4.5s infinite',
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {loading ? (
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : (
                    <>
                      <span>{mode === 'login' ? 'Đăng nhập ngay' : 'Gửi liên kết đặt lại'}</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </motion.button>

                {/* Divider & Google Login (Login Mode Only) */}
                {mode === 'login' && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0 2px 0' }}>
                      <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                      <span
                        style={{
                          padding: '0 10px',
                          fontSize: 10.5,
                          color: '#94a3b8',
                          fontWeight: 800,
                          letterSpacing: '0.05em',
                        }}
                      >
                        HOẶC TIẾP TỤC VỚI
                      </span>
                      <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                    </div>

                    {/* Official GIS Button Container */}
                    <div
                      id="googleButtonDivLogin"
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                        minHeight: 40,
                      }}
                    />
                  </>
                )}
              </motion.form>
            )}
          </AnimatePresence>

          {/* ── FOOTER SWITCHER ── */}
          <div style={{ marginTop: 10, textAlign: 'center', fontSize: 12.5, color: '#64748b' }}>
            {mode === 'login' ? (
              <>
                Chưa có tài khoản?{' '}
                <button
                  onClick={() => reset('register')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontWeight: 800,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Đăng ký 1-Click bằng Google
                </button>
              </>
            ) : mode === 'register' ? (
              <>
                Đã có tài khoản?{' '}
                <button
                  onClick={() => reset('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontWeight: 800,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Đăng nhập ngay
                </button>
              </>
            ) : (
              <>
                Nhớ mật khẩu rồi?{' '}
                <button
                  onClick={() => reset('login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Quay lại Đăng nhập
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* RIGHT COLUMN: AI & FEATURES BADGES */}
        <div
          className="auth-side-column"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            width: 240,
            flexShrink: 0,
          }}
        >
          {/* Badge 3: AI Assistant */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: 18,
              border: '1.5px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 10px 25px -4px rgba(139, 92, 246, 0.12)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #f3eefd 0%, #ede9fe 100%)',
                color: '#8b5cf6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px rgba(139, 92, 246, 0.12)',
                flexShrink: 0,
              }}
            >
              <Bot size={20} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: '#0f172a' }}>AI Trợ lý học tập</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b' }}>Giải đề & hỗ trợ tức thì</div>
            </div>
          </motion.div>

          {/* Badge 4: Smart Learning Path */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRadius: 18,
              border: '1.5px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 10px 25px -4px rgba(245, 158, 11, 0.12)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px rgba(245, 158, 11, 0.12)',
                flexShrink: 0,
              }}
            >
              <Zap size={19} />
            </div>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: '#0f172a' }}>Ôn thi thông minh</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#64748b' }}>Cá nhân hoá theo năng lực</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Global Embedded Animations & Responsive Styles */}
      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-150%) skewX(-25deg); }
          25%, 100% { transform: translateX(250%) skewX(-25deg); }
        }
        @keyframes pulseGlow {
          0% { transform: scale(0.95); opacity: 0.3; }
          100% { transform: scale(1.1); opacity: 0.55; }
        }
        @keyframes pulseHalo {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.75; }
        }

        /* Show side columns only on wide screens (>= 1120px) to guarantee zero overlap */
        .auth-side-column {
          display: flex;
        }
        @media (max-width: 1120px) {
          .auth-side-column {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function Field({
  icon,
  label,
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 800,
          color: '#475569',
          marginBottom: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#94a3b8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            transition: 'color 0.2s ease',
          }}
        >
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: 40,
            paddingLeft: 38,
            paddingRight: 12,
            borderRadius: 10,
            border: '1.5px solid #cbd5e1',
            fontSize: 13.5,
            color: '#0f172a',
            background: '#ffffff',
            outline: 'none',
            fontFamily: mono ? 'monospace' : 'inherit',
            transition: 'all 0.2s ease',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#2563eb';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.14)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#cbd5e1';
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
      </div>
    </div>
  );
}
