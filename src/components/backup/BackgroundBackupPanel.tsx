import React, { useCallback, useEffect, useState } from 'react';
import {
  Server,
  CloudDownload,
  Loader2,
  CheckCircle2,
  XCircle,
  Trash2,
  Moon,
  RefreshCw,
  Download,
  Database,
  Image as ImageIcon,
  ShieldAlert,
  Copy,
  Zap,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BACKUP_TABLES, DEFAULT_TABLES, formatBytes, exportFullSnapshot, downloadBlob } from '@/lib/backupCore';
import { useToast } from '@/hooks/use-toast';

const INIT_SQL = `-- Chạy script này trong Supabase Dashboard -> SQL Editor
CREATE TABLE IF NOT EXISTS public.backup_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_path text,
  file_name text,
  file_size bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  include_media boolean NOT NULL DEFAULT false,
  tables jsonb NOT NULL DEFAULT '[]'::jsonb,
  progress numeric NOT NULL DEFAULT 0,
  step text,
  manifest jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  heartbeat_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.backup_jobs TO authenticated;
GRANT ALL ON public.backup_jobs TO service_role;

ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'backup_jobs' AND policyname = 'Admins can view backup jobs'
  ) THEN
    CREATE POLICY "Admins can view backup jobs"
      ON public.backup_jobs FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'backup_jobs' AND policyname = 'Admins can create backup jobs'
  ) THEN
    CREATE POLICY "Admins can create backup jobs"
      ON public.backup_jobs FOR INSERT TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin') AND created_by = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'backup_jobs' AND policyname = 'Admins can update backup jobs'
  ) THEN
    CREATE POLICY "Admins can update backup jobs"
      ON public.backup_jobs FOR UPDATE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'backup_jobs' AND policyname = 'Admins can delete backup jobs'
  ) THEN
    CREATE POLICY "Admins can delete backup jobs"
      ON public.backup_jobs FOR DELETE TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

DROP TRIGGER IF EXISTS trg_backup_jobs_updated_at ON public.backup_jobs;
CREATE TRIGGER trg_backup_jobs_updated_at
  BEFORE UPDATE ON public.backup_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE INDEX IF NOT EXISTS idx_backup_jobs_created_at ON public.backup_jobs (created_at DESC);

-- Khởi tạo bucket backup-uploads nếu chưa có
INSERT INTO storage.buckets (id, name, public)
VALUES ('backup-uploads', 'backup-uploads', false)
ON CONFLICT (id) DO NOTHING;`;

