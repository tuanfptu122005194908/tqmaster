import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function genPassword(len = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%';
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  let out = '';
  for (let i = 0; i < len; i++) out += chars[arr[i] % chars.length];
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Always respond success to avoid email enumeration
  const ok = () =>
    new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'Email không hợp lệ' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const cleanEmail = email.trim().toLowerCase();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Find user by email in profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (!profile?.id) return ok();

    const newPassword = genPassword();
    const { error: updErr } = await supabase.auth.admin.updateUserById(profile.id, {
      password: newPassword,
      user_metadata: { must_change_password: true },
    });
    if (updErr) {
      console.error('updateUserById error:', updErr.message);
      return ok();
    }

    const GMAIL_USER = Deno.env.get('GMAIL_USER')!;
    const GMAIL_APP_PASSWORD = Deno.env.get('GMAIL_APP_PASSWORD')!;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });

    const html = `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#3B82F6,#6366F1);padding:28px 32px;border-radius:16px 16px 0 0;color:#fff;">
    <div style="font-size:13px;font-weight:600;letter-spacing:.5px;opacity:.9;text-transform:uppercase;">TQMaster · Khôi phục mật khẩu</div>
    <div style="font-size:22px;font-weight:800;margin-top:6px;">🔐 Mật khẩu mới của bạn</div>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:28px 32px;color:#111827;">
    <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 16px;">Xin chào ${escapeHtml(profile.full_name || '')},</p>
    <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 16px;">Hệ thống đã tạo mật khẩu mới cho tài khoản của bạn. Vui lòng dùng mật khẩu này để đăng nhập:</p>
    <div style="background:#f8fafc;border:1px dashed #cbd5e1;border-radius:12px;padding:18px;text-align:center;font-family:monospace;font-size:22px;font-weight:800;letter-spacing:2px;color:#3B82F6;margin:0 0 16px;">${escapeHtml(newPassword)}</div>
    <p style="font-size:14px;line-height:1.6;color:#dc2626;margin:0 0 16px;">⚠️ Vì lý do bảo mật, hãy đăng nhập và đổi mật khẩu ngay trong phần Hồ sơ.</p>
    <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;text-align:center;">Nếu bạn không yêu cầu việc này, vui lòng đổi mật khẩu ngay hoặc liên hệ quản trị viên.</p>
  </div>
</div>`;

    await transporter.sendMail({
      from: `"TQMaster" <${GMAIL_USER}>`,
      to: cleanEmail,
      subject: '🔐 Mật khẩu mới cho tài khoản TQMaster',
      html,
    });


    return ok();
  } catch (err) {
    console.error('forgot-password error:', err instanceof Error ? err.message : err);
    // Still return success to avoid leaking info
    return ok();
  }
});

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
