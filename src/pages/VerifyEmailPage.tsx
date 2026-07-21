import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Loader2, RefreshCw, CheckCircle, LogOut, AlertCircle, ExternalLink, ShieldAlert } from 'lucide-react';

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
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

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
      setMsg({ kind: 'err', text: 'Tài khoản chưa được xác thực. Vui lòng bấm vào "Verify Email" trong email rồi thử lại.' });
    }
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

        <h1 className="text-2xl font-extrabold text-center mb-1.5">Xác thực email tài khoản</h1>
        <p className="text-sm text-center text-[hsl(var(--muted-fg))] mb-4">
          Chúng tôi đã gửi email xác thực đến địa chỉ:
        </p>

        <div className="text-center font-bold text-base text-[hsl(var(--primary))] break-all mb-6 p-3 rounded-xl"
          style={{ background: 'hsl(var(--primary) / 0.08)', border: '1px solid hsl(var(--primary) / 0.2)' }}>
          {email}
        </div>

        {/* 🚀 STEP BY STEP GUIDANCE BANNER */}
        <div className="mb-6 p-4 rounded-2xl border-2 border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/40 space-y-3.5 text-left shadow-sm">
          <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300 text-sm">
            <ShieldAlert size={18} className="shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span>🚀 CÁCH XÁC THỰC NHANH VÀ CHUẨN NHẤT:</span>
          </div>

          <div className="space-y-3 text-xs text-foreground/90 leading-relaxed font-medium">
            <div className="p-3 bg-white dark:bg-zinc-900/80 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-1">
              <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">1</span>
                <span>Bước 1 (Trong Gmail / Hộp thư):</span>
              </div>
              <ul className="pl-6 space-y-1 list-disc text-[11.5px] text-muted-foreground">
                <li>Nếu thấy thư ở mục <b>Thư rác (Spam)</b> hoặc có cảnh báo màu đỏ: Bấm nút <b className="text-emerald-600 dark:text-emerald-400">"Không phải spam"</b> (Not spam).</li>
                <li>Bấm trực tiếp vào nút <b className="text-indigo-600 dark:text-indigo-400">"Verify Email"</b> (hoặc đường link) trong thư.</li>
              </ul>
            </div>

            <div className="p-3 bg-white dark:bg-zinc-900/80 rounded-xl border border-indigo-100 dark:border-indigo-900/50 space-y-1">
              <div className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">2</span>
                <span>Bước 2 (Trên trang web TQMaster):</span>
              </div>
              <p className="pl-6 text-[11.5px] text-muted-foreground">
                Quay lại đây và bấm nút xanh bên dưới <b>"Tôi đã xác thực"</b> để tự động đăng nhập!
              </p>
            </div>
          </div>
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
          onClick={checkVerified}
          disabled={checking}
          className="w-full h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2 mb-3 transition-all active:scale-[0.99] disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
            color: 'hsl(var(--primary-foreground, 0 0% 100%))',
            boxShadow: '0 8px 20px -6px hsl(var(--primary) / 0.45)',
          }}>
          {checking ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={20} />}
          Tôi đã xác thực
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

