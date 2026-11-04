import { useCallback, useEffect, useRef, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { supabase } from '@/integrations/supabase/client';
import { claimAdminDevice, verifyAdminDevice, releaseDeviceToken, AdminGateException } from '@/lib/native/adminDevice';
import { shouldAutoLock } from '@/lib/native/orderAlert';
import { isNativeApp } from '@/lib/native/platform';

export type Phase = 'booting' | 'signed_out' | 'denied' | 'locked' | 'ready' | 'error';
export type Denial = 'not_admin' | 'device_locked' | 'unlinked';

const AUTO_LOCK_MS = 60_000;
const HEARTBEAT_MS = 5 * 60_000;

async function biometricUnlock(): Promise<{ ok: boolean; message?: string }> {
  if (!isNativeApp()) return { ok: true };
  try {
    const info = await BiometricAuth.checkBiometry();
    if (!info.isAvailable && !info.deviceIsSecure) {
      return { ok: false, message: 'Hãy đặt khoá màn hình (vân tay / PIN) cho điện thoại để dùng app.' };
    }
    await BiometricAuth.authenticate({
      reason: 'Mở khoá TQMaster Admin',
      cancelTitle: 'Huỷ',
      allowDeviceCredential: true,
      androidTitle: 'TQMaster Admin',
      androidSubtitle: 'Xác thực để tiếp tục',
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (/cancel/i.test(msg)) return { ok: false };
    return { ok: false, message: 'Xác thực chưa thành công. Hãy thử lại.' };
  }
}

export function useAdminGate() {
  const [phase, setPhase] = useState<Phase>('booting');
  const [denial, setDenial] = useState<Denial | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [firstTime, setFirstTime] = useState(false);
  const [lockMsg, setLockMsg] = useState<string | null>(null);
  const [adminEmail, setAdminEmail] = useState('');
  const phaseRef = useRef<Phase>('booting');
  phaseRef.current = phase;

  const deny = useCallback(async (reason: Denial) => {
    await supabase.auth.signOut();
    setDenial(reason);
    setPhase('denied');
  }, []);

  const enter = useCallback(async () => {
    try {
      const { firstTime: ft } = await claimAdminDevice();
      const { data } = await supabase.auth.getUser();
      setAdminEmail(data.user?.email ?? '');
      setFirstTime(ft);
      setLockMsg(null);
      setPhase('locked');
    } catch (e) {
      const code = e instanceof AdminGateException ? e.code : 'UNKNOWN';
      if (code === 'NOT_ADMIN') return deny('not_admin');
      if (code === 'DEVICE_LOCKED') return deny('device_locked');
      setErrorMsg(code === 'NETWORK' ? 'Không có kết nối mạng. Hãy kiểm tra Internet.' : 'Không thể xác minh thiết bị. Thử lại sau.');
      setPhase('error');
    }
  }, [deny]);

  // Boot
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      if (data.session) void enter();
      else setPhase('signed_out');
    });
    const { data: sub } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT' && phaseRef.current !== 'denied') setPhase('signed_out');
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [enter]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<string | null> => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        return /invalid/i.test(error.message) ? 'Email hoặc mật khẩu không đúng.' : error.message;
      }
      setDenial(null);
      await enter();
      return null;
    },
    [enter],
  );

  const unlock = useCallback(async () => {
    const r = await biometricUnlock();
    if (r.ok) {
      setLockMsg(null);
      setPhase('ready');
    } else {
      setLockMsg(r.message ?? null);
    }
  }, []);

  const lock = useCallback(() => {
    if (phaseRef.current === 'ready') setPhase('locked');
  }, []);

  const signOut = useCallback(async () => {
    await releaseDeviceToken();
    await supabase.auth.signOut();
    setPhase('signed_out');
  }, []);

  // Auto-lock after 60s in background + device heartbeat on resume / interval
  useEffect(() => {
    if (phase !== 'ready' || !isNativeApp()) return;
    let bgAt: number | null = null;

    const verify = async () => {
      const ok = await verifyAdminDevice();
      if (ok === false) await deny('unlinked');
    };

    const handle = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        bgAt = Date.now();
        return;
      }
      if (shouldAutoLock(bgAt, Date.now(), AUTO_LOCK_MS)) setPhase('locked');
      bgAt = null;
      void verify();
    });
    const timer = window.setInterval(() => void verify(), HEARTBEAT_MS);
    return () => {
      window.clearInterval(timer);
      void handle.then(h => h.remove());
    };
  }, [phase, deny]);

  return { phase, denial, errorMsg, firstTime, lockMsg, adminEmail, signIn, unlock, lock, signOut, retry: enter };
}

