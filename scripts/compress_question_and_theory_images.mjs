/**
 * scripts/compress_question_and_theory_images.mjs
 * Batch in-place compression script for question-images and theory-images
 * Converts images to crisp WebP (quality 82, max dimension 1400px).
 * Overwrites files in-place using x-upsert to preserve all existing URLs.
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SUPABASE_URL = 'https://vhljgmtithjeovtrghvy.supabase.co';
const KEYS_PATH = path.resolve('scratch/keys.json');
const INVENTORY_PATH = path.resolve('backup_sql/storage_objects_inventory.json');
const CHECKPOINT_PATH = path.resolve('scratch/compression_checkpoint.json');

const CONCURRENCY = 12;
const MIN_FILE_SIZE = 40 * 1024; // 40 KB threshold
const MAX_DIMENSION = 1400;
const WEBP_QUALITY = 82;

if (!fs.existsSync(KEYS_PATH)) {
  console.error('Missing scratch/keys.json with serviceRoleKey');
  process.exit(1);
}
const { serviceRoleKey } = JSON.parse(fs.readFileSync(KEYS_PATH, 'utf8'));

if (!fs.existsSync(INVENTORY_PATH)) {
  console.error('Missing inventory file:', INVENTORY_PATH);
  process.exit(1);
}
const allObjects = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf8'));

// Load checkpoint if exists
let checkpoint = { processed: {}, savedBytes: 0, originalBytes: 0 };
if (fs.existsSync(CHECKPOINT_PATH)) {
  try {
    checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_PATH, 'utf8'));
    console.log(`Loaded checkpoint with ${Object.keys(checkpoint.processed).length} previously processed items.`);
  } catch (e) {
    console.warn('Could not parse checkpoint, starting fresh.');
  }
}

// Filter target files
const targets = allObjects.filter(item => {
  if (item.bucket_id !== 'question-images' && item.bucket_id !== 'theory-images') return false;
  if (!item.name) return false;
  const size = item.size || 0;
  if (size < MIN_FILE_SIZE) return false;
  // Skip if already in checkpoint
  const key = `${item.bucket_id}/${item.name}`;
  if (checkpoint.processed[key]) return false;
  return true;
});

// Sort largest files first to maximize immediate disk savings
targets.sort((a, b) => (b.size || 0) - (a.size || 0));

console.log(`\n======================================================`);
console.log(`TARGETS IDENTIFIED FOR COMPRESSION:`);
console.log(`- Remaining targets: ${targets.length}`);
console.log(`- Concurrency: ${CONCURRENCY} workers`);
console.log(`- Minimum size: ${MIN_FILE_SIZE / 1024} KB`);
console.log(`- WebP Quality: ${WEBP_QUALITY}% | Max Dimension: ${MAX_DIMENSION}px`);
console.log(`======================================================\n`);

let processedCount = 0;
let totalSavedBytes = checkpoint.savedBytes || 0;
let totalOriginalBytes = checkpoint.originalBytes || 0;
let totalNewBytes = 0;
let skippedCount = 0;
let errorCount = 0;

function saveCheckpoint() {
  checkpoint.savedBytes = totalSavedBytes;
  checkpoint.originalBytes = totalOriginalBytes;
  fs.writeFileSync(CHECKPOINT_PATH, JSON.stringify(checkpoint, null, 2), 'utf8');
}

async function processFile(item) {
  const itemKey = `${item.bucket_id}/${item.name}`;
  const origSize = item.size || 0;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // 1. Download
      const dlUrl = `${SUPABASE_URL}/storage/v1/object/authenticated/${item.bucket_id}/${encodeURIComponent(item.name).replace(/%2F/g, '/')}`;
      const res = await fetch(dlUrl, {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          checkpoint.processed[itemKey] = { status: 'not_found' };
          skippedCount++;
          return;
        }
        throw new Error(`Download failed with status ${res.status}`);
      }

      const rawBuffer = Buffer.from(await res.arrayBuffer());
      if (rawBuffer.length === 0) {
        checkpoint.processed[itemKey] = { status: 'empty' };
        skippedCount++;
        return;
      }

      // 2. Compress via sharp
      let compressed;
      try {
        compressed = await sharp(rawBuffer)
          .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY, effort: 4 })
          .toBuffer();
      } catch (sharpErr) {
        // Not a decodable image or unsupported
        checkpoint.processed[itemKey] = { status: 'unsupported_format' };
        skippedCount++;
        return;
      }

      // 3. Only upload if savings >= 10%
      if (compressed.length >= rawBuffer.length * 0.90) {
        checkpoint.processed[itemKey] = { status: 'skipped_no_savings', origSize: rawBuffer.length, newSize: compressed.length };
        skippedCount++;
        return;
      }

      // 4. In-place upload with x-upsert
      const upUrl = `${SUPABASE_URL}/storage/v1/object/${item.bucket_id}/${encodeURIComponent(item.name).replace(/%2F/g, '/')}`;
      const upRes = await fetch(upUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          'x-upsert': 'true',
          'Content-Type': 'image/webp',
          'cache-control': '31536000',
        },
        body: compressed,
      });

      if (!upRes.ok) {
        throw new Error(`Upload failed with status ${upRes.status}: ${await upRes.text()}`);
      }

      const saved = rawBuffer.length - compressed.length;
      totalSavedBytes += saved;
      totalOriginalBytes += rawBuffer.length;
      totalNewBytes += compressed.length;

      checkpoint.processed[itemKey] = {
        status: 'compressed',
        origSize: rawBuffer.length,
        newSize: compressed.length,
        saved,
        pct: Math.round((saved / rawBuffer.length) * 100),
      };
      return;
    } catch (err) {
      if (attempt === 2) {
        errorCount++;
        console.error(`[ERROR] ${itemKey}:`, err.message);
      } else {
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
}

// Worker Pool
async function runPool() {
  let index = 0;
  const startTime = Date.now();

  const worker = async (workerId) => {
    while (index < targets.length) {
      const currentIndex = index++;
      const item = targets[currentIndex];
      await processFile(item);
      processedCount++;

      if (processedCount % 50 === 0 || processedCount === targets.length) {
        saveCheckpoint();
        const elapsedSec = Math.max(1, Math.round((Date.now() - startTime) / 1000));
        const rate = (processedCount / elapsedSec).toFixed(1);
        const savedMB = (totalSavedBytes / (1024 * 1024)).toFixed(2);
        console.log(`[${processedCount}/${targets.length}] (${rate} img/s) - Total Saved: ${savedMB} MB | Skipped: ${skippedCount} | Errors: ${errorCount}`);
      }
    }
  };

  const workers = Array.from({ length: CONCURRENCY }, (_, i) => worker(i + 1));
  await Promise.all(workers);

  saveCheckpoint();
  const totalSec = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n======================================================`);
  console.log(`COMPRESSION COMPLETED IN ${totalSec}s:`);
  console.log(`- Processed: ${processedCount}`);
  console.log(`- Total Original: ${(totalOriginalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`- Total New: ${(totalNewBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`- Total Disk Saved: ${(totalSavedBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`- Skipped: ${skippedCount}`);
  console.log(`- Errors: ${errorCount}`);
  console.log(`======================================================\n`);
}

runPool().catch(err => {
  console.error('Fatal compression script error:', err);
  process.exit(1);
});

