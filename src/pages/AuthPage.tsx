import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Eye, EyeOff, Loader2, Mail, Lock, User, GraduationCap,
  CheckCircle, AlertCircle
} from 'lucide-react';
import logoAvatar from '@/assets/logo-avatar.png';
import authMountainBg from '@/assets/auth-mountain-bg.png';

type Mode = 'login' | 'register' | 'forgot';

function SnowEffect() {
  const snowflakes = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 5 + 2, // 2px - 7px
      duration: Math.random() * 8 + 6, // 6s - 14s
      delay: Math.random() * 5,
      opacity: Math.random() * 0.7 + 0.3,
      sway: (Math.random() - 0.5) * 40,
    }));
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 4 }}>
      {snowflakes.map(flake => (
        <div
          key={flake.id}
          style={{
            position: 'absolute',
            top: '-12px',
            left: `${flake.left}%`,
            width: flake.size,
            height: flake.size,
            backgroundColor: '#ffffff',
            borderRadius: '50%',
            opacity: flake.opacity,
            boxShadow: '0 0 8px rgba(255, 255, 255, 0.9)',
            animation: `snowFall ${flake.duration}s linear infinite`,
            animationDelay: `${flake.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes snowFall {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          15% {
            opacity: 0.85;
          }
          85% {
            opacity: 0.85;
          }
          100% {
            transform: translateY(108vh) translateX(45px);
            opacity: 0;
          }
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
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!success || mode !== 'register') return;
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setMode('login');
          setSuccess(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [success, mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(false);

    if (mode === 'forgot') {
      if (!email.trim()) { setError('Vui lòng nhập email'); return; }
      setLoading(true);
      const { error: err } = await supabase.functions.invoke('forgot-password', {
        body: { email: email.trim() },
      });
      setLoading(false);
      if (err) { setError('Có lỗi xảy ra, vui lòng thử lại'); return; }
      setSuccess(true);
      return;
    }

    if (password.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự'); return; }
    setLoading(true);

    if (mode === 'login') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message === 'Invalid login credentials' ? 'Email hoặc mật khẩu không đúng' : err.message);
    } else {
      if (!fullName.trim()) { setError('Vui lòng nhập họ tên'); setLoading(false); return; }
      const { error: signUpErr } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: 'https://tqmaster.vercel.app/',
          data: { full_name: fullName, student_code: studentCode },
        },
      });
      if (signUpErr) {
        setError(signUpErr.message.includes('already') ? 'Email này đã được đăng ký' : signUpErr.message);
      } else {
        setSuccess(true);
      }
    }
    setLoading(false);
  };

  const reset = (m: Mode) => {
    setMode(m); setError(''); setSuccess(false);
    setEmail(''); setPassword(''); setFullName(''); setStudentCode('');
  };

  if (!mounted) return null;

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `#ffffff url(${authMountainBg}) no-repeat center center`,
      backgroundSize: 'cover',
      fontFamily: "'Inter', -apple-system, sans-serif",
      position: 'relative',
      overflowX: 'hidden',
      padding: '24px',
    }}>
      {/* Falling Snow Effect */}
      <SnowEffect />

      {/* Soft overall backdrop filter for readability */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(2px)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Top Floating Logo */}
      <div style={{
        position: 'absolute',
        top: 36,
        left: 48,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        zIndex: 10,
      }}>
        <div style={{
          width: 50, height: 50, borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)',
          border: '2.5px solid #ffffff', background: '#ffffff'
        }}>
          <img src={logoAvatar} alt="TQMaster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            TQMaster
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2563eb', letterSpacing: '0.01em' }}>
            Hệ thống Học tập & Ôn thi
          </div>
        </div>
      </div>

      {/* ── CENTERED LARGE FLOATING CARD ── */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: '#ffffff',
        borderRadius: 28,
        padding: '48px 44px',
        boxShadow: '0 30px 70px -10px rgba(37, 99, 235, 0.18), 0 12px 30px -5px rgba(0,0,0,0.06)',
        border: '1px solid rgba(226, 232, 240, 0.8)',
        position: 'relative',
        zIndex: 10,
        margin: 'auto',
      }}>
        {/* Top User Icon Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: '#eff6ff', border: '2px solid #dbeafe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#2563eb', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.15)'
          }}>
            <User size={32} />
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 8px 0' }}>
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Tạo tài khoản mới' : 'Quên mật khẩu?'}
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            {mode === 'login'
              ? 'Đăng nhập để bắt đầu làm bài thi và xem lý thuyết'
              : mode === 'register'
              ? 'Đăng ký tài khoản để học tập miễn phí trên TQMaster'
              : 'Nhập email của bạn để lấy lại mật khẩu nhanh chóng'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {mode === 'register' && (
            <>
              <Field
                icon={<User size={20} />}
                label="Họ và tên"
                id="fullName"
                value={fullName}
                onChange={setFullName}
                placeholder="Nguyễn Văn A"
              />
              <Field
                icon={<GraduationCap size={20} />}
                label="Mã sinh viên"
                id="studentCode"
                value={studentCode}
                onChange={setStudentCode}
                placeholder="VD: 2021XXXXXX"
                mono
              />
            </>
          )}

          <Field
            icon={<Mail size={20} />}
            label="Địa chỉ Email"
            id="email"
            type="email"
            required
            value={email}
            onChange={setEmail}
            placeholder="admin@gmail.com"
          />

          {mode !== 'forgot' && (
            <div>
              <label htmlFor="password" style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Tối thiểu 8 ký tự' : '••••••••'}
                  required
                  minLength={8}
                  style={{
                    width: '100%',
                    height: 52,
                    paddingLeft: 48,
                    paddingRight: 48,
                    borderRadius: 14,
                    border: '1.5px solid #cbd5e1',
                    fontSize: 15,
                    color: '#0f172a',
                    background: '#ffffff',
                    outline: 'none',
                    transition: 'all 0.15s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.14)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4
                  }}
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          {/* Remember Me & Forgot Password */}
          {mode === 'login' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ width: 17, height: 17, accentColor: '#2563eb', borderRadius: 4, cursor: 'pointer' }}
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => reset('forgot')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer' }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Error banner */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px',
              background: '#ffe4e6', border: '1px solid #fecdd3', borderRadius: 14,
              color: '#e11d48', fontSize: 14, fontWeight: 600
            }}>
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Success banner */}
          {success && !error && (
            <div>
              {mode === 'forgot' ? (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px',
                  background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 14,
                  color: '#15803d', fontSize: 14, fontWeight: 600
                }}>
                  <CheckCircle size={20} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Đã gửi hướng dẫn đặt lại mật khẩu về email của bạn!</span>
                </div>
              ) : (
                <div style={{
                  padding: 18, background: '#eff6ff', border: '1.5px solid #bfdbfe',
                  borderRadius: 16, fontSize: 13, color: '#1e3a8a'
                }}>
                  <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 6, color: '#1d4ed8' }}>
                    🚀 XÁC THỰC EMAIL ĐĂNG KÝ ({countdown}s)
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.5 }}>
                    Vui lòng mở hộp thư Gmail của bạn và bấm vào liên kết <b>"Verify Email"</b> để hoàn tất đăng ký!
                  </p>
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setSuccess(false); }}
                    style={{ marginTop: 12, background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Chuyển sang Đăng nhập ngay →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Main Primary Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              height: 52,
              width: '100%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 24px -4px rgba(37, 99, 235, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.15s ease',
              marginTop: 6,
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? (
              <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <>
                {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Đăng Ký Tài Khoản' : 'Gửi liên kết đặt lại'}
              </>
            )}
          </button>
        </form>

        {/* Toggle Login/Register footer */}
        <div style={{ marginTop: 28, textAlign: 'center', fontSize: 14, color: '#64748b' }}>
          {mode === 'login' ? (
            <>
              Chưa có tài khoản?{' '}
              <button
                onClick={() => reset('register')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, cursor: 'pointer', padding: 0 }}
              >
                Đăng ký ngay
              </button>
            </>
          ) : mode === 'register' ? (
            <>
              Đã có tài khoản?{' '}
              <button
                onClick={() => reset('login')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, cursor: 'pointer', padding: 0 }}
              >
                Đăng nhập
              </button>
            </>
          ) : (
            <>
              Nhớ mật khẩu rồi?{' '}
              <button
                onClick={() => reset('login')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', padding: 0 }}
              >
                Quay lại Đăng nhập
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  icon, label, id, value, onChange, placeholder, type = 'text', required = false, mono = false,
}: {
  icon: React.ReactNode; label: string; id: string;
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean; mono?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          required={required}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: 52,
            paddingLeft: 48,
            paddingRight: 16,
            borderRadius: 14,
            border: '1.5px solid #cbd5e1',
            fontSize: 15,
            color: '#0f172a',
            background: '#ffffff',
            outline: 'none',
            fontFamily: mono ? 'monospace' : 'inherit',
            transition: 'all 0.15s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.14)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>
    </div>
  );
}
