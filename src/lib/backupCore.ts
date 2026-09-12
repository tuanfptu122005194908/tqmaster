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
const TABLE_EXPORT_CONCURRENCY = 4;
const BUCKET_LIST_CONCURRENCY = 4;
const MEDIA_DOWNLOAD_CONCURRENCY = 8;
const MEDIA_UPLOAD_CONCURRENCY = 6;
const TABLE_RESTORE_CONCURRENCY = 3;
const CHUNK_RESTORE_CONCURRENCY = 3;

async function runPool<T>(
  items: T[],
  concurrency: number,
  task: (item: T, index: number) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const worker = async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      await task(items[index], index);
    }
  };
  const workerCount = Math.min(Math.max(concurrency, 1), items.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
}

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

/**
 * Cột khoá dùng cho keyset pagination. Với bảng lớn (hàng trăm nghìn dòng),
 * phân trang bằng OFFSET khiến Postgres phải quét lại toàn bộ các dòng trước đó
 * ở mỗi trang → chậm dần và cuối cùng bị "statement timeout".
 * Keyset (WHERE key > lastKey ORDER BY key LIMIT n) luôn nhanh như trang đầu.
 */
function keysetColumn(table: BackupTable): string | null {
  if (table.conflict && !table.conflict.includes(',')) return table.conflict.trim();
  return null;
}

function isTimeoutError(message: string): boolean {
  const m = message.toLowerCase();
  return m.includes('timeout') || m.includes('57014') || m.includes('canceling statement');
}

export async function fetchAllRows(
  table: BackupTable,
  onPage?: (loaded: number) => void
): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  const key = keysetColumn(table);

  if (key) {
    // ── Keyset pagination (ổn định & nhanh với bảng rất lớn) ──
    let lastKey: string | number | null = null;
    let pageSize = PAGE;
    for (;;) {
      let q = supabase
        .from(table.name as never)
        .select('*')
        .order(key as never, { ascending: true })
        .limit(pageSize);
      if (lastKey !== null) q = q.gt(key as never, lastKey as never) as never;

      const { data, error } = await q;
      if (error) {
        // Trang quá lớn / quá tải → thu nhỏ trang rồi thử lại thay vì bỏ cuộc
        if (pageSize > 100 && isTimeoutError(error.message)) {
          pageSize = Math.max(100, Math.floor(pageSize / 2));
          continue;
        }
        throw new Error(error.message);
      }
      const chunk = (data as unknown as Record<string, unknown>[]) ?? [];
      rows.push(...chunk);
      onPage?.(rows.length);
      if (chunk.length < pageSize) break;
      const last = chunk[chunk.length - 1][key];
      if (last === null || last === undefined) break;
      lastKey = last as string | number;
    }
    return rows;
  }

  // ── Bảng khoá phức hợp (dữ liệu nhỏ) → phân trang theo offset ──
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

async function uploadMedia(bucket: string, path: string, blob: Blob): Promise<string | null> {
  let lastError = 'Không thể tải file lên';
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      upsert: true,
      contentType: blob.type || guessContentType(path),
    });
    if (!error) return null;
    lastError = error.message;
    await new Promise((resolve) => setTimeout(resolve, 350 * (attempt + 1)));
  }
  return lastError;
}

// ─── EXPORT ───────────────────────────────────────────────────────────────────

export interface ExportOptions {
  tables: string[];
  includeMedia: boolean;
  onProgress?: ProgressFn;
  saveToFile?: boolean;
}

export interface SnapshotExportResult {
  fileName: string;
  manifest: BackupManifest;
  sizeBytes: number;
  blob: Blob;
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

