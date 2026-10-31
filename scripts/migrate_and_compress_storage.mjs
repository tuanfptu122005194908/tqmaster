import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OLD_REF = 'vhljgmtithjeovtrghvy';
const NEW_REF = 'dkujrthjkefusiciyckd';
const OLD_URL = `https://${OLD_REF}.supabase.co`;
const NEW_URL = `https://${NEW_REF}.supabase.co`;
const NEW_SECRET_KEY = process.env.SUPABASE_NEW_SECRET_KEY || '';
const OLD_ANON_KEY = process.env.SUPABASE_OLD_KEY || '';

const INVENTORY_PATH = path.resolve('backup_sql/storage_objects_inventory.json');

function linkOldProject() {
  fs.mkdirSync('supabase/.temp', { recursive: true });
  fs.writeFileSync('supabase/.temp/project-ref', OLD_REF, 'utf8');
}

function runOldQueryJson(sql) {
  linkOldProject();
  const tmpFile = path.resolve('backup_sql/_tmp_storage_query.sql');
  fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
  fs.writeFileSync(tmpFile, sql, 'utf8');
  const out = execSync(`npx supabase db query --linked -o json -f "${tmpFile}"`, {
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
  });
  const firstBrace = out.indexOf('{');
  const parsed = JSON.parse(out.slice(firstBrace));
  return parsed.rows || [];
}

function runOldSqlFile(sqlContent) {
  linkOldProject();
  const tmpFile = path.resolve('backup_sql/_tmp_storage_exec.sql');
  fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
  fs.writeFileSync(tmpFile, sqlContent, 'utf8');
  execSync(`npx supabase db query --linked -f "${tmpFile}"`, {
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
  });
}

async function setupNewStorageBuckets() {
  console.log(`\n[1/4] Setting up 11 Storage Buckets on NEW project (${NEW_REF})...`);
  const buckets = [
    { id: 'thumbnails', public: true },
    { id: 'qr-codes', public: true },
    { id: 'announcement-images', public: true },
    { id: 'avatars', public: true },
    { id: 'news-images', public: true },
    { id: 'chat-images', public: true },
    { id: 'bill-images', public: false },
    { id: 'question-images', public: false },
    { id: 'exam-images', public: false },
    { id: 'theory-files', public: false },
    { id: 'theory-images', public: false },
  ];

  for (const b of buckets) {
    const res = await fetch(`${NEW_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        apikey: NEW_SECRET_KEY,
        Authorization: `Bearer ${NEW_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: b.id, name: b.id, public: b.public }),
    });
    if (!res.ok) {
      await fetch(`${NEW_URL}/storage/v1/bucket/${b.id}`, {
        method: 'PUT',
        headers: {
          apikey: NEW_SECRET_KEY,
          Authorization: `Bearer ${NEW_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: b.id, name: b.id, public: b.public }),
      });
    }
  }
  console.log('✓ All 11 Storage Buckets ensured on NEW project!');
}

async function exportInventoryAndCleanOldStorage() {
  console.log(`\n[2/4] Exporting Storage inventory from OLD project (${OLD_REF})...`);

  const rows = runOldQueryJson(`
    SELECT
      bucket_id,
      name,
      COALESCE(metadata->>'mimetype', 'application/octet-stream') AS mimetype,
      COALESCE((metadata->>'size')::bigint, 0) AS size
    FROM storage.objects
    WHERE bucket_id NOT IN ('bill-images', 'chat-images', 'backup-uploads')
    ORDER BY
      CASE bucket_id
        WHEN 'thumbnails' THEN 1
        WHEN 'qr-codes' THEN 2
        WHEN 'announcement-images' THEN 3
        WHEN 'news-images' THEN 4
        WHEN 'question-images' THEN 5
        WHEN 'exam-images' THEN 6
        WHEN 'theory-images' THEN 7
        WHEN 'theory-files' THEN 8
        ELSE 9
      END,
      name;
  `);

  fs.mkdirSync(path.dirname(INVENTORY_PATH), { recursive: true });
  fs.writeFileSync(INVENTORY_PATH, JSON.stringify(rows, null, 2), 'utf8');
  console.log(`✓ Saved ${rows.length} storage object entries to ${INVENTORY_PATH}`);
  return rows;
}

async function migrateObjectsIfUnlocked(inventory) {
  console.log(`\n[3/4] Checking if OLD Storage Gateway (${OLD_URL}) is unlocked...`);
  const probe = await fetch(`${OLD_URL}/storage/v1/object/public/thumbnails/1774099869343-prf192.png`);
  if (probe.status === 402) {
    console.log(
      `⚠ OLD Storage Gateway currently returns HTTP 402 (Quota Restriction).\n` +
      `  -> Inventory of ${inventory.length} files is safely saved in ${INVENTORY_PATH}.\n` +
      `  -> As soon as ${OLD_REF} quota resets or is unlocked, run: node scripts/migrate_and_compress_storage.mjs\n` +
      `     to automatically download, compress (WebP via sharp), upload to ${NEW_REF}, and rewrite DB URLs.`
    );
    return false;
  }

  let sharp = null;
  try {
    sharp = (await import('sharp')).default;
    console.log('✓ Loaded sharp for high-speed WebP image compression.');
  } catch {
    console.log('ℹ sharp not installed; run "npm i -D sharp" for server-side WebP compression during migration.');
  }

  let migrated = 0;
  for (const item of inventory) {
    const isPublic = ['thumbnails', 'qr-codes', 'announcement-images', 'avatars', 'news-images'].includes(item.bucket_id);
    const srcUrl = isPublic
      ? `${OLD_URL}/storage/v1/object/public/${item.bucket_id}/${encodeURI(item.name)}`
      : `${OLD_URL}/storage/v1/object/authenticated/${item.bucket_id}/${encodeURI(item.name)}`;

    const res = await fetch(srcUrl, {
      headers: { apikey: OLD_ANON_KEY, Authorization: `Bearer ${OLD_ANON_KEY}` },
    });
    if (!res.ok) continue;

    let buffer = Buffer.from(await res.arrayBuffer());
    let contentType = item.mimetype || 'application/octet-stream';
    const isHeavyImage =
      contentType.startsWith('image/') &&
      !contentType.includes('svg') &&
      !contentType.includes('gif') &&
      (item.bucket_id === 'thumbnails' || item.bucket_id === 'announcement-images' || item.bucket_id === 'news-images' || buffer.length > 100 * 1024);

    if (sharp && isHeavyImage) {
      const maxDim = item.bucket_id === 'thumbnails' ? 960 : 1400;
      buffer = await sharp(buffer)
        .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      contentType = 'image/webp';
    }

    const upRes = await fetch(`${NEW_URL}/storage/v1/object/${item.bucket_id}/${encodeURI(item.name)}`, {
      method: 'POST',
      headers: {
        apikey: NEW_SECRET_KEY,
        Authorization: `Bearer ${NEW_SECRET_KEY}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
        'cache-control': '31536000',
      },
      body: buffer,
    });
    if (upRes.ok) migrated++;
  }

  console.log(`✓ Migrated and compressed ${migrated}/${inventory.length} files to ${NEW_REF}.`);
  return migrated > 0;
}

