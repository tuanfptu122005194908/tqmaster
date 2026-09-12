import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình kết nối Supabase (mặc định trỏ vào DB chứa đầy đủ dữ liệu thực)
const SUPABASE_URL = process.env.EXPORT_SUPABASE_URL || 'https://jokmwkkepasocfpcsmzd.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPORT_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impva213a2tlcGFzb2NmcGNzbXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczODE0NTcsImV4cCI6MjA5Mjk1NzQ1N30.NiFtzrNo6K-MRSnF3dPPwDoV-Uki50BfhCaTCOEm-G0';
const ADMIN_EMAIL = process.env.EXPORT_ADMIN_EMAIL || 'admin@gmail.com';
const ADMIN_PASSWORD = process.env.EXPORT_ADMIN_PASSWORD || 'tuan0112';

const OUT_DIR = path.resolve(__dirname, '../backup_sql');
const PAGE_SIZE = 1000;
const INSERT_CHUNK = 500;

const TABLES = [
  { name: 'profiles', conflict: 'id', orderCol: 'id', label: 'Hồ sơ người dùng' },
  { name: 'user_roles', conflict: 'id', orderCol: 'id', label: 'Phân quyền' },
  { name: 'subjects', conflict: 'id', orderCol: 'id', label: 'Môn học' },
  { name: 'exams', conflict: 'id', orderCol: 'id', label: 'Đề thi' },
  { name: 'exam_subjects', conflict: 'exam_id,subject_id', orderCol: null, label: 'Đề thi ↔ Môn học' },
  { name: 'questions', conflict: 'id', orderCol: 'id', label: 'Câu hỏi' },
  { name: 'question_options', conflict: 'id', orderCol: 'id', label: 'Phương án trả lời' },
  { name: 'theories', conflict: 'id', orderCol: 'id', label: 'Tài liệu lý thuyết' },
  { name: 'theory_subjects', conflict: 'theory_id,subject_id', orderCol: null, label: 'Tài liệu ↔ Môn học' },
  { name: 'user_subjects', conflict: 'id', orderCol: 'id', label: 'Quyền môn học của user' },
  { name: 'discount_codes', conflict: 'id', orderCol: 'id', label: 'Mã giảm giá' },
  { name: 'orders', conflict: 'id', orderCol: 'id', label: 'Đơn hàng' },
  { name: 'order_items', conflict: 'id', orderCol: 'id', label: 'Chi tiết đơn hàng' },
  { name: 'exam_attempts', conflict: 'id', orderCol: 'id', label: 'Lượt làm bài thi' },
  { name: 'attempt_answers', conflict: 'id', orderCol: 'id', label: 'Đáp án chi tiết' },
  { name: 'question_reports', conflict: 'id', orderCol: 'id', label: 'Báo lỗi câu hỏi' },
  { name: 'announcements', conflict: 'id', orderCol: 'id', label: 'Thông báo' },
  { name: 'news_posts', conflict: 'id', orderCol: 'id', label: 'Tin tức' },
  { name: 'news_likes', conflict: 'post_id,user_id', orderCol: null, label: 'Lượt thích tin tức' },
  { name: 'news_comments', conflict: 'id', orderCol: 'id', label: 'Bình luận tin tức' },
  { name: 'conversations', conflict: 'id', orderCol: 'id', label: 'Hội thoại hỗ trợ' },
  { name: 'chat_messages', conflict: 'id', orderCol: 'id', label: 'Tin nhắn hỗ trợ' },
  { name: 'chat_cleanup_logs', conflict: 'id', orderCol: 'id', label: 'Nhật ký dọn tin nhắn' },
  { name: 'active_sessions', conflict: 'session_id', orderCol: null, label: 'Phiên hoạt động' },
  { name: 'system_settings', conflict: 'key', orderCol: 'key', label: 'Cấu hình hệ thống' }
];

