import { Preferences } from '@capacitor/preferences';

export type AlertSound = 'chime' | 'off';

export interface AlertPrefs {
  sound: AlertSound;
  speak: boolean;
  vibrate: boolean;
}

export const DEFAULT_ALERT_PREFS: AlertPrefs = { sound: 'chime', speak: true, vibrate: true };

const KEY = 'tqm_admin_alert_prefs_v1';

export function sanitizePrefs(raw: unknown): AlertPrefs {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<AlertPrefs>;
  return {
    sound: r.sound === 'off' ? 'off' : 'chime',
    speak: typeof r.speak === 'boolean' ? r.speak : DEFAULT_ALERT_PREFS.speak,
    vibrate: typeof r.vibrate === 'boolean' ? r.vibrate : DEFAULT_ALERT_PREFS.vibrate,
  };
}

export async function loadAlertPrefs(): Promise<AlertPrefs> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    return value ? sanitizePrefs(JSON.parse(value)) : DEFAULT_ALERT_PREFS;
  } catch {
    return DEFAULT_ALERT_PREFS;
  }
}

export async function saveAlertPrefs(prefs: AlertPrefs): Promise<void> {
  await Preferences.set({ key: KEY, value: JSON.stringify(sanitizePrefs(prefs)) });
}

