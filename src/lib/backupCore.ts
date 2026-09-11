/**
 * TQMaster — Full Snapshot Backup Engine
 *
 * Mục tiêu: tạo bản sao lưu ĐẦY ĐỦ, KHÔNG MẤT DỮ LIỆU của toàn bộ database +
 * media trong Storage, đủ để khôi phục sang một dự án / cơ sở dữ liệu khác.
 *
 * Định dạng gói (.zip):
 *   manifest.json          — metadata: phiên bản, thời gian, origin cũ, số dòng mỗi bảng
 *   data/<table>.json      — toàn bộ dòng của bảng, giữ nguyên kiểu dữ liệu JSON
 *   media/<bucket>/<path>  — toàn bộ file trong Storage
 *
 * Khi khôi phục sang project khác, mọi URL chứa origin cũ được tự động đổi
 * sang origin mới, nên ảnh / file vẫn hiển thị đúng.
 */
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';

export const BACKUP_FORMAT_VERSION = 2;

export type TableGroup = 'content' | 'commerce' | 'users' | 'activity' | 'system';

export interface BackupTable {
  name: string;
  label: string;
  group: TableGroup;
  /** Thứ tự khôi phục — nhỏ hơn = khôi phục trước (tôn trọng khoá ngoại) */
  order: number;
  /** Cột xung đột dùng cho upsert (khoá chính) */
  conflict: string;
  /** Cột dùng để sắp xếp khi export (ổn định, phân trang) */
  orderBy?: string;
  /** Không thể khôi phục nếu chưa có tài khoản đăng nhập tương ứng */
  requiresAuthUsers?: boolean;
  note?: string;
}

export const GROUP_LABELS: Record<TableGroup, string> = {
  content: '📚 Nội dung học tập',
  commerce: '🛒 Kinh doanh',
  users: '👤 Người dùng & phân quyền',
  activity: '📊 Hoạt động & lịch sử',
  system: '⚙️ Hệ thống',
};

export const BACKUP_TABLES: BackupTable[] = [
  // ── Nội dung ────────────────────────────────────────────────
  { name: 'subjects', label: 'Môn học', group: 'content', order: 10, conflict: 'id', orderBy: 'created_at' },
  { name: 'exams', label: 'Đề thi', group: 'content', order: 11, conflict: 'id', orderBy: 'created_at' },
  { name: 'exam_subjects', label: 'Đề thi ↔ Môn học', group: 'content', order: 12, conflict: 'exam_id,subject_id', orderBy: 'exam_id' },
  { name: 'questions', label: 'Câu hỏi', group: 'content', order: 13, conflict: 'id', orderBy: 'created_at' },
  { name: 'question_options', label: 'Phương án trả lời', group: 'content', order: 14, conflict: 'id', orderBy: 'id' },
  { name: 'theories', label: 'Tài liệu / Lý thuyết', group: 'content', order: 15, conflict: 'id', orderBy: 'created_at' },
  { name: 'theory_subjects', label: 'Tài liệu ↔ Môn học', group: 'content', order: 16, conflict: 'theory_id,subject_id', orderBy: 'theory_id' },
  { name: 'news_posts', label: 'Bài viết tin tức', group: 'content', order: 17, conflict: 'id', orderBy: 'created_at' },
  { name: 'announcements', label: 'Thông báo', group: 'content', order: 18, conflict: 'id', orderBy: 'created_at' },

  // ── Kinh doanh ──────────────────────────────────────────────
  { name: 'discount_codes', label: 'Mã giảm giá', group: 'commerce', order: 20, conflict: 'id', orderBy: 'created_at' },

  // ── Người dùng ──────────────────────────────────────────────
  { name: 'profiles', label: 'Hồ sơ người dùng', group: 'users', order: 30, conflict: 'id', orderBy: 'created_at', requiresAuthUsers: true, note: 'Chỉ khôi phục được khi tài khoản đăng nhập đã tồn tại ở hệ thống mới.' },
  { name: 'user_roles', label: 'Phân quyền', group: 'users', order: 31, conflict: 'id', orderBy: 'id', requiresAuthUsers: true },
  { name: 'user_subjects', label: 'Quyền truy cập môn học', group: 'users', order: 32, conflict: 'user_id,subject_id', orderBy: 'granted_at', requiresAuthUsers: true },

  // ── Kinh doanh (phụ thuộc user) ─────────────────────────────
  { name: 'orders', label: 'Đơn hàng', group: 'commerce', order: 40, conflict: 'id', orderBy: 'created_at', requiresAuthUsers: true },
  { name: 'order_items', label: 'Chi tiết đơn hàng', group: 'commerce', order: 41, conflict: 'id', orderBy: 'id', requiresAuthUsers: true },

  // ── Hoạt động ───────────────────────────────────────────────
  { name: 'exam_attempts', label: 'Lượt làm bài', group: 'activity', order: 50, conflict: 'id', orderBy: 'started_at', requiresAuthUsers: true },
  { name: 'attempt_answers', label: 'Đáp án đã chọn', group: 'activity', order: 51, conflict: 'id', orderBy: 'id', requiresAuthUsers: true },
  { name: 'question_reports', label: 'Báo lỗi câu hỏi', group: 'activity', order: 52, conflict: 'id', orderBy: 'created_at', requiresAuthUsers: true },
  { name: 'news_likes', label: 'Lượt thích tin tức', group: 'activity', order: 53, conflict: 'post_id,user_id', orderBy: 'created_at', requiresAuthUsers: true },
  { name: 'news_comments', label: 'Bình luận tin tức', group: 'activity', order: 54, conflict: 'id', orderBy: 'created_at', requiresAuthUsers: true },
  { name: 'conversations', label: 'Hội thoại hỗ trợ', group: 'activity', order: 55, conflict: 'id', orderBy: 'created_at', requiresAuthUsers: true },
  { name: 'chat_messages', label: 'Tin nhắn hỗ trợ', group: 'activity', order: 56, conflict: 'id', orderBy: 'created_at', requiresAuthUsers: true },
  { name: 'chat_cleanup_logs', label: 'Nhật ký dọn tin nhắn', group: 'activity', order: 57, conflict: 'id', orderBy: 'cleaned_at', requiresAuthUsers: true },

  // ── Hệ thống ────────────────────────────────────────────────
  { name: 'system_settings', label: 'Cấu hình hệ thống', group: 'system', order: 60, conflict: 'key', orderBy: 'key' },
];