function formatSqlValue(val, col) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : 'NULL';
  if (Array.isArray(val)) {
    if (col === 'selected' || col === 'images') {
      if (val.length === 0) return "'{}'::text[]";
      const elems = val.map((x) => `'${String(x).replace(/'/g, "''")}'`).join(', ');
      return `ARRAY[${elems}]::text[]`;
    }
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function exportTable(supabase, tableInfo, fileIndex) {
  const { name, conflict, orderCol, label } = tableInfo;
  const prefix = String(fileIndex).padStart(2, '0');
  const fileName = `${prefix}_${name}.sql`;
  const filePath = path.join(OUT_DIR, fileName);

  const { count, error: countErr } = await supabase
    .from(name)
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.warn(`  ⚠️ Bỏ qua [${name}]: ${countErr.message}`);
    return { name, rows: 0, size: 0, status: 'skipped' };
  }

  const stream = fs.createWriteStream(filePath, { encoding: 'utf8' });

  const write = (str) =>
    new Promise((resolve, reject) => {
      if (!stream.write(str)) stream.once('drain', resolve);
      else resolve();
    });

  const now = new Date().toISOString();
  await write(`-- ==============================================================================\n`);
  await write(`-- Bảng: public.${name} (${label})\n`);
  await write(`-- Tổng số dòng: ${count}\n`);
  await write(`-- Xuất lúc: ${now}\n`);
  await write(`-- ==============================================================================\n\n`);
  await write(`BEGIN;\n`);
  await write(`SET session_replication_role = replica; -- Tạm tắt kiểm tra khóa ngoại & trigger\n\n`);

  if (count === 0) {
    await write(`-- Bảng này chưa có dữ liệu.\n\n`);
    await write(`SET session_replication_role = origin;\n`);
    await write(`COMMIT;\n`);
    await new Promise((r) => stream.end(r));
    console.log(`  [${prefix}] ${name.padEnd(20)}: 0 dòng -> ${fileName}`);
    return { name, rows: 0, size: fs.statSync(filePath).size, status: 'empty' };
  }

  let totalExported = 0;
  let lastKey = null;
  let offset = 0;
  let columns = null;

  while (totalExported < count) {
    let q = supabase.from(name).select('*').limit(PAGE_SIZE);

    if (orderCol) {
      q = q.order(orderCol, { ascending: true });
      if (lastKey !== null) {
        q = q.gt(orderCol, lastKey);
      }
    } else {
      q = q.range(offset, offset + PAGE_SIZE - 1);
    }

    const { data: chunk, error: pageErr } = await q;
    if (pageErr) {
      throw new Error(`Lỗi đọc trang bảng ${name}: ${pageErr.message}`);
    }

    if (!chunk || chunk.length === 0) break;

    if (!columns && chunk.length > 0) {
      columns = Object.keys(chunk[0]).sort();
    }

    // Ghi từng nhóm dòng theo INSERT_CHUNK
    for (let i = 0; i < chunk.length; i += INSERT_CHUNK) {
      const slice = chunk.slice(i, i + INSERT_CHUNK);
      const colsSql = columns.map((c) => `"${c}"`).join(', ');
      const rowsSql = slice
        .map((r) => `  (${columns.map((c) => formatSqlValue(r[c], c)).join(', ')})`)
        .join(',\n');

      const conflictClause = conflict ? `ON CONFLICT (${conflict}) DO NOTHING` : '';
      await write(`INSERT INTO public.${name} (${colsSql}) VALUES\n${rowsSql}\n${conflictClause};\n\n`);
    }

    totalExported += chunk.length;
    offset += chunk.length;

    if (orderCol && chunk.length > 0) {
      lastKey = chunk[chunk.length - 1][orderCol];
    }

    // Hiển thị tiến trình với các bảng lớn
    if (count > 5000) {
      process.stdout.write(`\r  ⏳ [${prefix}] ${name}: ${totalExported}/${count} dòng (${Math.round((totalExported / count) * 100)}%)...`);
    }

    if (chunk.length < PAGE_SIZE) break;
  }

  if (count > 5000) {
    process.stdout.write('\r');
  }

  await write(`SET session_replication_role = origin;\n`);
  await write(`COMMIT;\n`);
  await new Promise((r) => stream.end(r));

  const stats = fs.statSync(filePath);
  console.log(`  ✅ [${prefix}] ${name.padEnd(20)}: ${totalExported.toLocaleString()} dòng -> ${fileName} (${formatBytes(stats.size)})`);

  return { name, rows: totalExported, size: stats.size, status: 'done' };
}

async function main() {
  console.log('================================================================');
  console.log('🚀 TQMaster - CÔNG CỤ XUẤT TOÀN BỘ DỮ LIỆU DATABASE RA SQL');
  console.log('================================================================');
  console.log(`Nguồn dữ liệu: ${SUPABASE_URL}`);
  console.log(`Tài khoản:     ${ADMIN_EMAIL}`);

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('\nĐang xác thực quyền quản trị viên...');
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (authErr) {
    console.error('❌ Lỗi đăng nhập:', authErr.message);
    process.exit(1);
  }
  console.log(`✅ Đã đăng nhập thành công: ${authData.user.email} (Role: admin)`);

  console.log(`\nBắt đầu xuất ${TABLES.length} bảng dữ liệu vào: ${OUT_DIR}\n`);

  const startTime = Date.now();
  const results = [];

  for (let i = 0; i < TABLES.length; i++) {
    const res = await exportTable(supabase, TABLES[i], i + 1);
    results.push(res);
  }

  // Tạo file README & file nạp toàn bộ
  const readmePath = path.join(OUT_DIR, 'README.md');
  const totalRows = results.reduce((acc, cur) => acc + (cur.rows || 0), 0);
  const totalBytes = results.reduce((acc, cur) => acc + (cur.size || 0), 0);
  const elapsed = Math.round((Date.now() - startTime) / 1000);

  fs.writeFileSync(
    readmePath,
    `# Hướng dẫn nạp dữ liệu SQL

Dữ liệu được xuất từ: \`${SUPABASE_URL}\`
Thời gian: \`${new Date().toLocaleString('vi-VN')}\`
Tổng số dòng: **${totalRows.toLocaleString()} dòng**
Tổng dung lượng: **${formatBytes(totalBytes)}**

## Cách nạp vào Supabase mới:
1. Mở **Supabase Dashboard** của project mới -> vào **SQL Editor**.
2. Đảm bảo bạn đã chạy file \`database_schema_clean.sql\` để tạo các bảng trước.
3. Chạy lần lượt các file SQL theo thứ tự từ \`01_profiles.sql\` đến \`25_system_settings.sql\`.
   *(Mỗi file đều đã có \`SET session_replication_role = replica;\` và \`ON CONFLICT DO NOTHING\` nên chạy an toàn và không bị lỗi khoá ngoại)*.
4. Đối với các file có dung lượng lớn như \`07_question_options.sql\` và \`15_attempt_answers.sql\`, nếu dán vào Web SQL Editor bị lag, bạn có thể nạp qua tool như **DBeaver**, **pgAdmin**, hoặc lệnh **psql**.
`
  );

  console.log('\n================================================================');
  console.log(`🎉 HOÀN TẤT TRONG ${elapsed} GIÂY!`);
  console.log(`Tổng số dòng đã xuất: ${totalRows.toLocaleString()} dòng`);
  console.log(`Tổng dung lượng:      ${formatBytes(totalBytes)}`);
  console.log(`Thư mục chứa file:    ${OUT_DIR}`);
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('\n❌ Có lỗi xảy ra:', err);
  process.exit(1);
});
