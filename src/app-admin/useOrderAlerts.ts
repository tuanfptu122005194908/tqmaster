import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startPush } from '@/lib/native/push';
import { verifyAdminDevice } from '@/lib/native/adminDevice';
import { createOrderDeduper, buildOrderAlertText, type OrderAlertInfo } from '@/lib/native/orderAlert';
import { runForegroundAlert } from '@/lib/native/alertPlayer';
import type { AlertPrefs } from '@/lib/native/alertPrefs';

/**
 * Foreground order alerts: Supabase Realtime (INSERT) + FCM foreground messages,
 * deduped by order id so one order never rings twice.
 */
export function useOrderAlerts(opts: {
  enabled: boolean;
  prefs: AlertPrefs;
  onOpenOrder: (orderId: string) => void;
  onNewOrder?: () => void;
}) {
  const { enabled, prefs, onOpenOrder, onNewOrder } = opts;
  const deduper = useMemo(() => createOrderDeduper(), []);
  const [banner, setBanner] = useState<OrderAlertInfo | null>(null);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;
  const timer = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setBanner(null);
  }, []);

  const raise = useCallback(
    (info: OrderAlertInfo) => {
      if (!deduper.markNew(info.orderId)) return;
      setBanner(info);
      onNewOrder?.();
      void runForegroundAlert(info.buyerName, prefsRef.current);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setBanner(null), 9000);
    },
    [deduper, onNewOrder],
  );

  /** "Gửi thông báo thử" from settings */
  const test = useCallback(() => {
    raise({ orderId: `test-${Date.now()}`, buyerName: 'Nguyễn Văn A', amount: 70000 });
  }, [raise]);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel(`admin-app-orders-${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        const o = payload.new as { id?: string; full_name?: string; final_amount?: number };
        if (o?.id) raise({ orderId: o.id, buyerName: o.full_name ?? '', amount: Number(o.final_amount ?? 0) });
      })
      .subscribe();

    let stopPush: (() => void) | undefined;
    let cancelled = false;
    void startPush({
      onToken: token => void verifyAdminDevice(token),
      onOrderPush: (data, tapped) => {
        if (tapped) {
          deduper.markNew(data.orderId);
          onOpenOrder(data.orderId);
        } else {
          raise(data);
        }
      },
    }).then(cleanup => {
      if (cancelled) cleanup();
      else stopPush = cleanup;
    });

    return () => {
      cancelled = true;
      stopPush?.();
      void supabase.removeChannel(channel);
    };
  }, [enabled, raise, deduper, onOpenOrder]);

  return { banner, bannerText: banner ? buildOrderAlertText(banner) : '', dismiss, test };
}

