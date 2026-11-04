import { Haptics, NotificationType } from '@capacitor/haptics';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import chimeUrl from '@/app-admin/assets/order_alert.wav';
import type { AlertPrefs } from './alertPrefs';
import { buildOrderSpeech } from './orderAlert';

let audio: HTMLAudioElement | null = null;

export async function playChime(): Promise<void> {
  try {
    if (!audio) audio = new Audio(chimeUrl);
    audio.currentTime = 0;
    await audio.play();
  } catch {
    // autoplay may be blocked on very old WebViews; vibration/TTS still run
  }
}

export async function speakBuyer(buyerName: string): Promise<void> {
  try {
    await TextToSpeech.speak({
      text: buildOrderSpeech({ buyerName }),
      lang: 'vi-VN',
      rate: 0.95,
      pitch: 1.0,
      volume: 1.0,
      category: 'ambient',
    });
  } catch {
    // TTS engine missing: silently ignore
  }
}

export async function buzz(): Promise<void> {
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch {
    // ignore
  }
}

/** Plays the configured foreground alert for one order. */
export async function runForegroundAlert(buyerName: string, prefs: AlertPrefs): Promise<void> {
  if (prefs.vibrate) void buzz();
  if (prefs.sound === 'chime') await playChime();
  if (prefs.speak) await speakBuyer(buyerName);
}

