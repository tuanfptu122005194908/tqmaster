import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

// ─── Table Schema Definitions ────────────────────────────────────────────────

export interface TableSchema {
  name: string;
  label: string;
  columns: string[];
  importable: boolean;
  requiredColumns: string[];
  group: 'content' | 'transaction' | 'other';
  sampleRow: Record<string, string | number | boolean>;
}

export const TABLE_SCHEMAS: TableSchema[] = [
  // ── Nhóm Nội dung học ────────────────────────────────
  {
    name: 'subjects',
    label: 'Môn học',
    group: 'content',
    importable: true,
    columns: ['id', 'name', 'description', 'price', 'semester', 'sort_order', 'is_active', 'thumbnail_url', 'created_at'],
    requiredColumns: ['name', 'semester'],
    sampleRow: { name: 'Kinh tế vi mô', description: 'Môn học cơ bản', price: 150000, semester: 1, sort_order: 1, is_active: true },
  },
  {
    name: 'exams',
    label: 'Đề thi',
    group: 'content',
    importable: true,
    columns: ['id', 'title', 'description', 'duration_min', 'is_active', 'created_by', 'created_at'],
    requiredColumns: ['title', 'duration_min'],
    sampleRow: { title: 'Đề thi giữa kỳ 1', description: 'Đề thi thử', duration_min: 60, is_active: true },
  },
  {
    name: 'questions',
    label: 'Câu hỏi',
    group: 'content',
    importable: true,
    columns: ['id', 'exam_id', 'content', 'type', 'order_num', 'chapter_name', 'image_url', 'created_at'],
    requiredColumns: ['exam_id', 'content', 'order_num'],
    sampleRow: { exam_id: 'uuid-exam-here', content: 'Câu hỏi mẫu?', type: 'single', order_num: 1, chapter_name: 'Chương 1' },
  },
  {
    name: 'question_options',
    label: 'Phương án trả lời',
    group: 'content',
    importable: true,
    columns: ['id', 'question_id', 'label', 'content', 'is_correct'],
    requiredColumns: ['question_id', 'label'],
    sampleRow: { question_id: 'uuid-question-here', label: 'A', content: 'Phương án mẫu', is_correct: false },
  },
  {
    name: 'theories',
    label: 'Tài liệu lý thuyết',
    group: 'content',
    importable: true,
    columns: ['id', 'title', 'description', 'url', 'type', 'file_name', 'sort_order', 'created_at'],
    requiredColumns: ['title', 'url', 'type'],
    sampleRow: { title: 'Slide bài giảng', description: 'Tài liệu mẫu', url: 'https://example.com/file.pdf', type: 'pdf', sort_order: 1 },
  },
  // ── Nhóm Tin tức / Thông báo ──────────────────────────
  {
    name: 'news_posts',
    label: 'Tin tức',
    group: 'other',
    importable: true,
    columns: ['id', 'title', 'content', 'images', 'created_by', 'created_at'],
    requiredColumns: ['title', 'content'],
    sampleRow: { title: 'Tin tức mẫu', content: 'Nội dung tin tức mẫu' },
  },
  {
    name: 'announcements',
    label: 'Thông báo',
    group: 'other',
    importable: true,
    columns: ['id', 'title', 'content', 'image_url', 'subject_id', 'created_by', 'created_at'],
    requiredColumns: ['title'],
    sampleRow: { title: 'Thông báo mẫu', content: 'Nội dung thông báo' },
  },
  {
    name: 'discount_codes',
    label: 'Mã giảm giá',
    group: 'other',
    importable: true,
    columns: ['id', 'code', 'discount_type', 'value', 'is_active', 'max_uses', 'used_count', 'expires_at', 'created_at'],
    requiredColumns: ['code', 'value'],
    sampleRow: { code: 'SAVE20', discount_type: 'percent', value: 20, is_active: true, max_uses: 100 },
  },
  // ── Nhóm Giao dịch (Chỉ Export) ──────────────────────
  {
    name: 'profiles',
    label: 'Hồ sơ người dùng',
    group: 'transaction',
    importable: false,
    columns: ['id', 'username', 'email', 'full_name', 'phone', 'student_code', 'is_banned', 'created_at'],
    requiredColumns: [],
    sampleRow: {},
  },
  {
    name: 'orders',
    label: 'Đơn hàng',
    group: 'transaction',
    importable: false,
    columns: ['id', 'user_id', 'full_name', 'email', 'student_code', 'status', 'original_amount', 'discount_amount', 'final_amount', 'discount_code', 'note', 'created_at'],
    requiredColumns: [],
    sampleRow: {},
  },
  {
    name: 'order_items',
    label: 'Chi tiết đơn hàng',
    group: 'transaction',
    importable: false,
    columns: ['id', 'order_id', 'subject_id', 'price'],
    requiredColumns: [],
    sampleRow: {},
  },
  {
    name: 'exam_attempts',
    label: 'Lịch sử làm bài',
    group: 'transaction',
    importable: false,
    columns: ['id', 'user_id', 'exam_id', 'score', 'correct_q', 'total_q', 'mode', 'started_at', 'submitted_at'],
    requiredColumns: [],
    sampleRow: {},
  },
];