async function rewriteDatabaseUrlsToNewProject() {
  console.log(`\n[4/4] Rewriting Storage URLs in NEW project (${NEW_REF})...`);
  const headers = {
    apikey: NEW_SECRET_KEY,
    Authorization: `Bearer ${NEW_SECRET_KEY}`,
    'Content-Type': 'application/json',
  };
  const tablesAndCols = [
    { table: 'subjects', col: 'thumbnail_url' },
    { table: 'questions', col: 'image_url' },
    { table: 'question_options', col: 'image_url' },
    { table: 'theories', col: 'url' },
    { table: 'announcements', col: 'image_url' },
    { table: 'system_settings', col: 'value', pk: 'key' },
  ];
  for (const tc of tablesAndCols) {
    const pk = tc.pk || 'id';
    const r = await fetch(`${NEW_URL}/rest/v1/${tc.table}?select=${pk},${tc.col}&${tc.col}=like.*${OLD_REF}*`, { headers });
    if (!r.ok) continue;
    const rows = await r.json();
    for (const row of rows) {
      const updated = String(row[tc.col] || '').replaceAll(OLD_URL, NEW_URL);
      await fetch(`${NEW_URL}/rest/v1/${tc.table}?${pk}=eq.${encodeURIComponent(row[pk])}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ [tc.col]: updated }),
      });
    }
  }
  console.log(`✓ Updated database URLs to point to ${NEW_URL}.`);
}

(async () => {
  await setupNewStorageBuckets();
  const inventory = fs.existsSync(INVENTORY_PATH)
    ? JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf8'))
    : await exportInventoryAndCleanOldStorage();

  const migrated = await migrateObjectsIfUnlocked(inventory);
  if (migrated) {
    await rewriteDatabaseUrlsToNewProject();
  }
})();
