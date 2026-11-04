import { useState } from 'react';
import {
  AlertTriangle, Eye, EyeOff, Fingerprint, KeyRound, Lock, Mail, RefreshCw, ShieldAlert, ShieldCheck, Smartphone,
} from 'lucide-react';
import Logo from '@/components/Logo';
import type { Denial } from '../useAdminGate';

export function Mascot({ size = 132 }: { size?: number }) {
  return (
    <div className="aa-mascot-wrap" style={{ width: size, height: size }}>
      <div className="aa-mascot-glow" />
      <Logo alt="TQMaster" />
    </div>
  );
}

export function SplashScreen({ label = 'Đang khởi động…' }: { label?: string }) {
  return (
    <div className="aa-stage">
      <Mascot />
      <h1 className="aa-brand">TQMaster <span>Admin</span></h1>
      <p className="aa-tag">{label}</p>
      <div className="aa-loader" />
    </div>
  );
}

export function LoginScreen({ onSubmit }: { onSubmit: (email: string, pw: string) => Promise<string | null> }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pw || busy) return;
    setBusy(true);
    setErr(null);
    const msg = await onSubmit(email, pw);
    if (msg) setErr(msg);
    setBusy(false);
  };

  return (
    <div className="aa-stage">
      <Mascot size={116} />
      <h1 className="aa-brand">TQMaster <span>Admin</span></h1>
      <p className="aa-tag">Khu vực dành riêng cho quản trị viên</p>
      <form className="aa-glass" onSubmit={submit} autoComplete="on">
        {err && (
          <div className="aa-alert"><AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />{err}</div>
        )}
        <label className="aa-field">
          <span>Email admin</span>
          <div className="aa-input-wrap">
            <Mail size={18} />
            <input className="aa-input" type="email" inputMode="email" autoComplete="username" placeholder="admin@email.com"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </label>
        <label className="aa-field">
          <span>Mật khẩu</span>
          <div className="aa-input-wrap">
            <KeyRound size={18} />
            <input className="aa-input" type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
              value={pw} onChange={e => setPw(e.target.value)} />
            <button type="button" className="aa-eye" onClick={() => setShow(s => !s)} aria-label="Hiện/ẩn mật khẩu">
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <button className="aa-btn" type="submit" disabled={busy || !email || !pw}>
          {busy ? <RefreshCw size={18} className="aa-spin" /> : <ShieldCheck size={18} />}
          {busy ? 'Đang xác thực…' : 'Đăng nhập'}
        </button>
      </form>
      <div className="aa-foot"><Lock size={13} /> Ứng dụng riêng · chỉ chạy trên thiết bị đã liên kết</div>
    </div>
  );
}

export function LockScreen({ onUnlock, message, firstTime, email }: {
  onUnlock: () => void; message: string | null; firstTime: boolean; email: string;
}) {
  return (
    <div className="aa-stage">
      <div className="aa-glass aa-center">
        <div className="aa-lockring"><Fingerprint size={44} /></div>
        <h2 className="aa-h2">{firstTime ? 'Đã liên kết thiết bị này' : 'Ứng dụng đang khoá'}</h2>
        <p className="aa-p">
          {firstTime
            ? 'Điện thoại này là thiết bị duy nhất được phép dùng tài khoản admin. Xác thực để vào ứng dụng.'
            : 'Dùng vân tay, khuôn mặt hoặc mã PIN của máy để mở khoá.'}
        </p>
        {email && <p className="aa-p" style={{ marginTop: -8, fontWeight: 800, color: '#334155' }}>{email}</p>}
        {message && <div className="aa-alert" style={{ textAlign: 'left' }}><AlertTriangle size={18} style={{ flexShrink: 0 }} />{message}</div>}
        <button className="aa-btn" onClick={onUnlock}><Fingerprint size={20} /> Mở khoá</button>
      </div>
    </div>
  );
}

const DENIAL_COPY: Record<Denial, { title: string; body: string }> = {
  not_admin: {
    title: 'Chỉ dành cho quản trị viên',
    body: 'Tài khoản này không có quyền admin nên không thể dùng ứng dụng. Bạn đã được đăng xuất.',
  },
  device_locked: {
    title: 'Tài khoản đã liên kết thiết bị khác',
    body: 'Admin chỉ được dùng trên một điện thoại. Hãy gỡ liên kết ở web admin (mục "Thiết bị app") nếu bạn muốn đổi máy.',
  },
  unlinked: {
    title: 'Thiết bị đã bị gỡ liên kết',
    body: 'Điện thoại này không còn được phép truy cập. Nếu là bạn gỡ, hãy đăng nhập lại để liên kết.',
  },
};

export function DeniedScreen({ reason, onBack }: { reason: Denial; onBack: () => void }) {
  const c = DENIAL_COPY[reason];
  return (
    <div className="aa-stage">
      <div className="aa-glass aa-center">
        <div className="aa-lockring red"><ShieldAlert size={44} /></div>
        <h2 className="aa-h2">{c.title}</h2>
        <p className="aa-p">{c.body}</p>
        <button className="aa-btn ghost" onClick={onBack}>Quay lại đăng nhập</button>
      </div>
    </div>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="aa-stage">
      <div className="aa-glass aa-center">
        <div className="aa-lockring red"><Smartphone size={42} /></div>
        <h2 className="aa-h2">Chưa kết nối được</h2>
        <p className="aa-p">{message}</p>
        <button className="aa-btn" onClick={onRetry}><RefreshCw size={18} /> Thử lại</button>
      </div>
    </div>
  );
}