// ─── Export Logic ─────────────────────────────────────────────────────────────

export interface ExportResult {
  success: boolean;
  fileName: string;
  rowCounts: Record<string, number>;
  error?: string;
}

export async function exportToExcel(tableNames: string[]): Promise<ExportResult> {
  const wb = XLSX.utils.book_new();
  const rowCounts: Record<string, number> = {};

  const schemas = TABLE_SCHEMAS.filter((s) => tableNames.includes(s.name));

  for (const schema of schemas) {
    try {
      const { data, error } = await supabase
        .from(schema.name as never)
        .select(schema.columns.join(','));

      if (error) throw error;

      const rows = (data as Record<string, unknown>[]) ?? [];
      rowCounts[schema.name] = rows.length;

      // Convert arrays/objects to JSON strings for Excel compatibility
      const sanitized = rows.map((row) => {
        const out: Record<string, unknown> = {};
        for (const col of schema.columns) {
          const val = row[col];
          if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
            out[col] = JSON.stringify(val);
          } else {
            out[col] = val ?? '';
          }
        }
        return out;
      });

      // Create sheet with headers even if empty
      const ws = rows.length > 0
        ? XLSX.utils.json_to_sheet(sanitized, { header: schema.columns })
        : XLSX.utils.aoa_to_sheet([schema.columns]);

      // Style header row (bold)
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddr]) continue;
        ws[cellAddr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'DBEAFE' } } };
      }

      // Auto column width
      ws['!cols'] = schema.columns.map((col) => ({
        wch: Math.max(col.length, 15),
      }));

      XLSX.utils.book_append_sheet(wb, ws, schema.label);
    } catch (err) {
      console.error(`Export error for table ${schema.name}:`, err);
      // Create error sheet
      const ws = XLSX.utils.aoa_to_sheet([['ERROR'], [`Lỗi khi export: ${String(err)}`]]);
      XLSX.utils.book_append_sheet(wb, ws, `${schema.label} (Lỗi)`);
      rowCounts[schema.name] = -1;
    }
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const fileName = `TQMaster_Backup_${ts}.xlsx`;

  XLSX.writeFile(wb, fileName);

  return { success: true, fileName, rowCounts };
}

// ─── Import Logic ─────────────────────────────────────────────────────────────

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportSheetResult {
  tableName: string;
  label: string;
  success: number;
  failed: number;
  errors: ImportRowError[];
}

export interface ImportResult {
  sheets: ImportSheetResult[];
  totalSuccess: number;
  totalFailed: number;
}

