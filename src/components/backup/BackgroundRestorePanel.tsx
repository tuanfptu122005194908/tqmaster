import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Upload, Loader2, CloudUpload, FileArchive, AlertTriangle,
  CheckCircle2, XCircle, RefreshCw, Moon,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { inspectSnapshot, SnapshotInfo, formatBytes } from '@/lib/backupCore';
import { useToast } from '@/hooks/use-toast';

interface JobReport {
  tables?: Record<string, { label: string; total: number; inserted: number; failed: number; errors: string[] }>;
  mediaUploaded?: number;
  mediaFailed?: number;
  mediaErrors?: string[];
  missingBuckets?: string[];
}

interface Job {
  id: string;
  file_name: string;
  file_size: number;
  status: string;
  dry_run: boolean;
  include_media: boolean;
  progress: number;
  step: string | null;
  report: JobReport | null;
  error: string | null;
  created_at: string;
  finished_at: string | null;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Đang chờ', color: '#b45309', bg: '#fef3c7' },
  running: { label: 'Đang chạy', color: '#1d4ed8', bg: '#dbeafe' },
  done: { label: 'Hoàn tất', color: '#15803d', bg: '#dcfce7' },
  failed: { label: 'Lỗi', color: '#b91c1c', bg: '#fee2e2' },
  cancelled: { label: 'Đã huỷ', color: '#475569', bg: '#e2e8f0' },
};

