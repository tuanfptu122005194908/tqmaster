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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

    // 1. Authenticate caller and verify they are an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);
    const token = authHeader.slice('Bearer '.length);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: 'Unauthorized' }, 401);

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: roleCheck } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleCheck) {
      return json({ error: 'Chỉ quản trị viên mới có quyền tạo tài khoản' }, 403);
    }

    // 2. Parse request body
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return json({ error: 'Invalid body' }, 400);

    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();
    const username = String(body.username || '').trim();
    const fullName = String(body.fullName || '').trim();
    const studentCode = String(body.studentCode || '').trim();
    const role = body.role === 'admin' ? 'admin' : 'user';

    if (!email || !password || !username) {
      return json({ error: 'Vui lòng điền đầy đủ Email, Username và Mật khẩu' }, 400);
    }
    if (password.length < 6) {
      return json({ error: 'Mật khẩu phải từ 6 ký tự trở lên' }, 400);
    }

    // 3. Create user via Auth Admin API (automatically confirms email, no SMTP rate limit)
    const { data: createdUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        username,
        full_name: fullName || username,
        student_code: studentCode || null,
        created_by_admin: true,
      },
    });

    if (createErr) {
      return json({ error: createErr.message || 'Không thể tạo tài khoản' }, 400);
    }

    const userId = createdUser.user.id;

    // 4. Ensure profile is updated
    await adminClient.from('profiles').upsert({
      id: userId,
      email,
      username,
      full_name: fullName || username,
      student_code: studentCode || null,
      updated_at: new Date().toISOString(),
    });

    // 5. Set role if admin
    if (role === 'admin') {
      await adminClient.from('user_roles').upsert({
        user_id: userId,
        role: 'admin',
      });
    }

    return json({ success: true, user: createdUser.user });
  } catch (err: any) {
    console.error('[admin-create-user error]', err);
    return json({ error: err.message || 'Lỗi máy chủ nội bộ' }, 500);
  }
});
