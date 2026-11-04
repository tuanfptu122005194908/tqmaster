import { describe, expect, it } from 'vitest';
import {
  buildOrderAlertText,
  buildOrderSpeech,
  createOrderDeduper,
  formatVND,
  mapAdminGateError,
  shouldAutoLock,
} from '@/lib/native/orderAlert';
import { DEFAULT_ALERT_PREFS, sanitizePrefs } from '@/lib/native/alertPrefs';
import { timeAgo } from '@/app-admin/data';

describe('admin app order alert helpers (Spec 38)', () => {
  it('builds the alert text with buyer name and VND amount', () => {
    const text = buildOrderAlertText({ buyerName: 'Nguyễn Văn A', amount: 70000 });
    expect(text).toContain('Bạn có đơn hàng từ Nguyễn Văn A');
    expect(text).toContain(formatVND(70000));
  });

  it('falls back to a generic buyer when the name is blank', () => {
    expect(buildOrderAlertText({ buyerName: '   ', amount: 0 })).toContain('một học viên');
    expect(buildOrderSpeech({ buyerName: '' })).toBe('Bạn có đơn hàng từ một học viên');
  });

  it('speech reads only the buyer name (no amount)', () => {
    expect(buildOrderSpeech({ buyerName: 'Trần B' })).toBe('Bạn có đơn hàng từ Trần B');
  });

  it('dedupes the same order across push and realtime', () => {
    const d = createOrderDeduper();
    expect(d.markNew('o1')).toBe(true);
    expect(d.markNew('o1')).toBe(false);
    expect(d.markNew('o2')).toBe(true);
    expect(d.has('o1')).toBe(true);
  });

  it('evicts old ids beyond the cap', () => {
    const d = createOrderDeduper(2);
    d.markNew('a'); d.markNew('b'); d.markNew('c');
    expect(d.has('a')).toBe(false);
    expect(d.has('c')).toBe(true);
  });

  it('maps RPC errors to stable gate codes', () => {
    expect(mapAdminGateError('NOT_ADMIN')).toBe('NOT_ADMIN');
    expect(mapAdminGateError('DEVICE_LOCKED')).toBe('DEVICE_LOCKED');
    expect(mapAdminGateError('TypeError: Failed to fetch')).toBe('NETWORK');
    expect(mapAdminGateError('boom')).toBe('UNKNOWN');
    expect(mapAdminGateError(null)).toBe('UNKNOWN');
  });

  it('auto-locks only after the background limit', () => {
    expect(shouldAutoLock(null, 1000)).toBe(false);
    expect(shouldAutoLock(0, 59_000)).toBe(false);
    expect(shouldAutoLock(0, 60_000)).toBe(true);
  });

  it('sanitizes stored alert prefs', () => {
    expect(sanitizePrefs(null)).toEqual(DEFAULT_ALERT_PREFS);
    expect(sanitizePrefs({ sound: 'off', speak: false, vibrate: 'x' })).toEqual({ sound: 'off', speak: false, vibrate: true });
    expect(sanitizePrefs({ sound: 'weird' }).sound).toBe('chime');
  });

  it('formats relative time in Vietnamese', () => {
    const now = Date.parse('2026-11-04T10:00:00Z');
    expect(timeAgo('2026-11-04T09:59:50Z', now)).toBe('Vừa xong');
    expect(timeAgo('2026-11-04T09:30:00Z', now)).toBe('30 phút trước');
    expect(timeAgo('2026-11-04T07:00:00Z', now)).toBe('3 giờ trước');
  });
});
