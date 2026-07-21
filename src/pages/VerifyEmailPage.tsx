import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Loader2, RefreshCw, CheckCircle, LogOut, AlertCircle } from 'lucide-react';

const RESEND_COOLDOWN_S = 60;
const RESEND_MAX_PER_HOUR = 3;
const STORAGE_KEY = 'verify_email_resend_log';

function getResendLog(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as number[];
    const cutoff = Date.now() - 60 * 60 * 1000;
    return arr.filter(t => t > cutoff);
  } catch { return []; }
}

function pushResend() {
  const log = getResendLog();
  log.push(Date.now());
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
}

export default function VerifyEmailPage({ email, onVerified }: { email: string; onVerified: () => void }) {
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [otp, setOtp] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const verifyByOtp = async () => {
    setMsg(null);
    const code = otp.replace(/\D/g, '');
    if (code.length !== 6) {
      setMsg({ kind: 'err', text: 'Vui lòng nhập đủ 6 số của mã xác thực.' });
      return;
    }
    setVerifyingOtp(true);
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'signup' });
    setVerifyingOtp(false);
    if (error) {
      setMsg({ kind: 'err', text: 'Mã không đúng hoặc đã hết hạn. Vui lòng thử lại hoặc bấm "Gửi lại email".' });
      return;
    }
    onVerified();
  };

  const remainingThisHour = Math.max(0, RESEND_MAX_PER_HOUR - getResendLog().length);

  const resend = async () => {
    setMsg(null);
    if (cooldown > 0) return;
    if (getResendLog().length >= RESEND_MAX_PER_HOUR) {
      setMsg({ kind: 'err', text: `Bạn đã gửi quá ${RESEND_MAX_PER_HOUR} lần trong 1 giờ. Vui lòng thử lại sau.` });
      return;
    }
    setSending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    setSending(false);
    if (error) {
      setMsg({ kind: 'err', text: error.message });
    } else {
      pushResend();
      setCooldown(RESEND_COOLDOWN_S);
      setMsg({ kind: 'ok', text: 'Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư (kể cả Spam).' });
    }
  };

  const checkVerified = async () => {
    setMsg(null);
    setChecking(true);
    await supabase.auth.refreshSession();
    const { data } = await supabase.auth.getUser();
    setChecking(false);
    if (data.user?.email_confirmed_at) {
      onVerified();
    } else {
      setMsg({ kind: 'err', text: 'Tài khoản chưa được xác thực. Vui lòng bấm vào liên kết trong email rồi thử lại.' });
    }
  };

  const logout = async () => { await supabase.auth.signOut(); };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'hsl(var(--background))' }}>
      <div className="w-full max-w-[460px] rounded-3xl p-8"
        style={{
          background: 'hsl(var(--surface-raised))',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 20px 60px -20px rgba(0,0,0,0.15)',
        }}>
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
            <Mail size={30} />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-center mb-2">Xác thực email</h1>
        <p className="text-sm text-center text-[hsl(var(--muted-fg))] mb-1">
          Bạn cần xác thực email trước khi sử dụng hệ thống.
        </p>
        <p className="text-sm text-center mb-6">
          Chúng tôi đã gửi liên kết xác thực đến:
        </p>

        <div className="text-center font-semibold text-[hsl(var(--primary))] break-all mb-6 p-3 rounded-xl"
          style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
          {email}
        </div>

        {msg && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl text-sm mb-4"
            style={{
              background: msg.kind === 'ok' ? 'hsl(var(--success-light))' : 'hsl(var(--danger-light))',
              border: `1px solid ${msg.kind === 'ok' ? 'hsl(var(--success) / 0.25)' : 'hsl(var(--danger) / 0.25)'}`,
              color: msg.kind === 'ok' ? 'hsl(var(--success))' : 'hsl(var(--danger))',
            }}>
            {msg.kind === 'ok' ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
            <span className="font-medium leading-snug">{msg.text}</span>
          </div>
        )}

        <button
          onClick={checkVerified}
          disabled={checking}
          className="w-full h-12 rounded-xl font-semibold flex items-center justify-center gap-2 mb-3 transition-all disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
            color: 'hsl(var(--primary-foreground, 0 0% 100%))',
            boxShadow: '0 8px 20px -6px hsl(var(--primary) / 0.45)',
          }}>
          {checking ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
          Tôi đã xác thực
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
          <span className="text-xs text-[hsl(var(--muted-fg))] font-medium">HOẶC NHẬP MÃ 6 SỐ</span>
          <div className="flex-1 h-px" style={{ background: 'hsl(var(--border))' }} />
        </div>

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="______"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="w-full h-12 rounded-xl text-center tracking-[0.5em] text-xl font-bold mb-3 focus:outline-none focus:ring-2"
          style={{
            background: 'hsl(var(--background))',
            border: '1.5px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}
        />

        <button
          onClick={verifyByOtp}
          disabled={verifyingOtp || otp.length !== 6}
          className="w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mb-3 transition-all disabled:opacity-50"
          style={{
            background: 'hsl(var(--success))',
            color: 'white',
          }}>
          {verifyingOtp ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          Xác thực bằng mã
        </button>

        <button
          onClick={resend}
          disabled={sending || cooldown > 0}
          className="w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-2 mb-3 transition-all disabled:opacity-60"
          style={{
            background: 'hsl(var(--background))',
            border: '1.5px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }}>
          {sending ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại email xác thực'}
        </button>

        <div className="text-xs text-center text-[hsl(var(--muted-fg))] mb-5">
          Còn lại {remainingThisHour}/{RESEND_MAX_PER_HOUR} lượt gửi trong 1 giờ
        </div>

        <button
          onClick={logout}
          className="w-full text-xs text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--danger))] flex items-center justify-center gap-1.5 transition-colors">
          <LogOut size={13} /> Đăng xuất
        </button>

        <p className="mt-5 text-xs text-center text-[hsl(var(--subtle-fg))] leading-relaxed">
          Tài khoản chưa xác thực sẽ tự động bị xoá sau 24 giờ.
        </p>
      </div>
    </div>
  );
}