const CHUNK_SIZE = 100;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function importFromExcel(
  file: File,
  selectedTableNames: string[],
  onProgress?: (percent: number) => void
): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });

  const results: ImportSheetResult[] = [];
  let totalSuccess = 0;
  let totalFailed = 0;

  const importableSchemas = TABLE_SCHEMAS.filter(
    (s) => s.importable && selectedTableNames.includes(s.name)
  );

  for (let si = 0; si < importableSchemas.length; si++) {
    const schema = importableSchemas[si];

    // Match sheet by label name
    const sheetName = wb.SheetNames.find(
      (n) => n === schema.label || n.toLowerCase() === schema.name.toLowerCase()
    );

    const sheetResult: ImportSheetResult = {
      tableName: schema.name,
      label: schema.label,
      success: 0,
      failed: 0,
      errors: [],
    };

    if (!sheetName) {
      // Sheet not found — skip silently
      results.push(sheetResult);
      continue;
    }

    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

    // Process in chunks
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const validRows: Record<string, unknown>[] = [];

      // Validate each row
      for (let ri = 0; ri < chunk.length; ri++) {
        const row = chunk[ri];
        const globalRowNum = i + ri + 2; // 1-indexed + header row
        let rowValid = true;

        // Check required columns
        for (const reqCol of schema.requiredColumns) {
          if (!row[reqCol] && row[reqCol] !== 0 && row[reqCol] !== false) {
            sheetResult.errors.push({
              row: globalRowNum,
              message: `Thiếu trường bắt buộc: "${reqCol}"`,
            });
            rowValid = false;
            break;
          }
        }

        if (!rowValid) {
          sheetResult.failed++;
          continue;
        }

        // Clean row: only keep known columns, parse JSON arrays
        const cleanRow: Record<string, unknown> = {};
        for (const col of schema.columns) {
          if (col === 'created_at' || col === 'updated_at') continue; // let DB handle timestamps
          if (row[col] === undefined || row[col] === null || row[col] === '') continue;

          let val = row[col];
          // Try to parse JSON arrays (e.g., images column)
          if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
            try { val = JSON.parse(val); } catch { /* keep as string */ }
          }
          cleanRow[col] = val;
        }

        validRows.push(cleanRow);
      }

      if (validRows.length === 0) continue;

      // Upsert chunk
      try {
        const { error } = await supabase
          .from(schema.name as never)
          .upsert(validRows as never[], { onConflict: 'id', ignoreDuplicates: false });

        if (error) {
          sheetResult.errors.push({
            row: i + 2,
            message: `Lỗi DB (batch ${i / CHUNK_SIZE + 1}): ${error.message}`,
          });
          sheetResult.failed += validRows.length;
        } else {
          sheetResult.success += validRows.length;
        }
      } catch (err) {
        sheetResult.errors.push({
          row: i + 2,
          message: `Lỗi không xác định: ${String(err)}`,
        });
        sheetResult.failed += validRows.length;
      }

      // Yield to UI thread
      await sleep(10);

      // Progress callback
      if (onProgress) {
        const overall = ((si * rows.length + i + CHUNK_SIZE) / (importableSchemas.length * rows.length)) * 100;
        onProgress(Math.min(overall, 99));
      }
    }

    totalSuccess += sheetResult.success;
    totalFailed += sheetResult.failed;
    results.push(sheetResult);
  }

  onProgress?.(100);
  return { sheets: results, totalSuccess, totalFailed };
}

// ─── Template Download ────────────────────────────────────────────────────────

export function downloadTemplate(tableName: string): void {
  const schema = TABLE_SCHEMAS.find((s) => s.name === tableName);
  if (!schema) return;

  const wb = XLSX.utils.book_new();

  // Header row
  const headerRow = schema.columns.filter(
    (c) => c !== 'created_at' && c !== 'updated_at'
  );

  // Sample row
  const sampleRow = headerRow.map((col) => schema.sampleRow[col] ?? '');

  const ws = XLSX.utils.aoa_to_sheet([headerRow, sampleRow]);

  // Style header
  ws['!cols'] = headerRow.map((col) => ({
    wch: Math.max(col.length + 4, 18),
  }));

  XLSX.utils.book_append_sheet(wb, ws, schema.label);
  XLSX.writeFile(wb, `TQMaster_Template_${schema.name}.xlsx`);
}

// ─── Detect sheets in uploaded file ──────────────────────────────────────────

export async function detectSheetsInFile(file: File): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  return wb.SheetNames;
}
