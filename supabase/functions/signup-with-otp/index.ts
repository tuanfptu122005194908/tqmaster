import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function genCode(): string {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1_000_000).padStart(6, '0');
}

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function escapeHtml(s: string) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function otpEmailHtml(code: string, fullName: string) {
  return `
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;">
  <div style="background:linear-gradient(135deg,#3B82F6,#6366F1);padding:28px 32px;border-radius:16px 16px 0 0;color:#fff;">
    <div style="font-size:13px;font-weight:600;letter-spacing:.5px;opacity:.9;text-transform:uppercase;">TQMaster · Xác thực email</div>
    <div style="font-size:22px;font-weight:800;margin-top:6px;">🔐 Mã xác thực đăng ký</div>
  </div>
  <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:28px 32px;color:#111827;">
    <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 12px;">Xin chào ${escapeHtml(fullName || '')},</p>
    <p style="font-size:15px;line-height:1.6;color:#374151;margin:0 0 18px;">Vui lòng nhập mã xác thực 6 số dưới đây vào ứng dụng để hoàn tất đăng ký:</p>
    <div style="background:#f8fafc;border:2px dashed #3B82F6;border-radius:12px;padding:22px;text-align:center;font-family:monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#3B82F6;margin:0 0 18px;">${code}</div>
    <p style="font-size:14px;line-height:1.6;color:#dc2626;margin:0 0 8px;">⏰ Mã có hiệu lực trong <b>15 phút</b>.</p>
    <p style="font-size:12px;color:#9ca3af;margin:24px 0 0;text-align:center;">Nếu bạn không đăng ký tài khoản TQMaster, vui lòng bỏ qua email này.</p>
  </div>
</div>`;
}

interface GmailAccount {
  user: string;
  pass: string;
}

function getGmailAccounts(): GmailAccount[] {
  const list: GmailAccount[] = [];
  const add = (user?: string, pass?: string) => {
    if (user && pass) list.push({ user: user.trim(), pass: pass.trim() });
  };

  // Verified working accounts (lequyen2k555 is 100% active with fresh quota)
  add('lequyen2k555@gmail.com', 'ellgvghwrbrszixj');
  add('quynhchi2klx@gmail.com', 'drfvyemdzjhrlnzo');

  add(Deno.env.get('GMAIL_USER'), Deno.env.get('GMAIL_APP_PASSWORD'));
  add(Deno.env.get('GMAIL_USER_2'), Deno.env.get('GMAIL_APP_PASSWORD_2'));

  const seen = new Set<string>();
  return list.filter(acc => {
    if (seen.has(acc.user.toLowerCase())) return false;
    seen.add(acc.user.toLowerCase());
    return true;
  });
}

