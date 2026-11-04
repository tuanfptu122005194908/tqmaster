import { Device } from '@capacitor/device';
import { supabase } from '@/integrations/supabase/client';
import { mapAdminGateError, type AdminGateError } from './orderAlert';

export class AdminGateException extends Error {
  code: AdminGateError;
  constructor(code: AdminGateError, message?: string) {
    super(message || code);
    this.code = code;
  }
}

export async function getDeviceIdentity(): Promise<{ id: string; name: string }> {
  const [{ identifier }, info] = await Promise.all([Device.getId(), Device.getInfo()]);
  const name = [info.manufacturer, info.model].filter(Boolean).join(' ').trim() || 'Android';
  return { id: identifier, name };
}

/** Links this phone (first admin device wins). Throws AdminGateException on rejection. */
export async function claimAdminDevice(fcmToken?: string | null): Promise<{ firstTime: boolean }> {
  const dev = await getDeviceIdentity();
  const { data, error } = await supabase.rpc('claim_admin_device', {
    p_device_id: dev.id,
    p_device_name: dev.name,
    p_fcm_token: fcmToken ?? null,
  });
  if (error) throw new AdminGateException(mapAdminGateError(error.message), error.message);
  const firstTime = Boolean((data as { first_time?: boolean } | null)?.first_time);
  return { firstTime };
}

/** Heartbeat. Returns false when this phone is no longer the linked device. */
export async function verifyAdminDevice(fcmToken?: string | null): Promise<boolean | null> {
  const dev = await getDeviceIdentity();
  const { data, error } = await supabase.rpc('verify_admin_device', {
    p_device_id: dev.id,
    p_fcm_token: fcmToken ?? null,
  });
  if (error) return null; // network/transient: caller keeps current state
  return data === true;
}

export async function releaseDeviceToken(): Promise<void> {
  try {
    const dev = await getDeviceIdentity();
    await supabase.rpc('release_admin_device_token', { p_device_id: dev.id });
  } catch {
    // best effort on sign-out
  }
}

