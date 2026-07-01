import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';

interface OrderItem {
  name: string;
  price: number;
}

interface OrderPayload {
  orderId: string;
  fullName: string;
  studentCode: string;
  email: string;
  finalAmount: number;
  originalAmount?: number;
  discountAmount?: number;
  discountCode?: string | null;
  itemsCount: number;
  items?: OrderItem[];
  note?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');
    if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Validate auth — accept either the internal service-role call (from create-order)
    // or a logged-in user token.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '').trim();
    const isServiceCall = token === serviceKey;
    if (!isServiceCall) {
      const { data: userData } = await supabase.auth.getUser(token);
      if (!userData?.user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }


    const body = (await req.json()) as OrderPayload;
    if (!body?.orderId || !body?.email || !body?.fullName) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Lookup admin notify email from system_settings
    const { data: setting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'admin_notify_email')
      .maybeSingle();

    let adminEmail = setting?.value?.trim();

    // Fallback: pick first admin user's email from profiles
    if (!adminEmail) {
      const { data: adminRole } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();
      if (adminRole?.user_id) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', adminRole.user_id)
          .maybeSingle();
        adminEmail = prof?.email;
      }
    }

    if (!adminEmail) {
      return new Response(JSON.stringify({ error: 'No admin email configured' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formatVND = (n: number) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

    // Resolve items: prefer payload, fallback to DB
    let items: OrderItem[] = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) {
      const { data: dbItems } = await supabase
        .from('order_items')
        .select('price, subjects(name)')
        .eq('order_id', body.orderId);
      items = (dbItems ?? []).map((it: any) => ({
        name: it.subjects?.name ?? 'Môn học',
        price: Number(it.price),
      }));
    }

    const original = Number(body.originalAmount ?? items.reduce((s, i) => s + Number(i.price), 0));
    const discount = Number(body.discountAmount ?? 0);

    const itemsRowsHtml = items.length > 0 ? items.map((it, idx) => `
      <tr>
        <td style="padding:10px 14px;border-top:1px solid #eef2f7;color:#374151;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="display:inline-block;min-width:22px;height:22px;line-height:22px;text-align:center;background:#eef2ff;color:#4f46e5;border-radius:6px;font-size:12px;font-weight:700;">${idx + 1}</span>
            <span style="font-weight:600;">${escapeHtml(it.name)}</span>
          </div>
        </td>
        <td style="padding:10px 14px;border-top:1px solid #eef2f7;text-align:right;font-weight:700;color:#111827;white-space:nowrap;">${formatVND(Number(it.price))}</td>
      </tr>
    `).join('') : `<tr><td colspan="2" style="padding:14px;text-align:center;color:#9ca3af;font-size:13px;">Không có môn nào</td></tr>`;

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f6f7fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06);">
        <tr><td style="background:linear-gradient(135deg,#3B82F6,#6366F1);padding:28px 32px;color:#fff;">
          <div style="font-size:13px;font-weight:600;letter-spacing:0.5px;opacity:0.9;text-transform:uppercase;">TQMaster · Thông báo đơn hàng</div>
          <div style="font-size:22px;font-weight:800;margin-top:6px;">🛒 Có đơn hàng mới cần duyệt</div>
        </td></tr>
        <tr><td style="padding:28px 32px;color:#111827;">
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#374151;">
            Một sinh viên vừa tạo đơn hàng và đang chờ admin xét duyệt.
          </p>

          <!-- Customer info -->
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;font-size:14px;margin-bottom:20px;">
            <tr><td style="padding:12px 16px;background:#f9fafb;color:#6b7280;width:38%;">Mã đơn</td>
                <td style="padding:12px 16px;font-family:monospace;font-weight:600;">${body.orderId}</td></tr>
            <tr><td style="padding:12px 16px;background:#f9fafb;color:#6b7280;border-top:1px solid #e5e7eb;">Họ tên</td>
                <td style="padding:12px 16px;border-top:1px solid #e5e7eb;">${escapeHtml(body.fullName)}</td></tr>
            <tr><td style="padding:12px 16px;background:#f9fafb;color:#6b7280;border-top:1px solid #e5e7eb;">Mã sinh viên</td>
                <td style="padding:12px 16px;border-top:1px solid #e5e7eb;font-family:monospace;">${escapeHtml(body.studentCode || '—')}</td></tr>
            <tr><td style="padding:12px 16px;background:#f9fafb;color:#6b7280;border-top:1px solid #e5e7eb;">Email</td>
                <td style="padding:12px 16px;border-top:1px solid #e5e7eb;">${escapeHtml(body.email)}</td></tr>
            ${body.note ? `<tr><td style="padding:12px 16px;background:#f9fafb;color:#6b7280;border-top:1px solid #e5e7eb;">Ghi chú</td>
                <td style="padding:12px 16px;border-top:1px solid #e5e7eb;">${escapeHtml(body.note)}</td></tr>` : ''}
          </table>

          <!-- Items -->
          <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280;margin:0 0 8px;">Chi tiết môn học (${items.length})</div>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;font-size:14px;margin-bottom:20px;">
            <tr style="background:#f9fafb;">
              <td style="padding:10px 14px;color:#6b7280;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.4px;">Môn học</td>
              <td style="padding:10px 14px;color:#6b7280;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:0.4px;text-align:right;">Giá</td>
            </tr>
            ${itemsRowsHtml}
          </table>

          <!-- Totals -->
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <tr><td style="padding:10px 16px;color:#6b7280;">Tạm tính</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#111827;">${formatVND(original)}</td></tr>
            ${discount > 0 ? `
            <tr><td style="padding:10px 16px;color:#6b7280;border-top:1px solid #eef2f7;">Giảm giá${body.discountCode ? ` <span style="font-family:monospace;background:#eef2ff;color:#4f46e5;padding:2px 6px;border-radius:4px;font-size:12px;margin-left:4px;">${escapeHtml(body.discountCode)}</span>` : ''}</td>
                <td style="padding:10px 16px;text-align:right;font-weight:600;color:#dc2626;border-top:1px solid #eef2f7;">−${formatVND(discount)}</td></tr>` : ''}
            <tr style="background:#f8fafc;"><td style="padding:14px 16px;border-top:1px solid #e5e7eb;font-weight:700;color:#111827;">Thanh toán</td>
                <td style="padding:14px 16px;text-align:right;border-top:1px solid #e5e7eb;font-weight:800;color:#3B82F6;font-size:18px;">${formatVND(body.finalAmount)}</td></tr>
          </table>
          <div style="margin-top:24px;text-align:center;">
            <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}" style="display:inline-block;padding:12px 28px;background:#3B82F6;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">Mở trang quản trị</a>
          </div>
          <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;text-align:center;">
            Email tự động từ TQMaster. Vui lòng không trả lời email này.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

    const resp = await fetch(`${GATEWAY_URL}/emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'X-Connection-Api-Key': RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'TQMaster <onboarding@resend.dev>',
        to: [adminEmail],
        subject: `🛒 Đơn hàng mới #${body.orderId} từ ${body.fullName}`,
        html,
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      console.error('Resend error:', resp.status, data);
      throw new Error(`Resend failed [${resp.status}]: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true, sentTo: adminEmail, id: data?.id }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('notify-admin-new-order error:', msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
