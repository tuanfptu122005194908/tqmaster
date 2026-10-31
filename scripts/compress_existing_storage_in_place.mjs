import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const PROJECT_REF = 'vhljgmtithjeovtrghvy';
const SUPABASE_URL = `https://${PROJECT_REF}.supabase.co`;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const INVENTORY_PATH = path.resolve('backup_sql/storage_objects_inventory.json');

const BUCKET_CONFIGS = {
  thumbnails: { maxDim: 960, quality: 82 },
  'announcement-images': { maxDim: 1280, quality: 82 },
  'news-images': { maxDim: 1280, quality: 82 },
};

async function optimizeStorage() {
  console.log('🚀 Bắt đầu tối ưu hóa nén ảnh trực tiếp trên Supabase Storage...');
  console.log(`Dự án: ${PROJECT_REF} (${SUPABASE_URL})`);

  if (!fs.existsSync(INVENTORY_PATH)) {
    throw new Error(`Không tìm thấy file inventory: ${INVENTORY_PATH}`);
  }

  const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf8'));
  const targets = inventory.filter(
    (item) =>
      BUCKET_CONFIGS[item.bucket_id] &&
      !item.name.endsWith('.svg') &&
      !item.name.endsWith('.gif')
  );

  console.log(`Tìm thấy tổng cộng ${targets.length} ảnh cần kiểm tra tối ưu (thumbnails, announcement-images, news-images).`);

  let totalOriginalBytes = 0;
  let totalOptimizedBytes = 0;
  let successCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    const cfg = BUCKET_CONFIGS[item.bucket_id];
    const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/${item.bucket_id}/${encodeURI(item.name)}`;

    try {
      const getRes = await fetch(fileUrl, {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      });

      if (!getRes.ok) {
        console.warn(`[${i + 1}/${targets.length}] ⚠ Không tải được: ${item.bucket_id}/${item.name} (${getRes.status})`);
        errorCount++;
        continue;
      }

      const originalBuf = Buffer.from(await getRes.arrayBuffer());
      totalOriginalBytes += originalBuf.length;

      // Nếu file đã rất nhỏ (< 50KB), giữ nguyên
      if (originalBuf.length < 50 * 1024) {
        totalOptimizedBytes += originalBuf.length;
        skippedCount++;
        continue;
      }

      const compressedBuf = await sharp(originalBuf)
        .resize({ width: cfg.maxDim, height: cfg.maxDim, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: cfg.quality })
        .toBuffer();

      // Nếu nén xong nhẹ hơn ít nhất 15%
      if (compressedBuf.length < originalBuf.length * 0.85) {
        const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${item.bucket_id}/${encodeURI(item.name)}`;
        const putRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            apikey: SERVICE_ROLE_KEY,
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
            'Content-Type': 'image/webp',
            'cache-control': '31536000',
            'x-upsert': 'true',
          },
          body: compressedBuf,
        });

        if (putRes.ok) {
          totalOptimizedBytes += compressedBuf.length;
          successCount++;
          const savedPercent = ((1 - compressedBuf.length / originalBuf.length) * 100).toFixed(1);
          console.log(
            `[${i + 1}/${targets.length}] ✓ ${item.bucket_id}/${item.name}: ` +
              `${(originalBuf.length / 1024 / 1024).toFixed(2)} MB -> ` +
              `${(compressedBuf.length / 1024).toFixed(1)} KB (Giảm ${savedPercent}%)`
          );
        } else {
          console.warn(`[${i + 1}/${targets.length}] ⚠ Upload thất bại: ${item.bucket_id}/${item.name} (${putRes.status})`);
          totalOptimizedBytes += originalBuf.length;
          errorCount++;
        }
      } else {
        totalOptimizedBytes += originalBuf.length;
        skippedCount++;
      }
    } catch (err) {
      console.error(`[${i + 1}/${targets.length}] ❌ Lỗi xử lý: ${item.bucket_id}/${item.name}:`, err.message);
      errorCount++;
    }
  }

  const origMB = (totalOriginalBytes / 1024 / 1024).toFixed(2);
  const optMB = (totalOptimizedBytes / 1024 / 1024).toFixed(2);
  const savedMB = ((totalOriginalBytes - totalOptimizedBytes) / 1024 / 1024).toFixed(2);
  const savedPct = totalOriginalBytes > 0 ? (((totalOriginalBytes - totalOptimizedBytes) / totalOriginalBytes) * 100).toFixed(1) : 0;

  console.log('\n======================================================');
  console.log('🎉 KẾT QUẢ TỐI ƯU HÓA STORAGE HOÀN TẤT:');
  console.log(`- Tổng số file đã tối ưu thành công: ${successCount}`);
  console.log(`- File đã tối ưu sẵn (bỏ qua): ${skippedCount}`);
  console.log(`- File gặp lỗi: ${errorCount}`);
  console.log(`- Dung lượng ban đầu: ${origMB} MB`);
  console.log(`- Dung lượng sau khi nén: ${optMB} MB`);
  console.log(`- Tiết kiệm được: ${savedMB} MB (Giảm ${savedPct}%)`);
  console.log('======================================================');
}

optimizeStorage().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