interface BackupJob {
  id: string;
  file_name: string | null;
  file_path: string | null;
  file_size: number;
  status: string;
  include_media: boolean;
  tables: string[] | null;
  progress: number;
  step: string | null;
  error: string | null;
  created_at: string;
  updated_at?: string | null;
  heartbeat_at?: string | null;
  finished_at: string | null;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: 'Đang chờ', color: '#b45309', bg: '#fef3c7', border: '#fde68a' },
  running: { label: 'Đang chạy', color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe' },
  done: { label: 'Hoàn tất', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' },
  failed: { label: 'Lỗi', color: '#b91c1c', bg: '#fee2e2', border: '#fecaca' },
  cancelled: { label: 'Đã hủy', color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
};

export default function BackgroundBackupPanel() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>(DEFAULT_TABLES);
  const [includeMedia, setIncludeMedia] = useState(false);
  const [starting, setStarting] = useState(false);
  const [jobs, setJobs] = useState<BackupJob[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resumingId, setResumingId] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState(false);

  const isJobStale = (job: BackupJob): boolean => {
    if (job.status !== 'running' && job.status !== 'pending') return false;
    const lastActive = job.heartbeat_at || job.updated_at || job.created_at;
    if (!lastActive) return false;
    // Nếu quá 2.5 phút không có tín hiệu cập nhật thì coi là bị treo/gián đoạn
    return Date.now() - new Date(lastActive).getTime() > 2.5 * 60 * 1000;
  };

  const loadJobs = useCallback(async () => {
    const { data, error } = await supabase
      .from('backup_jobs')
      .select('id, file_name, file_path, file_size, status, include_media, tables, progress, step, error, created_at, updated_at, heartbeat_at, finished_at')
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) {
      if (error.message?.includes('schema cache') || error.code === 'PGRST205') {
        setSchemaError(true);
      }
      return;
    }
    setSchemaError(false);
    setJobs((data ?? []) as unknown as BackupJob[]);
  }, []);

  useEffect(() => {
    loadJobs();
    const timer = setInterval(loadJobs, 4000);
    return () => clearInterval(timer);
  }, [loadJobs]);

  const toggleTable = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const startServerBackup = async () => {
    if (selected.length === 0) {
      toast({ title: 'Chưa chọn bảng dữ liệu nào', variant: 'destructive' });
      return;
    }

    setStarting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) throw new Error('Vui lòng đăng nhập lại.');

      // Đảm bảo bucket backup-uploads đã sẵn sàng
      try {
        await supabase.storage.createBucket('backup-uploads', { public: false });
      } catch {}

      const { data: job, error: jobErr } = await supabase
        .from('backup_jobs')
        .insert({
          created_by: userId,
          include_media: includeMedia,
          tables: selected,
          status: 'running',
          progress: 5,
          step: 'Khởi tạo sao lưu đám mây...',
        })
        .select('id')
        .single();

      if (jobErr || !job) {
        if (jobErr?.message?.includes('schema cache') || jobErr?.code === 'PGRST205') {
          setSchemaError(true);
          throw new Error('Bảng backup_jobs chưa tồn tại trên Supabase. Vui lòng bấm nút "Sao chép mã SQL" phía trên và chạy trong SQL Editor.');
        }
        throw new Error(jobErr?.message ?? 'Không thể tạo yêu cầu sao lưu.');
      }

      await loadJobs();

      // Đóng gói trực tiếp tốc độ cao & tải lên Cloud Storage (Khuyên dùng, không bị giới hạn 150MB RAM của Edge Function)
      toast({
        title: '⚡ Đang đóng gói dữ liệu và lưu lên đám mây...',
        description: 'Động cơ nén tối ưu (STORE media + fast DEFLATE) đang xử lý...',
      });

      let lastDbUpdate = 0;
      const res = await exportFullSnapshot({
        tables: selected,
        includeMedia,
        saveToFile: false,
        onProgress: async (p, m) => {
          const now = Date.now();
          const pct = Math.min(Math.round(p), 94);
          // Giới hạn tần suất gọi Supabase tối đa 1 lần mỗi 1.5 giây để chống nghẽn kết nối PostgREST
          if (now - lastDbUpdate > 1500 || pct >= 94) {
            lastDbUpdate = now;
            try {
              await supabase.from('backup_jobs').update({
                progress: pct,
                step: m,
                heartbeat_at: new Date().toISOString(),
              }).eq('id', job.id);
            } catch {
              // Bỏ qua lỗi cập nhật tiến độ tạm thời
            }
          }
        },
      });

      const filePath = `archives/${job.id}/${res.fileName}`;
      await supabase.from('backup_jobs').update({
        progress: 96,
        step: 'Đang lưu trữ gói sao lưu lên Cloud Storage...',
        heartbeat_at: new Date().toISOString(),
      }).eq('id', job.id);

      const { error: upErr } = await supabase.storage
        .from('backup-uploads')
        .upload(filePath, res.blob, {
          contentType: 'application/zip',
          upsert: true,
        });

      if (upErr) {
        // Nếu lỗi tải lên Storage (ví dụ chưa có bucket), tự động tải ngay file về máy người dùng để không mất dữ liệu
        downloadBlob(res.blob, res.fileName);
        throw new Error(`Kho lưu trữ đám mây báo lỗi: ${upErr.message}. Hệ thống đã tự động kích hoạt tải file .zip về máy của bạn!`);
      }

      await supabase.from('backup_jobs').update({
        status: 'done',
        file_path: filePath,
        file_name: res.fileName,
        file_size: res.sizeBytes,
        progress: 100,
        step: 'Hoàn tất! Đã tạo và lưu trữ an toàn trên đám mây.',
        finished_at: new Date().toISOString(),
        heartbeat_at: new Date().toISOString(),
      }).eq('id', job.id);

      toast({
        title: '✅ Đã lưu trữ gói sao lưu trên đám mây',
        description: `${res.fileName} (${formatBytes(res.sizeBytes)}). Bạn có thể bấm "Tải về (.zip)" bất cứ lúc nào!`,
      });
      await loadJobs();
    } catch (err) {
      const errMsg = String(err instanceof Error ? err.message : err);
      console.error('Lỗi khi sao lưu:', err);
      try {
        if (job?.id) {
          await supabase.from('backup_jobs').update({
            status: 'failed',
            error: errMsg,
            step: 'Thất bại khi thực hiện sao lưu: ' + errMsg,
            finished_at: new Date().toISOString(),
          }).eq('id', job.id);
        }
      } catch {}
      toast({
        title: 'Không thể hoàn tất sao lưu',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setStarting(false);
      await loadJobs();
    }
  };

  const resumeJobWithBrowser = async (job: BackupJob) => {
    setResumingId(job.id);
    try {
      toast({ title: '⚡ Đang tiếp tục đóng gói và lưu tệp lên đám mây...' });
      await supabase.from('backup_jobs').update({
        status: 'running',
        step: 'Đang đọc dữ liệu và nén tệp sao lưu...',
        progress: 10,
        heartbeat_at: new Date().toISOString(),
      }).eq('id', job.id);
      await loadJobs();

      // Đảm bảo bucket backup-uploads sẵn sàng
      try {
        await supabase.storage.createBucket('backup-uploads', { public: false });
      } catch {}

      const tablesToExport = (job.tables && job.tables.length > 0) ? job.tables : DEFAULT_TABLES;
      let lastDbUpdate = 0;
      const res = await exportFullSnapshot({
        tables: tablesToExport,
        includeMedia: job.include_media,
        saveToFile: false,
        onProgress: async (p, m) => {
          const now = Date.now();
          const pct = Math.min(Math.round(p), 94);
          if (now - lastDbUpdate > 1500 || pct >= 94) {
            lastDbUpdate = now;
            try {
              await supabase.from('backup_jobs').update({
                progress: pct,
                step: m,
                heartbeat_at: new Date().toISOString(),
              }).eq('id', job.id);
            } catch {}
          }
        },
      });

      const filePath = `archives/${job.id}/${res.fileName}`;
      await supabase.from('backup_jobs').update({
        progress: 96,
        step: 'Đang lưu trữ gói sao lưu lên Cloud Storage...',
        heartbeat_at: new Date().toISOString(),
      }).eq('id', job.id);

      const { error: upErr } = await supabase.storage
        .from('backup-uploads')
        .upload(filePath, res.blob, {
          contentType: 'application/zip',
          upsert: true,
        });

      if (upErr) {
        downloadBlob(res.blob, res.fileName);
        throw new Error(`Kho lưu trữ đám mây báo lỗi: ${upErr.message}. Đã tự động tải file .zip về máy của bạn!`);
      }

      await supabase.from('backup_jobs').update({
        status: 'done',
        file_path: filePath,
        file_name: res.fileName,
        file_size: res.sizeBytes,
        progress: 100,
        step: 'Hoàn tất! Đã hoàn tất và lưu trữ an toàn trên đám mây.',
        finished_at: new Date().toISOString(),
        heartbeat_at: new Date().toISOString(),
      }).eq('id', job.id);

      toast({
        title: '✅ Đã hoàn tất sao lưu thành công',
        description: `${res.fileName} (${formatBytes(res.sizeBytes)})`,
      });
      await loadJobs();
    } catch (err) {
      const errMsg = String(err instanceof Error ? err.message : err);
      console.error('Lỗi hoàn tất:', err);
      try {
        await supabase.from('backup_jobs').update({
          status: 'failed',
          error: errMsg,
          step: 'Thất bại khi thực hiện: ' + errMsg,
          finished_at: new Date().toISOString(),
        }).eq('id', job.id);
      } catch {}
      toast({
        title: 'Lỗi khi hoàn tất sao lưu',
        description: errMsg,
        variant: 'destructive',
      });
    } finally {
      setResumingId(null);
      await loadJobs();
    }
  };

  const markJobFailed = async (job: BackupJob) => {
    try {
      await supabase.from('backup_jobs').update({
        status: 'failed',
        error: 'Tiến trình bị gián đoạn (do vượt quá giới hạn CPU/RAM Edge Function máy chủ).',
        step: 'Đã dừng do gián đoạn.',
        finished_at: new Date().toISOString(),
      }).eq('id', job.id);
      toast({ title: 'Đã đánh dấu thất bại' });
      await loadJobs();
    } catch (err) {
      toast({ title: 'Lỗi', description: String(err), variant: 'destructive' });
    }
  };

  const handleDownload = async (job: BackupJob) => {
    if (!job.file_path) {
      toast({ title: 'File sao lưu không còn tồn tại trên server', variant: 'destructive' });
      return;
    }
    setDownloadingId(job.id);
    try {
      const { data, error } = await supabase.storage
        .from('backup-uploads')
        .download(job.file_path);

      if (error || !data) {
        throw new Error(error?.message ?? 'Không tải được tệp từ Storage.');
      }

      const fileName = job.file_name || `TQMaster_ServerBackup_${job.id.slice(0, 8)}.zip`;
      downloadBlob(data, fileName);
      toast({ title: '✅ Đang tải gói sao lưu về máy...' });
    } catch (err) {
      toast({
        title: 'Lỗi tải file',
        description: String(err instanceof Error ? err.message : err),
        variant: 'destructive',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (job: BackupJob) => {
    if (!confirm('Bạn có chắc muốn xóa bản sao lưu này khỏi đám mây?')) return;
    setDeletingId(job.id);
    try {
      if (job.file_path) {
        await supabase.storage.from('backup-uploads').remove([job.file_path]);
      }
      await supabase.from('backup_jobs').delete().eq('id', job.id);
      toast({ title: 'Đã xóa bản sao lưu khỏi máy chủ' });
      await loadJobs();
    } catch (err) {
      toast({
        title: 'Lỗi khi xóa',
        description: String(err instanceof Error ? err.message : err),
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 22,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '18px 22px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          borderBottom: '1px solid #bbf7d0',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 14px rgba(16, 185, 129, 0.3)',
            flexShrink: 0,
          }}
        >
          <Server size={22} color="#ffffff" />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 900, color: '#064e3b', letterSpacing: '-0.02em' }}>
            Sao lưu chạy nền trên máy chủ
          </div>
          <div style={{ fontSize: 12, color: '#059669', marginTop: 2, fontWeight: 500 }}>
            Tạo gói .zip trực tiếp trên Supabase Cloud — <b>Tắt máy thoải mái</b>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Tắt máy banner */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 14,
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Moon size={17} color="#2563eb" />
          </div>
          <div style={{ fontSize: 12, color: '#1e40af', lineHeight: 1.6 }}>
            <b>Tắt máy & đóng tab thoải mái:</b> Sau khi bấm nút, máy chủ Supabase sẽ tự động gom dữ liệu, nén zip và lưu trữ. Khi nào mở lại máy, bạn chỉ việc bấm <b>Tải về</b>.
          </div>
        </div>

        {/* Cảnh báo khi chưa chạy migration trên Supabase */}
        {schemaError && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 14,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <ShieldAlert size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, color: '#991b1b', lineHeight: 1.6 }}>
                <b>Cần chạy SQL khởi tạo trên Supabase:</b> Bảng <code>backup_jobs</code> chưa được tạo trên cơ sở dữ liệu Supabase của bạn. Bấm nút dưới đây để sao chép script, sau đó dán vào <b>Supabase Dashboard → SQL Editor</b> và bấm <b>Run</b>.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(INIT_SQL);
                toast({
                  title: '📋 Đã sao chép mã SQL!',
                  description: 'Hãy mở Supabase Dashboard → SQL Editor, dán vào và bấm Run (Ctrl + Enter).',
                });
              }}
              style={{
                alignSelf: 'flex-start',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 10,
                background: '#dc2626',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)',
              }}
            >
              <Copy size={13} />
              Sao chép mã SQL khởi tạo
            </button>
          </div>
        )}

        {/* Media Option */}
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 14,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={includeMedia}
              onChange={(e) => setIncludeMedia(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#2563eb', cursor: 'pointer' }}
            />
            <ImageIcon size={16} color="#475569" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
              Bao gồm ảnh & tệp trong Storage
            </span>
          </label>
          <div style={{ fontSize: 11, color: '#64748b', paddingLeft: 26, lineHeight: 1.5 }}>
            {includeMedia
              ? '⚠️ Gói sẽ nặng hơn và mất nhiều thời gian nén hơn. Giới hạn an toàn RAM là 120MB media.'
              : '⚡ Khuyên dùng: Chỉ sao lưu toàn bộ dữ liệu cơ sở dữ liệu (Database). Cực nhanh, file chỉ vài MB và tiết kiệm dung lượng cloud.'}
          </div>
        </div>

        {/* Table Selector Summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#334155' }}>
            <Database size={15} color="#3b82f6" />
            <span>Bảng dữ liệu ({selected.length}/{BACKUP_TABLES.length})</span>
          </div>
          <button
            type="button"
            onClick={() => setSelected(selected.length === BACKUP_TABLES.length ? [] : DEFAULT_TABLES)}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 12,
              fontWeight: 700,
              color: '#2563eb',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: 8,
            }}
          >
            {selected.length === BACKUP_TABLES.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
        </div>

        {/* Table Checkboxes Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 6,
            maxHeight: 120,
            overflowY: 'auto',
            padding: '8px',
            background: '#f8fafc',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
          }}
        >
          {BACKUP_TABLES.map((t) => (
            <label
              key={t.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
                color: selected.includes(t.name) ? '#1e293b' : '#94a3b8',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type="checkbox"
                checked={selected.includes(t.name)}
                onChange={() => toggleTable(t.name)}
                style={{ accentColor: '#2563eb', cursor: 'pointer' }}
              />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t.label}
              </span>
            </label>
          ))}
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={startServerBackup}
          disabled={starting || selected.length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '13px 20px',
            borderRadius: 14,
            background: starting
              ? '#94a3b8'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: 14,
            border: 'none',
            cursor: starting || selected.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: '0 6px 18px rgba(16, 185, 129, 0.35)',
            transition: 'all 0.2s',
          }}
        >
          {starting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Đang đóng gói và lưu trữ lên đám mây...</span>
            </>
          ) : (
            <>
              <CloudDownload size={18} />
              <span>Bắt đầu sao lưu máy chủ & Lưu đám mây</span>
            </>
          )}
        </button>

        {/* Lịch sử sao lưu */}
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>
              Danh sách gói sao lưu trên máy chủ ({jobs.length})
            </div>
            <button
              type="button"
              onClick={loadJobs}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} />
              Làm mới
            </button>
          </div>

          {jobs.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                borderRadius: 14,
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                fontSize: 12,
                color: '#94a3b8',
              }}
            >
              Chưa có bản sao lưu nào được tạo trên máy chủ.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {jobs.map((job) => {
                const stale = isJobStale(job);
                const meta = stale
                  ? { label: 'Gián đoạn', color: '#b45309', bg: '#fef3c7', border: '#fde68a' }
                  : (STATUS_META[job.status] ?? STATUS_META.pending);
                const isRunning = job.status === 'running' || job.status === 'pending';
                const isDone = job.status === 'done';

                return (
                  <div
                    key={job.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: '#ffffff',
                      border: `1px solid ${meta.border}`,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: 20,
                            background: meta.bg,
                            color: meta.color,
                            border: `1px solid ${meta.border}`,
                            flexShrink: 0,
                          }}
                        >
                          {meta.label}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#1e293b',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {job.file_name || `Bản sao lưu #${job.id.slice(0, 8)}`}
                        </span>
                      </div>

                      <div style={{ fontSize: 11, color: '#64748b', flexShrink: 0 }}>
                        {new Date(job.created_at).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </div>
                    </div>

                    {/* Progress or Step */}
                    {isRunning && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#2563eb' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Loader2 size={12} className="animate-spin" />
                            {job.step || 'Đang xử lý...'}
                          </span>
                          <span style={{ fontWeight: 700 }}>{job.progress}%</span>
                        </div>
                        <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${Math.max(job.progress, 5)}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #3b82f6, #10b981)',
                              transition: 'width 0.3s',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Cảnh báo và giải cứu khi tiến trình bị gián đoạn/treo */}
                    {stale && isRunning && (
                      <div style={{ padding: '10px 12px', background: '#fffbeb', border: '1.5px solid #fcd34d', borderRadius: 12, fontSize: 11, color: '#92400e', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800 }}>
                          <ShieldAlert size={15} color="#d97706" />
                          Tiến trình bị gián đoạn (Dừng tại {job.progress}%: {job.step || 'Đang xử lý'})
                        </div>
                        <div style={{ fontSize: 11, color: '#78350f', lineHeight: 1.4 }}>
                          Máy chủ Edge Function đã bị ngắt (vượt quá giới hạn CPU/RAM 150MB). Bạn có thể bấm nút dưới đây để tiếp tục đóng gói và lưu trữ an toàn ngay lập tức.
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => resumeJobWithBrowser(job)}
                            disabled={resumingId === job.id}
                            style={{
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: 8,
                              padding: '6px 12px',
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: resumingId === job.id ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
                            }}
                          >
                            {resumingId === job.id ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                            Đóng gói & Lưu trữ lên Cloud ngay
                          </button>

                          <button
                            type="button"
                            onClick={() => markJobFailed(job)}
                            style={{
                              background: '#f8fafc',
                              color: '#64748b',
                              border: '1px solid #cbd5e1',
                              borderRadius: 8,
                              padding: '5px 10px',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Đánh dấu Thất bại
                          </button>
                        </div>
                      </div>
                    )}

                    {job.error && (
                      <div style={{ fontSize: 11, color: '#dc2626', background: '#fef2f2', padding: '6px 10px', borderRadius: 8 }}>
                        {job.error}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {isDone
                          ? `${job.file_size > 0 ? formatBytes(job.file_size) : 'Đã nén'} · ${job.include_media ? 'Kèm Media' : 'Chỉ Database'}`
                          : (job.include_media ? 'Kèm Media' : 'Chỉ Database')}
                      </div>

                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {isDone && job.file_path && (
                          <button
                            type="button"
                            onClick={() => handleDownload(job)}
                            disabled={downloadingId === job.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 12px',
                              borderRadius: 10,
                              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                              color: '#ffffff',
                              fontSize: 12,
                              fontWeight: 700,
                              border: 'none',
                              cursor: downloadingId === job.id ? 'not-allowed' : 'pointer',
                              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                            }}
                          >
                            {downloadingId === job.id ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Download size={13} />
                            )}
                            Tải về (.zip)
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDelete(job)}
                          disabled={deletingId === job.id}
                          title="Xóa bản ghi này"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 30,
                            height: 30,
                            borderRadius: 10,
                            background: '#f8fafc',
                            color: '#ef4444',
                            border: '1px solid #e2e8f0',
                            cursor: deletingId === job.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {deletingId === job.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 10,
              background: '#f8fafc',
              border: '1px solid #f1f5f9',
              fontSize: 11,
              color: '#64748b',
              lineHeight: 1.5,
              textAlign: 'center',
            }}
          >
            💡 Hệ thống tự động giữ tối đa 3 bản sao lưu mới nhất trên đám mây để không tốn dung lượng của tài khoản Supabase.
          </div>
        </div>
      </div>
    </div>
  );
}
