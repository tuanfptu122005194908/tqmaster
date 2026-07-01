// Server-authoritative order creation.
// Client sends { subjectIds, couponCode?, fullName, studentCode, billImagePath? }.
// Server fetches prices from DB, validates coupon, computes total, inserts order.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function genOrderId() {
  // ORD-XXXXXX (cryptographically random)
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  const n = (buf[0] << 24 | buf[1] << 16 | buf[2] << 8 | buf[3]) >>> 0;
  return 'ORD-' + (n % 1_000_000).toString().padStart(6, '0');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST')    return json({ error: 'Method not allowed' }, 405);

  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!;

    // 1. Authenticate via JWT (verify_jwt is off, so do it manually)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const token = authHeader.slice('Bearer '.length);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401);
    const user = userData.user;
    if (!user.email_confirmed_at) {
      return json({ error: 'Bạn cần xác thực email trước khi đặt hàng' }, 403);
    }

    // 2. Validate body
    const body = await req.json().catch(() => null) as any;
    if (!body || typeof body !== 'object') return json({ error: 'Invalid body' }, 400);

    const subjectIds: string[] = Array.isArray(body.subjectIds) ? body.subjectIds.filter((x: unknown) => typeof x === 'string') : [];
    const couponCode: string | null = typeof body.couponCode === 'string' && body.couponCode.trim() ? body.couponCode.trim().toUpperCase() : null;
    const fullName: string = typeof body.fullName === 'string' ? body.fullName.trim().slice(0, 200) : '';
    const studentCode: string = typeof body.studentCode === 'string' ? body.studentCode.trim().slice(0, 50) : '';
    const billImagePath: string | null = typeof body.billImagePath === 'string' ? body.billImagePath.slice(0, 500) : null;
    const note: string | null = typeof body.note === 'string' ? body.note.slice(0, 1000) : null;

    if (subjectIds.length === 0)    return json({ error: 'Cart is empty' }, 400);
    if (subjectIds.length > 50)     return json({ error: 'Too many items' }, 400);
    if (!fullName || !studentCode)  return json({ error: 'Missing customer info' }, 400);

    // Dedup
    const uniqueIds = [...new Set(subjectIds)];

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // 3. Reject if user already owns any of these subjects
    const { data: owned } = await admin
      .from('user_subjects')
      .select('subject_id')
      .eq('user_id', user.id)
      .in('subject_id', uniqueIds);
    if ((owned ?? []).length > 0) {
      return json({ error: 'Bạn đã sở hữu một số môn trong giỏ hàng' }, 400);
    }

    // 4. Fetch prices from DB (TRUSTED SOURCE)
    const { data: subjects, error: subjErr } = await admin
      .from('subjects')
      .select('id, name, price, is_active')
      .in('id', uniqueIds);
    if (subjErr) return json({ error: 'DB error' }, 500);
    if (!subjects || subjects.length !== uniqueIds.length) {
      return json({ error: 'Một số môn không tồn tại' }, 400);
    }
    if (subjects.some(s => !s.is_active)) {
      return json({ error: 'Một số môn không còn được bán' }, 400);
    }

    const originalAmount = subjects.reduce((sum, s) => sum + Number(s.price), 0);
    if (originalAmount <= 0) {
      console.warn('[create-order] zero-priced cart', { user: user.id, ip, subjectIds: uniqueIds });
      return json({ error: 'Giỏ hàng không hợp lệ' }, 400);
    }

    // 5. Validate coupon server-side
    let discountAmount = 0;
    let couponRow: { id: string; code: string; used_count: number } | null = null;
    if (couponCode) {
      const { data: c } = await admin
        .from('discount_codes')
        .select('id, code, discount_type, value, max_uses, used_count, expires_at, is_active')
        .eq('code', couponCode)
        .eq('is_active', true)
        .maybeSingle();
      if (!c) return json({ error: 'Mã giảm giá không hợp lệ' }, 400);
      if (c.max_uses != null && c.used_count >= c.max_uses) return json({ error: 'Mã đã hết lượt' }, 400);
      if (c.expires_at && new Date(c.expires_at) < new Date()) return json({ error: 'Mã đã hết hạn' }, 400);

      const v = Number(c.value);
      if (c.discount_type === 'percent') {
        const pct = Math.max(0, Math.min(100, v));
        discountAmount = Math.floor(originalAmount * pct / 100);
      } else {
        discountAmount = Math.max(0, Math.min(originalAmount, v));
      }
      couponRow = { id: c.id, code: c.code, used_count: c.used_count };
    }

    const finalAmount = originalAmount - discountAmount;
    if (finalAmount <= 0) {
      return json({ error: 'Tổng đơn không hợp lệ' }, 400);
    }

    // 6. Insert order (server-trusted values)
    const orderId = genOrderId();
    const { error: insErr } = await admin.from('orders').insert({
      id: orderId,
      user_id: user.id,
      full_name: fullName,
      student_code: studentCode,
      email: user.email,
      discount_code: couponRow?.code ?? null,
      original_amount: originalAmount,
      discount_amount: discountAmount,
      final_amount: finalAmount,
      bill_image_url: billImagePath,
      status: 'pending',
      note,
    });
    if (insErr) {
      console.error('[create-order] order insert failed', insErr, { user: user.id, ip });
      return json({ error: 'Không tạo được đơn' }, 500);
    }

    const { error: itemsErr } = await admin.from('order_items').insert(
      subjects.map(s => ({ order_id: orderId, subject_id: s.id, price: Number(s.price) }))
    );
    if (itemsErr) {
      // rollback
      await admin.from('orders').delete().eq('id', orderId);
      console.error('[create-order] items insert failed', itemsErr, { user: user.id, ip });
      return json({ error: 'Không tạo được dòng đơn' }, 500);
    }

    if (couponRow) {
      await admin.from('discount_codes')
        .update({ used_count: couponRow.used_count + 1 })
        .eq('id', couponRow.id);
    }

    // 7. Notify admin (best-effort)
    admin.functions.invoke('notify-admin-new-order', {
      body: {
        orderId, fullName, studentCode,
        email: user.email,
        finalAmount, originalAmount, discountAmount,
        discountCode: couponRow?.code ?? null,
        itemsCount: subjects.length,
        items: subjects.map(s => ({ name: s.name, price: Number(s.price) })),
      },
    }).catch(e => console.warn('notify failed', e));

    console.log('[create-order] OK', { orderId, user: user.id, ip, finalAmount });
    return json({ orderId, finalAmount, originalAmount, discountAmount });
  } catch (e) {
    console.error('[create-order] exception', e, { ip });
    return json({ error: 'Internal error' }, 500);
  }
});
