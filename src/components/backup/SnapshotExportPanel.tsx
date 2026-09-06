import React, { useMemo, useState } from 'react';
import { Download, Loader2, CheckCircle2, HardDriveDownload, Image as ImageIcon } from 'lucide-react';
import {
  BACKUP_TABLES,
  DEFAULT_TABLES,
  GROUP_LABELS,
  TableGroup,
  exportFullSnapshot,
  formatBytes,
  SnapshotExportResult,
} from '@/lib/backupCore';
import { useToast } from '@/hooks/use-toast';

const GROUPS: TableGroup[] = ['content', 'commerce', 'users', 'activity', 'system'];

export default function SnapshotExportPanel() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>(DEFAULT_TABLES);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [msg, setMsg] = useState('');
  const [result, setResult] = useState<SnapshotExportResult | null>(null);

  const grouped = useMemo(
    () => GROUPS.map((g) => ({ g, items: BACKUP_TABLES.filter((t) => t.group === g) })),
    []
  );

  const toggle = (name: string) =>
    setSelected((s) => (s.includes(name) ? s.filter((x) => x !== name) : [...s, name]));

  const toggleGroup = (g: TableGroup) => {
    const names = BACKUP_TABLES.filter((t) => t.group === g).map((t) => t.name);
    const all = names.every((n) => selected.includes(n));
    setSelected((s) => (all ? s.filter((n) => !names.includes(n)) : [...new Set([...s, ...names])]));
  };

  const run = async (tables: string[], media: boolean) => {
    if (tables.length === 0) {
      toast({ title: 'Chưa chọn bảng nào', variant: 'destructive' });
      return;
    }
    setBusy(true);
    setResult(null);
    setPct(0);
    setMsg('Đang chuẩn bị...');
    try {
      const res = await exportFullSnapshot({
        tables,
        includeMedia: media,
        onProgress: (p, m) => { setPct(p); setMsg(m); },
      });
      setResult(res);
      toast({
        title: '✅ Đã tạo gói sao lưu',
        description: `${res.fileName} — ${res.manifest.totalRows} dòng, ${res.manifest.totalMediaFiles} file (${formatBytes(res.sizeBytes)})`,
      });
    } catch (err) {
      toast({ title: 'Lỗi khi sao lưu', description: String(err), variant: 'destructive' });
    } finally {
      setBusy(false);
      setMsg('');
      setPct(0);
    }
  };

  return (
    <div style={card}>
      <div style={{ ...header, background: 'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)', borderBottom: '1px solid #bfdbfe' }}>
        <div style={{ ...iconBox, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}>
          <HardDriveDownload size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#1e3a8a' }}>Sao lưu toàn bộ hệ thống</div>
          <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 2 }}>
            Một gói .zip duy nhất: toàn bộ bảng dữ liệu + ảnh & tệp đính kèm
          </div>
        </div>
      </div>

      <div style={{ padding: '18px 22px', flex: 1, overflowY: 'auto' }}>
        <label style={mediaToggle}>
          <input type="checkbox" checked={includeMedia} onChange={(e) => setIncludeMedia(e.target.checked)} style={cb} />
          <ImageIcon size={15} color="#2563eb" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Kèm toàn bộ ảnh & tệp trong kho lưu trữ</span>
          <span style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>gói sẽ nặng hơn</span>
        </label>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 10px' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>
            Bảng dữ liệu ({selected.length}/{BACKUP_TABLES.length})
          </span>
          <button
            onClick={() => setSelected(selected.length === BACKUP_TABLES.length ? [] : DEFAULT_TABLES)}
            style={ghostBtn}
          >
            {selected.length === BACKUP_TABLES.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
          </button>
        </div>

        {grouped.map(({ g, items }) => {
          const allSel = items.every((t) => selected.includes(t.name));
          return (
            <div key={g} style={groupBox}>
              <div style={groupHeader} onClick={() => toggleGroup(g)}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#475569' }}>{GROUP_LABELS[g]}</span>
                <input type="checkbox" checked={allSel} readOnly style={cb} />
              </div>
              {items.map((t) => {
                const on = selected.includes(t.name);
                return (
                  <label key={t.name} style={{ ...rowStyle, background: on ? '#eff6ff' : 'transparent' }}>
                    <input type="checkbox" checked={on} onChange={() => toggle(t.name)} style={cb} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{t.label}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{t.name}</span>
                  </label>
                );
              })}
            </div>
          );
        })}
      </div>

      {busy && (
        <div style={{ padding: '0 22px 12px' }}>
          <div style={progressTrack}>
            <div style={{ ...progressFill, width: `${pct}%` }} />
          </div>
          <div style={{ fontSize: 12, color: '#1e3a8a', marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Loader2 size={13} className="animate-spin" /> {msg}
          </div>
        </div>
      )}

      {result && !busy && (
        <div style={{ margin: '0 22px 12px', padding: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 6 }}>
            <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6 }} />
            {result.fileName} · {formatBytes(result.sizeBytes)}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {result.manifest.tables.map((t) => (
              <span key={t.name} style={{ ...chip, background: t.error ? '#fee2e2' : '#dcfce7', color: t.error ? '#dc2626' : '#15803d' }}>
                {t.label}: {t.error ? 'Lỗi' : `${t.rows}`}
              </span>
            ))}
            {result.manifest.totalMediaFiles > 0 && (
              <span style={{ ...chip, background: '#dbeafe', color: '#1d4ed8' }}>
                Media: {result.manifest.totalMediaFiles} file
              </span>
            )}
          </div>
        </div>
      )}

      <div style={footer}>
        <button onClick={() => run(selected, includeMedia)} disabled={busy || selected.length === 0} style={primaryBtn(busy || selected.length === 0)}>
          {busy ? <><Loader2 size={15} className="animate-spin" /> Đang sao lưu...</> : <><Download size={15} /> Tạo gói sao lưu ({selected.length} bảng)</>}
        </button>
        <button onClick={() => run(DEFAULT_TABLES, true)} disabled={busy} style={outlineBtn}>
          Sao lưu tất cả + media
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
const cb: React.CSSProperties = { width: 15, height: 15, accentColor: '#3b82f6', cursor: 'pointer' };
const mediaToggle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px',
  border: '1px solid #bfdbfe', background: '#f8fbff', borderRadius: 12, cursor: 'pointer',
};
const groupBox: React.CSSProperties = { border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', marginBottom: 10 };
const groupHeader: React.CSSProperties = {
  padding: '9px 13px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer',
};
const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 13px', cursor: 'pointer' };
const ghostBtn: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: '#3b82f6', background: '#eff6ff',
  border: '1px solid #bfdbfe', borderRadius: 8, padding: '4px 12px', cursor: 'pointer',
};
const chip: React.CSSProperties = { fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600 };
const progressTrack: React.CSSProperties = { height: 8, background: '#e2e8f0', borderRadius: 20, overflow: 'hidden' };
const progressFill: React.CSSProperties = { height: '100%', background: 'linear-gradient(90deg,#3b82f6,#1d4ed8)', transition: 'width .2s' };
const footer: React.CSSProperties = {
  padding: '14px 22px', borderTop: '1px solid #f1f5f9', background: '#fafafa',
  display: 'flex', flexDirection: 'column', gap: 9,
};
const primaryBtn = (disabled: boolean): React.CSSProperties => ({
  width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', fontWeight: 700, fontSize: 13,
  cursor: disabled ? 'not-allowed' : 'pointer',
  background: disabled ? '#e2e8f0' : 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  color: disabled ? '#94a3b8' : '#fff',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
});
const outlineBtn: React.CSSProperties = {
  width: '100%', padding: '10px 0', borderRadius: 12, border: '1.5px solid #3b82f6',
  fontWeight: 700, fontSize: 13, cursor: 'pointer', background: '#fff', color: '#2563eb',
};
