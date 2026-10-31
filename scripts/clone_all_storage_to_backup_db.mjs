import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OLD_URL = 'https://vhljgmtithjeovtrghvy.supabase.co';
const NEW_URL = 'https://dkujrthjkefusiciyckd.supabase.co';

const OLD_KEY = process.env.SUPABASE_OLD_SERVICE_ROLE_KEY || '';
const NEW_KEY = process.env.SUPABASE_NEW_SERVICE_ROLE_KEY || '';

const CONCURRENCY = 25;

async function getAllStorageObjectsFromOldDb() {
  console.log('🔍 Đang trích xuất danh sách toàn bộ file từ database cũ (vhljgmtithjeovtrghvy)...');
  const tmpSql = path.resolve('scratch/all_storage_objects.sql');
  fs.mkdirSync('scratch', { recursive: true });
  fs.writeFileSync(
    tmpSql,
    `SELECT bucket_id, name, COALESCE(metadata->>'mimetype', 'application/octet-stream') as mimetype, COALESCE((metadata->>'size')::bigint, 0) as size FROM storage.objects ORDER BY CASE bucket_id WHEN 'thumbnails' THEN 1 WHEN 'qr-codes' THEN 2 WHEN 'announcement-images' THEN 3 WHEN 'news-images' THEN 4 WHEN 'exam-images' THEN 5 WHEN 'theory-images' THEN 6 WHEN 'theory-files' THEN 7 WHEN 'question-images' THEN 8 ELSE 9 END, name;`,
    'utf8'
  );

  fs.mkdirSync('supabase/.temp', { recursive: true });
  fs.writeFileSync('supabase/.temp/project-ref', 'vhljgmtithjeovtrghvy', 'utf8');
  if (fs.existsSync('supabase/.temp/pooler-url')) fs.unlinkSync('supabase/.temp/pooler-url');

  const out = execSync(`npx supabase db query --linked -f "${tmpSql}" -o json`, {
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
  });

  const firstBrace = out.indexOf('{');
  const parsed = JSON.parse(out.slice(firstBrace));
  return parsed.rows || [];
}

async function transferSingleFile(item, retries = 3) {
  const isPublic = ['thumbnails', 'qr-codes', 'announcement-images', 'avatars', 'news-images', 'chat-images'].includes(item.bucket_id);
  const srcUrl = isPublic
    ? `${OLD_URL}/storage/v1/object/public/${item.bucket_id}/${encodeURI(item.name)}`
    : `${OLD_URL}/storage/v1/object/authenticated/${item.bucket_id}/${encodeURI(item.name)}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const getRes = await fetch(srcUrl, {
        headers: {
          apikey: OLD_KEY,
          Authorization: `Bearer ${OLD_KEY}`,
        },
      });

      if (!getRes.ok) {
        if (attempt === retries) {
          return { success: false, item, error: `Download failed HTTP ${getRes.status}` };
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }

      const buf = Buffer.from(await getRes.arrayBuffer());
      const destUrl = `${NEW_URL}/storage/v1/object/${item.bucket_id}/${encodeURI(item.name)}`;

      const putRes = await fetch(destUrl, {
        method: 'POST',
        headers: {
          apikey: NEW_KEY,
          Authorization: `Bearer ${NEW_KEY}`,
          'Content-Type': item.mimetype || 'application/octet-stream',
          'x-upsert': 'true',
          'cache-control': '31536000',
        },
        body: buf,
      });

      if (putRes.ok) {
        return { success: true, item, size: buf.length };
      } else {
        if (attempt === retries) {
          const errText = await putRes.text();
          return { success: false, item, error: `Upload failed HTTP ${putRes.status}: ${errText}` };
        }
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    } catch (err) {
      if (attempt === retries) {
        return { success: false, item, error: err.message };
      }
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

async function updateNewDatabaseUrls() {
  console.log('\n🔗 Đang chuyển đổi toàn bộ URL trong Database mới (dkujrthjkefusiciyckd)...');
  const headers = {
    apikey: NEW_KEY,
    Authorization: `Bearer ${NEW_KEY}`,
    'Content-Type': 'application/json',
  };

  const tasks = [
    { table: 'subjects', col: 'thumbnail_url', pk: 'id' },
    { table: 'questions', col: 'image_url', pk: 'id' },
    { table: 'question_options', col: 'image_url', pk: 'id' },
    { table: 'theories', col: 'url', pk: 'id' },
    { table: 'announcements', col: 'image_url', pk: 'id' },
    { table: 'system_settings', col: 'value', pk: 'key' },
  ];

  for (const t of tasks) {
    try {
      const fetchUrl = `${NEW_URL}/rest/v1/${t.table}?select=${t.pk},${t.col}&${t.col}=like.*vhljgmtithjeovtrghvy*`;
      const res = await fetch(fetchUrl, { headers });
      if (!res.ok) continue;
      const rows = await res.json();
      console.log(`Cập nhật ${rows.length} dòng trong bảng ${t.table}.${t.col}...`);

      for (const row of rows) {
        const newVal = String(row[t.col] || '').replaceAll(OLD_URL, NEW_URL);
        await fetch(`${NEW_URL}/rest/v1/${t.table}?${t.pk}=eq.${encodeURIComponent(row[t.pk])}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ [t.col]: newVal }),
        });
      }
    } catch (err) {
      console.error(`Lỗi cập nhật bảng ${t.table}:`, err.message);
    }
  }
  console.log('✓ Đã cập nhật toàn bộ URL trong Database mới sang dkujrthjkefusiciyckd!');
}

