// Khôi phục gói sao lưu (.zip) CHẠY NỀN trên máy chủ.
// Người dùng tải gói lên kho lưu trữ rồi tạo một "job"; hàm này tự xử lý tiếp,
// tự gọi lại chính nó khi sắp hết thời gian, nên đóng trình duyệt vẫn chạy tiếp.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import JSZip from 'npm:jszip@3.10.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

/** Thứ tự khôi phục tôn trọng khoá ngoại + khoá xung đột để upsert */
const TABLES: { name: string; label: string; conflict: string }[] = [
  { name: 'subjects', label: 'Môn học', conflict: 'id' },
  { name: 'exams', label: 'Đề thi', conflict: 'id' },
  { name: 'exam_subjects', label: 'Đề thi ↔ Môn học', conflict: 'exam_id,subject_id' },
  { name: 'questions', label: 'Câu hỏi', conflict: 'id' },
  { name: 'question_options', label: 'Phương án trả lời', conflict: 'id' },
  { name: 'theories', label: 'Tài liệu / Lý thuyết', conflict: 'id' },
  { name: 'theory_subjects', label: 'Tài liệu ↔ Môn học', conflict: 'theory_id,subject_id' },
  { name: 'news_posts', label: 'Bài viết tin tức', conflict: 'id' },
  { name: 'announcements', label: 'Thông báo', conflict: 'id' },
  { name: 'discount_codes', label: 'Mã giảm giá', conflict: 'id' },
  { name: 'profiles', label: 'Hồ sơ người dùng', conflict: 'id' },
  { name: 'user_roles', label: 'Phân quyền', conflict: 'id' },
  { name: 'user_subjects', label: 'Quyền truy cập môn học', conflict: 'user_id,subject_id' },
  { name: 'orders', label: 'Đơn hàng', conflict: 'id' },
  { name: 'order_items', label: 'Chi tiết đơn hàng', conflict: 'id' },
  { name: 'exam_attempts', label: 'Lượt làm bài', conflict: 'id' },
  { name: 'attempt_answers', label: 'Đáp án đã chọn', conflict: 'id' },
  { name: 'question_reports', label: 'Báo lỗi câu hỏi', conflict: 'id' },
  { name: 'news_likes', label: 'Lượt thích tin tức', conflict: 'post_id,user_id' },
  { name: 'news_comments', label: 'Bình luận tin tức', conflict: 'id' },
  { name: 'conversations', label: 'Hội thoại hỗ trợ', conflict: 'id' },
  { name: 'chat_messages', label: 'Tin nhắn', conflict: 'id' },
  { name: 'chat_cleanup_logs', label: 'Nhật ký dọn tin nhắn', conflict: 'id' },
  { name: 'system_settings', label: 'Cấu hình hệ thống', conflict: 'key' },
  { name: 'active_sessions', label: 'Phiên đăng nhập', conflict: 'user_id' },
];

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
const guessType = (p: string) => MIME[p.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream';

const CHUNK = 200;
const TIME_BUDGET_MS = 180_000;
const MEDIA_CONCURRENCY = 6;

type Cursor = {
  phase: 'media' | 'data' | 'done';
  mediaIndex: number;
  tableIndex: number;
  rowIndex: number;
};

type Report = {
  tables: Record<string, { label: string; total: number; inserted: number; failed: number; errors: string[] }>;
  mediaUploaded: number;
  mediaFailed: number;
  mediaErrors: string[];
  missingBuckets: string[];
};

const emptyReport = (): Report => ({
  tables: {}, mediaUploaded: 0, mediaFailed: 0, mediaErrors: [], missingBuckets: [],
});

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

async function runPool<T>(items: T[], limit: number, task: (item: T) => Promise<void>) {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, Math.max(items.length, 1)) }, async () => {
    for (;;) {
      const index = i++;
      if (index >= items.length) return;
      await task(items[index]);
    }
  });
  await Promise.all(workers);
}

async function update(jobId: string, patch: Record<string, unknown>) {
  await admin.from('restore_jobs').update({ ...patch, heartbeat_at: new Date().toISOString() }).eq('id', jobId);
}

