// Sao lưu toàn bộ hệ thống (.zip) CHẠY NỀN trên máy chủ Supabase.
// Quản trị viên bấm "Tạo sao lưu", yêu cầu được chuyển cho Edge Function này.
// Nhờ EdgeRuntime.waitUntil, client có thể đóng trình duyệt hoặc tắt máy, máy chủ vẫn tự xử lý tiếp.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import JSZip from 'npm:jszip@3.10.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void } | undefined;

interface BackupTable {
  name: string;
  label: string;
  order: number;
  conflict: string;
  orderBy?: string;
}

const BACKUP_TABLES: BackupTable[] = [
  // ── Nội dung ────────────────────────────────────────────────
  { name: 'subjects', label: 'Môn học', order: 10, conflict: 'id', orderBy: 'created_at' },
  { name: 'exams', label: 'Đề thi', order: 11, conflict: 'id', orderBy: 'created_at' },
  { name: 'exam_subjects', label: 'Đề thi ↔ Môn học', order: 12, conflict: 'exam_id,subject_id', orderBy: 'exam_id' },
  { name: 'questions', label: 'Câu hỏi', order: 13, conflict: 'id', orderBy: 'created_at' },
  { name: 'question_options', label: 'Phương án trả lời', order: 14, conflict: 'id', orderBy: 'id' },
  { name: 'theories', label: 'Tài liệu / Lý thuyết', order: 15, conflict: 'id', orderBy: 'created_at' },
  { name: 'theory_subjects', label: 'Tài liệu ↔ Môn học', order: 16, conflict: 'theory_id,subject_id', orderBy: 'theory_id' },
  { name: 'news_posts', label: 'Bài viết tin tức', order: 17, conflict: 'id', orderBy: 'created_at' },
  { name: 'announcements', label: 'Thông báo', order: 18, conflict: 'id', orderBy: 'created_at' },

  // ── Kinh doanh ──────────────────────────────────────────────
  { name: 'discount_codes', label: 'Mã giảm giá', order: 20, conflict: 'id', orderBy: 'created_at' },

  // ── Người dùng ──────────────────────────────────────────────
  { name: 'profiles', label: 'Hồ sơ người dùng', order: 30, conflict: 'id', orderBy: 'created_at' },
  { name: 'user_roles', label: 'Phân quyền', order: 31, conflict: 'id', orderBy: 'id' },
  { name: 'user_subjects', label: 'Quyền truy cập môn học', order: 32, conflict: 'user_id,subject_id', orderBy: 'granted_at' },

  // ── Kinh doanh (phụ thuộc user) ─────────────────────────────
  { name: 'orders', label: 'Đơn hàng', order: 40, conflict: 'id', orderBy: 'created_at' },
  { name: 'order_items', label: 'Chi tiết đơn hàng', order: 41, conflict: 'id', orderBy: 'id' },

  // ── Hoạt động ───────────────────────────────────────────────
  { name: 'exam_attempts', label: 'Lượt làm bài', order: 50, conflict: 'id', orderBy: 'started_at' },
  { name: 'attempt_answers', label: 'Đáp án đã chọn', order: 51, conflict: 'id', orderBy: 'id' },
  { name: 'question_reports', label: 'Báo lỗi câu hỏi', order: 52, conflict: 'id', orderBy: 'created_at' },
  { name: 'news_likes', label: 'Lượt thích tin tức', order: 53, conflict: 'post_id,user_id', orderBy: 'created_at' },
  { name: 'news_comments', label: 'Bình luận tin tức', order: 54, conflict: 'id', orderBy: 'created_at' },
  { name: 'conversations', label: 'Hội thoại hỗ trợ', order: 55, conflict: 'id', orderBy: 'created_at' },
  { name: 'chat_messages', label: 'Tin nhắn hỗ trợ', order: 56, conflict: 'id', orderBy: 'created_at' },
  { name: 'chat_cleanup_logs', label: 'Nhật ký dọn tin nhắn', order: 57, conflict: 'id', orderBy: 'cleaned_at' },

  // ── Hệ thống ────────────────────────────────────────────────
  { name: 'system_settings', label: 'Cấu hình hệ thống', order: 60, conflict: 'key', orderBy: 'key' },
];

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

const MAX_TOTAL_MEDIA_BYTES = 120 * 1024 * 1024; // 120MB an toàn RAM cho Edge Function
const MAX_BACKUP_RETENTION = 3; // Giữ tối đa 3 bản mới nhất trên Storage để không tốn dung lượng cloud

async function updateJob(jobId: string, patch: Record<string, unknown>) {
  await admin.from('backup_jobs').update({ ...patch, heartbeat_at: new Date().toISOString() }).eq('id', jobId);
}