async function sendOtpEmail(to: string, code: string, fullName: string) {
  const accounts = getGmailAccounts();
  let lastErr: any = null;

  for (const acc of accounts) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: acc.user, pass: acc.pass },
      });
      await transporter.sendMail({
        from: `"TQMaster" <${acc.user}>`,
        to,
        subject: `🔐 Mã xác thực TQMaster: ${code}`,
        html: otpEmailHtml(code, fullName),
      });
      console.log(`[signup-with-otp] Email sent successfully via ${acc.user}`);
      return;
    } catch (err) {
      lastErr = err;
      console.warn(`[signup-with-otp] Email via ${acc.user} failed:`, err instanceof Error ? err.message : err);
    }
  }

  throw lastErr || new Error('Tất cả tài khoản Gmail đều không thể gửi email.');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'signup');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ---------- RESEND ----------
    if (action === 'resend') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!email) return json(400, { error: 'Email không hợp lệ' });

      const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      const user = list?.users?.find(u => (u.email || '').toLowerCase() === email);
      if (!user) return json(404, { error: 'Không tìm thấy tài khoản' });
      if (user.email_confirmed_at) return json(400, { error: 'Email đã được xác thực' });

      // Rate limit: 3 lần / giờ
      const { data: existing } = await supabase.from('signup_otps').select('*').eq('user_id', user.id).maybeSingle();
      const now = new Date();
      let windowStart = existing ? new Date(existing.hour_window_start) : now;
      let sentCount = existing?.sent_count_hour ?? 0;
      if (now.getTime() - windowStart.getTime() > 3600_000) {
        windowStart = now;
        sentCount = 0;
      }
      if (sentCount >= 3) {
        return json(429, { error: 'Bạn đã gửi quá 3 lần trong 1 giờ. Vui lòng thử lại sau.' });
      }
      if (existing && now.getTime() - new Date(existing.last_sent_at).getTime() < 55_000) {
        return json(429, { error: 'Vui lòng đợi ít nhất 60 giây trước khi gửi lại.' });
      }

      const code = genCode();
      const code_hash = await sha256(`${email}:${code}`);
      const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      const fullName = (user.user_metadata as any)?.full_name || '';

      await supabase.from('signup_otps').upsert({
        user_id: user.id,
        email,
        code_hash,
        expires_at,
        attempts: 0,
        last_sent_at: now.toISOString(),
        sent_count_hour: sentCount + 1,
        hour_window_start: windowStart.toISOString(),
      });

      await sendOtpEmail(email, code, fullName);
      return json(200, { success: true });
    }

    // ---------- VERIFY ----------
    if (action === 'verify') {
      const email = String(body.email || '').trim().toLowerCase();
      const token = String(body.token || '').trim();
      if (!email || !/^\d{6}$/.test(token)) return json(400, { error: 'Mã không hợp lệ' });

      const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      const user = list?.users?.find(u => (u.email || '').toLowerCase() === email);
      if (!user) return json(404, { error: 'Không tìm thấy tài khoản' });
      if (user.email_confirmed_at) return json(200, { success: true, already: true });

      const { data: row } = await supabase.from('signup_otps').select('*').eq('user_id', user.id).maybeSingle();
      if (!row) return json(400, { error: 'Không có mã xác thực. Vui lòng gửi lại mã.' });
      if (new Date(row.expires_at).getTime() < Date.now()) return json(400, { error: 'Mã đã hết hạn. Vui lòng gửi lại mã mới.' });
      if (row.attempts >= 5) return json(429, { error: 'Bạn đã nhập sai quá nhiều lần. Vui lòng gửi lại mã mới.' });

      const hash = await sha256(`${email}:${token}`);
      if (hash !== row.code_hash) {
        await supabase.from('signup_otps').update({ attempts: row.attempts + 1 }).eq('user_id', user.id);
        return json(400, { error: 'Mã không đúng. Vui lòng kiểm tra lại.' });
      }

      const { error: updErr } = await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
      if (updErr) return json(500, { error: updErr.message });

      await supabase.from('signup_otps').delete().eq('user_id', user.id);
      return json(200, { success: true });
    }

    // ---------- SIGNUP ----------
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const full_name = String(body.full_name || '').trim();
    const student_code = String(body.student_code || '').trim() || null;

    if (!email || !password) return json(400, { error: 'Thiếu email hoặc mật khẩu' });
    if (password.length < 8) return json(400, { error: 'Mật khẩu phải có ít nhất 8 ký tự' });
    if (!full_name) return json(400, { error: 'Vui lòng nhập họ tên' });

    // Kiểm tra email đã tồn tại
    const { data: existingList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existingUser = existingList?.users?.find(u => (u.email || '').toLowerCase() === email);

    let userId: string;

    if (existingUser) {
      if (existingUser.email_confirmed_at) {
        return json(400, { error: 'Email này đã được đăng ký và xác thực. Vui lòng đăng nhập.' });
      }
      // Chưa xác thực -> Cập nhật trực tiếp mật khẩu & họ tên thay vì xoá rồi tạo lại
      const { data: updData, error: updErr } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: { full_name, student_code },
      });
      if (updErr || !updData?.user) {
        return json(400, { error: updErr?.message || 'Không thể cập nhật thông tin tài khoản' });
      }
      userId = updData.user.id;
    } else {
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: false,
        user_metadata: { full_name, student_code },
      });
      if (createErr || !created?.user) {
        return json(400, { error: createErr?.message || 'Không thể tạo tài khoản' });
      }
      userId = created.user.id;
    }

    const code = genCode();
    const code_hash = await sha256(`${email}:${code}`);
    const expires_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await supabase.from('signup_otps').upsert({
      user_id: userId,
      email,
      code_hash,
      expires_at,
      attempts: 0,
      last_sent_at: new Date().toISOString(),
      sent_count_hour: 1,
      hour_window_start: new Date().toISOString(),
    });

    try {
      await sendOtpEmail(email, code, full_name);
    } catch (mailErr) {
      console.error('sendOtpEmail failed:', mailErr instanceof Error ? mailErr.message : mailErr);
      return json(500, { error: 'Không thể gửi email xác thực. Vui lòng thử lại.' });
    }

    return json(200, { success: true });
  } catch (err) {
    console.error('signup-with-otp error:', err instanceof Error ? err.message : err);
    return json(500, { error: 'Lỗi máy chủ' });
  }
});
