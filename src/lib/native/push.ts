import { PushNotifications } from '@capacitor/push-notifications';
import type { PluginListenerHandle } from '@capacitor/core';
import { isNativeApp } from './platform';

export const ORDER_CHANNEL_ID = 'orders_alert_v1';

export interface PushHandlers {
  onToken: (token: string) => void;
  onOrderPush: (data: { orderId: string; buyerName: string; amount: number }, tapped: boolean) => void;
  onError?: (message: string) => void;
}

function parseData(data: Record<string, unknown> | undefined) {
  const d = data ?? {};
  return {
    orderId: String(d.order_id ?? ''),
    buyerName: String(d.buyer_name ?? ''),
    amount: Number(d.amount ?? 0) || 0,
  };
}

/** Requests permission, creates the loud channel and registers with FCM. Returns a cleanup fn. */
export async function startPush(handlers: PushHandlers): Promise<() => void> {
  if (!isNativeApp()) return () => undefined;

  const handles: PluginListenerHandle[] = [];

  handles.push(await PushNotifications.addListener('registration', t => handlers.onToken(t.value)));
  handles.push(await PushNotifications.addListener('registrationError', e => handlers.onError?.(e.error)));
  handles.push(
    await PushNotifications.addListener('pushNotificationReceived', n => {
      const parsed = parseData(n.data);
      if (parsed.orderId) handlers.onOrderPush(parsed, false);
    }),
  );
  handles.push(
    await PushNotifications.addListener('pushNotificationActionPerformed', a => {
      const parsed = parseData(a.notification.data);
      if (parsed.orderId) handlers.onOrderPush(parsed, true);
    }),
  );

  try {
    await PushNotifications.createChannel({
      id: ORDER_CHANNEL_ID,
      name: 'Đơn hàng mới',
      description: 'Thông báo khi có đơn hàng mới cần duyệt',
      importance: 5,
      visibility: 1,
      sound: 'order_alert.wav',
      vibration: true,
      lights: true,
    });
  } catch (e) {
    handlers.onError?.(e instanceof Error ? e.message : String(e));
  }

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== 'granted') {
    handlers.onError?.('Chưa cấp quyền thông báo cho ứng dụng.');
  } else {
    // Delay registration slightly so permission dialog dismissal transition completes smoothly
    window.setTimeout(() => {
      void PushNotifications.register().catch(e => {
        handlers.onError?.(`Không thể đăng ký FCM (cần google-services.json): ${String(e)}`);
      });
    }, 500);
  }

  return () => {
    handles.forEach(h => h.remove());
  };
}

export async function stopPush(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    await PushNotifications.unregister();
    await PushNotifications.removeAllDeliveredNotifications();
  } catch {
    // ignore
  }
}