async function fetchTableRows(table: BackupTable): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];
  const key = table.conflict && !table.conflict.includes(',') ? table.conflict.trim() : null;

  if (key) {
    let lastKey: string | number | null = null;
    const pageSize = 1000;
    for (;;) {
      let q = admin.from(table.name as never).select('*').order(key as never, { ascending: true }).limit(pageSize);
      if (lastKey !== null) q = q.gt(key as never, lastKey as never) as never;

      const { data, error } = await q;
      if (error) throw new Error(`Lỗi đọc bảng ${table.name}: ${error.message}`);
      const chunk = (data as unknown as Record<string, unknown>[]) ?? [];
      rows.push(...chunk);
      if (chunk.length < pageSize) break;
      const last = chunk[chunk.length - 1][key];
      if (last === null || last === undefined) break;
      lastKey = last as string | number;
    }
  } else {
    let from = 0;
    const pageSize = 1000;
    for (;;) {
      let q = admin.from(table.name as never).select('*').range(from, from + pageSize - 1);
      if (table.orderBy) q = q.order(table.orderBy as never, { ascending: true, nullsFirst: true }) as never;
      const { data, error } = await q;
      if (error) throw new Error(`Lỗi đọc bảng ${table.name}: ${error.message}`);
      const chunk = (data as unknown as Record<string, unknown>[]) ?? [];
      rows.push(...chunk);
      if (chunk.length < pageSize) break;
      from += pageSize;
    }
  }

  return rows;
}

