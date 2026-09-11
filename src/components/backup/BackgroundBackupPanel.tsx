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
} from 'lucide-react';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';
import { BACKUP_TABLES, DEFAULT_TABLES, formatBytes } from '@/lib/backupCore';
import { useToast } from '@/hooks/use-toast';

interface BackupJob {
  id: string;
  file_name: string | null;
  file_path: string | null;
  file_size: number;
  status: string;
  include_media: boolean;
  progress: number;
  step: string | null;
  error: string | null;
  created_at: string;
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

  const loadJobs = useCallback(async () => {
    const { data } = await supabase
      .from('backup_jobs')
      .select('id, file_name, file_path, file_size, status, include_media, progress, step, error, created_at, finished_at')
      .order('created_at', { ascending: false })
      .limit(6);
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

      const { data: job, error: jobErr } = await supabase
        .from('backup_jobs')
        .insert({
          created_by: userId,
          include_media: includeMedia,
          tables: selected,
          status: 'pending',
          progress: 0,
          step: 'Khởi tạo yêu cầu sao lưu máy chủ...',
        })
        .select('id')
        .single();

      if (jobErr || !job) {
        throw new Error(jobErr?.message ?? 'Không thể tạo yêu cầu sao lưu.');
      }

      const { error: fnErr } = await supabase.functions.invoke('backup-worker', {
        body: { jobId: job.id },
      });

      if (fnErr) {
        throw new Error(fnErr.message);
      }

      toast({
        title: '🚀 Đã bắt đầu sao lưu trên máy chủ',
        description: 'Bạn có thể đóng tab hoặc tắt máy tính ngay bây giờ. Máy chủ Supabase sẽ tự động chạy ngầm và lưu trữ gói sao lưu.',
      });

      await loadJobs();
    } catch (err) {
      toast({
        title: 'Không thể khởi động sao lưu',
        description: String(err instanceof Error ? err.message : err),
        variant: 'destructive',
      });
    } finally {
      setStarting(false);
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
        throw new Error(error?.message ?? 'Không tải được tệp.');
      }

      saveAs(data, job.file_name || `TQMaster_ServerBackup_${job.id.slice(0, 8)}.zip`);
      toast({ title: '✅ Bắt đầu tải file về máy' });
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
              <span>Đang gửi lệnh tới máy chủ...</span>
            </>
          ) : (
            <>
              <CloudDownload size={18} />
              <span>Bắt đầu sao lưu trên máy chủ (Tắt máy thoải mái)</span>
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
                const meta = STATUS_META[job.status] ?? STATUS_META.pending;
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

                    {job.error && (
                      <div style={{ fontSize: 11, color: '#dc2626', background: '#fef2f2', padding: '6px 10px', borderRadius: 8 }}>
                        {job.error}
                      </div>
                    )}

                    {/* Done Actions */}
                    {isDone && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, borderTop: '1px solid #f1f5f9' }}>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {job.file_size > 0 ? formatBytes(job.file_size) : 'Đã nén'} · {job.include_media ? 'Kèm Media' : 'Chỉ Database'}
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          {job.file_path && (
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
                            title="Xóa khỏi đám mây"
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
                    )}
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
