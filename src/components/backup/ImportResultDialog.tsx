import React, { useState } from 'react';
import { X, CheckCircle2, XCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { ImportResult } from '@/lib/excelBackup';

interface ImportResultDialogProps {
  result: ImportResult;
  onClose: () => void;
}

export default function ImportResultDialog({ result, onClose }: ImportResultDialogProps) {
  const [expandedSheet, setExpandedSheet] = useState<string | null>(null);

  const toggle = (name: string) => {
    setExpandedSheet((prev) => (prev === name ? null : name));
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 600,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        {/* Dialog Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              📊 Kết quả Import
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              Tổng cộng:{' '}
              <strong style={{ color: '#059669' }}>{result.totalSuccess} thành công</strong>
              {result.totalFailed > 0 && (
                <>, <strong style={{ color: '#dc2626' }}>{result.totalFailed} thất bại</strong></>
              )}
            </div>
          </div>
          <button
            id="btn-close-import-result"
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              border: 'none', background: '#f1f5f9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#64748b',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{ padding: '16px 24px', display: 'flex', gap: 12 }}>
          <div style={{
            flex: 1, padding: '12px 16px', borderRadius: 12,
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#059669' }}>
              {result.totalSuccess}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginTop: 2 }}>
              Dòng thành công
            </div>
          </div>
          <div style={{
            flex: 1, padding: '12px 16px', borderRadius: 12,
            background: result.totalFailed > 0 ? '#fef2f2' : '#f8fafc',
            border: `1px solid ${result.totalFailed > 0 ? '#fecaca' : '#e2e8f0'}`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: result.totalFailed > 0 ? '#dc2626' : '#94a3b8' }}>
              {result.totalFailed}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginTop: 2 }}>
              Dòng thất bại
            </div>
          </div>
          <div style={{
            flex: 1, padding: '12px 16px', borderRadius: 12,
            background: '#eff6ff', border: '1px solid #bfdbfe',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#2563eb' }}>
              {result.sheets.length}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginTop: 2 }}>
              Sheets xử lý
            </div>
          </div>
        </div>

        {/* Per-Sheet Details */}
        <div style={{ padding: '0 24px 20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {result.sheets.map((sheet) => {
            const hasErrors = sheet.errors.length > 0;
            const isExpanded = expandedSheet === sheet.tableName;
            const isEmpty = sheet.success === 0 && sheet.failed === 0;

            return (
              <div
                key={sheet.tableName}
                style={{
                  border: `1px solid ${hasErrors ? '#fecaca' : '#e2e8f0'}`,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: hasErrors ? '#fff5f5' : '#fff',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: hasErrors ? 'pointer' : 'default',
                  }}
                  onClick={() => hasErrors && toggle(sheet.tableName)}
                >
                  {isEmpty ? (
                    <AlertCircle size={16} color="#94a3b8" />
                  ) : hasErrors ? (
                    <XCircle size={16} color="#ef4444" />
                  ) : (
                    <CheckCircle2 size={16} color="#10b981" />
                  )}

                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                    {sheet.label}
                  </span>

                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 20,
                    background: sheet.success > 0 ? '#dcfce7' : '#f1f5f9',
                    color: sheet.success > 0 ? '#15803d' : '#6b7280',
                    fontWeight: 700,
                  }}>
                    ✓ {sheet.success}
                  </span>

                  {sheet.failed > 0 && (
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 20,
                      background: '#fee2e2', color: '#dc2626', fontWeight: 700,
                    }}>
                      ✗ {sheet.failed}
                    </span>
                  )}

                  {hasErrors && (
                    <span style={{ color: '#9ca3af' }}>
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </span>
                  )}
                </div>

                {/* Error Details */}
                {isExpanded && hasErrors && (
                  <div style={{
                    borderTop: '1px solid #fecaca',
                    padding: '10px 14px',
                    background: '#fff',
                    display: 'flex', flexDirection: 'column', gap: 6,
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}>
                    {sheet.errors.map((err, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#dc2626', display: 'flex', gap: 8 }}>
                        <span style={{ fontWeight: 700, color: '#9ca3af', flexShrink: 0 }}>
                          Dòng {err.row}:
                        </span>
                        <span>{err.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f1f5f9',
          display: 'flex', justifyContent: 'flex-end',
          background: '#fafafa',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 28px',
              borderRadius: 12,
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