async function listFiles(bucket: string): Promise<{ bucket: string; path: string; size: number }[]> {
  const out: { bucket: string; path: string; size: number }[] = [];
  const walk = async (prefix: string) => {
    let offset = 0;
    for (;;) {
      const { data, error } = await admin.storage.from(bucket).list(prefix, {
        limit: 100,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });
      if (error || !data) return;
      for (const item of data) {
        const full = prefix ? `${prefix}/${item.name}` : item.name;
        const meta = item as unknown as { id: string | null; metadata: { size?: number } | null };
        if (meta.id === null) {
          await walk(full);
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

// Tự động dọn dẹp các bản sao lưu cũ trên Storage để tránh đầy bộ nhớ
async function pruneOldBackups() {
  try {
    const { data: jobs } = await admin
      .from('backup_jobs')
      .select('id, file_path, status, created_at')
      .eq('status', 'done')
      .not('file_path', 'is', null)
      .order('created_at', { ascending: false });

    if (jobs && jobs.length > MAX_BACKUP_RETENTION) {
      const toDelete = jobs.slice(MAX_BACKUP_RETENTION);
      for (const oldJob of toDelete) {
        if (oldJob.file_path) {
          await admin.storage.from('backup-uploads').remove([oldJob.file_path]);
          await admin.from('backup_jobs').update({
            step: 'Đã tự động xóa file trên đám mây để tiết kiệm dung lượng',
            file_path: null,
          }).eq('id', oldJob.id);
        }
      }
    }
  } catch (err) {
    console.error('Lỗi khi dọn dẹp sao lưu cũ:', err);
  }
}

async function processJob(jobId: string) {
  const { data: job } = await admin.from('backup_jobs').select('*').eq('id', jobId).maybeSingle();
  if (!job || job.status === 'done' || job.status === 'cancelled') return;

  try {
    await updateJob(jobId, {
      status: 'running',
      started_at: new Date().toISOString(),
      step: 'Bắt đầu quá trình sao lưu trên máy chủ...',
      progress: 5,
    });

    const zip = new JSZip();
    const tableNames: string[] = Array.isArray(job.tables) && job.tables.length > 0
      ? (job.tables as string[])
      : BACKUP_TABLES.map((t) => t.name);

    const selectedTables = BACKUP_TABLES.filter((t) => tableNames.includes(t.name)).sort((a, b) => a.order - b.order);

    const manifest: Record<string, unknown> = {
      formatVersion: 2,
      app: 'TQMaster',
      createdAt: new Date().toISOString(),
      sourceOrigin: new URL(SUPABASE_URL).origin,
      includeMedia: Boolean(job.include_media),
      tables: [] as { name: string; label: string; rows: number; error?: string }[],
      media: [] as { bucket: string; files: number; bytes: number }[],
      mediaFailed: [] as string[],
      totalRows: 0,
      totalMediaFiles: 0,
    };

    let totalRows = 0;
    const dbTargetShare = job.include_media ? 50 : 85;

    // Đọc từng bảng dữ liệu
    for (let i = 0; i < selectedTables.length; i++) {
      const table = selectedTables[i];
      const pct = Math.round(5 + ((i + 1) / selectedTables.length) * (dbTargetShare - 5));
      await updateJob(jobId, {
        step: `Đang đọc dữ liệu bảng: ${table.label} (${i + 1}/${selectedTables.length})...`,
        progress: pct,
      });

      try {
        const rows = await fetchTableRows(table);
        zip.file(`data/${table.name}.json`, JSON.stringify(rows, null, 0));
        (manifest.tables as { name: string; label: string; rows: number; error?: string }[]).push({
          name: table.name,
          label: table.label,
          rows: rows.length,
        });
        totalRows += rows.length;
      } catch (err) {
        (manifest.tables as { name: string; label: string; rows: number; error?: string }[]).push({
          name: table.name,
          label: table.label,
          rows: 0,
          error: String(err),
        });
      }
    }
    manifest.totalRows = totalRows;

    // Nếu chọn sao lưu Media
    if (job.include_media) {
      await updateJob(jobId, { step: 'Đang quét danh sách file trong kho lưu trữ...', progress: 52 });
      const { data: bucketList } = await admin.storage.listBuckets();
      const allBucketNames = Array.from(new Set([...(bucketList ?? []).map((b) => b.name), ...KNOWN_BUCKETS]));

      const allMediaFiles: { bucket: string; path: string; size: number }[] = [];
      for (const b of allBucketNames) {
        const files = await listFiles(b);
        if (files.length > 0) {
          allMediaFiles.push(...files);
          (manifest.media as { bucket: string; files: number; bytes: number }[]).push({
            bucket: b,
            files: files.length,
            bytes: files.reduce((s, f) => s + f.size, 0),
          });
        }
      }

      manifest.totalMediaFiles = allMediaFiles.length;
      let downloadedBytes = 0;
      const mediaFailed: string[] = [];

      for (let i = 0; i < allMediaFiles.length; i++) {
        const file = allMediaFiles[i];
        if (downloadedBytes + file.size > MAX_TOTAL_MEDIA_BYTES) {
          mediaFailed.push(`${file.bucket}/${file.path} (Bỏ qua: vượt quá giới hạn an toàn RAM ${MAX_TOTAL_MEDIA_BYTES / 1024 / 1024}MB)`);
          continue;
        }

        const pct = Math.round(52 + ((i + 1) / Math.max(allMediaFiles.length, 1)) * 33);
        if (i % 5 === 0 || i === allMediaFiles.length - 1) {
          await updateJob(jobId, {
            step: `Đang tải tệp media (${i + 1}/${allMediaFiles.length})...`,
            progress: pct,
          });
        }

        try {
          const { data: fileData, error: dlErr } = await admin.storage.from(file.bucket).download(file.path);
          if (dlErr || !fileData) {
            mediaFailed.push(`${file.bucket}/${file.path}`);
          } else {
            const buf = await fileData.arrayBuffer();
            zip.file(`media/${file.bucket}/${file.path}`, buf);
            downloadedBytes += buf.byteLength;
          }
        } catch {
          mediaFailed.push(`${file.bucket}/${file.path}`);
        }
      }
      manifest.mediaFailed = mediaFailed;
    }

    // Thêm manifest và readme
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    zip.file('README.txt', [
      'TQMaster — Gói sao lưu tự động tạo trên máy chủ',
      `Thời gian: ${new Date().toLocaleString('vi-VN')}`,
      `Nguồn: ${SUPABASE_URL}`,
      `Tổng số dòng: ${manifest.totalRows}`,
      `Tổng số file media: ${manifest.totalMediaFiles}`,
      'Khôi phục: Mở mục Admin → Backup & Restore → Khôi phục toàn bộ, chọn đúng file .zip này.',
    ].join('\n'));

    await updateJob(jobId, { step: 'Đang nén dữ liệu thành tệp .zip...', progress: 90 });

    const zipBuffer = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    const fileName = `TQMaster_ServerBackup_${timestamp}.zip`;
    const filePath = `archives/${jobId}/${fileName}`;

    await updateJob(jobId, { step: 'Đang lưu trữ gói sao lưu lên đám mây...', progress: 95 });

    const { error: uploadError } = await admin.storage
      .from('backup-uploads')
      .upload(filePath, zipBuffer, {
        contentType: 'application/zip',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Không thể lưu file vào Storage: ${uploadError.message}`);
    }

    // Dọn dẹp bản sao lưu cũ
    await pruneOldBackups();

    await updateJob(jobId, {
      status: 'done',
      file_path: filePath,
      file_name: fileName,
      file_size: zipBuffer.byteLength,
      progress: 100,
      step: 'Hoàn tất! Đã tạo và lưu trữ gói sao lưu an toàn.',
      manifest,
      finished_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Lỗi sao lưu trên máy chủ:', err);
    await updateJob(jobId, {
      status: 'failed',
      error: String(err instanceof Error ? err.message : err),
      step: 'Thất bại khi thực hiện sao lưu.',
      finished_at: new Date().toISOString(),
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
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    const internal = token === SERVICE_KEY;

    if (!internal) {
      const userClient = createClient(SUPABASE_URL, ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      });
      const { data: userData } = await userClient.auth.getUser();
      const user = userData?.user;
      if (!user) {
        return new Response(JSON.stringify({ error: 'Chưa đăng nhập' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: isAdmin } = await admin.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: 'Chỉ quản trị viên mới được tạo sao lưu máy chủ' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Chạy nền: Phản hồi HTTP 200 ngay lập tức, tiến trình nén tiếp tục chạy độc lập trên server
    if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) {
      EdgeRuntime.waitUntil(processJob(jobId));
    } else {
      processJob(jobId);
    }

    return new Response(JSON.stringify({ ok: true, jobId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
