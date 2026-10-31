import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

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
const OUTPUT_DIR = path.resolve('downloaded_theories');

function sanitizeName(name) {
  if (!name) return 'Chua_Phan_Loai';
  return name
    .replace(/[<>:"/\\|?*]+/g, '_')
    .trim()
    .replace(/\s+/g, ' ');
}

function getSafeFileName(rawFileName, title, storagePath) {
  let name = rawFileName || title || storagePath;
  const ext = path.extname(storagePath) || path.extname(name) || '.zip';
  if (!name.toLowerCase().endsWith(ext.toLowerCase())) {
    name += ext;
  }
  return sanitizeName(name);
}

async function downloadFileWithRetry(url, targetPath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(targetPath, Buffer.from(buffer));
      return buffer.byteLength;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

async function run() {
  console.log('🚀 Bắt đầu trích xuất toàn bộ tài liệu từ Supabase Storage về máy tính...');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const { data: theories, error } = await client
    .from('theories')
    .select('id, title, file_name, url, theory_subjects(subjects(name, semester))')
    .eq('type', 'file');

  if (error) {
    throw new Error('Lỗi truy vấn danh sách tài liệu: ' + error.message);
  }

  console.log(`📋 Tìm thấy ${theories.length} tài liệu lý thuyết / đề thi.`);

  let totalBytes = 0;
  let successCount = 0;
  let failCount = 0;
  const downloadedMap = new Map(); // storagePath -> buffer or local path

  for (let i = 0; i < theories.length; i++) {
    const item = theories[i];
    
    // Lấy danh sách môn học và kỳ học tương ứng
    const subjectList = (item.theory_subjects || [])
      .map((ts) => ts.subjects)
      .filter(Boolean);

    if (subjectList.length === 0) {
      subjectList.push({ name: 'Tai_Lieu_Chung', semester: 0 });
    }

    // Lấy storage path từ URL
    let storagePath = '';
    const match = item.url.match(/theory-files\/(.+)$/);
    if (match) {
      storagePath = decodeURIComponent(match[1]);
    } else {
      storagePath = path.basename(item.url);
    }

    const fileName = getSafeFileName(item.file_name, item.title, storagePath);
    const authUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/theory-files/${encodeURI(storagePath)}`;

    // Tải file về thư mục cache tạm hoặc trực tiếp
    let sourceBuffer = null;
    if (downloadedMap.has(storagePath)) {
      sourceBuffer = fs.readFileSync(downloadedMap.get(storagePath));
    } else {
      process.stdout.write(`[${i + 1}/${theories.length}] ⏳ Đang tải: ${fileName}... `);
      try {
        const tempPath = path.join(OUTPUT_DIR, `__temp_${storagePath}`);
        const size = await downloadFileWithRetry(authUrl, tempPath);
        totalBytes += size;
        successCount++;
        downloadedMap.set(storagePath, tempPath);
        sourceBuffer = fs.readFileSync(tempPath);
        console.log(`✅ (${(size / (1024 * 1024)).toFixed(2)} MB)`);
      } catch (err) {
        failCount++;
        console.log(`❌ Lỗi: ${err.message}`);
        continue;
      }
    }

    // Copy file vào từng thư mục Kỳ / Môn học tương ứng
    for (const sub of subjectList) {
      const semFolder = sub.semester ? `Kỳ ${sub.semester}` : 'Chung';
      const subjectFolder = sanitizeName(sub.name);
      const targetDir = path.join(OUTPUT_DIR, semFolder, subjectFolder);
      fs.mkdirSync(targetDir, { recursive: true });

      let targetFilePath = path.join(targetDir, fileName);
      if (fs.existsSync(targetFilePath) && downloadedMap.get(storagePath) !== targetFilePath) {
        const ext = path.extname(fileName);
        const base = path.basename(fileName, ext);
        targetFilePath = path.join(targetDir, `${base}_${item.id.slice(0, 4)}${ext}`);
      }

      fs.writeFileSync(targetFilePath, sourceBuffer);
    }
  }

  // Dọn dẹp các file __temp_
  const allFiles = fs.readdirSync(OUTPUT_DIR);
  for (const f of allFiles) {
    if (f.startsWith('__temp_')) {
      fs.unlinkSync(path.join(OUTPUT_DIR, f));
    }
  }

  console.log('\n======================================================');
  console.log('🎉 HOÀN TẤT TRÍCH XUẤT TÀI LIỆU VỀ MÁY TÍNH!');
  console.log(`📁 Thư mục lưu trữ: ${OUTPUT_DIR}`);
  console.log(`✅ Thành công: ${successCount} files`);
  console.log(`❌ Thất bại: ${failCount} files`);
  console.log(`📦 Tổng dung lượng tải về: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log('======================================================\n');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
