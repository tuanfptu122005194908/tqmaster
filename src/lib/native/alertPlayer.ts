import { Haptics, NotificationType } from '@capacitor/haptics';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import chimeUrl from '@/app-admin/assets/order_alert.wav';
import type { AlertPrefs } from './alertPrefs';
import { buildOrderSpeech } from './orderAlert';

let audio: HTMLAudioElement | null = null;

/** Plays the crisp 'ting' chime and waits for it to finish before resolving. */
export async function playChime(): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      if (!audio) {
        audio = new Audio(chimeUrl);
      }
      audio.currentTime = 0;
      audio.volume = 1.0;

      let settled = false;
      const done = () => {
        if (!settled) {
          settled = true;
          if (audio) {
            audio.removeEventListener('ended', done);
            audio.removeEventListener('error', done);
          }
          resolve();
        }
      };

      audio.addEventListener('ended', done, { once: true });
      audio.addEventListener('error', done, { once: true });
      // Safety timeout: 480ms (sound file is 400ms)
      setTimeout(done, 480);

      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch(() => done());
      }
    } catch {
      resolve();
    }
  });
}

/** Speaks the buyer name at full volume, ensuring it never overlaps. */
export async function speakBuyer(buyerName: string): Promise<void> {
  try {
    // Stop any in-progress speech first
    try {
      await TextToSpeech.stop();
    } catch {
      // ignore
    }

    await TextToSpeech.speak({
      text: buildOrderSpeech({ buyerName }),
      lang: 'vi-VN',
      rate: 0.95,
      pitch: 1.0,
      volume: 1.0,
      category: 'playback',
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

/**
 * Plays the configured foreground alert for one order sequentially:
 * 1. Vibrate immediately (haptics)
 * 2. Play crisp loud "TING" bell chime -> wait until it ends
 * 3. Brief pause (80ms)
 * 4. Speak loudly: "Bạn có đơn hàng từ <tên người mua>"
 */
export async function runForegroundAlert(buyerName: string, prefs: AlertPrefs): Promise<void> {
  if (prefs.vibrate) void buzz();
  if (prefs.sound === 'chime') {
    await playChime();
    // Brief silence so speech starts cleanly after the chime ring
    await new Promise((r) => setTimeout(r, 90));
  }
  if (prefs.speak) {
    await speakBuyer(buyerName);
  }
}