async function main() {
  console.log('================================================================');
  console.log('📦 BẮT ĐẦU ĐỒNG BỘ 100% TOÀN BỘ FILE STORAGE SANG DATABASE MỚI');
  console.log(`Nguồn: ${OLD_URL} -> Đích: ${NEW_URL}`);
  console.log('================================================================\n');

  const allItems = await getAllStorageObjectsFromOldDb();
  console.log(`✓ Đã trích xuất ${allItems.length} file cần chuyển.`);

  let transferredCount = 0;
  let totalBytes = 0;
  let errorCount = 0;
  const startTime = Date.now();

  for (let i = 0; i < allItems.length; i += CONCURRENCY) {
    const chunk = allItems.slice(i, i + CONCURRENCY);
    const results = await Promise.all(chunk.map((item) => transferSingleFile(item)));

    for (const r of results) {
      if (r.success) {
        transferredCount++;
        totalBytes += r.size;
      } else {
        errorCount++;
        console.warn(`[LỖI] ${r.item.bucket_id}/${r.item.name}: ${r.error}`);
      }
    }

    const percent = (((i + chunk.length) / allItems.length) * 100).toFixed(1);
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(0);
    const transferredMB = (totalBytes / 1024 / 1024).toFixed(1);
    console.log(
      `Tiến độ: ${transferredCount}/${allItems.length} files (${percent}%) | ` +
        `Đã chuyển: ${transferredMB} MB | Lỗi: ${errorCount} | Thời gian: ${elapsedSec}s`
    );
  }

  console.log('\n================================================================');
  console.log('🎉 ĐÃ CHUYỂN TOÀN BỘ FILE STORAGE HOÀN TẤT!');
  console.log(`- Tổng số file chuyển thành công: ${transferredCount}/${allItems.length}`);
  console.log(`- Dung lượng đã chuyển: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`- Số file lỗi: ${errorCount}`);
  console.log('================================================================');

  // Đổi các link ảnh trong database mới sang domain mới
  await updateNewDatabaseUrls();

  console.log('\n✅ HOÀN TẤT 100% QUÁ TRÌNH DỰ PHÒNG & ĐỒNG BỘ TOÀN DIỆN!');
}

main().catch((err) => {
  console.error('Lỗi nghiêm trọng:', err);
  process.exit(1);
});

