import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '').trim();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Verify caller is an admin
    const { data: userData } = await supabase.auth.getUser(token);
    const callerId = userData?.user?.id;
    if (!callerId) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: callerId, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { orderId } = await req.json();
    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Missing orderId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load order from DB (trusted source)
    const { data: order } = await supabase
      .from('orders')
      .select('id, full_name, email, final_amount, status')
      .eq('id', orderId)
      .maybeSingle();

    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (order.status !== 'approved') {
      return new Response(JSON.stringify({ error: 'Order not approved' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get items
    const { data: dbItems } = await supabase
      .from('order_items')
      .select('price, subjects(name)')
      .eq('order_id', orderId);
    const items = (dbItems ?? []).map((it: any) => ({
      name: it.subjects?.name ?? 'Môn học',
      price: Number(it.price),
    }));

    const formatVND = (n: number) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

    const itemsHtml = items.length
      ? items.map((it, i) => `
        <tr>
          <td style="padding:14px 20px;border-top:1px solid #eef2f7;color:#1f2937;font-size:15px;font-weight:600;">
            <span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;background:#dcfce7;color:#16a34a;border-radius:50%;font-size:12px;font-weight:700;margin-right:10px;">${i + 1}</span>${escapeHtml(it.name)}
          </td>
          <td style="padding:14px 20px;border-top:1px solid #eef2f7;text-align:right;font-weight:700;color:#111827;white-space:nowrap;font-size:15px;">${formatVND(it.price)}</td>
        </tr>`).join('')
      : `<tr><td colspan="2" style="padding:18px;text-align:center;color:#9ca3af;">—</td></tr>`;

    const appUrl = Deno.env.get('APP_URL') ?? 'https://tqmaster.vercel.app';
    const year = new Date().getFullYear();

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Đơn hàng đã được duyệt</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Đơn hàng #${order.id} của bạn đã được duyệt thành công.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px -12px rgba(16,24,40,.18);font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#34d399 0%,#16a34a 55%,#15803d 100%);padding:44px 32px 38px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr><td style="width:74px;height:74px;background:rgba(255,255,255,.18);border-radius:50%;text-align:center;vertical-align:middle;font-size:38px;line-height:74px;">✅</td></tr></table>
          <div style="font-size:13px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.85);text-transform:uppercase;margin-top:18px;">TQMaster</div>
          <div style="font-size:25px;font-weight:800;color:#ffffff;margin-top:8px;line-height:1.3;">Đơn hàng đã được duyệt!</div>
          <div style="font-size:15px;color:rgba(255,255,255,.9);margin-top:8px;">Bạn đã có thể truy cập các môn học của mình 🎉</div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:36px 32px 8px;">
          <p style="font-size:16px;line-height:1.6;color:#1f2937;margin:0 0 8px;">Xin chào <strong>${escapeHtml(order.full_name)}</strong>,</p>
          <p style="font-size:15px;line-height:1.7;color:#475569;margin:0 0 24px;">Cảm ơn bạn đã tin tưởng TQMaster. Đơn hàng của bạn đã được duyệt thành công và sẵn sàng để học. Chúc bạn học thật hiệu quả!</p>

          <!-- Order id chip -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
            <tr><td style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 18px;">
              <span style="font-size:12px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">Mã đơn hàng</span><br>
              <span style="font-size:17px;font-weight:800;color:#15803d;font-family:'SFMono-Regular',Consolas,monospace;">#${order.id}</span>
            </td></tr>
          </table>

          <!-- Items -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;font-size:14px;margin-bottom:8px;">
            <tr style="background:#f8fafc;">
              <td style="padding:12px 20px;color:#64748b;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Môn học</td>
              <td style="padding:12px 20px;color:#64748b;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.5px;text-align:right;">Giá</td>
            </tr>
            ${itemsHtml}
            <tr style="background:#f0fdf4;">
              <td style="padding:16px 20px;border-top:2px solid #bbf7d0;font-weight:800;color:#111827;font-size:15px;">Tổng thanh toán</td>
              <td style="padding:16px 20px;border-top:2px solid #bbf7d0;text-align:right;font-weight:800;color:#16a34a;font-size:20px;">${formatVND(Number(order.final_amount))}</td>
            </tr>
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:20px 32px 36px;text-align:center;">
          <a href="${escapeHtml(appUrl)}" style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:15px 40px;border-radius:12px;box-shadow:0 8px 20px -6px rgba(22,163,74,.5);">Bắt đầu học ngay →</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;padding:26px 32px;text-align:center;border-top:1px solid #eef2f7;">
          <div style="font-size:14px;font-weight:700;color:#334155;">TQMaster</div>
          <div style="font-size:12px;color:#94a3b8;margin-top:6px;line-height:1.6;">Email tự động — vui lòng không trả lời email này.<br>© ${year} TQMaster. Mọi quyền được bảo lưu.</div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const GMAIL_USER = Deno.env.get('GMAIL_USER')!;
    const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')!;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    await transporter.sendMail({
      from: `"TQMaster" <${GMAIL_USER}>`,
      to: order.email,
      subject: `✅ Đơn hàng #${order.id} đã được duyệt`,
      html,
    });

    return new Response(JSON.stringify({ success: true, sentTo: order.email }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });


  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('notify-order-approved error:', msg);
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
