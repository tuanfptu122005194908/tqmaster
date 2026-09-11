import React, { useState } from 'react';
import { ShieldAlert, HardDrive, FileSpreadsheet } from 'lucide-react';
import SnapshotExportPanel from '@/components/backup/SnapshotExportPanel';
import BackgroundBackupPanel from '@/components/backup/BackgroundBackupPanel';
import SnapshotRestorePanel from '@/components/backup/SnapshotRestorePanel';
import BackgroundRestorePanel from '@/components/backup/BackgroundRestorePanel';
import BackupExportPanel from '@/components/backup/BackupExportPanel';
import BackupImportPanel from '@/components/backup/BackupImportPanel';

type Tab = 'snapshot' | 'excel';

export default function AdminBackup() {
  const [tab, setTab] = useState<Tab>('snapshot');

  return (
    <div style={{
      padding: '24px clamp(14px, 3vw, 32px)',
      minHeight: '100%',
      background: '#f4f7fc',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>
            💾 Backup & Restore
          </h1>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20,
            background: '#e0e7ff', color: '#4f46e5', border: '1px solid #c7d2fe',
          }}>
            Admin Only
          </span>
        </div>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0, maxWidth: 860 }}>
          Tạo bản sao lưu đầy đủ toàn bộ dữ liệu và ảnh/tệp của hệ thống trong một gói duy nhất, đủ để khôi phục
          hoặc chuyển toàn bộ sang một cơ sở dữ liệu khác. Hỗ trợ chạy nền trên máy chủ đám mây, bạn có thể tắt máy sau khi bấm.
        </p>
      </div>

      {/* Warning */}
      <div style={{
        marginBottom: 20, padding: '13px 16px', borderRadius: 14,
        background: '#fff7ed', border: '1px solid #fed7aa',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: '#fff', border: '1px solid #fed7aa',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <ShieldAlert size={17} color="#d97706" />
        </div>
        <div style={{ fontSize: 12, color: '#b45309', lineHeight: 1.7 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e', marginBottom: 3 }}>
            Tính năng nhạy cảm — chỉ dành cho quản trị viên
          </div>
          Gói sao lưu chứa toàn bộ dữ liệu khách hàng. Hãy lưu trữ cẩn thận và <b>không chia sẻ với người ngoài</b>.
          Luôn tạo bản sao lưu mới trước khi khôi phục.
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        <TabBtn active={tab === 'snapshot'} onClick={() => setTab('snapshot')} icon={<HardDrive size={15} />}>
          Sao lưu toàn bộ (khuyên dùng)
        </TabBtn>
        <TabBtn active={tab === 'excel'} onClick={() => setTab('excel')} icon={<FileSpreadsheet size={15} />}>
          Excel cho người đọc
        </TabBtn>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 20,
        alignItems: 'start',
      }}>
        {tab === 'snapshot' ? (
          <>
            <BackgroundBackupPanel />
            <BackgroundRestorePanel />
            <SnapshotExportPanel />
            <SnapshotRestorePanel />
          </>
        ) : (
          <>
            <BackupExportPanel />
            <BackupImportPanel />
          </>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, children }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700,
        cursor: 'pointer',
        border: `1.5px solid ${active ? '#3b82f6' : '#e2e8f0'}`,
        background: active ? 'linear-gradient(135deg,#3b82f6,#1d4ed8)' : '#fff',
        color: active ? '#fff' : '#475569',
        boxShadow: active ? '0 6px 16px rgba(37,99,235,0.28)' : 'none',
      }}
    >
      {icon}{children}
    </button>
  );
}
