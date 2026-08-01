import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Eye, EyeOff, Loader2, Mail, Lock, User, CheckCircle, AlertCircle, Sparkles, ArrowRight
} from 'lucide-react';
import logoAvatar from '@/assets/logo-avatar.png';
import authMountainBg from '@/assets/auth-mountain-bg.png';
import { toast } from 'sonner';
import { parseFunctionError } from '@/lib/utils';

// Google SVG Icon
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" style={{ marginRight: '10px', flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

type Mode = 'login' | 'register' | 'forgot';

function SnowEffect() {
  const snowflakes = useMemo(() => {
    return Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: Math.random() * 6 + 3,
      duration: Math.random() * 8 + 6,
      delay: Math.random() * 6,
      opacity: Math.random() * 0.65 + 0.35,
      color: Math.random() > 0.25 ? '#ffffff' : '#93c5fd',
      glow: Math.random() > 0.3 ? '0 0 12px rgba(255, 255, 255, 0.95), 0 0 6px rgba(59, 130, 246, 0.5)' : '0 0 6px rgba(255, 255, 255, 0.8)',
    }));
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 5 }}>
      {snowflakes.map(flake => (
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
          10% { opacity: 0.95; }
          50% { transform: translateY(50vh) translateX(35px) scale(1.1); opacity: 0.95; }
          90% { opacity: 0.9; }
          100% { transform: translateY(105vh) translateX(-25px) scale(0.9); opacity: 0; }
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

  useEffect(() => { setMounted(true); }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error('Lỗi đăng nhập Google: ' + (error.message || 'Vui lòng thử lại'));
        setError(error.message);
        setLoading(false);
      }
    } catch (e: any) {
      toast.error('Lỗi đăng nhập Google: ' + (e?.message || 'Vui lòng thử lại'));
      setError(e?.message || 'Không thể mở trang đăng nhập Google');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(false);

    if (mode === 'forgot') {
      if (!email.trim()) { setError('Vui lòng nhập email'); return; }
      setLoading(true);
      const { data, error: err } = await supabase.functions.invoke('forgot-password', {
        body: { email: email.trim() },
      });
      setLoading(false);
      const errMsg = await parseFunctionError(data, err);
      if (errMsg || err) { setError(errMsg || 'Có lỗi xảy ra, vui lòng thử lại'); return; }
      setSuccess(true);
      return;
    }

    if (mode === 'login') {
      if (!email.trim()) { setError('Vui lòng nhập email'); return; }
      if (password.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự'); return; }
      setLoading(true);
      const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setLoading(false);
      if (err) {
        setError(err.message === 'Invalid login credentials' ? 'Email hoặc mật khẩu không đúng' : err.message);
      }
    }
  };

  const reset = (m: Mode) => {
    setMode(m); setError(''); setSuccess(false);
    setEmail(''); setPassword('');
  };

  if (!mounted) return null;

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: `url(${authMountainBg})`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center center',
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      fontFamily: "'Inter', -apple-system, sans-serif",
      position: 'relative',
      overflowX: 'hidden',
      padding: '24px',
    }}>
      {/* Falling Snow Effect */}
      <SnowEffect />

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

      {/* ── CENTERED FLOATING CARD ── */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: '#ffffff',
        borderRadius: 28,
        padding: '48px 44px',
        boxShadow: '0 30px 70px -10px rgba(37, 99, 235, 0.22), 0 12px 30px -5px rgba(0,0,0,0.08)',
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
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 8px 0' }}>
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Đăng ký tài khoản' : 'Quên mật khẩu?'}
          </h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            {mode === 'login'
              ? 'Đăng nhập để bắt đầu làm bài thi và xem lý thuyết'
              : mode === 'register'
              ? 'Đăng ký nhanh chóng 1-Click bằng tài khoản Google'
              : 'Nhập email của bạn để lấy lại mật khẩu nhanh chóng'}
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px',
            background: '#ffe4e6', border: '1px solid #fecdd3', borderRadius: 14,
            color: '#e11d48', fontSize: 14, fontWeight: 600, marginBottom: 20
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Success banner */}
        {success && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px',
            background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 14,
            color: '#15803d', fontSize: 14, fontWeight: 600, marginBottom: 20
          }}>
            <CheckCircle size={20} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Đã gửi hướng dẫn đặt lại mật khẩu về email của bạn!</span>
          </div>
        )}

        {/* ── REGISTER MODE: GOOGLE ONLY ── */}
        {mode === 'register' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Info Banner */}
            <div style={{
              padding: '20px 22px',
              background: '#edf5ff',
              border: '1.5px solid #dbeafe',
              borderRadius: 18,
              fontSize: 14,
              color: '#1e40af',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.08)'
            }}>
              <Sparkles size={22} style={{ color: '#2563eb', flexShrink: 0, marginTop: 2 }} />
              <div style={{ lineHeight: 1.55 }}>
                <strong style={{ color: '#1d4ed8', display: 'block', marginBottom: 4, fontSize: 14.5 }}>
                  Đăng ký nhanh 1-Click
                </strong>
                TQMaster hỗ trợ Đăng ký nhanh bằng tài khoản Google. Không cần điền form phức tạp hay xác thực email!
              </div>
            </div>

            {/* Google Register Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{
                height: 54,
                width: '100%',
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                color: '#0f172a',
                border: '2px solid #cbd5e1',
                borderRadius: 16,
                fontSize: 15.5,
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.borderColor = '#3b82f6', e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (!loading && (e.currentTarget.style.borderColor = '#cbd5e1', e.currentTarget.style.transform = 'translateY(0)'))}
            >
              {loading ? (
                <Loader2 size={22} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
              ) : (
                <>
                  <GoogleIcon />
                  Đăng ký ngay bằng Google
                  <ArrowRight size={18} style={{ marginLeft: 6, color: '#3b82f6' }} />
                </>
              )}
            </button>
          </div>
        ) : (
          /* ── LOGIN & FORGOT MODE: FORM ── */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

            {mode === 'login' && (
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
                    placeholder="••••••••"
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

            {/* Main Primary Action Button */}
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
                  {mode === 'login' ? 'Sign In' : 'Gửi liên kết đặt lại'}
                </>
              )}
            </button>

            {/* Divider (Login Mode Only) */}
            {mode === 'login' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0 8px 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                  <span style={{ padding: '0 12px', fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>HOẶC</span>
                  <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                </div>

                {/* Google Login Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  style={{
                    height: 52,
                    width: '100%',
                    background: '#ffffff',
                    color: '#334155',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 14,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.borderColor = '#94a3b8', e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.borderColor = '#cbd5e1', e.currentTarget.style.background = '#ffffff')}
                >
                  <GoogleIcon />
                  Đăng nhập bằng Google
                </button>
              </>
            )}
          </form>
        )}

        {/* Toggle Login/Register Footer */}
        <div style={{ marginTop: 28, textAlign: 'center', fontSize: 14, color: '#64748b' }}>
          {mode === 'login' ? (
            <>
              Chưa có tài khoản?{' '}
              <button
                onClick={() => reset('register')}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 800, cursor: 'pointer', padding: 0 }}
              >
                Đăng ký bằng Google
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