export const DEFAULT_TABLES = BACKUP_TABLES.map((t) => t.name);

export interface BackupManifest {
  formatVersion: number;
  app: string;
  createdAt: string;
  sourceOrigin: string;
  includeMedia: boolean;
  tables: { name: string; label: string; rows: number; error?: string }[];
  media: { bucket: string; files: number; bytes: number; public?: boolean }[];
  /** Các file media không tải được khi sao lưu (nếu có) */
  mediaFailed: string[];
  totalRows: number;
  totalMediaFiles: number;
}

export type ProgressFn = (percent: number, message: string) => void;

const PAGE = 1000;

function currentOrigin(): string {
  const url = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
  try {
    return url ? new URL(url).origin : '';
  } catch {
    return '';
  }
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// ─── Đọc toàn bộ dòng của một bảng (phân trang) ───────────────────────────────

export async function fetchAllRows(
  table: BackupTable,
  onPage?: (loaded: number) => void
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  let from = 0;
  for (;;) {
    let q = supabase.from(table.name as never).select('*').range(from, from + PAGE - 1);
    if (table.orderBy) q = q.order(table.orderBy as never, { ascending: true, nullsFirst: true }) as never;
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    const chunk = (data as unknown as Record<string, unknown>[]) ?? [];
    rows.push(...chunk);
    onPage?.(rows.length);
    if (chunk.length < PAGE) break;
    from += PAGE;
  }
  return rows;
}

// ─── Liệt kê toàn bộ file trong một bucket ────────────────────────────────────

interface MediaEntry { bucket: string; path: string; size: number }

async function listBucketFiles(bucket: string): Promise<MediaEntry[]> {
  const out: MediaEntry[] = [];
  const walk = async (prefix: string) => {
    let offset = 0;
    for (;;) {
      const { data, error } = await supabase.storage.from(bucket).list(prefix, {
        limit: 100,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });
      if (error || !data) return;
      for (const item of data) {
        const full = prefix ? `${prefix}/${item.name}` : item.name;
        const meta = item as unknown as { id: string | null; metadata: { size?: number } | null };
        if (meta.id === null) {
          await walk(full); // thư mục
        } else {
          out.push({ bucket, path: full, size: meta.metadata?.size ?? 0 });
        }
      }
      if (data.length < 100) break;
      offset += 100;
    }
  };
  await walk('');
  return out;
}

async function downloadMedia(bucket: string, path: string): Promise<Blob | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (!error && data) return data;
    await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
  }
  return null;
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

