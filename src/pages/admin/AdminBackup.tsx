import React from 'react';
import { ShieldAlert } from 'lucide-react';
import BackupExportPanel from '@/components/backup/BackupExportPanel';
import BackupImportPanel from '@/components/backup/BackupImportPanel';

export default function AdminBackup() {
  return (
    <div style={{
      padding: '28px 32px',
      minHeight: '100%',
      background: '#f4f7fc',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <h1 style={{
            fontSize: 26, fontWeight: 900, color: '#0f172a',
            letterSpacing: '-0.03em', margin: 0,
          }}>
            💾 Backup & Restore
          </h1>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 10px',
            borderRadius: 20,
            background: '#e0e7ff', color: '#4f46e5',
            border: '1px solid #c7d2fe',
          }}>
            Admin Only
          </span>
        </div>
        <p style={{ fontSize: 14, color: '#64748b', margin: 0 }}>
          Xuất (Export) toàn bộ dữ liệu database ra file Excel để sao lưu, hoặc nhập (Import) từ file Excel để khôi phục / import hàng loạt.
        </p>
      </div>

      {/* Security Warning Banner */}
      <div style={{
        marginBottom: 24,
        padding: '14px 18px',
        borderRadius: 14,
        background: '#fff7ed',
        border: '1px solid #fed7aa',
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: '#fff', border: '1px solid #fed7aa',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ShieldAlert size={18} color="#d97706" />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#92400e', marginBottom: 4 }}>
            ⚠️ Tính năng nhạy cảm — Chỉ dành cho Quản trị viên
          </div>
          <div style={{ fontSize: 12, color: '#b45309', lineHeight: 1.6 }}>
            • File backup chứa toàn bộ dữ liệu của hệ thống. Hãy lưu trữ file cẩn thận và <strong>không chia sẻ với người ngoài</strong>.<br />
            • Import sẽ <strong>cập nhật (Upsert)</strong> dữ liệu — dữ liệu trùng ID sẽ bị ghi đè, dữ liệu cũ không bị xóa.<br />
            • Nên Export backup <strong>trước khi Import</strong> để có bản dự phòng an toàn.
          </div>
        </div>
      </div>

      {/* Two-Panel Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: 24,
        alignItems: 'start',
      }}>
        <BackupExportPanel />
        <BackupImportPanel />
      </div>
    </div>
  );
}
