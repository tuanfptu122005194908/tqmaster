// Minimal FCM HTTP v1 sender for Deno edge functions (Spec 38).
// Secret required: FCM_SERVICE_ACCOUNT = full JSON of a Firebase service account key.

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri?: string;
}

export interface OrderPushPayload {
  orderId: string;
  buyerName: string;
  amount: number;
}

export const ORDER_CHANNEL_ID = 'orders_alert_v1';

const b64url = (input: ArrayBuffer | string): string => {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

function pemToDer(pem: string): ArrayBuffer {
  const body = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const raw = atob(body);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

function loadServiceAccount(): ServiceAccount | null {
  const raw = Deno.env.get('FCM_SERVICE_ACCOUNT');
  if (!raw) return null;
  try {
    const sa = JSON.parse(raw) as ServiceAccount;
    return sa.client_email && sa.private_key && sa.project_id ? sa : null;
  } catch {
    return null;
  }
}

async function getAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const aud = sa.token_uri ?? 'https://oauth2.googleapis.com/token';
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud,
    iat: now,
    exp: now + 3600,
  }));
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToDer(sa.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claim}`));
  const assertion = `${header}.${claim}.${b64url(sig)}`;

  const resp = await fetch(aud, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  const json = await resp.json();
  if (!resp.ok || !json.access_token) throw new Error(`FCM auth failed: ${JSON.stringify(json)}`);
  return json.access_token as string;
}

const formatVND = (n: number) => `${Math.round(n).toLocaleString('vi-VN')}đ`;

export interface PushResult {
  sent: number;
  dead: number;
  skipped?: string;
}

/** Sends the order alert to every linked admin device; clears dead tokens. */
export async function sendOrderPush(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  order: OrderPushPayload,
): Promise<PushResult> {
  const sa = loadServiceAccount();
  if (!sa) return { sent: 0, dead: 0, skipped: 'FCM_SERVICE_ACCOUNT not configured' };

  const { data: devices } = await supabase
    .from('admin_devices')
    .select('id, fcm_token')
    .not('fcm_token', 'is', null);
  if (!devices?.length) return { sent: 0, dead: 0, skipped: 'no linked device with token' };

  const accessToken = await getAccessToken(sa);
  const name = (order.buyerName || '').trim() || 'một học viên';
  let sent = 0;
  let dead = 0;

  for (const d of devices as { id: string; fcm_token: string }[]) {
    const resp = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        message: {
          token: d.fcm_token,
          notification: {
            title: '🛒 Đơn hàng mới',
            body: `Bạn có đơn hàng từ ${name} – ${formatVND(order.amount)}`,
          },
          data: {
            order_id: order.orderId,
            buyer_name: order.buyerName ?? '',
            amount: String(order.amount ?? 0),
          },
          android: {
            priority: 'HIGH',
            ttl: '3600s',
            notification: {
              channel_id: ORDER_CHANNEL_ID,
              sound: 'order_alert.wav',
              default_vibrate_timings: true,
              notification_priority: 'PRIORITY_MAX',
              visibility: 'PUBLIC',
            },
          },
        },
      }),
    });
    if (resp.ok) {
      sent++;
    } else {
      const err = await resp.json().catch(() => ({}));
      const status = err?.error?.status as string | undefined;
      if (status === 'UNREGISTERED' || status === 'INVALID_ARGUMENT' || resp.status === 404) {
        dead++;
        await supabase.from('admin_devices').update({ fcm_token: null }).eq('id', d.id);
      } else {
        console.error('FCM send failed', resp.status, JSON.stringify(err));
      }
    }
  }
  return { sent, dead };
}