export interface ExportOptions {
  tables: string[];
  includeMedia: boolean;
  onProgress?: ProgressFn;
}

export interface SnapshotExportResult {
  fileName: string;
  manifest: BackupManifest;
  sizeBytes: number;
}

export async function exportFullSnapshot(opts: ExportOptions): Promise<SnapshotExportResult> {
  const { tables, includeMedia, onProgress } = opts;
  const zip = new JSZip();
  const selected = BACKUP_TABLES.filter((t) => tables.includes(t.name)).sort((a, b) => a.order - b.order);

  const manifest: BackupManifest = {
    formatVersion: BACKUP_FORMAT_VERSION,
    app: 'TQMaster',
    createdAt: new Date().toISOString(),
    sourceOrigin: currentOrigin(),
    includeMedia,
    tables: [],
    media: [],
    mediaFailed: [],
    totalRows: 0,
    totalMediaFiles: 0,
  };

  const dbShare = includeMedia ? 55 : 95;

  for (let i = 0; i < selected.length; i++) {
    const table = selected[i];
    const base = (i / selected.length) * dbShare;
    onProgress?.(base, `Đang đọc bảng ${table.label}...`);
    try {
      const rows = await fetchAllRows(table, (loaded) =>
        onProgress?.(base, `Đang đọc bảng ${table.label}... (${loaded} dòng)`)
      );
      zip.file(`data/${table.name}.json`, JSON.stringify(rows, null, 0));
      manifest.tables.push({ name: table.name, label: table.label, rows: rows.length });
      manifest.totalRows += rows.length;
    } catch (err) {
      manifest.tables.push({ name: table.name, label: table.label, rows: 0, error: String(err) });
    }
  }

  if (includeMedia) {
    onProgress?.(dbShare, 'Đang liệt kê file media...');
    const { data: buckets } = await supabase.storage.listBuckets();
    const KNOWN_BUCKETS = [
      'thumbnails',
      'theory-files',
      'theory-images',
      'question-images',
      'exam-images',
      'bill-images',
      'qr-codes',
      'announcement-images',
      'avatars',
      'news-images',
      'chat-images',
    ];
    const bucketNames = Array.from(
      new Set([...(buckets ?? []).map((b) => b.name), ...KNOWN_BUCKETS])
    );

    const publicFlags = new Map<string, boolean>(
      (buckets ?? []).map((b) => [b.name, Boolean((b as unknown as { public?: boolean }).public)])
    );

    const all: MediaEntry[] = [];
    for (const b of bucketNames) {
      const files = await listBucketFiles(b);
      all.push(...files);
      if (files.length > 0) {
        manifest.media.push({
          bucket: b,
          files: files.length,
          bytes: files.reduce((s, f) => s + f.size, 0),
          public: publicFlags.get(b) ?? false,
        });
      }
    }
    manifest.totalMediaFiles = all.length;

    // Tải song song (6 file cùng lúc) để nhanh hơn nhiều lần
    const CONCURRENCY = 6;
    let done = 0;
    let cursor = 0;
    const worker = async () => {
      for (;;) {
        const idx = cursor++;
        if (idx >= all.length) return;
        const f = all[idx];
        const blob = await downloadMedia(f.bucket, f.path);
        if (blob) zip.file(`media/${f.bucket}/${f.path}`, blob);
        else manifest.mediaFailed.push(`${f.bucket}/${f.path}`);
        done++;
        const pct = dbShare + (done / Math.max(all.length, 1)) * (95 - dbShare);
        onProgress?.(pct, `Đang tải media ${done}/${all.length}...`);
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, all.length) }, worker));
  }

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('README.txt', buildReadme(manifest));

  onProgress?.(96, 'Đang nén gói sao lưu...');
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
  const fileName = `TQMaster_Snapshot_${timestamp()}.zip`;
  saveAs(blob, fileName);
  onProgress?.(100, 'Hoàn tất!');

  return { fileName, manifest, sizeBytes: blob.size };
}

