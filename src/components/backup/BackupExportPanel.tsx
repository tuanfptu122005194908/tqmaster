import React, { useState } from 'react';
import { Download, Database, CheckCircle2, Loader2, BookOpen } from 'lucide-react';
import BackupTableSelector from './BackupTableSelector';
import { TABLE_SCHEMAS, exportToExcel, ExportResult } from '@/lib/excelBackup';
import { exportQuestionsReadable } from '@/lib/exportQuestions';
import { useToast } from '@/hooks/use-toast';

export default function BackupExportPanel() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<string[]>(TABLE_SCHEMAS.map((s) => s.name));
  const [loading, setLoading] = useState(false);
  const [qLoading, setQLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [lastResult, setLastResult] = useState<ExportResult | null>(null);

  const handleExport = async (tableNames: string[]) => {
    if (tableNames.length === 0) {
      toast({ title: 'Chưa chọn bảng', description: 'Vui lòng chọn ít nhất 1 bảng để xuất.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    setProgressMsg('Đang chuẩn bị xuất dữ liệu...');
    setLastResult(null);
    try {
      const result = await exportToExcel(tableNames, setProgressMsg);
      setLastResult(result);
      toast({
        title: '✅ Xuất dữ liệu thành công!',
        description: `File "${result.fileName}" đã được tải về.`,
      });
    } catch (err) {
      toast({
        title: 'Lỗi khi xuất dữ liệu',
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  const handleExportQuestions = async () => {
    setQLoading(true);
    setProgressMsg('Đang chuẩn bị xuất câu hỏi...');
    try {
      const result = await exportQuestionsReadable(setProgressMsg);
      toast({
        title: '✅ Xuất câu hỏi thành công!',
        description: `"${result.fileName}" — ${result.totalSheets} đề, ${result.totalQuestions} câu hỏi.`,
      });
    } catch (err) {
      toast({
        title: 'Lỗi khi xuất câu hỏi',
        description: String(err),
        variant: 'destructive',
      });
    } finally {
      setQLoading(false);
      setProgressMsg('');
    }
  };

  return (
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
        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
        borderBottom: '1px solid #bfdbfe',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
          }}>
            <Download size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1e3a8a' }}>
              Xuất dữ liệu (Export)
            </div>
            <div style={{ fontSize: 12, color: '#3b82f6', marginTop: 2 }}>
              Tải database & media về máy dưới dạng file ZIP
            </div>
          </div>
        </div>
      </div>

      {/* Table Selector */}
      <div style={{ padding: '20px 24px', flex: 1, overflowY: 'auto' }}>
        <BackupTableSelector selected={selected} onChange={setSelected} mode="export" />

        {/* Loading Progress */}
        {loading && (
          <div style={{
            marginTop: 16, padding: 14,
            background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12,
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            <Loader2 size={18} className="animate-spin text-blue-600" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e3a8a' }}>
              {progressMsg}
            </div>
          </div>
        )}

        {/* Last export result */}
        {lastResult && !loading && (
          <div style={{
            marginTop: 16, padding: 14,
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d', marginBottom: 8 }}>
              <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6 }} />
              Kết quả xuất gần nhất:
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {Object.entries(lastResult.rowCounts).map(([table, count]) => {
                const schema = TABLE_SCHEMAS.find((s) => s.name === table);
                return (
                  <span key={table} style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 20,
                    background: count >= 0 ? '#dcfce7' : '#fee2e2',
                    color: count >= 0 ? '#15803d' : '#dc2626',
                    border: `1px solid ${count >= 0 ? '#bbf7d0' : '#fecaca'}`,
                    fontWeight: 600,
                  }}>
                    {schema?.label ?? table}: {count >= 0 ? `${count} dòng` : 'Lỗi'}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid #f1f5f9',
        display: 'flex', flexDirection: 'column', gap: 10,
        background: '#fafafa',
      }}>
        {/* Row 1: Export Questions readable */}
        <button
          id="btn-export-questions"
          onClick={handleExportQuestions}
          disabled={loading || qLoading}
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 12,
            border: 'none',
            fontWeight: 700,
            fontSize: 13,
            cursor: loading || qLoading ? 'not-allowed' : 'pointer',
            background: loading || qLoading
              ? '#e2e8f0'
              : 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: loading || qLoading ? '#94a3b8' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: loading || qLoading ? 'none' : '0 6px 18px rgba(5,150,105,0.30)',
            transition: 'all 0.15s ease',
          }}
        >
          {qLoading ? (
            <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> {progressMsg || 'Đang xuất...'}</>
          ) : (
            <><BookOpen size={15} /> Xuất câu hỏi theo môn (Excel đọc được)</>
          )}
        </button>

        {/* Row 2: DB backup buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            id="btn-export-selected"
            onClick={() => handleExport(selected)}
            disabled={loading || qLoading || selected.length === 0}
            style={{
              flex: 1,
              padding: '12px 0',
              borderRadius: 12,
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              cursor: loading || qLoading || selected.length === 0 ? 'not-allowed' : 'pointer',
              background: selected.length === 0 ? '#e2e8f0' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: selected.length === 0 ? '#94a3b8' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: selected.length > 0 ? '0 6px 18px rgba(37,99,235,0.35)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {loading ? (
              <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Đang xuất...</>
            ) : (
              <><Download size={15} /> DB Backup ({selected.length})</>
            )}
          </button>
          <button
            id="btn-export-all"
            onClick={() => handleExport(TABLE_SCHEMAS.map((s) => s.name))}
            disabled={loading || qLoading}
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              border: '1.5px solid #3b82f6',
              fontWeight: 700,
              fontSize: 13,
              cursor: loading || qLoading ? 'not-allowed' : 'pointer',
              background: '#fff',
              color: '#2563eb',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { if (!loading && !qLoading) e.currentTarget.style.background = '#eff6ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; }}
          >
            <Database size={15} /> Full Backup
          </button>
        </div>
      </div>
    </div>
  );
}