  let completedTables = 0;
  const tableResults = new Map<string, BackupManifest['tables'][number]>();
  await runPool(selected, TABLE_EXPORT_CONCURRENCY, async (table) => {
    onProgress?.(
      (completedTables / Math.max(selected.length, 1)) * dbShare,
      `Đang đọc song song ${TABLE_EXPORT_CONCURRENCY} bảng · ${completedTables}/${selected.length} xong...`
    );
    try {
      const rows = await fetchAllRows(table, (loaded) =>
        onProgress?.(
          (completedTables / Math.max(selected.length, 1)) * dbShare,
          `Đang đọc ${table.label} (${loaded} dòng) · ${completedTables}/${selected.length} bảng xong...`
        )
      );
      zip.file(`data/${table.name}.json`, JSON.stringify(rows, null, 0), {
        compression: 'DEFLATE',
        compressionOptions: { level: 1 },
      });
      tableResults.set(table.name, { name: table.name, label: table.label, rows: rows.length });
    } catch (err) {
      tableResults.set(table.name, { name: table.name, label: table.label, rows: 0, error: String(err) });
    } finally {
      completedTables++;
      onProgress?.(
        (completedTables / Math.max(selected.length, 1)) * dbShare,
        `Đã đọc ${completedTables}/${selected.length} bảng...`
      );
    }
  });
  manifest.tables = selected.map((table) => tableResults.get(table.name) ?? {
    name: table.name,
    label: table.label,
    rows: 0,
    error: 'Không nhận được kết quả',
  });
  manifest.totalRows = manifest.tables.reduce((sum, table) => sum + table.rows, 0);

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

    const filesByBucket = new Map<string, MediaEntry[]>();
    let listedBuckets = 0;
    await runPool(bucketNames, BUCKET_LIST_CONCURRENCY, async (b) => {
      const files = await listBucketFiles(b);
      filesByBucket.set(b, files);
      listedBuckets++;
      onProgress?.(dbShare, `Đang liệt kê song song kho lưu trữ ${listedBuckets}/${bucketNames.length}...`);
    });
    const all = bucketNames.flatMap((bucket) => filesByBucket.get(bucket) ?? []);
    manifest.media = bucketNames.flatMap((bucket) => {
      const files = filesByBucket.get(bucket) ?? [];
      return files.length === 0 ? [] : [{
        bucket,
        files: files.length,
        bytes: files.reduce((sum, file) => sum + file.size, 0),
        public: publicFlags.get(bucket) ?? false,
      }];
    });
    manifest.totalMediaFiles = all.length;

    let done = 0;
    await runPool(all, MEDIA_DOWNLOAD_CONCURRENCY, async (file) => {
      const blob = await downloadMedia(file.bucket, file.path);
      if (blob) {
        // Tệp media (ảnh, tài liệu, video) vốn đã nén, dùng STORE để không tốn CPU & RAM
        zip.file(`media/${file.bucket}/${file.path}`, blob, { compression: 'STORE' });
      } else {
        manifest.mediaFailed.push(`${file.bucket}/${file.path}`);
      }
      done++;
      const pct = dbShare + (done / Math.max(all.length, 1)) * (95 - dbShare);
      onProgress?.(pct, `Đang tải song song ${MEDIA_DOWNLOAD_CONCURRENCY} file · ${done}/${all.length}...`);
    });
  }

  zip.file('manifest.json', JSON.stringify(manifest, null, 2), {
    compression: 'DEFLATE',
    compressionOptions: { level: 1 },
  });
  zip.file('README.txt', buildReadme(manifest), {
    compression: 'DEFLATE',
    compressionOptions: { level: 1 },
  });

  onProgress?.(95, 'Đang đóng gói tệp .zip...');
  const blob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'STORE',
    },
    (meta) => {
      onProgress?.(
        95 + Math.round((meta.percent / 100) * 4),
        `Đang hoàn thiện tệp .zip (${Math.round(meta.percent)}%)...`
      );
    }
  );

  const fileName = `TQMaster_Snapshot_${timestamp()}.zip`;
  if (opts.saveToFile !== false) {
    downloadBlob(blob, fileName);
  }
  onProgress?.(100, 'Hoàn tất!');

  return { fileName, manifest, sizeBytes: blob.size, blob };
}

/** Kích hoạt tải file Blob về máy an toàn, chống bị trình duyệt chặn */
export function downloadBlob(blob: Blob, fileName: string): boolean {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch {}
    }, 2500);
    return true;
  } catch {
    try {
      saveAs(blob, fileName);
      return true;
    } catch {
      return false;
    }
  }
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

const MIME: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
  webp: 'image/webp', svg: 'image/svg+xml', pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip', rar: 'application/vnd.rar', txt: 'text/plain',
  mp4: 'video/mp4', mp3: 'audio/mpeg',
};

function guessContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return MIME[ext] ?? 'application/octet-stream';
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

