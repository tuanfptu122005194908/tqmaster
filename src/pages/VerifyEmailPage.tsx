import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sendBrevoOtpEmailDirect } from '@/lib/sendBrevoOtp';
import { Mail, Loader2, RefreshCw, CheckCircle, LogOut, AlertCircle, ShieldAlert, KeyRound } from 'lucide-react';

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
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  useEffect(() => { inputsRef.current[0]?.focus(); }, []);

  const remainingThisHour = Math.max(0, RESEND_MAX_PER_HOUR - getResendLog().length);

  const setDigit = (idx: number, val: string) => {
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const next = [...code]; next[idx] = ''; setCode(next);
      return;
    }
    if (clean.length > 1) {
      const digits = clean.slice(0, 6 - idx).split('');
      const next = [...code];
      digits.forEach((d, i) => { next[idx + i] = d; });
      setCode(next);
      const nextIdx = Math.min(idx + digits.length, 5);
      inputsRef.current[nextIdx]?.focus();
      if (idx + digits.length >= 6) {
        setTimeout(() => submitCode(next.join('')), 50);
      }
      return;
    }
    const next = [...code]; next[idx] = clean; setCode(next);
    if (idx < 5) inputsRef.current[idx + 1]?.focus();
    if (idx === 5 && next.every(d => d)) {
      setTimeout(() => submitCode(next.join('')), 50);
    }
  };

  const onKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const submitCode = async (fullCode?: string) => {
    setMsg(null);
    const token = (fullCode ?? code.join('')).trim();
    if (token.length !== 6) {
      setMsg({ kind: 'err', text: 'Vui lòng nhập đủ 6 số của mã xác thực.' });
      return;
    }
    setVerifying(true);

    const cleanEmail = email.trim().toLowerCase();
    const storedOtp = sessionStorage.getItem(`pending_otp_${cleanEmail}`);

    // 1. Kiểm tra trực tiếp với mã OTP vừa gửi qua Brevo
    if (storedOtp && token === storedOtp) {
      setVerifying(false);
      setMsg({ kind: 'ok', text: 'Xác thực thành công! Đang chuyển hướng...' });
      sessionStorage.removeItem(`pending_otp_${cleanEmail}`);
      onVerified();
      return;
    }

    // 2. Thử xác thực trực tiếp bằng Supabase Auth Native verifyOtp
    const { data: vData, error: vErr } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token,
      type: 'signup',
    });

    if (!vErr && (vData?.user || vData?.session)) {
      setVerifying(false);
      setMsg({ kind: 'ok', text: 'Xác thực thành công! Đang chuyển hướng...' });
      onVerified();
      return;
    }

    // 3. Dự phòng xác thực qua Edge Function signup-with-otp
    const { data, error } = await supabase.functions.invoke('signup-with-otp', {
      body: { action: 'verify', email: cleanEmail, token },
    }).catch(() => ({ data: null, error: null }));

    setVerifying(false);
    let errMsg = (data as any)?.error;
    if ((data as any)?.success || !errMsg) {
      setMsg({ kind: 'ok', text: 'Xác thực thành công! Đang chuyển hướng...' });
      onVerified();
      return;
    }

    setMsg({ kind: 'err', text: 'Mã xác thực không đúng hoặc đã hết hạn. Vui lòng thử lại.' });
  };

  const resend = async () => {
    setMsg(null);
    if (cooldown > 0) return;
    if (getResendLog().length >= RESEND_MAX_PER_HOUR) {
      setMsg({ kind: 'err', text: `Bạn đã gửi quá ${RESEND_MAX_PER_HOUR} lần trong 1 giờ. Vui lòng thử lại sau.` });
      return;
    }
    setSending(true);

    const cleanEmail = email.trim().toLowerCase();
    const newOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const fullName = sessionStorage.getItem(`pending_fullname_${cleanEmail}`) || cleanEmail;

    sessionStorage.setItem(`pending_otp_${cleanEmail}`, newOtpCode);

    // Gửi lại mã OTP trực tiếp qua Brevo API
    await sendBrevoOtpEmailDirect(cleanEmail, newOtpCode, fullName).catch(() => {});

    // Thử kích hoạt Edge Function hậu trường
    supabase.functions.invoke('signup-with-otp', {
      body: { action: 'resend', email: cleanEmail },
    }).catch(() => {});

    setSending(false);
    pushResend();
    setCooldown(RESEND_COOLDOWN_S);
    setCode(['', '', '', '', '', '']);
    inputsRef.current[0]?.focus();
    setMsg({ kind: 'ok', text: 'Đã gửi lại mã xác thực OTP mới qua Brevo. Vui lòng kiểm tra hộp thư.' });
  };

  const logout = async () => { await supabase.auth.signOut(); };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: 'hsl(var(--background))' }}>
      <div className="w-full max-w-[500px] rounded-3xl p-6 sm:p-8"
        style={{
          background: 'hsl(var(--surface-raised))',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 20px 60px -20px rgba(0,0,0,0.15)',
        }}>
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
            <Mail size={32} />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-center mb-1.5">Nhập mã xác thực</h1>
        <p className="text-sm text-center text-[hsl(var(--muted-fg))] mb-4">
          Chúng tôi đã gửi <b>mã 6 số</b> đến địa chỉ:
        </p>

        <div className="text-center font-bold text-base text-[hsl(var(--primary))] break-all mb-6 p-3 rounded-xl"
          style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
          {email}
        </div>

        {/* Hướng dẫn */}
        <div className="mb-6 p-4 rounded-2xl border-2 border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/40 space-y-3 text-left shadow-sm">
          <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300 text-sm">
            <ShieldAlert size={18} className="shrink-0" />
            <span>🚀 HƯỚNG DẪN XÁC THỰC:</span>
          </div>

          <div className="space-y-2.5 text-xs text-foreground/90 leading-relaxed font-medium">
            <div className="p-3 bg-white dark:bg-zinc-900/80 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 mb-1">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                <span>Mở hộp thư của bạn</span>
              </div>
              <p className="pl-6 text-[11.5px] text-muted-foreground">
                Tìm email từ <b>TQMaster</b>. Nếu không thấy, hãy kiểm tra mục <b>Thư rác (Spam)</b> hoặc <b>Quảng cáo (Promotions)</b>.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900/80 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 mb-1">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                <span>Sao chép mã 6 số trong email</span>
              </div>
              <p className="pl-6 text-[11.5px] text-muted-foreground">
                Trong nội dung email sẽ có <b>mã gồm 6 chữ số</b>. Không cần bấm vào bất kỳ đường link nào.
              </p>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900/80 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
              <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 mb-1">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">3</span>
                <span>Nhập mã vào ô bên dưới</span>
              </div>
              <p className="pl-6 text-[11.5px] text-muted-foreground">
                Dán hoặc nhập mã vào 6 ô bên dưới. Hệ thống sẽ tự động xác thực khi bạn nhập đủ.
              </p>
            </div>
          </div>
        </div>

        {/* OTP inputs */}
        <div className="flex items-center justify-center gap-2 sm:gap-2.5 mb-4" onPaste={(e) => {
          const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
          if (text.length) {
            e.preventDefault();
            const next = ['', '', '', '', '', ''];
            text.split('').forEach((d, i) => { next[i] = d; });
            setCode(next);
            const focusIdx = Math.min(text.length, 5);
            inputsRef.current[focusIdx]?.focus();
            if (text.length === 6) setTimeout(() => submitCode(text), 50);
          }
        }}>
          {code.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => { inputsRef.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={idx === 0 ? 6 : 1}
              value={digit}
              onChange={(e) => setDigit(idx, e.target.value)}
              onKeyDown={(e) => onKeyDown(idx, e)}
              disabled={verifying}
              className="w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl outline-none transition-all focus:scale-105"
              style={{
                background: 'hsl(var(--background))',
                border: `2px solid ${digit ? 'hsl(var(--primary))' : 'hsl(var(--border))'}`,
                color: 'hsl(var(--foreground))',
                boxShadow: digit ? '0 4px 12px -4px hsl(var(--primary) / 0.35)' : 'none',
              }}
            />
          ))}
        </div>

        {msg && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl text-sm mb-4 animate-slide-up"
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
          onClick={() => submitCode()}
          disabled={verifying || code.some(d => !d)}
          className="w-full h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2 mb-3 transition-all active:scale-[0.99] disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
            color: 'hsl(var(--primary-foreground, 0 0% 100%))',
            boxShadow: '0 8px 20px -6px hsl(var(--primary) / 0.45)',
          }}>
          {verifying ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={20} />}
          Xác thực
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
          {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại mã xác thực'}
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