export default function BackgroundRestorePanel() {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<SnapshotInfo | null>(null);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  const loadJobs = useCallback(async () => {
    const { data } = await supabase
      .from('restore_jobs')
      .select('id,file_name,file_size,status,dry_run,include_media,progress,step,report,error,created_at,finished_at')
      .order('created_at', { ascending: false })
      .limit(8);
    setJobs((data ?? []) as unknown as Job[]);
  }, []);

  useEffect(() => {
    loadJobs();
    const timer = setInterval(loadJobs, 4000);
    return () => clearInterval(timer);
  }, [loadJobs]);

  const pickFile = async (f: File | null) => {
    setInfo(null);
    setConfirmText('');
    setFile(f);
    if (!f) return;
    try {
      const i = await inspectSnapshot(f);
      setInfo(i);
      if (i.legacy) {
        toast({
          title: 'Gói sao lưu không hợp lệ',
          description: 'Hãy chọn gói .zip do chức năng "Tạo gói sao lưu" tạo ra.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({ title: 'Không đọc được file', description: String(err), variant: 'destructive' });
    }
  };

  const start = async (dryRun: boolean) => {
    if (!file || !info || info.legacy) return;
    if (!dryRun && confirmText.trim().toUpperCase() !== 'KHOI PHUC') {
      toast({ title: 'Cần xác nhận', description: 'Hãy gõ chính xác: KHOI PHUC', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) throw new Error('Bạn cần đăng nhập lại.');

      const path = `${userId}/${Date.now()}-${file.name.replace(/[^\w.\-]+/g, '_')}`;
      const { error: upErr } = await supabase.storage
        .from('backup-uploads')
        .upload(path, file, { upsert: true, contentType: 'application/zip' });
      if (upErr) throw new Error(upErr.message);

      const { data: job, error: jobErr } = await supabase
        .from('restore_jobs')
        .insert({
          created_by: userId,
          file_path: path,
          file_name: file.name,
          file_size: file.size,
          dry_run: dryRun,
          include_media: includeMedia,
          tables: info.dataFiles,
          status: 'pending',
        })
        .select('id')
        .single();
      if (jobErr || !job) throw new Error(jobErr?.message ?? 'Không tạo được yêu cầu khôi phục');

      const { error: fnErr } = await supabase.functions.invoke('restore-worker', { body: { jobId: job.id } });
      if (fnErr) throw new Error(fnErr.message);

      toast({
        title: dryRun ? '🔍 Đã bắt đầu kiểm tra thử' : '🚀 Đã bắt đầu khôi phục nền',
        description: 'Bạn có thể đóng trình duyệt. Quay lại trang này bất cứ lúc nào để xem báo cáo.',
      });
      setFile(null);
      setInfo(null);
      setConfirmText('');
      if (inputRef.current) inputRef.current.value = '';
      loadJobs();
    } catch (err) {
      toast({ title: 'Không bắt đầu được', description: String(err), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const resume = async (id: string) => {
    const { error } = await supabase.functions.invoke('restore-worker', { body: { jobId: id } });
    if (error) toast({ title: 'Không tiếp tục được', description: error.message, variant: 'destructive' });
    else toast({ title: 'Đã yêu cầu chạy tiếp' });
    loadJobs();
  };

  const cancel = async (id: string) => {
    await supabase.from('restore_jobs').update({ status: 'cancelled' }).eq('id', id);
    loadJobs();
  };

  const ready = !!info && !info.legacy;

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={iconWrap}><Moon size={17} color="#7c3aed" /></div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Khôi phục chạy nền</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>Tải gói lên một lần — máy chủ tự nạp, tắt máy vẫn chạy tiếp</div>
        </div>
      </div>

      <div style={{
        margin: '12px 0 14px', padding: '11px 13px', borderRadius: 12,
        background: '#f5f3ff', border: '1px solid #ddd6fe', fontSize: 12, color: '#5b21b6', lineHeight: 1.7,
      }}>
        Gói .zip được tải lên kho lưu trữ riêng của hệ thống. Sau đó máy chủ tự nạp dữ liệu và ảnh/tệp theo từng phần,
        tự chạy tiếp cho tới khi xong. Bạn có thể đóng trình duyệt và quay lại xem báo cáo sau.
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        style={{ display: 'none' }}
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />

      <button onClick={() => inputRef.current?.click()} disabled={uploading} style={pickBtn}>
        <Upload size={15} /> {file ? 'Chọn gói khác' : 'Chọn gói .zip'}
      </button>

      {file && (
        <div style={fileBox}>
          <FileArchive size={16} color="#7c3aed" />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>{file.name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              {formatBytes(file.size)}
              {info && !info.legacy && ` · ${info.dataFiles.length} bảng · ${info.mediaFiles} ảnh/tệp`}
            </div>
          </div>
        </div>
      )}

      {ready && (
        <>
          <label style={checkRow}>
            <input type="checkbox" checked={includeMedia} onChange={(e) => setIncludeMedia(e.target.checked)} />
            <span>Khôi phục cả ảnh và tệp đính kèm</span>
          </label>

          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Gõ KHOI PHUC để xác nhận ghi đè dữ liệu"
            style={confirmInput}
          />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <button onClick={() => start(true)} disabled={uploading} style={secondaryBtn}>
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Kiểm tra thử
            </button>
            <button onClick={() => start(false)} disabled={uploading} style={primaryBtn}>
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <CloudUpload size={15} />} Bắt đầu chạy nền
            </button>
          </div>
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 10px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Lần khôi phục gần đây</div>
        <button onClick={loadJobs} style={ghostBtn}><RefreshCw size={13} /> Làm mới</button>
      </div>

      {jobs.length === 0 && (
        <div style={{ fontSize: 12, color: '#94a3b8', padding: '10px 0' }}>Chưa có lần khôi phục nào.</div>
      )}

      <div style={{ display: 'grid', gap: 10 }}>
        {jobs.map((job) => {
          const meta = STATUS_META[job.status] ?? STATUS_META.pending;
          const rep = job.report ?? {};
          const tableList = Object.values(rep.tables ?? {});
          const inserted = tableList.reduce((s, t) => s + (t.inserted ?? 0), 0);
          const failed = tableList.reduce((s, t) => s + (t.failed ?? 0), 0);
          return (
            <div key={job.id} style={jobBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ ...badge, background: meta.bg, color: meta.color }}>{meta.label}</span>
                {job.dry_run && <span style={{ ...badge, background: '#e0e7ff', color: '#4338ca' }}>Kiểm tra thử</span>}
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', wordBreak: 'break-all' }}>{job.file_name}</span>
                <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 'auto' }}>
                  {new Date(job.created_at).toLocaleString('vi-VN')}
                </span>
              </div>

              <div style={{ marginTop: 8, height: 7, borderRadius: 20, background: '#e2e8f0', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, Number(job.progress) || 0)}%`, height: '100%',
                  background: job.status === 'failed'
                    ? 'linear-gradient(90deg,#ef4444,#b91c1c)'
                    : 'linear-gradient(90deg,#8b5cf6,#6d28d9)',
                  transition: 'width .4s ease',
                }} />
              </div>

              <div style={{ fontSize: 11.5, color: '#475569', marginTop: 6 }}>
                {Math.round(Number(job.progress) || 0)}% · {job.step ?? 'Đang chuẩn bị...'}
              </div>

              {(inserted > 0 || failed > 0 || (rep.mediaUploaded ?? 0) > 0) && (
                <div style={{ fontSize: 11.5, color: '#475569', marginTop: 4 }}>
                  {inserted} dòng đã ghi · {failed} dòng lỗi · {rep.mediaUploaded ?? 0} ảnh/tệp
                  {(rep.mediaFailed ?? 0) > 0 && ` · ${rep.mediaFailed} ảnh/tệp lỗi`}
                </div>
              )}

              {!!rep.missingBuckets?.length && (
                <div style={warnRow}>
                  <AlertTriangle size={13} /> Thiếu kho lưu trữ: {rep.missingBuckets.join(', ')}
                </div>
              )}

              {job.error && (
                <div style={{ ...warnRow, background: '#fef2f2', borderColor: '#fecaca', color: '#b91c1c' }}>
                  <XCircle size={13} /> {job.error}
                </div>
              )}

              {(job.status === 'running' || job.status === 'pending' || job.status === 'failed') && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => resume(job.id)} style={ghostBtn}><RefreshCw size={13} /> Chạy tiếp</button>
                  <button onClick={() => cancel(job.id)} style={{ ...ghostBtn, color: '#b91c1c' }}>
                    <XCircle size={13} /> Huỷ
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 20,
  boxShadow: '0 6px 20px rgba(15,23,42,0.05)',
};
const iconWrap: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 11, background: '#f5f3ff', border: '1px solid #ddd6fe',
  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
const pickBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 15px', borderRadius: 12,
  border: '1.5px dashed #c4b5fd', background: '#faf5ff', color: '#6d28d9',
  fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', justifyContent: 'center',
};
const fileBox: React.CSSProperties = {
  display: 'flex', gap: 10, alignItems: 'center', marginTop: 12, padding: '10px 12px',
  borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0',
};
const checkRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, fontSize: 12.5, color: '#334155', cursor: 'pointer',
};
const confirmInput: React.CSSProperties = {
  marginTop: 10, width: '100%', padding: '10px 12px', borderRadius: 11,
  border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
};
const primaryBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12,
  border: 'none', background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', color: '#fff',
  fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 16px rgba(109,40,217,0.28)',
};
const secondaryBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 12,
  border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569',
  fontSize: 13, fontWeight: 700, cursor: 'pointer',
};
const ghostBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 9,
  border: '1px solid #e2e8f0', background: '#fff', color: '#475569',
  fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
};
const jobBox: React.CSSProperties = {
  padding: '12px 14px', borderRadius: 14, background: '#fcfcfd', border: '1px solid #e2e8f0',
};
const badge: React.CSSProperties = {
  fontSize: 10.5, fontWeight: 800, padding: '3px 8px', borderRadius: 20,
};
const warnRow: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '7px 10px',
  borderRadius: 10, background: '#fff7ed', border: '1px solid #fed7aa', color: '#b45309',
  fontSize: 11.5, fontWeight: 600,
};
