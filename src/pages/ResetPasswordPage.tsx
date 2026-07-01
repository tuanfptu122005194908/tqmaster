import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, EyeOff, Loader2, Lock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import logoAvatar from '@/assets/logo-avatar.png';

export default function ResetPasswordPage({ onDone, forced = false }: { onDone: () => void; forced?: boolean }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Mật khẩu phải có ít nhất 8 ký tự'); return; }
    if (password !== confirm) { setError('Mật khẩu nhập lại không khớp'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password, data: { must_change_password: false } });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => { onDone(); }, 2500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6 relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 -right-32 w-[480px] h-[480px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-[440px] relative z-10 animate-slide-up">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-md ring-2 ring-white/60">
            <img src={logoAvatar} alt="TQMaster" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">TQMaster</span>
        </div>

        <div className="rounded-3xl p-7 sm:p-9"
          style={{
            background: 'hsl(var(--surface-raised))',
            border: '1px solid hsl(var(--border))',
            boxShadow: '0 20px 60px -20px rgba(0,0,0,0.15), 0 8px 24px -8px rgba(0,0,0,0.08)',
          }}>
          <div className="mb-7">
            <h2 className="text-[1.75rem] font-extrabold tracking-tight mb-1.5">Đặt lại mật khẩu 🔐</h2>
            <p className="text-sm text-[hsl(var(--muted-fg))]">
              {forced
                ? 'Bạn đang dùng mật khẩu tạm thời. Vui lòng tạo mật khẩu mới để tiếp tục.'
                : 'Nhập mật khẩu mới cho tài khoản của bạn.'}
            </p>
          </div>

          {success ? (
            <div className="flex items-start gap-2.5 p-4 rounded-xl text-sm"
              style={{ background: 'hsl(var(--success-light))', border: '1px solid hsl(var(--success) / 0.25)', color: 'hsl(var(--success))' }}>
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <span className="font-medium leading-snug">Đổi mật khẩu thành công! Đang chuyển hướng...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <PassField label="Mật khẩu mới" value={password} onChange={setPassword}
                show={showPass} toggle={() => setShowPass(!showPass)} placeholder="Tối thiểu 8 ký tự" />
              <PassField label="Nhập lại mật khẩu" value={confirm} onChange={setConfirm}
                show={showPass} toggle={() => setShowPass(!showPass)} placeholder="Nhập lại mật khẩu mới" />

              {error && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl text-sm"
                  style={{ background: 'hsl(var(--danger-light))', border: '1px solid hsl(var(--danger) / 0.25)', color: 'hsl(var(--danger))' }}>
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span className="font-medium leading-snug">{error}</span>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-xl font-semibold text-[0.95rem] flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
                  color: 'hsl(var(--primary-foreground, 0 0% 100%))',
                  boxShadow: '0 8px 20px -6px hsl(var(--primary) / 0.45)',
                }}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <>Cập nhật mật khẩu <ArrowRight size={17} /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function PassField({ label, value, onChange, show, toggle, placeholder }: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; toggle: () => void; placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[hsl(var(--subtle-fg))] uppercase tracking-wide">{label}</label>
      <div className="relative group">
        <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--subtle-fg))] group-focus-within:text-[hsl(var(--primary))] transition-colors" />
        <input
          type={show ? 'text' : 'password'} value={value} required minLength={8}
          onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full h-11 pl-10 pr-11 rounded-xl text-sm transition-all"
          style={{ background: 'hsl(var(--background))', border: '1.5px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--primary))'; e.currentTarget.style.boxShadow = '0 0 0 4px hsl(var(--primary) / 0.12)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'hsl(var(--border))'; e.currentTarget.style.boxShadow = 'none'; }}
        />
        <button type="button" onClick={toggle}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[hsl(var(--subtle-fg))] hover:text-foreground hover:bg-[hsl(var(--primary)/0.08)] transition-colors">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}