async function selfInvoke(jobId: string) {
  await fetch(`${SUPABASE_URL}/functions/v1/restore-worker`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SERVICE_KEY}` },
    body: JSON.stringify({ jobId, internal: true }),
  }).catch(() => {});
}

async function processJob(jobId: string) {
  const startedAt = Date.now();
  const { data: job } = await admin.from('restore_jobs').select('*').eq('id', jobId).maybeSingle();
  if (!job) return;
  if (job.status === 'cancelled' || job.status === 'done' || job.status === 'failed') return;

  const cursor: Cursor = {
    phase: 'media', mediaIndex: 0, tableIndex: 0, rowIndex: 0,
    ...(job.cursor as Partial<Cursor> ?? {}),
  };
  const report: Report = { ...emptyReport(), ...((job.report as Report | null) ?? {}) };

  try {
    await update(jobId, { status: 'running', started_at: job.started_at ?? new Date().toISOString(), step: 'Đang mở gói sao lưu...' });

    const { data: file, error: dlErr } = await admin.storage.from('backup-uploads').download(job.file_path);
    if (dlErr || !file) throw new Error(`Không tải được gói sao lưu: ${dlErr?.message ?? 'không tìm thấy tệp'}`);

    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) throw new Error('Gói không hợp lệ: thiếu manifest.json');
    const manifest = JSON.parse(await manifestFile.async('string')) as { sourceOrigin?: string };
    const source = manifest.sourceOrigin ?? '';
    const target = new URL(SUPABASE_URL).origin;

    const selectedTables = Array.isArray(job.tables) && job.tables.length > 0
      ? TABLES.filter((t) => (job.tables as string[]).includes(t.name))
      : TABLES;

    const mediaPaths = job.include_media
      ? Object.keys(zip.files).filter((p) => p.startsWith('media/') && !zip.files[p].dir).sort()
      : [];
    const mediaShare = mediaPaths.length > 0 ? 40 : 0;

    const outOfTime = () => Date.now() - startedAt > TIME_BUDGET_MS;
    const save = async (progress: number, step: string) =>
      await update(jobId, { cursor, report, progress: Math.min(99, Math.round(progress)), step });

    // ── Giai đoạn 1: media ──────────────────────────────────────────────
    if (cursor.phase === 'media') {
      if (mediaPaths.length > 0) {
        const { data: buckets } = await admin.storage.listBuckets();
        const existing = new Set((buckets ?? []).map((b) => b.name));
        report.missingBuckets = [...new Set(mediaPaths.map((p) => p.split('/')[1]))].filter((b) => !existing.has(b));
      }

      while (cursor.mediaIndex < mediaPaths.length) {
        if (outOfTime()) {
          await save((cursor.mediaIndex / mediaPaths.length) * mediaShare,
            `Đang tải ảnh/tệp lên · ${cursor.mediaIndex}/${mediaPaths.length}`);
          await selfInvoke(jobId);
          return;
        }
        const batch = mediaPaths.slice(cursor.mediaIndex, cursor.mediaIndex + MEDIA_CONCURRENCY * 3);
        await runPool(batch, MEDIA_CONCURRENCY, async (p) => {
          const parts = p.split('/');
          const bucket = parts[1];
          const path = parts.slice(2).join('/');
          if (report.missingBuckets.includes(bucket) || job.dry_run) {
            if (!job.dry_run) report.mediaFailed++;
            return;
          }
          try {
            const blob = await zip.files[p].async('blob');
            const { error } = await admin.storage.from(bucket).upload(path, blob, {
              upsert: true, contentType: blob.type || guessType(path),
            });
            if (error) {
              report.mediaFailed++;
              if (report.mediaErrors.length < 20) report.mediaErrors.push(`${bucket}/${path}: ${error.message}`);
            } else report.mediaUploaded++;
          } catch (err) {
            report.mediaFailed++;
            if (report.mediaErrors.length < 20) report.mediaErrors.push(`${bucket}/${path}: ${String(err)}`);
          }
        });
        cursor.mediaIndex += batch.length;
        await save((cursor.mediaIndex / Math.max(mediaPaths.length, 1)) * mediaShare,
          `Đang tải ảnh/tệp lên · ${cursor.mediaIndex}/${mediaPaths.length}`);
      }
      cursor.phase = 'data';
      cursor.tableIndex = 0;
      cursor.rowIndex = 0;
    }

    // ── Giai đoạn 2: dữ liệu bảng ───────────────────────────────────────
    while (cursor.tableIndex < selectedTables.length) {
      const table = selectedTables[cursor.tableIndex];
      const entry = zip.file(`data/${table.name}.json`);
      if (!entry) {
        cursor.tableIndex++; cursor.rowIndex = 0;
        continue;
      }
      const raw = JSON.parse(await entry.async('string')) as Record<string, unknown>[];
      const rows = (rewriteOrigins(raw, source, target) as Record<string, unknown>[]) ?? [];
      const rep = report.tables[table.name] ?? { label: table.label, total: rows.length, inserted: 0, failed: 0, errors: [] };
      rep.total = rows.length;
      report.tables[table.name] = rep;

      if (job.dry_run) {
        cursor.tableIndex++; cursor.rowIndex = 0;
        await save(mediaShare + (cursor.tableIndex / selectedTables.length) * (100 - mediaShare),
          `Đang kiểm tra ${table.label}...`);
        continue;
      }

      while (cursor.rowIndex < rows.length) {
        if (outOfTime()) {
          await save(mediaShare + ((cursor.tableIndex + cursor.rowIndex / Math.max(rows.length, 1)) / selectedTables.length) * (100 - mediaShare),
            `Đang nạp ${table.label} · ${cursor.rowIndex}/${rows.length} dòng`);
          await selfInvoke(jobId);
          return;
        }
        const chunk = rows.slice(cursor.rowIndex, cursor.rowIndex + CHUNK);
        const { error } = await admin.from(table.name).upsert(chunk, { onConflict: table.conflict });
        if (error) {
          // Thử lại từng dòng để xác định chính xác dòng lỗi
          for (let r = 0; r < chunk.length; r++) {
            const { error: rowErr } = await admin.from(table.name).upsert([chunk[r]], { onConflict: table.conflict });
            if (rowErr) {
              rep.failed++;
              if (rep.errors.length < 20) rep.errors.push(`Dòng ${cursor.rowIndex + r + 1}: ${rowErr.message}`);
            } else rep.inserted++;
          }
        } else rep.inserted += chunk.length;

        cursor.rowIndex += chunk.length;
        await save(mediaShare + ((cursor.tableIndex + cursor.rowIndex / Math.max(rows.length, 1)) / selectedTables.length) * (100 - mediaShare),
          `Đang nạp ${table.label} · ${cursor.rowIndex}/${rows.length} dòng`);
      }
      cursor.tableIndex++;
      cursor.rowIndex = 0;
    }

    cursor.phase = 'done';
    await update(jobId, {
      cursor, report, progress: 100, status: 'done',
      step: job.dry_run ? 'Kiểm tra thử hoàn tất' : 'Khôi phục hoàn tất',
      finished_at: new Date().toISOString(),
    });
  } catch (err) {
    await update(jobId, {
      status: 'failed', error: String(err instanceof Error ? err.message : err),
      cursor, report, finished_at: new Date().toISOString(),
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const jobId = String(body?.jobId ?? '');
    if (!jobId) {
      return new Response(JSON.stringify({ error: 'Thiếu jobId' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    const internal = token === SERVICE_KEY;

    if (!internal) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } }, auth: { persistSession: false },
      });
      const { data: userData } = await userClient.auth.getUser();
      const user = userData?.user;
      if (!user) {
        return new Response(JSON.stringify({ error: 'Chưa đăng nhập' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Chỉ quản trị viên mới được khôi phục dữ liệu' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Chạy nền: trả lời ngay, công việc tiếp tục sau khi client ngắt kết nối
    // @ts-ignore EdgeRuntime chỉ có trên Supabase Edge Functions
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) {
      // @ts-ignore
      EdgeRuntime.waitUntil(processJob(jobId));
    } else {
      processJob(jobId);
    }

    return new Response(JSON.stringify({ ok: true, jobId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
