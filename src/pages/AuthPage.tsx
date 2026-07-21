import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Eye, EyeOff, Loader2, Mail, Lock, User, GraduationCap,
  CheckCircle, AlertCircle, ArrowRight, Sparkles, ShieldCheck, Zap, BookOpenCheck,
} from 'lucide-react';
import logoAvatar from '@/assets/logo-avatar.png';

type Mode = 'login' | 'register' | 'forgot';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentCode, setStudentCode] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

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
        // Do NOT auto sign-in — email must be verified first.
        // Switch to login mode so user can sign in after verifying.
        setTimeout(() => {
          setMode('login');
          setSuccess(false);
        }, 10000);
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
    <div className="min-h-screen flex bg-background text-foreground relative overflow-hidden">
      {/* Decorative background blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-32 w-[480px] h-[480px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }} />
      </div>

      {/* LEFT: Branding panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 xl:p-16 relative z-10"
        style={{ background: 'linear-gradient(135deg, hsl(var(--primary-muted)) 0%, hsl(var(--surface-raised)) 100%)' }}>
        
        {/* Top brand */}
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-lg ring-2 ring-white/60"
            style={{ boxShadow: '0 8px 24px hsl(var(--primary) / 0.25)' }}>
            <img src={logoAvatar} alt="TQMaster" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">TQMaster</span>
        </div>

        {/* Center content */}
        <div className="max-w-lg animate-slide-up" style={{ animationDelay: '80ms' }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-semibold"
            style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--primary))' }}>
            <Sparkles size={13} /> Nền tảng học tập #1 cho sinh viên
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight mb-5">
            Chinh phục mọi <br />
            <span style={{
              background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--primary) / 0.6))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>kỳ thi</span> cùng TQMaster
          </h1>

          <p className="text-base text-[hsl(var(--muted-fg))] leading-relaxed mb-10 max-w-md">
            Tài liệu chuẩn xác, ngân hàng đề thi đa dạng và trải nghiệm luyện thi trực quan — tất cả trong một nền tảng.
          </p>

          <div className="space-y-3">
            {[
              { icon: <BookOpenCheck size={18} />, title: 'Tài liệu lý thuyết', desc: 'Biên soạn chuẩn, dễ hiểu, cập nhật liên tục' },
              { icon: <Zap size={18} />, title: 'Luyện thi trực tuyến', desc: 'Hàng ngàn câu hỏi sát đề thi thực tế' },
              { icon: <ShieldCheck size={18} />, title: 'An toàn & bảo mật', desc: 'Dữ liệu cá nhân được mã hoá tuyệt đối' },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl hover:translate-x-1 transition-transform duration-300"
                style={{ background: 'hsl(var(--surface-raised) / 0.6)', border: '1px solid hsl(var(--border) / 0.6)', backdropFilter: 'blur(8px)' }}>
                <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
                  {f.icon}
                </div>
                <div>
                  <div className="font-semibold text-sm mb-0.5">{f.title}</div>
                  <div className="text-xs text-[hsl(var(--muted-fg))]">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer testimonial */}
        <div className="text-xs text-[hsl(var(--muted-fg))] flex items-center gap-2 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex -space-x-2">
            {[1, 2, 3].map(n => (
              <div key={n} className="w-7 h-7 rounded-full border-2 border-[hsl(var(--surface-raised))]"
                style={{ background: `hsl(${n * 60} 70% 70%)` }} />
            ))}
          </div>
          <span><b className="text-foreground">10,000+</b> sinh viên đã tin dùng</span>
        </div>
      </div>

      {/* RIGHT: Form panel */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 relative z-10">
        {/* Mobile brand */}
        <div className="lg:hidden flex items-center gap-3 mb-8 animate-slide-up">
          <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-md ring-2 ring-white/60">
            <img src={logoAvatar} alt="TQMaster" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">TQMaster</span>
        </div>

        <div className="w-full max-w-[440px] animate-slide-up" style={{ animationDelay: '60ms' }}>
          {/* Card */}
          <div className="rounded-3xl p-7 sm:p-9"
            style={{
              background: 'hsl(var(--surface-raised))',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 20px 60px -20px rgba(0,0,0,0.15), 0 8px 24px -8px rgba(0,0,0,0.08)',
            }}>
            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-[1.75rem] font-extrabold tracking-tight mb-1.5">
                {mode === 'login' ? 'Chào mừng trở lại 👋' : mode === 'register' ? 'Tạo tài khoản mới ✨' : 'Quên mật khẩu? 🔑'}
              </h2>
              <p className="text-sm text-[hsl(var(--muted-fg))]">
                {mode === 'login'
                  ? 'Đăng nhập để tiếp tục hành trình học tập của bạn.'
                  : mode === 'register'
                  ? 'Bắt đầu hành trình học tập chỉ trong 30 giây.'
                  : 'Nhập email của bạn, chúng tôi sẽ gửi mật khẩu mới về hộp thư.'}
              </p>
            </div>

            {/* Tabs */}
            {mode !== 'forgot' && (
            <div className="flex p-1 rounded-xl mb-6"
              style={{ background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}>
              {(['login', 'register'] as Mode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => reset(m)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200"
                  style={{
                    background: mode === m ? 'hsl(var(--surface-raised))' : 'transparent',
                    color: mode === m ? 'hsl(var(--primary))' : 'hsl(var(--muted-fg))',
                    boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
                </button>
              ))}
            </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <div className="space-y-4 animate-fade-in">
                  <Field icon={<User size={17} />} label="Họ và tên" id="fullName"
                    value={fullName} onChange={setFullName} placeholder="Nguyễn Văn A" />
                  <Field icon={<GraduationCap size={17} />} label="Mã sinh viên" id="studentCode"
                    value={studentCode} onChange={setStudentCode} placeholder="VD: 2021XXXXXX" mono />
                </div>
              )}

              <Field icon={<Mail size={17} />} label="Email" id="email" type="email" required
                value={email} onChange={setEmail} placeholder="you@example.com" />

              {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-semibold text-[hsl(var(--subtle-fg))] uppercase tracking-wide">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--subtle-fg))] group-focus-within:text-[hsl(var(--primary))] transition-colors" />
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Tối thiểu 8 ký tự' : '••••••••'}
                    required minLength={8}
                    className="w-full h-11 pl-10 pr-11 rounded-xl text-sm transition-all"
                    style={{
                      background: 'hsl(var(--background))',
                      border: '1.5px solid hsl(var(--border))',
                      color: 'hsl(var(--foreground))',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.boxShadow = '0 0 0 4px hsl(var(--primary) / 0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[hsl(var(--subtle-fg))] hover:text-foreground hover:bg-[hsl(var(--primary)/0.08)] transition-colors">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {mode === 'login' && (
                  <div className="flex justify-end pt-1">
                    <button type="button" onClick={() => reset('forgot')} className="text-xs font-medium text-[hsl(var(--primary))] hover:underline">
                      Quên mật khẩu?
                    </button>
                  </div>
                )}
              </div>
              )}

              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl text-sm animate-slide-up"
                  style={{ background: 'hsl(var(--danger-light))', border: '1px solid hsl(var(--danger) / 0.25)', color: 'hsl(var(--danger))' }}>
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="font-medium leading-snug">{error}</span>
                </div>
              )}

              {success && !error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl text-sm animate-slide-up"
                  style={{ background: 'hsl(var(--success-light))', border: '1px solid hsl(var(--success) / 0.25)', color: 'hsl(var(--success))' }}>
                  <CheckCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="font-medium leading-snug flex-1">
                    {mode === 'forgot'
                      ? 'Đã gửi mật khẩu mới về email của bạn! Vui lòng kiểm tra hộp thư, đăng nhập và đổi lại mật khẩu.'
                      : (
                        <div className="space-y-3">
                          <p className="font-bold text-base text-emerald-800 dark:text-emerald-300">🎉 Đăng ký tài khoản thành công!</p>
                          <div className="p-4 bg-amber-500/15 border-2 border-amber-500/60 rounded-2xl text-xs space-y-2 text-foreground font-medium shadow-md">
                            <div className="font-bold text-amber-700 dark:text-amber-400 text-sm flex items-center gap-1.5">
                              <span>🚨</span> HƯỚNG DẪN XÁC THỰC EMAIL (BẮT BUỘC):
                            </div>
                            <ol className="list-decimal list-inside space-y-1.5 text-xs">
                              <li>Kiểm tra Hộp thư email (và <b>ĐẶC BIỆT LÀ MỤC THƯ RÁC / SPAM</b>).</li>
                              <li>Nếu bị đưa vào Spam: Bấm chọn <b>"Báo cáo không phải thư rác"</b> (Not Spam).</li>
                              <li>Copy <b>Mã OTP 6 số</b> trong email nhập vào trang xác thực (hoặc bấm liên kết).</li>
                            </ol>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl font-semibold text-[0.95rem] flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
                  color: 'hsl(var(--primary-foreground, 0 0% 100%))',
                  boxShadow: '0 8px 20px -6px hsl(var(--primary) / 0.45)',
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Đăng nhập' : mode === 'register' ? 'Tạo tài khoản' : 'Gửi liên kết đặt lại'}
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* Footer link */}
            <div className="mt-6 text-center text-sm text-[hsl(var(--muted-fg))]">
              {mode === 'login' ? (
                <>Chưa có tài khoản?{' '}
                  <button onClick={() => reset('register')} className="font-semibold text-[hsl(var(--primary))] hover:underline">
                    Đăng ký ngay
                  </button>
                </>
              ) : mode === 'register' ? (
                <>Đã có tài khoản?{' '}
                  <button onClick={() => reset('login')} className="font-semibold text-[hsl(var(--primary))] hover:underline">
                    Đăng nhập
                  </button>
                </>
              ) : (
                <>Nhớ mật khẩu rồi?{' '}
                  <button onClick={() => reset('login')} className="font-semibold text-[hsl(var(--primary))] hover:underline">
                    Quay lại đăng nhập
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[hsl(var(--subtle-fg))]">
            © {new Date().getFullYear()} TQMaster. Đã đăng ký bản quyền.
          </p>
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
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-[hsl(var(--subtle-fg))] uppercase tracking-wide">
        {label}
      </label>
      <div className="relative group">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--subtle-fg))] group-focus-within:text-[hsl(var(--primary))] transition-colors">
          {icon}
        </span>
        <input
          id={id} type={type} value={value} required={required}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-11 pl-10 pr-3 rounded-xl text-sm transition-all ${mono ? 'font-mono' : ''}`}
          style={{
            background: 'hsl(var(--background))',
            border: '1.5px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.boxShadow = '0 0 0 4px hsl(var(--primary) / 0.12)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>
    </div>
  );
}
