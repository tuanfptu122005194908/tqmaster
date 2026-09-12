import { createClient } from '@supabase/supabase-js';

const SOURCE_URL = 'https://jokmwkkepasocfpcsmzd.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva213a2tlcGFzb2NmcGNzbXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODE0NTcsImV4cCI6MjA5Mjk1NzQ1N30.NiFtzrNo6K-MRSnF3dPPwDoV-Uki50BfhCaTCOEm-G0';

const TARGET_URL = 'https://vhljgmtithjeovtrghvy.supabase.co';
const TARGET_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

const OLD_ADMIN_ID = '09930854-0481-4bd4-b728-37c258670e28';
const NEW_ADMIN_ID = 'd6b4218e-9081-4fcd-b19f-f7854bf147dd';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'tuan0112';

async function main() {
  console.log('🔄 Đang đồng bộ đơn hàng mới từ Database cũ sang Database mới...');

  const source = createClient(SOURCE_URL, SOURCE_KEY);
  const target = createClient(TARGET_URL, TARGET_SERVICE_KEY);

  await source.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });

  // 1. Lấy tất cả đơn hàng phát sinh sau mốc backup 12/09/2026
  const { data: newOrders, error: ordErr } = await source
    .from('orders')
    .select('*, order_items(*)')
    .gt('created_at', '2026-09-12T07:05:31')
    .order('created_at', { ascending: true });

  if (ordErr || !newOrders || newOrders.length === 0) {
    console.log('Không có đơn hàng mới nào cần đồng bộ.');
    return;
  }

  console.log(`Tìm thấy ${newOrders.length} đơn hàng mới cần đồng bộ:`, newOrders.map(o => `${o.id} (${o.full_name})`));

  for (const ord of newOrders) {
    // A. Tìm profile tương ứng bên target (theo email hoặc id)
    let targetUserId = ord.user_id;
    const { data: targetProfileByEmail } = await target.from('profiles').select('id').eq('email', ord.email).maybeSingle();
    if (targetProfileByEmail) {
      targetUserId = targetProfileByEmail.id;
    } else {
      const { data: srcProfile } = await source.from('profiles').select('*').eq('id', ord.user_id).single();
      if (srcProfile) {
        console.log(`- Đang copy profile học viên: ${srcProfile.full_name} (${srcProfile.email})...`);
        await target.from('profiles').upsert(srcProfile, { onConflict: 'id' });
      }
    }

    // B. Copy Order
    const { order_items, ...orderData } = ord;
    orderData.user_id = targetUserId;
    if (orderData.status === 'pending') {
      orderData.reviewed_by = null;
      orderData.reviewed_at = null;
    } else if (orderData.reviewed_by === OLD_ADMIN_ID) {
      orderData.reviewed_by = NEW_ADMIN_ID;
    }

    console.log(`- Đang nạp đơn hàng: ${orderData.id} (user_id: ${targetUserId})...`);
    const { error: insOrdErr } = await target.from('orders').upsert(orderData, { onConflict: 'id' });
    if (insOrdErr) {
      console.error('Lỗi nạp đơn hàng:', insOrdErr.message);
      continue;
    }

    // C. Copy Order Items
    if (order_items && order_items.length > 0) {
      console.log(`- Đang copy ${order_items.length} môn trong đơn: ${orderData.id}...`);
      const { error: insItemsErr } = await target.from('order_items').upsert(order_items, { onConflict: 'id' });
      if (insItemsErr) {
        console.error('Lỗi nạp order_items:', insItemsErr.message);
      }
    }
  }

  console.log('✅ Hoàn tất đồng bộ! Hãy kiểm tra lại trang Admin Orders.');
}

main().catch(console.error);
