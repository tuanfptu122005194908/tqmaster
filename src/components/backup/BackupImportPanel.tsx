import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, X, FileDown, AlertTriangle, Loader2 } from 'lucide-react';
import BackupTableSelector from './BackupTableSelector';
import ImportResultDialog from './ImportResultDialog';
import { TABLE_SCHEMAS, importFromExcel, downloadTemplate, detectSheetsInFile, ImportResult } from '@/lib/excelBackup';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export default function BackupImportPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [detectedSheets, setDetectedSheets] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (f: File) => {
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      toast({ title: 'File không hợp lệ', description: 'Vui lòng chọn file Excel (.xlsx)', variant: 'destructive' });
      return;
    }
    setFile(f);
    setResult(null);
    try {
      const sheets = await detectSheetsInFile(f);
      setDetectedSheets(sheets);
      // Auto-select matching tables
      const matched = TABLE_SCHEMAS.filter(
        (s) => s.importable && sheets.some((sh) => sh === s.label || sh.toLowerCase() === s.name)
      ).map((s) => s.name);
      setSelected(matched);
    } catch {
      toast({ title: 'Lỗi đọc file', description: 'Không thể đọc file Excel.', variant: 'destructive' });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileSelect(f);
  };

  const handleImport = async () => {
    if (!file || selected.length === 0) return;
    setLoading(true);
    setProgress(0);
    setResult(null);

    try {
      const res = await importFromExcel(file, selected, setProgress);
      setResult(res);
      setShowResult(true);

      // Invalidate relevant queries
      for (const tableName of selected) {
        queryClient.invalidateQueries({ queryKey: [tableName] });
      }
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });

      if (res.totalFailed === 0) {
        toast({ title: `✅ Import thành công ${res.totalSuccess} dòng!` });
      } else {
        toast({
          title: `⚠️ Import hoàn tất (có lỗi)`,
          description: `${res.totalSuccess} thành công, ${res.totalFailed} thất bại.`,
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({ title: 'Lỗi khi import', description: String(err), variant: 'destructive' });
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const clearFile = () => {
    setFile(null);
    setDetectedSheets([]);
    setSelected([]);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const importableSchemas = TABLE_SCHEMAS.filter((s) => s.importable);

  return (
    <>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
          borderBottom: '1px solid #bbf7d0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
            }}>
              <Upload size={20} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#064e3b' }}>
                Nhập dữ liệu (Import)
              </div>
              <div style={{ fontSize: 12, color: '#10b981', marginTop: 2 }}>
                Khôi phục hoặc import hàng loạt từ file Excel
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Warning Banner */}
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: '#fffbeb', border: '1px solid #fde68a',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: '#92400e', lineHeight: 1.5 }}>
              <strong>Lưu ý:</strong> Import sử dụng chiến lược <strong>Upsert</strong>. Nếu dữ liệu đã tồn tại (cùng ID), nó sẽ được <strong>cập nhật</strong>. Dữ liệu cũ không bị xóa.
            </span>
          </div>

          {/* File Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !file && fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? '#3b82f6' : file ? '#10b981' : '#cbd5e1'}`,
              borderRadius: 14,
              padding: '24px 16px',
              textAlign: 'center',
              cursor: file ? 'default' : 'pointer',
              background: dragOver ? '#eff6ff' : file ? '#f0fdf4' : '#fafafa',
              transition: 'all 0.15s ease',
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />

            {!file ? (
              <>
                <FileSpreadsheet size={32} color="#94a3b8" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>
                  Kéo & thả file Excel vào đây
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  hoặc click để chọn file (.xlsx)
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                <FileSpreadsheet size={24} color="#10b981" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#065f46' }}>{file.name}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>
                    {detectedSheets.length} sheets được phát hiện: {detectedSheets.join(', ')}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', marginLeft: 'auto' }}
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Table Selector (show only when file is selected) */}
          {file && (
            <div>
              <BackupTableSelector selected={selected} onChange={setSelected} mode="import" />
            </div>
          )}

          {/* Template Download Section */}
          <div style={{
            padding: '14px 16px',
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 10 }}>
              📄 Tải file mẫu (Template):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {importableSchemas.map((schema) => (
                <button
                  key={schema.name}
                  id={`btn-template-${schema.name}`}
                  onClick={() => downloadTemplate(schema.name)}
                  style={{
                    fontSize: 11, fontWeight: 600,
                    padding: '5px 12px', borderRadius: 20,
                    border: '1px solid #bfdbfe', background: '#eff6ff',
                    color: '#2563eb', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5,
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#dbeafe'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#eff6ff'; }}
                >
                  <FileDown size={11} /> {schema.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {loading && (
          <div style={{ padding: '0 24px 4px', background: '#fff' }}>
            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span>Đang import dữ liệu...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #10b981, #3b82f6)',
                transition: 'width 0.3s ease',
                borderRadius: 3,
              }} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f1f5f9',
          background: '#fafafa',
        }}>
          <button
            id="btn-import-confirm"
            onClick={handleImport}
            disabled={!file || selected.length === 0 || loading}
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              cursor: (!file || selected.length === 0 || loading) ? 'not-allowed' : 'pointer',
              background: (!file || selected.length === 0 || loading)
                ? '#e2e8f0'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: (!file || selected.length === 0 || loading) ? '#94a3b8' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: (file && selected.length > 0 && !loading) ? '0 6px 18px rgba(16,185,129,0.35)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? (
              <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Đang import...</>
            ) : (
              <><Upload size={15} /> Import ({selected.length} bảng)</>
            )}
          </button>
        </div>
      </div>

      {/* Result Dialog */}
      {showResult && result && (
        <ImportResultDialog result={result} onClose={() => setShowResult(false)} />
      )}
    </>
  );
}
