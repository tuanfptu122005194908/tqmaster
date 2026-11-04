/**
 * Pure helpers for the admin order alert (Spec 38). No native imports so they are unit-testable.
 */

export interface OrderAlertInfo {
  orderId: string;
  buyerName: string;
  amount: number;
}

export function formatVND(n: number): string {
  const v = Number.isFinite(n) ? Math.round(n) : 0;
  return `${v.toLocaleString('vi-VN')}đ`;
}

/** Text shown in the banner / notification body. */
export function buildOrderAlertText(info: Pick<OrderAlertInfo, 'buyerName' | 'amount'>): string {
  const name = (info.buyerName || '').trim() || 'một học viên';
  return `Bạn có đơn hàng từ ${name} – ${formatVND(info.amount)}`;
}

/** Text read aloud by the text-to-speech engine. */
export function buildOrderSpeech(info: Pick<OrderAlertInfo, 'buyerName'>): string {
  const name = (info.buyerName || '').trim() || 'một học viên';
  return `Bạn có đơn hàng từ ${name}`;
}

/**
 * Remembers recently alerted order ids so the push handler and the realtime
 * handler never alert twice for the same order.
 */
export function createOrderDeduper(maxEntries = 100) {
  const seen: string[] = [];
  return {
    /** Returns true the first time an id is seen, false afterwards. */
    markNew(orderId: string): boolean {
      if (!orderId) return true;
      if (seen.includes(orderId)) return false;
      seen.push(orderId);
      if (seen.length > maxEntries) seen.shift();
      return true;
    },
    has(orderId: string): boolean {
      return seen.includes(orderId);
    },
  };
}

export type AdminGateError = 'NOT_ADMIN' | 'DEVICE_LOCKED' | 'INVALID_DEVICE' | 'NETWORK' | 'UNKNOWN';

/** Maps a Postgres/PostgREST error message from the admin RPCs to a stable code. */
export function mapAdminGateError(message: string | null | undefined): AdminGateError {
  const m = (message || '').toUpperCase();
  if (m.includes('NOT_ADMIN')) return 'NOT_ADMIN';
  if (m.includes('DEVICE_LOCKED')) return 'DEVICE_LOCKED';
  if (m.includes('INVALID_DEVICE')) return 'INVALID_DEVICE';
  if (m.includes('FETCH') || m.includes('NETWORK') || m.includes('TIMEOUT')) return 'NETWORK';
  return 'UNKNOWN';
}

/** Auto-lock decision: lock when the app stayed in background longer than `limitMs`. */
export function shouldAutoLock(backgroundedAt: number | null, now: number, limitMs = 60_000): boolean {
  if (backgroundedAt === null) return false;
  return now - backgroundedAt >= limitMs;
}

