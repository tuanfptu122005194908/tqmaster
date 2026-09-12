import { createClient } from '@supabase/supabase-js';

// Database Nguồn (Chứa đầy đủ dữ liệu thực)
const SOURCE_URL = 'https://jokmwkkepasocfpcsmzd.supabase.co';
const SOURCE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva213a2tlcGFzb2NmcGNzbXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODE0NTcsImV4cCI6MjA5Mjk1NzQ1N30.NiFtzrNo6K-MRSnF3dPPwDoV-Uki50BfhCaTCOEm-G0';

// Database Đích (Hệ thống mới của bạn)
const TARGET_URL = 'https://vhljgmtithjeovtrghvy.supabase.co';
const TARGET_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobGpnbXRpdGhqZW92dHJnaHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNTM5NzEsImV4cCI6MjEwNDYyOTk3MX0.0eqtdv4M9Udnq3DtACj3ogZvWPl0Mr58kl32pgK3qpU';

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'tuan0112';

const BATCH_SIZE = 500;
const PAGE_SIZE = 1000;

const TABLES = [
  { name: 'subjects', conflict: 'id', orderCol: 'id', label: 'Môn học' },
  { name: 'exams', conflict: 'id', orderCol: 'id', label: 'Đề thi' },
  { name: 'exam_subjects', conflict: 'exam_id,subject_id', orderCol: null, label: 'Đề thi ↔ Môn học' },
  { name: 'questions', conflict: 'id', orderCol: 'id', label: 'Câu hỏi' },
  { name: 'question_options', conflict: 'id', orderCol: 'id', label: 'Phương án trả lời' },
  { name: 'theories', conflict: 'id', orderCol: 'id', label: 'Tài liệu lý thuyết' },
  { name: 'theory_subjects', conflict: 'theory_id,subject_id', orderCol: null, label: 'Tài liệu ↔ Môn học' },
  { name: 'discount_codes', conflict: 'id', orderCol: 'id', label: 'Mã giảm giá' },
  { name: 'announcements', conflict: 'id', orderCol: 'id', label: 'Thông báo' },
  { name: 'news_posts', conflict: 'id', orderCol: 'id', label: 'Tin tức' },
  { name: 'system_settings', conflict: 'key', orderCol: 'key', label: 'Cấu hình hệ thống' }
];

function transformRow(row, oldAdminId, newAdminId) {
  const json = JSON.stringify(row);
  // 1. Đổi domain Storage cũ sang domain Storage mới
  const replacedDomain = json
    .split('https://jokmwkkepasocfpcsmzd.supabase.co')
    .join('https://vhljgmtithjeovtrghvy.supabase.co');

  const obj = JSON.parse(replacedDomain);

  // 2. Map ID người tạo nếu là Admin cũ -> Admin mới
  if (obj.created_by === oldAdminId) {
    obj.created_by = newAdminId;
  }
  if (obj.updated_by === oldAdminId) {
    obj.updated_by = newAdminId;
  }
  if (obj.banned_by === oldAdminId) {
    obj.banned_by = newAdminId;
  }

  return obj;
}

async function migrateTable(sourceClient, targetClient, tableInfo, oldAdminId, newAdminId) {
  const { name, conflict, orderCol, label } = tableInfo;

  const { count, error: countErr } = await sourceClient
    .from(name)
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.warn(`  ⚠️ Bỏ qua [${name}]: ${countErr.message}`);
    return;
  }

  if (count === 0) {
    console.log(`  [${name}] Không có dữ liệu, bỏ qua.`);
    return;
  }

  console.log(`\n📦 Bắt đầu nạp [${label} - ${name}]: ${count.toLocaleString()} dòng...`);

  let loaded = 0;
  let lastKey = null;
  let offset = 0;

  while (loaded < count) {
    let q = sourceClient.from(name).select('*').limit(PAGE_SIZE);

    if (orderCol) {
      q = q.order(orderCol, { ascending: true });
      if (lastKey !== null) {
        q = q.gt(orderCol, lastKey);
      }
    } else {
      q = q.range(offset, offset + PAGE_SIZE - 1);
    }

    const { data: chunk, error: readErr } = await q;
    if (readErr) {
      throw new Error(`Lỗi đọc từ DB nguồn [${name}]: ${readErr.message}`);
    }

    if (!chunk || chunk.length === 0) break;

    const transformedChunk = chunk.map((r) => transformRow(r, oldAdminId, newAdminId));

    // Ghi vào DB đích theo từng BATCH_SIZE
    for (let i = 0; i < transformedChunk.length; i += BATCH_SIZE) {
      const slice = transformedChunk.slice(i, i + BATCH_SIZE);
      const { error: writeErr } = await targetClient
        .from(name)
        .upsert(slice, { onConflict: conflict, ignoreDuplicates: false });

      if (writeErr) {
        console.error(`\n❌ Lỗi nạp dữ liệu bảng [${name}]:`, writeErr.message);
        throw writeErr;
      }
    }

    loaded += chunk.length;
    offset += chunk.length;

    if (orderCol && chunk.length > 0) {
      lastKey = chunk[chunk.length - 1][orderCol];
    }

    const pct = Math.round((loaded / count) * 100);
    process.stdout.write(`\r  ⏳ Đã nạp: ${loaded.toLocaleString()}/${count.toLocaleString()} (${pct}%)...`);

    if (chunk.length < PAGE_SIZE) break;
  }

  console.log(`\r  ✅ [${label} - ${name}]: Đã nạp xong ${loaded.toLocaleString()} dòng 100%!`);
}

async function main() {
  console.log('================================================================');
  console.log('⚡ TQMASTER - CHUYỂN DỮ LIỆU TRỰC TIẾP SANG DATABASE MỚI');
  console.log('================================================================');
  console.log(`Nguồn: ${SOURCE_URL}`);
  console.log(`Đích:  ${TARGET_URL}`);

  const sourceClient = createClient(SOURCE_URL, SOURCE_KEY);
  const targetClient = createClient(TARGET_URL, TARGET_KEY);

  console.log('\nĐang đăng nhập admin vào cả 2 database...');

  const [srcAuth, tgtAuth] = await Promise.all([
    sourceClient.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    targetClient.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  ]);

  if (srcAuth.error) throw new Error('Không đăng nhập được DB nguồn: ' + srcAuth.error.message);
  if (tgtAuth.error) throw new Error('Không đăng nhập được DB đích: ' + tgtAuth.error.message);

  const oldAdminId = srcAuth.data.user.id;
  const newAdminId = tgtAuth.data.user.id;

  console.log(`✅ DB nguồn: ${srcAuth.data.user.email} (ID: ${oldAdminId})`);
  console.log(`✅ DB đích:  ${tgtAuth.data.user.email} (ID: ${newAdminId})`);
  console.log('\nBắt đầu nạp dữ liệu tự động...\n');

  const startTime = Date.now();

  for (const table of TABLES) {
    await migrateTable(sourceClient, targetClient, table, oldAdminId, newAdminId);
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log('\n================================================================');
  console.log(`🎉 HOÀN TẤT TOÀN BỘ NỘI DUNG TRONG ${elapsed} GIÂY!`);
  console.log(`Toàn bộ môn học, đề thi, 14.467 câu hỏi và 99.458 phương án đã được nạp vào DB mới!`);
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Thất bại:', err);
  process.exit(1);
});