function buildReadme(m: BackupManifest): string {
  return [
    'TQMaster — Gói sao lưu toàn bộ hệ thống',
    `Tạo lúc: ${new Date(m.createdAt).toLocaleString('vi-VN')}`,
    `Phiên bản định dạng: ${m.formatVersion}`,
    `Nguồn: ${m.sourceOrigin || '(không xác định)'}`,
    '',
    'Cấu trúc:',
    '  manifest.json          — thông tin gói sao lưu',
    '  data/<bảng>.json       — dữ liệu từng bảng (giữ nguyên kiểu dữ liệu)',
    '  media/<bucket>/<file>  — toàn bộ ảnh và tệp đính kèm',
    '',
    `Tổng số dòng: ${m.totalRows}`,
    `Tổng số file media: ${m.totalMediaFiles}`,
    `File media không tải được: ${m.mediaFailed?.length ?? 0}`,
    '',
    'Khôi phục: mở trang Admin → Backup & Restore → Khôi phục toàn bộ, chọn đúng file .zip này.',
    'Khi khôi phục sang hệ thống khác, đường dẫn ảnh sẽ tự động được đổi sang tên miền mới.',
  ].join('\n');
}

// ─── INSPECT ──────────────────────────────────────────────────────────────────

export interface SnapshotInfo {
  manifest: BackupManifest | null;
  dataFiles: string[];
  mediaFiles: number;
  legacy: boolean;
}

export async function inspectSnapshot(file: File): Promise<SnapshotInfo> {
  const zip = await new JSZip().loadAsync(file);
  const manifestFile = zip.file('manifest.json');
  const dataFiles = Object.keys(zip.files)
    .filter((p) => p.startsWith('data/') && p.endsWith('.json'))
    .map((p) => p.slice(5, -5));
  const mediaFiles = Object.keys(zip.files).filter((p) => p.startsWith('media/') && !zip.files[p].dir).length;
  const manifest = manifestFile ? (JSON.parse(await manifestFile.async('string')) as BackupManifest) : null;
  return { manifest, dataFiles, mediaFiles, legacy: !manifest || dataFiles.length === 0 };
}

// ─── RESTORE ──────────────────────────────────────────────────────────────────

export interface RestoreTableReport {
  name: string;
  label: string;
  total: number;
  inserted: number;
  failed: number;
  skipped: boolean;
  errors: { row: number; message: string }[];
}

export interface RestoreReport {
  tables: RestoreTableReport[];
  mediaUploaded: number;
  mediaFailed: number;
  /** Chi tiết lỗi tải lên media (tối đa 20 dòng) */
  mediaErrors: string[];
  /** Kho lưu trữ có trong gói nhưng chưa tồn tại ở hệ thống đích */
  missingBuckets: string[];
  totalInserted: number;
  totalFailed: number;
  dryRun: boolean;
}

export interface RestoreOptions {
  tables: string[];
  includeMedia: boolean;
  dryRun: boolean;
  onProgress?: ProgressFn;
}

const CHUNK = 200;

/** Đổi mọi URL trỏ về origin cũ thành origin mới (dùng khi chuyển hệ thống) */
function rewriteOrigins(value: unknown, from: string, to: string): unknown {
  if (!from || !to || from === to) return value;
  if (typeof value === 'string') return value.split(from).join(to);
  if (Array.isArray(value)) return value.map((v) => rewriteOrigins(v, from, to));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = rewriteOrigins(v, from, to);
    return out;
  }
  return value;
}

