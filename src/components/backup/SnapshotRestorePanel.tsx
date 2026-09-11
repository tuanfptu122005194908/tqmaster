import React, { useRef, useState } from 'react';
import { Upload, Loader2, DatabaseBackup, FileArchive, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import {
  BACKUP_TABLES,
  inspectSnapshot,
  restoreSnapshot,
  SnapshotInfo,
  RestoreReport,
  formatBytes,
} from '@/lib/backupCore';
import { useToast } from '@/hooks/use-toast';

export default function SnapshotRestorePanel() {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [info, setInfo] = useState<SnapshotInfo | null>(null);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState('');
  const [report, setReport] = useState<RestoreReport | null>(null);

  const pickFile = async (f: File | null) => {
    setReport(null);
    setInfo(null);
    setConfirmText('');
    if (!f) return;
    setFile(f);
    try {
      const i = await inspectSnapshot(f);
      setInfo(i);
      if (i.legacy) {
        toast({
          title: 'Gói sao lưu cũ',
          description: 'File này không phải gói snapshot mới. Hãy tạo lại bằng nút "Tạo gói sao lưu".',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({ title: 'Không đọc được file', description: String(err), variant: 'destructive' });
    }
  };

  const run = async (dryRun: boolean) => {
    if (!file || !info || info.legacy) return;
    if (!dryRun && confirmText.trim().toUpperCase() !== 'KHOI PHUC') {
      toast({ title: 'Cần xác nhận', description: 'Hãy gõ chính xác: KHOI PHUC', variant: 'destructive' });
      return;
    }
    setBusy(true);
    setReport(null);
    setPct(0);
    try {
      const rep = await restoreSnapshot(file, {
        tables: info.dataFiles,
        includeMedia,
        dryRun,
        onProgress: (p, m) => { setPct(p); setMsg(m); },
      });
      setReport(rep);
      toast({
        title: dryRun ? '🔍 Kiểm tra xong' : '✅ Khôi phục xong',
        description: dryRun
          ? `Gói chứa ${rep.tables.reduce((s, t) => s + t.total, 0)} dòng, sẵn sàng khôi phục.`
          : `${rep.totalInserted} dòng đã ghi, ${rep.totalFailed} dòng lỗi, ${rep.mediaUploaded} file media.`,
        variant: !dryRun && rep.totalFailed > 0 ? 'destructive' : undefined,
      });
    } catch (err) {
      toast({ title: 'Lỗi khi khôi phục', description: String(err), variant: 'destructive' });
    } finally {
      setBusy(false);
      setPct(0);
      setMsg('');
    }
  };

  const restorable = !!info && !info.legacy;

  return (
    <div style={card}>
      <div style={{ ...header, background: 'linear-gradient(135deg,#fff7ed 0%,#ffedd5 100%)', borderBottom: '1px solid #fed7aa' }}>
        <div style={{ ...iconBox, background: 'linear-gradient(135deg,#f97316,#c2410c)' }}>
          <DatabaseBackup size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#7c2d12' }}>Khôi phục / Chuyển hệ thống</div>
          <div style={{ fontSize: 12, color: '#c2410c', marginTop: 2 }}>
            Nạp gói .zip vào hệ thống hiện tại — đường dẫn ảnh tự đổi sang tên miền mới
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 22px', flex: 1, overflowY: 'auto' }}>
        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pickFile(e.dataTransfer.files?.[0] ?? null); }}
          style={dropZone(!!file)}
        >
          <FileArchive size={28} color={file ? '#ea580c' : '#94a3b8'} />
          <div style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginTop: 8 }}>
            {file ? file.name : 'Kéo thả hoặc bấm để chọn gói .zip'}
          </div>
          {file && <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{formatBytes(file.size)}</div>}
          <input
            ref={inputRef}
            type="file"
            accept=".zip"
            hidden
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
        </div>

        {info && info.legacy && (
          <div style={warnBox}>
            <AlertTriangle size={15} color="#b45309" />
            <span style={{ fontSize: 12, color: '#92400e' }}>
              Gói này không đúng định dạng snapshot mới (thiếu manifest.json). Hãy tạo bản sao lưu mới ở panel bên trái.
            </span>
          </div>
        )}

        {info && !info.legacy && info.manifest && (
          <div style={infoBox}>
            <div style={{ fontSize: 12, color: '#334155', lineHeight: 1.8 }}>
              <div><b>Tạo lúc:</b> {new Date(info.manifest.createdAt).toLocaleString('vi-VN')}</div>
              <div><b>Nguồn:</b> {info.manifest.sourceOrigin || '—'}</div>
              <div><b>Số bảng:</b> {info.dataFiles.length} · <b>Số dòng:</b> {info.manifest.totalRows} · <b>Media:</b> {info.mediaFiles} file</div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              {info.manifest.tables.map((t) => (
                <span key={t.name} style={chip}>{t.label}: {t.rows}</span>
              ))}
            </div>
          </div>
        )}

        {restorable && (
          <>
            <label style={{ ...mediaToggle, marginTop: 14 }}>
              <input type="checkbox" checked={includeMedia} onChange={(e) => setIncludeMedia(e.target.checked)} style={cb} />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Khôi phục cả ảnh & tệp ({info?.mediaFiles ?? 0} file)</span>
            </label>

            <div style={noteBox}>
              • Dữ liệu trùng khoá chính sẽ được <b>ghi đè</b>, dữ liệu khác giữ nguyên (không xoá gì).<br />
              • Các bảng gắn với tài khoản đăng nhập ({BACKUP_TABLES.filter(t => t.requiresAuthUsers).length} bảng) chỉ khôi phục được khi tài khoản tương ứng đã tồn tại ở hệ thống mới.<br />
              • Nên bấm <b>Kiểm tra trước</b> để xem gói có hợp lệ không rồi mới khôi phục thật.
            </div>

            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Gõ "KHOI PHUC" để mở khoá nút khôi phục'
              style={confirmInput}
            />
          </>
        )}

        {busy && (
          <div style={{ marginTop: 14 }}>
            <div style={progressTrack}><div style={{ ...progressFill, width: `${pct}%` }} /></div>
            <div style={{ fontSize: 12, color: '#9a3412', marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Loader2 size={13} className="animate-spin" /> {msg}
            </div>
          </div>
        )}

        {report && !busy && (
          <div style={{ marginTop: 14, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '9px 13px', background: '#f8fafc', fontSize: 12, fontWeight: 700, color: '#334155' }}>
              {report.dryRun ? 'Kết quả kiểm tra' : 'Kết quả khôi phục'} · {report.totalInserted} thành công · {report.totalFailed} lỗi
              {!report.dryRun && ` · ${report.mediaUploaded} media`}
            </div>
            {report.missingBuckets.length > 0 && (
              <div style={{ padding: '9px 13px', background: '#fff7ed', borderTop: '1px solid #fed7aa', fontSize: 11.5, color: '#b45309' }}>
                ⚠️ Hệ thống đích chưa có kho lưu trữ: <b>{report.missingBuckets.join(', ')}</b>. Hãy tạo trước rồi khôi phục lại phần ảnh/tệp.
              </div>
            )}
            {report.mediaErrors.length > 0 && (
              <div style={{ padding: '9px 13px', background: '#fef2f2', borderTop: '1px solid #fecaca', fontSize: 11, color: '#b91c1c' }}>
                {report.mediaErrors.slice(0, 5).map((e, i) => <div key={i}>{e}</div>)}
              </div>
            )}
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
              {report.tables.map((t) => (
                <div key={t.name} style={{ padding: '8px 13px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    {t.skipped ? <XCircle size={13} color="#94a3b8" />
                      : t.failed > 0 ? <AlertTriangle size={13} color="#dc2626" />
                      : <CheckCircle2 size={13} color="#16a34a" />}
                    <b style={{ color: '#1e293b' }}>{t.label}</b>
                    <span style={{ color: '#64748b', marginLeft: 'auto' }}>
                      {t.skipped ? 'Không có trong gói' : report.dryRun ? `${t.total} dòng` : `${t.inserted}/${t.total} dòng`}
                    </span>
                  </div>
                  {t.errors.slice(0, 3).map((e, i) => (
                    <div key={i} style={{ fontSize: 11, color: '#dc2626', marginLeft: 21, marginTop: 3 }}>
                      Dòng {e.row}: {e.message}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={footer}>
        <button onClick={() => run(true)} disabled={!restorable || busy} style={outlineBtn(!restorable || busy)}>
          🔍 Kiểm tra trước (không ghi dữ liệu)
        </button>
        <button
          onClick={() => run(false)}
          disabled={!restorable || busy || confirmText.trim().toUpperCase() !== 'KHOI PHUC'}
          style={dangerBtn(!restorable || busy || confirmText.trim().toUpperCase() !== 'KHOI PHUC')}
        >
          {busy ? <><Loader2 size={15} className="animate-spin" /> Đang khôi phục...</> : <><Upload size={15} /> Khôi phục vào hệ thống này</>}
        </button>
      </div>
    </div>
  );
}

// ─── styles ───────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20,
  overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%',
};
const header: React.CSSProperties = { padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 12 };
const iconBox: React.CSSProperties = {
  width: 42, height: 42, borderRadius: 12, display: 'flex',
  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
};
const cb: React.CSSProperties = { width: 15, height: 15, accentColor: '#ea580c', cursor: 'pointer' };
const dropZone = (has: boolean): React.CSSProperties => ({
  border: `2px dashed ${has ? '#fdba74' : '#cbd5e1'}`,
  background: has ? '#fff7ed' : '#f8fafc',
  borderRadius: 14, padding: '24px 16px', textAlign: 'center', cursor: 'pointer',
});
const warnBox: React.CSSProperties = {
  marginTop: 12, padding: 11, background: '#fffbeb', border: '1px solid #fde68a',
  borderRadius: 10, display: 'flex', gap: 8, alignItems: 'flex-start',
};
const infoBox: React.CSSProperties = {
  marginTop: 12, padding: 12, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
};
const chip: React.CSSProperties = {
  fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600,
  background: '#e0e7ff', color: '#3730a3',
};
const mediaToggle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px',
  border: '1px solid #fed7aa', background: '#fffaf5', borderRadius: 12, cursor: 'pointer',
};
const noteBox: React.CSSProperties = {
  marginTop: 12, padding: 12, background: '#fff7ed', border: '1px solid #fed7aa',
  borderRadius: 12, fontSize: 11.5, color: '#9a3412', lineHeight: 1.8,
};
const confirmInput: React.CSSProperties = {
  marginTop: 12, width: '100%', padding: '10px 12px', borderRadius: 10,
  border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none',
};
const progressTrack: React.CSSProperties = { height: 8, background: '#e2e8f0', borderRadius: 20, overflow: 'hidden' };
const progressFill: React.CSSProperties = { height: '100%', background: 'linear-gradient(90deg,#f97316,#c2410c)', transition: 'width .2s' };
const footer: React.CSSProperties = {
  padding: '14px 22px', borderTop: '1px solid #f1f5f9', background: '#fafafa',
  display: 'flex', flexDirection: 'column', gap: 9,
};
const outlineBtn = (disabled: boolean): React.CSSProperties => ({
  width: '100%', padding: '10px 0', borderRadius: 12,
  border: `1.5px solid ${disabled ? '#e2e8f0' : '#f97316'}`,
  fontWeight: 700, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
  background: '#fff', color: disabled ? '#94a3b8' : '#c2410c',
});
const dangerBtn = (disabled: boolean): React.CSSProperties => ({
  width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 13,
  cursor: disabled ? 'not-allowed' : 'pointer',
  background: disabled ? '#e2e8f0' : 'linear-gradient(135deg,#f97316,#c2410c)',
  color: disabled ? '#94a3b8' : '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
});
