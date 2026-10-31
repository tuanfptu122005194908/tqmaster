import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';

const SUPABASE_URL = 'https://vhljgmtithjeovtrghvy.supabase.co';
let SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
if (!SERVICE_KEY && fs.existsSync('scratch/keys.json')) {
  try {
    const keys = JSON.parse(fs.readFileSync('scratch/keys.json', 'utf8'));
    SERVICE_KEY = keys.serviceRoleKey || '';
  } catch {}
}

if (!SERVICE_KEY) {
  console.error('Lỗi: Không tìm thấy Supabase Service Role Key.');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SERVICE_KEY);

async function listAllFiles(prefix = '') {
  let allFiles = [];
  let page = 0;
  const pageSize = 100;

  while (true) {
    const { data, error } = await client.storage.from('theory-files').list(prefix, {
      limit: pageSize,
      offset: page * pageSize,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      throw new Error('Lỗi khi lấy danh sách files: ' + error.message);
    }

    if (!data || data.length === 0) break;

    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null && !item.metadata) {
        // Đây là thư mục con, đệ quy tìm tiếp
        const subFiles = await listAllFiles(fullPath);
        allFiles = allFiles.concat(subFiles);
      } else {
        allFiles.push({
          path: fullPath,
          size: item.metadata?.size || 0,
        });
      }
    }

    if (data.length < pageSize) break;
    page++;
  }

  return allFiles;
}

async function run() {
  const isConfirmed = process.argv.includes('--confirm');

  console.log('🔍 Đang kiểm tra các file trong bucket `theory-files` trên Supabase Storage...');
  const files = await listAllFiles();

  const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

  console.log(`📦 Tìm thấy ${files.length} file trong bucket \`theory-files\`.`);
  console.log(`📊 Tổng dung lượng: ${totalMB} MB`);

  if (files.length === 0) {
    console.log('✅ Bucket `theory-files` đã sạch sẽ, không có file nào cần xóa.');
    return;
  }

  if (!isConfirmed) {
    console.log('\n⚠️ CHẾ ĐỘ KIỂM TRA (DRY-RUN): Chưa có file nào bị xóa.');
    console.log('👉 Sau khi bạn đã upload toàn bộ file lên Google Drive thành công:');
    console.log('   Hãy chạy lệnh sau để xóa sạch 473 MB trên Supabase Storage:');
    console.log('   node scripts/clean_supabase_theory_files.mjs --confirm\n');
    return;
  }

  console.log(`\n🚨 ĐANG TIẾN HÀNH XÓA SẠCH ${files.length} FILE (${totalMB} MB) TRÊN STORAGE...`);

  const filePaths = files.map((f) => f.path);
  const batchSize = 50;
  let deletedCount = 0;

  for (let i = 0; i < filePaths.length; i += batchSize) {
    const batch = filePaths.slice(i, i + batchSize);
    const { data, error } = await client.storage.from('theory-files').remove(batch);

    if (error) {
      console.error(`❌ Lỗi xóa batch ${i}:`, error.message);
    } else {
      deletedCount += data?.length || batch.length;
      console.log(`🗑️ Đã xóa batch ${i + 1} - ${i + batch.length} (${deletedCount}/${filePaths.length} files)...`);
    }
  }

  console.log('\n======================================================');
  console.log(`🎉 ĐÃ GIẢI PHÓNG THÀNH CÔNG ${totalMB} MB DUNG LƯỢNG STORAGE!`);
  console.log(`✅ Tổng số file đã dọn dẹp: ${deletedCount} files.`);
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