export async function restoreSnapshot(file: File, opts: RestoreOptions): Promise<RestoreReport> {
  const { tables, includeMedia, dryRun, onProgress } = opts;
  const zip = await new JSZip().loadAsync(file);
  const manifestFile = zip.file('manifest.json');
  if (!manifestFile) throw new Error('Gói không hợp lệ: thiếu manifest.json. Hãy chọn file sao lưu do phiên bản mới tạo ra.');
  const manifest = JSON.parse(await manifestFile.async('string')) as BackupManifest;

  const report: RestoreReport = {
    tables: [],
    mediaUploaded: 0,
  mediaFailed: 0,
    mediaErrors: [],
    missingBuckets: [],
    totalInserted: 0,
    totalFailed: 0,
    dryRun,
  };

  const target = currentOrigin();
  const source = manifest.sourceOrigin || '';

  // 1) Media trước để URL sẵn sàng
  const mediaPaths = Object.keys(zip.files).filter((p) => p.startsWith('media/') && !zip.files[p].dir);
  const mediaShare = includeMedia && mediaPaths.length > 0 ? 40 : 0;

  if (includeMedia && mediaPaths.length > 0) {
    // Kiểm tra các kho lưu trữ (bucket) còn thiếu ở hệ thống đích
    const { data: existing } = await supabase.storage.listBuckets();
    const existingNames = new Set((existing ?? []).map((b) => b.name));
    const neededBuckets = new Set(mediaPaths.map((p) => p.split('/')[1]));
    for (const b of neededBuckets) if (!existingNames.has(b)) report.missingBuckets.push(b);
  }

  if (includeMedia && mediaPaths.length > 0 && !dryRun) {
    const skip = new Set(report.missingBuckets);
    for (let i = 0; i < mediaPaths.length; i++) {
      const p = mediaPaths[i];
      const parts = p.split('/');
      const bucket = parts[1];
      const path = parts.slice(2).join('/');
      onProgress?.(((i + 1) / mediaPaths.length) * mediaShare, `Đang tải lên media ${i + 1}/${mediaPaths.length}...`);
      if (skip.has(bucket)) {
        report.mediaFailed++;
        continue;
      }
      try {
        const blob = await zip.files[p].async('blob');
        const { error } = await supabase.storage.from(bucket).upload(path, blob, {
          upsert: true,
          contentType: blob.type || guessContentType(path),
        });
        if (error) {
          report.mediaFailed++;
          if (report.mediaErrors.length < 20) report.mediaErrors.push(`${bucket}/${path}: ${error.message}`);
        } else {
          report.mediaUploaded++;
        }
      } catch (err) {
        report.mediaFailed++;
        if (report.mediaErrors.length < 20) report.mediaErrors.push(`${bucket}/${path}: ${String(err)}`);
      }
    }
  }

  // 2) Dữ liệu theo đúng thứ tự khoá ngoại
  const selected = BACKUP_TABLES.filter((t) => tables.includes(t.name)).sort((a, b) => a.order - b.order);

  for (let ti = 0; ti < selected.length; ti++) {
    const table = selected[ti];
    const entry = zip.file(`data/${table.name}.json`);
    const rep: RestoreTableReport = {
      name: table.name,
      label: table.label,
      total: 0,
      inserted: 0,
      failed: 0,
      skipped: !entry,
      errors: [],
    };
    if (!entry) {
      report.tables.push(rep);
      continue;
    }

    const raw = JSON.parse(await entry.async('string')) as Record<string, unknown>[];
    const rows = (rewriteOrigins(raw, source, target) as Record<string, unknown>[]) ?? [];
    rep.total = rows.length;

    if (dryRun) {
      report.tables.push(rep);
      onProgress?.(mediaShare + ((ti + 1) / selected.length) * (100 - mediaShare), `Kiểm tra ${table.label}...`);
      continue;
    }

    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const { error } = await supabase
        .from(table.name as never)
        .upsert(chunk as never[], { onConflict: table.conflict, ignoreDuplicates: false });

      if (error) {
        // Thử lại từng dòng để xác định chính xác dòng lỗi
        for (let r = 0; r < chunk.length; r++) {
          const { error: rowErr } = await supabase
            .from(table.name as never)
            .upsert([chunk[r]] as never[], { onConflict: table.conflict, ignoreDuplicates: false });
          if (rowErr) {
            rep.failed++;
            if (rep.errors.length < 20) rep.errors.push({ row: i + r + 1, message: rowErr.message });
          } else {
            rep.inserted++;
          }
        }
      } else {
        rep.inserted += chunk.length;
      }

      const inner = (i + chunk.length) / Math.max(rows.length, 1);
      const pct = mediaShare + ((ti + inner) / selected.length) * (100 - mediaShare);
      onProgress?.(Math.min(pct, 99), `Đang khôi phục ${table.label} (${i + chunk.length}/${rows.length})...`);
    }

    report.totalInserted += rep.inserted;
    report.totalFailed += rep.failed;
    report.tables.push(rep);
  }

  onProgress?.(100, dryRun ? 'Kiểm tra hoàn tất!' : 'Khôi phục hoàn tất!');
  return report;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
