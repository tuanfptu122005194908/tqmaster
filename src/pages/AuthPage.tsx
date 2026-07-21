import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Eye, EyeOff, Loader2, Mail, Lock, User, GraduationCap,
  CheckCircle, AlertCircle
} from 'lucide-react';
import logoAvatar from '@/assets/logo-avatar.png';

type Mode = 'login' | 'register' | 'forgot';

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
      display: 'flex',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e6effe 50%, #f5f8ff 100%)',
      fontFamily: "'Inter', -apple-system, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── LEFT SECTION: Landscape Vector Illustration & Branding ── */}
      <div style={{
        flex: 1.1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        position: 'relative',
        zIndex: 2,
      }} className="hidden lg:flex">
        
        {/* Top Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 46, height: 46, borderRadius: 16, overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(59, 130, 246, 0.25)',
            border: '2px solid #ffffff', background: '#ffffff'
          }}>
            <img src={logoAvatar} alt="TQMaster" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#1e293b', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              TQMaster
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', letterSpacing: '0.02em' }}>
              Hệ thống Học tập & Ôn thi
            </div>
          </div>
        </div>

        {/* Center SVG Landscape Vector (Mountains & Hot Air Balloon Style) */}
        <div style={{ position: 'relative', margin: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <svg viewBox="0 0 600 400" style={{ width: '100%', maxWidth: 520, height: 'auto', filter: 'drop-shadow(0 15px 30px rgba(59,130,246,0.12))' }}>
            <defs>
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#eff6ff" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="mtn1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#93c5fd" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="mtn2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#bfdbfe" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
              <linearGradient id="mtn3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dbeafe" />
                <stop offset="100%" stopColor="#93c5fd" />
              </linearGradient>
              <linearGradient id="balloonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>

            {/* Sun / Soft Glow */}
            <circle cx="300" cy="120" r="70" fill="#ffffff" opacity="0.6" />

            {/* Clouds */}
            <path d="M120 110 Q135 95 155 105 Q175 90 195 105 Q210 100 220 110 Z" fill="#ffffff" opacity="0.8" />
            <path d="M380 90 Q395 75 415 85 Q435 70 455 85 Q470 80 480 90 Z" fill="#ffffff" opacity="0.7" />

            {/* Background Mountains */}
            <polygon points="40,320 200,160 360,320" fill="url(#mtn3)" opacity="0.7" />
            <polygon points="260,320 420,140 560,320" fill="url(#mtn3)" opacity="0.6" />

            {/* Midground Mountains */}
            <polygon points="100,340 280,180 440,340" fill="url(#mtn2)" opacity="0.85" />

            {/* Snow Caps */}
            <polygon points="280,180 250,210 270,205 280,215 290,205 310,210" fill="#ffffff" />
            <polygon points="200,160 180,185 195,180 200,190 205,180 220,185" fill="#ffffff" />

            {/* Foreground Mountain Peak */}
            <polygon points="0,380 180,200 360,380" fill="url(#mtn1)" />
            <polygon points="180,200 160,225 175,220 180,230 185,220 200,225" fill="#ffffff" />

            {/* Hot Air Balloon */}
            <g transform="translate(390, 110)">
              <ellipse cx="25" cy="30" rx="20" ry="26" fill="url(#balloonGrad)" />
              <path d="M12 26 C12 45 38 45 38 26 Z" fill="#2563eb" opacity="0.3" />
              <line x1="17" y1="52" x2="20" y2="58" stroke="#3b82f6" strokeWidth="1.5" />
              <line x1="33" y1="52" x2="30" y2="58" stroke="#3b82f6" strokeWidth="1.5" />
              <rect x="19" y="58" width="12" height="9" rx="2" fill="#1e3a8a" />
            </g>

            {/* Birds */}
            <path d="M220 130 Q225 124 230 130 Q235 124 240 130" stroke="#3b82f6" strokeWidth="2" fill="none" opacity="0.7" />
            <path d="M250 145 Q254 140 258 145 Q262 140 266 145" stroke="#3b82f6" strokeWidth="1.5" fill="none" opacity="0.6" />
          </svg>
        </div>

        {/* Bottom Feature Badges */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { title: '10.000+ Sinh viên', desc: 'Đăng ký & tin dùng' },
            { title: 'Ngân hàng 100k+ Đề', desc: 'Cập nhật liên tục' },
            { title: 'Luyện thi Chuẩn 100%', desc: 'Dễ dàng đạt điểm A' },
          ].map((item, idx) => (
            <div key={idx} style={{
              flex: 1, padding: '14px 16px', background: '#ffffff',
              borderRadius: 16, border: '1px solid #e2e8f0',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.06)'
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT SECTION: Floating Clean Card Auth Form ── */}
      <div style={{
        flex: 0.9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        position: 'relative',
        zIndex: 2,
      }}>
        <div style={{
          width: '100%',
          maxWidth: 440,
          background: '#ffffff',
          borderRadius: 24,
          padding: '40px 36px',
          boxShadow: '0 25px 50px -12px rgba(59, 130, 246, 0.12), 0 10px 20px -5px rgba(0,0,0,0.04)',
          border: '1px solid #f1f5f9',
          animation: 'fadeSlideUp 0.4s ease-out',
        }}>
          {/* Top User Icon Badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#eff6ff', border: '1px solid #dbeafe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#2563eb', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.12)'
            }}>
              <User size={26} />
            </div>
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: '0 0 6px 0' }}>
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Tạo tài khoản mới' : 'Quên mật khẩu?'}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.4 }}>
              {mode === 'login'
                ? 'Đăng nhập để bắt đầu làm bài thi và xem lý thuyết'
                : mode === 'register'
                ? 'Đăng ký tài khoản để học tập miễn phí trên TQMaster'
                : 'Nhập email của bạn để lấy lại mật khẩu nhanh chóng'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {mode === 'register' && (
              <>
                <Field
                  icon={<User size={18} />}
                  label="Họ và tên"
                  id="fullName"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Nguyễn Văn A"
                />
                <Field
                  icon={<GraduationCap size={18} />}
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
              icon={<Mail size={18} />}
              label="Địa chỉ Email"
              id="email"
              type="email"
              required
              value={email}
              onChange={setEmail}
              placeholder="admin@touristms.com"
            />

            {mode !== 'forgot' && (
              <div>
                <label htmlFor="password" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Mật khẩu
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
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
                      height: 48,
                      paddingLeft: 42,
                      paddingRight: 44,
                      borderRadius: 12,
                      border: '1.5px solid #cbd5e1',
                      fontSize: 14,
                      color: '#0f172a',
                      background: '#ffffff',
                      outline: 'none',
                      transition: 'all 0.15s ease',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4
                    }}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            {mode === 'login' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: '#475569', fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#2563eb', borderRadius: 4, cursor: 'pointer' }}
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => reset('forgot')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer' }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                background: '#ffe4e6', border: '1px solid #fecdd3', borderRadius: 12,
                color: '#e11d48', fontSize: 13, fontWeight: 600
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Success banner */}
            {success && !error && (
              <div>
                {mode === 'forgot' ? (
                  <div style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                    background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 12,
                    color: '#15803d', fontSize: 13, fontWeight: 600
                  }}>
                    <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>Đã gửi hướng dẫn đặt lại mật khẩu về email của bạn!</span>
                  </div>
                ) : (
                  <div style={{
                    padding: 16, background: '#eff6ff', border: '1.5px solid #bfdbfe',
                    borderRadius: 14, fontSize: 12, color: '#1e3a8a'
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 6, color: '#1d4ed8' }}>
                      🚀 XÁC THỰC EMAIL ĐĂNG KÝ ({countdown}s)
                    </div>
                    <p style={{ margin: 0, lineHeight: 1.5 }}>
                      Vui lòng mở hộp thư Gmail của bạn và bấm vào liên kết <b>"Verify Email"</b> để hoàn tất đăng ký!
                    </p>
                    <button
                      type="button"
                      onClick={() => { setMode('login'); setSuccess(false); }}
                      style={{ marginTop: 10, background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer' }}
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
                height: 48,
                width: '100%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px -4px rgba(37, 99, 235, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.15s ease',
                marginTop: 4,
              }}
              onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? (
                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : mode === 'register' ? 'Đăng Ký Tài Khoản' : 'Gửi liên kết đặt lại'}
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register footer */}
          <div style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#64748b' }}>
            {mode === 'login' ? (
              <>
                Chưa có tài khoản?{' '}
                <button
                  onClick={() => reset('register')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                  Đăng ký ngay
                </button>
              </>
            ) : mode === 'register' ? (
              <>
                Đã có tài khoản?{' '}
                <button
                  onClick={() => reset('login')}
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, cursor: 'pointer', padding: 0 }}
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
      <label htmlFor={id} style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex' }}>
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
            height: 48,
            paddingLeft: 42,
            paddingRight: 14,
            borderRadius: 12,
            border: '1.5px solid #cbd5e1',
            fontSize: 14,
            color: '#0f172a',
            background: '#ffffff',
            outline: 'none',
            fontFamily: mono ? 'monospace' : 'inherit',
            transition: 'all 0.15s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.12)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>
    </div>
  );
}