const RESTORE_STAGE: Record<string, number> = {
  subjects: 1,
  exams: 2, theories: 2, news_posts: 2, announcements: 2, discount_codes: 2, profiles: 2, system_settings: 2,
  exam_subjects: 3, questions: 3, theory_subjects: 3, user_roles: 3, user_subjects: 3, orders: 3,
  question_options: 4, order_items: 4, exam_attempts: 4, question_reports: 4,
  news_likes: 4, news_comments: 4, conversations: 4,
  attempt_answers: 5, chat_messages: 5,
  chat_cleanup_logs: 6,
};

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
    let completedMedia = 0;
    await runPool(mediaPaths, MEDIA_UPLOAD_CONCURRENCY, async (p) => {
      const parts = p.split('/');
      const bucket = parts[1];
      const path = parts.slice(2).join('/');
      if (skip.has(bucket)) {
        report.mediaFailed++;
      } else {
        try {
          const blob = await zip.files[p].async('blob');
          const uploadError = await uploadMedia(bucket, path, blob);
          if (uploadError) {
            report.mediaFailed++;
            if (report.mediaErrors.length < 20) report.mediaErrors.push(`${bucket}/${path}: ${uploadError}`);
          } else {
            report.mediaUploaded++;
          }
        } catch (err) {
          report.mediaFailed++;
          if (report.mediaErrors.length < 20) report.mediaErrors.push(`${bucket}/${path}: ${String(err)}`);
        }
      }
      completedMedia++;
      onProgress?.(
        (completedMedia / mediaPaths.length) * mediaShare,
        `Đang tải lên song song ${MEDIA_UPLOAD_CONCURRENCY} file · ${completedMedia}/${mediaPaths.length}...`
      );
    });
  }

  // 2) Dữ liệu theo đúng thứ tự khoá ngoại
  const selected = BACKUP_TABLES.filter((t) => tables.includes(t.name)).sort((a, b) => a.order - b.order);
  let completedRestoreTables = 0;
  const restoreResults = new Map<string, RestoreTableReport>();
  const restoreTable = async (table: BackupTable) => {
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
      restoreResults.set(table.name, rep);
      completedRestoreTables++;
      return;
    }

    const raw = JSON.parse(await entry.async('string')) as Record<string, unknown>[];
    const rows = (rewriteOrigins(raw, source, target) as Record<string, unknown>[]) ?? [];
    rep.total = rows.length;

    if (dryRun) {
      restoreResults.set(table.name, rep);
      completedRestoreTables++;
      onProgress?.(mediaShare + (completedRestoreTables / selected.length) * (100 - mediaShare), `Đã kiểm tra ${completedRestoreTables}/${selected.length} bảng...`);
      return;
    }

    const chunks = Array.from({ length: Math.ceil(rows.length / CHUNK) }, (_, index) => ({
      start: index * CHUNK,
      rows: rows.slice(index * CHUNK, (index + 1) * CHUNK),
    }));
    let completedRows = 0;
    await runPool(chunks, CHUNK_RESTORE_CONCURRENCY, async ({ start, rows: chunk }) => {
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
            if (rep.errors.length < 20) rep.errors.push({ row: start + r + 1, message: rowErr.message });
          } else {
            rep.inserted++;
          }
        }
      } else {
        rep.inserted += chunk.length;
      }
      completedRows += chunk.length;
      const tableFraction = completedRows / Math.max(rows.length, 1);
      const pct = mediaShare + ((completedRestoreTables + tableFraction) / selected.length) * (100 - mediaShare);
      onProgress?.(Math.min(pct, 99), `Đang ghi song song ${table.label} (${completedRows}/${rows.length})...`);
    });

    restoreResults.set(table.name, rep);
    completedRestoreTables++;
  };

  const stages = Array.from(new Set(selected.map((table) => RESTORE_STAGE[table.name] ?? 99))).sort((a, b) => a - b);
  for (const stage of stages) {
    const stageTables = selected.filter((table) => (RESTORE_STAGE[table.name] ?? 99) === stage);
    await runPool(stageTables, TABLE_RESTORE_CONCURRENCY, restoreTable);
  }

  report.tables = selected.map((table) => restoreResults.get(table.name) ?? {
    name: table.name, label: table.label, total: 0, inserted: 0, failed: 0, skipped: true, errors: [],
  });
  report.totalInserted = report.tables.reduce((sum, table) => sum + table.inserted, 0);
  report.totalFailed = report.tables.reduce((sum, table) => sum + table.failed, 0);

  onProgress?.(100, dryRun ? 'Kiểm tra hoàn tất!' : 'Khôi phục hoàn tất!');
  return report;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
