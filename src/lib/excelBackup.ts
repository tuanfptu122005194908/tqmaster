import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// ─── Table Schema Definitions ────────────────────────────────────────────────

export interface TableSchema {
  name: string;
  label: string;
  columns: string[];
  importable: boolean;
  requiredColumns: string[];
  conflictColumns?: string; // PostgREST onConflict column(s). Default: 'id'. Use comma for composite PK.
  importOrder: number;     // Lower = imported first (respects FK dependency order)
  mediaColumns?: string[];
  htmlColumns?: string[];
  group: 'content' | 'transaction' | 'other';
  sampleRow: Record<string, string | number | boolean>;
}

export const TABLE_SCHEMAS: TableSchema[] = [
  // ── Nhóm Nội dung học (import order: 1→2→3→4→5→6→7) ─────────────────────
  {
    name: 'subjects',
    label: 'Môn học',
    group: 'content',
    importable: true,
    importOrder: 1,            // No FK deps
    conflictColumns: 'id',
    columns: ['id', 'name', 'description', 'price', 'semester', 'sort_order', 'is_active', 'thumbnail_url', 'created_at'],
    requiredColumns: ['name', 'semester'],
    mediaColumns: ['thumbnail_url'],
    htmlColumns: ['description'],
    sampleRow: { name: 'Kinh tế vi mô', description: 'Môn học cơ bản', price: 150000, semester: 1, sort_order: 1, is_active: true },
  },
  {
    name: 'exams',
    label: 'Đề thi',
    group: 'content',
    importable: true,
    importOrder: 2,            // No FK deps
    conflictColumns: 'id',
    columns: ['id', 'title', 'description', 'duration_min', 'is_active', 'created_by', 'created_at'],
    requiredColumns: ['title', 'duration_min'],
    htmlColumns: ['description'],
    sampleRow: { title: 'Đề thi giữa kỳ 1', description: 'Đề thi thử', duration_min: 60, is_active: true },
  },
  {
    name: 'exam_subjects',
    label: 'Đề thi - Môn học',
    group: 'content',
    importable: true,
    importOrder: 3,            // Depends on: subjects (1) + exams (2)
    conflictColumns: 'exam_id,subject_id',  // Composite PK — NOT 'id'
    columns: ['exam_id', 'subject_id'],
    requiredColumns: ['exam_id', 'subject_id'],
    sampleRow: { exam_id: 'uuid-exam-here', subject_id: 'uuid-subject-here' },
  },
  {
    name: 'questions',
    label: 'Câu hỏi',
    group: 'content',
    importable: true,
    importOrder: 4,            // Depends on: exams (2)
    conflictColumns: 'id',
    columns: ['id', 'exam_id', 'content', 'type', 'order_num', 'chapter_name', 'image_url', 'created_at'],
    requiredColumns: ['exam_id', 'order_num'],
    mediaColumns: ['image_url'],
    htmlColumns: ['content'],
    sampleRow: { exam_id: 'uuid-exam-here', content: 'Câu hỏi mẫu?', type: 'single', order_num: 1, chapter_name: 'Chương 1' },
  },
  {
    name: 'question_options',
    label: 'Phương án trả lời',
    group: 'content',
    importable: true,
    importOrder: 5,            // Depends on: questions (4)
    conflictColumns: 'id',
    columns: ['id', 'question_id', 'label', 'content', 'is_correct'],
    requiredColumns: ['question_id', 'label'],
    htmlColumns: ['content'],
    sampleRow: { question_id: 'uuid-question-here', label: 'A', content: 'Phương án mẫu', is_correct: false },
  },
  {
    name: 'theories',
    label: 'Tài liệu lý thuyết',
    group: 'content',
    importable: true,
    importOrder: 6,            // No critical FK deps
    conflictColumns: 'id',
    columns: ['id', 'title', 'description', 'url', 'type', 'file_name', 'sort_order', 'created_at'],
    requiredColumns: ['title', 'url', 'type'],
    mediaColumns: ['url'],
    sampleRow: { title: 'Slide bài giảng', description: 'Tài liệu mẫu', url: 'https://example.com/file.pdf', type: 'pdf', sort_order: 1 },
  },
  // ── Nhóm Tin tức / Thông báo ──────────────────────────
  {
    name: 'news_posts',
    label: 'Tin tức',
    group: 'other',
    importable: true,
    importOrder: 7,
    conflictColumns: 'id',
    columns: ['id', 'title', 'content', 'images', 'created_by', 'created_at'],
    requiredColumns: ['title', 'content'],
    mediaColumns: ['images'],
    htmlColumns: ['content'],
    sampleRow: { title: 'Tin tức mẫu', content: 'Nội dung tin tức mẫu' },
  },
  {
    name: 'announcements',
    label: 'Thông báo',
    group: 'other',
    importable: true,
    importOrder: 8,            // Depends on: subjects (1)
    conflictColumns: 'id',
    columns: ['id', 'title', 'content', 'image_url', 'subject_id', 'created_by', 'created_at'],
    requiredColumns: ['title'],
    mediaColumns: ['image_url'],
    htmlColumns: ['content'],
    sampleRow: { title: 'Thông báo mẫu', content: 'Nội dung thông báo' },
  },
  {
    name: 'discount_codes',
    label: 'Mã giảm giá',
    group: 'other',
    importable: true,
    importOrder: 9,
    conflictColumns: 'id',
    columns: ['id', 'code', 'discount_type', 'value', 'is_active', 'max_uses', 'used_count', 'expires_at', 'created_at'],
    requiredColumns: ['code', 'value'],
    sampleRow: { code: 'SAVE20', discount_type: 'percent', value: 20, is_active: true, max_uses: 100 },
  },
  // ── Nhóm Giao dịch (Chỉ Export, không Import) ────────
  {
    name: 'profiles',
    label: 'Hồ sơ người dùng',
    group: 'transaction',
    importable: false,
    importOrder: 99,
    conflictColumns: 'id',
    columns: ['id', 'username', 'email', 'full_name', 'phone', 'student_code', 'is_banned', 'created_at'],
    requiredColumns: [],
    sampleRow: {},
  },
  {
    name: 'orders',
    label: 'Đơn hàng',
    group: 'transaction',
    importable: false,
    importOrder: 99,
    conflictColumns: 'id',
    columns: ['id', 'user_id', 'full_name', 'email', 'student_code', 'status', 'original_amount', 'discount_amount', 'final_amount', 'discount_code', 'note', 'created_at'],
    requiredColumns: [],
    sampleRow: {},
  },
  {
    name: 'order_items',
    label: 'Chi tiết đơn hàng',
    group: 'transaction',
    importable: false,
    importOrder: 99,
    conflictColumns: 'id',
    columns: ['id', 'order_id', 'subject_id', 'price'],
    requiredColumns: [],
    sampleRow: {},
  },
  {
    name: 'exam_attempts',
    label: 'Lịch sử làm bài',
    group: 'transaction',
    importable: false,
    importOrder: 99,
    conflictColumns: 'id',
    columns: ['id', 'user_id', 'exam_id', 'score', 'correct_q', 'total_q', 'mode', 'started_at', 'submitted_at'],
    requiredColumns: [],
    sampleRow: {},
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const STORAGE_PREFIX = '/storage/v1/object/public/';

export function parseSupabaseUrl(url: string): { bucket: string; path: string } | null {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('supabase')) return null; // Matches supabase.co or supabase.in
    const idx = parsed.pathname.indexOf(STORAGE_PREFIX);
    if (idx === -1) return null;
    
    const rest = parsed.pathname.substring(idx + STORAGE_PREFIX.length);
    const parts = rest.split('/');
    if (parts.length < 2) return null;
    
    const bucket = parts[0];
    const path = parts.slice(1).join('/');
    return { bucket, path: decodeURIComponent(path) };
  } catch {
    return null;
  }
}

export function getSupabasePublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

async function fetchBlob(url: string): Promise<Blob | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return await response.blob();
  } catch (err) {
    console.error('Failed to fetch blob', url, err);
    return null;
  }
}

// ─── Export Logic ─────────────────────────────────────────────────────────────

export interface ExportResult {
  success: boolean;
  fileName: string;
  rowCounts: Record<string, number>;
  error?: string;
}

export async function exportToExcel(
  tableNames: string[],
  onProgress?: (msg: string) => void
): Promise<ExportResult> {
  const zip = new JSZip();
  const wb = XLSX.utils.book_new();
  const rowCounts: Record<string, number> = {};

  const schemas = TABLE_SCHEMAS.filter((s) => tableNames.includes(s.name));

  for (const schema of schemas) {
    onProgress?.(`Đang xuất bảng: ${schema.label}...`);
    try {
      let allRows: Record<string, unknown>[] = [];
      let start = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from(schema.name as never)
          .select(schema.columns.join(','))
          .range(start, start + limit - 1);

        if (error) throw error;

        const chunk = (data as Record<string, unknown>[]) ?? [];
        if (chunk.length > 0) {
          allRows = allRows.concat(chunk);
          start += limit;
          if (chunk.length < limit) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      const rows = allRows;
      rowCounts[schema.name] = rows.length;

      const sanitized: Record<string, unknown>[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const out: Record<string, unknown> = {};

        for (const col of schema.columns) {
          let val = row[col];

          // 1. Handle HTML Columns: Find <img> src and replace
          if (schema.htmlColumns?.includes(col) && typeof val === 'string') {
            let htmlContent = val;
            const imgSrcMatches = [...htmlContent.matchAll(/src=["'](https?:\/\/[^"']+)["']/g)];
            
            for (const match of imgSrcMatches) {
              const url = match[1];
              const parsed = parseSupabaseUrl(url);
              if (parsed) {
                onProgress?.(`Đang tải ảnh HTML: ${parsed.path} (Bảng ${schema.label})`);
                const blob = await fetchBlob(url);
                if (blob) {
                  const zipPath = `media/${schema.name}/${parsed.bucket}/${parsed.path}`;
                  zip.file(zipPath, blob);
                  // Replace in HTML
                  htmlContent = htmlContent.split(url).join(zipPath);
                }
              }
            }
            val = htmlContent;
          }

          // 2. Handle Media Columns: Download and rewrite URL
          if (schema.mediaColumns?.includes(col) && val) {
            let urlsToProcess: string[] = [];
            const isArray = Array.isArray(val);
            
            if (isArray) {
              urlsToProcess = val as string[];
            } else if (typeof val === 'string' && val.startsWith('[')) {
              try { urlsToProcess = JSON.parse(val); } catch { /* not a json array */ }
            } else if (typeof val === 'string') {
              urlsToProcess = [val];
            }

            const rewrittenPaths: string[] = [];
            
            for (const url of urlsToProcess) {
              if (typeof url !== 'string') continue;
              const parsed = parseSupabaseUrl(url);
              if (parsed) {
                onProgress?.(`Đang tải media: ${parsed.path} (Bảng ${schema.label})`);
                const blob = await fetchBlob(url);
                if (blob) {
                  const zipPath = `media/${schema.name}/${parsed.bucket}/${parsed.path}`;
                  zip.file(zipPath, blob);
                  rewrittenPaths.push(zipPath); // Save relative path
                } else {
                  rewrittenPaths.push(url); // Keep original if failed
                }
              } else {
                rewrittenPaths.push(url); // Not a supabase URL
              }
            }

            // Assign back to value
            if (isArray || (typeof val === 'string' && val.startsWith('['))) {
              val = rewrittenPaths; // will be stringified below
            } else if (rewrittenPaths.length > 0) {
              val = rewrittenPaths[0];
            }
          }

          // Convert arrays/objects to JSON strings for Excel compatibility
          if (Array.isArray(val) || (typeof val === 'object' && val !== null)) {
            out[col] = JSON.stringify(val);
          } else {
            out[col] = val ?? '';
          }
        }
        sanitized.push(out);
      }

      // Create sheet with headers even if empty
      const ws = sanitized.length > 0
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
      const ws = XLSX.utils.aoa_to_sheet([['ERROR'], [`Lỗi khi export: ${String(err)}`]]);
      XLSX.utils.book_append_sheet(wb, ws, `${schema.label} (Lỗi)`);
      rowCounts[schema.name] = -1;
    }
  }

  onProgress?.('Đang nén file ZIP...');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  zip.file('database.xlsx', excelBuffer);

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const fileName = `TQMaster_Backup_${ts}.zip`;

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, fileName);

  onProgress?.('Hoàn thành!');
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

export async function importFromZip(
  file: File,
  selectedTableNames: string[],
  onProgress?: (percent: number, msg: string) => void
): Promise<ImportResult> {
  const zip = new JSZip();
  await zip.loadAsync(file);

  // 1. Upload Media First
  const mediaFiles = Object.keys(zip.files).filter((path) => path.startsWith('media/') && !zip.files[path].dir);
  const mediaUrlMap = new Map<string, string>(); // 'media/tableName/bucket/path' => 'https://new-url'

  let uploadedCount = 0;
  for (const path of mediaFiles) {
    onProgress?.(
      (uploadedCount / mediaFiles.length) * 30, // Media upload takes up to 30% of progress
      `Đang khôi phục file media: ${uploadedCount + 1}/${mediaFiles.length}...`
    );
    
    // path format: media/[tableName]/[bucket]/[file_path.png]
    const parts = path.split('/'); 
    if (parts.length < 4) continue;
    
    const tableName = parts[1]; // We don't strictly need this for upload, but it's part of the path
    const bucket = parts[2];
    const filePath = parts.slice(3).join('/');
    
    const blob = await zip.files[path].async('blob');
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, { upsert: true });
      
    if (uploadError) {
      console.error(`Failed to upload ${path}:`, uploadError);
    } else {
      const publicUrl = getSupabasePublicUrl(bucket, filePath);
      mediaUrlMap.set(path, publicUrl);
    }
    uploadedCount++;
  }

  // 2. Extract database.xlsx
  onProgress?.(30, 'Đang đọc file database.xlsx...');
  const excelFile = zip.files['database.xlsx'];
  if (!excelFile) {
    throw new Error('Không tìm thấy file database.xlsx trong gói ZIP.');
  }

  const excelBuffer = await excelFile.async('arraybuffer');
  const wb = XLSX.read(excelBuffer, { type: 'array', cellDates: true });

  const results: ImportSheetResult[] = [];
  let totalSuccess = 0;
  let totalFailed = 0;

  // Sort by importOrder to respect FK dependencies:
  // subjects(1) → exams(2) → exam_subjects(3) → questions(4) → question_options(5) → ...
  const importableSchemas = TABLE_SCHEMAS
    .filter((s) => s.importable && selectedTableNames.includes(s.name))
    .sort((a, b) => (a.importOrder ?? 99) - (b.importOrder ?? 99));

  for (let si = 0; si < importableSchemas.length; si++) {
    const schema = importableSchemas[si];

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
      results.push(sheetResult);
      continue;
    }

    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const validRows: Record<string, unknown>[] = [];

      for (let ri = 0; ri < chunk.length; ri++) {
        const row = chunk[ri];
        const globalRowNum = i + ri + 2;
        let rowValid = true;

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

        const cleanRow: Record<string, unknown> = {};
        for (const col of schema.columns) {
          if (col === 'created_at' || col === 'updated_at') continue;
          if (row[col] === undefined || row[col] === null || row[col] === '') continue;

          let val = row[col];
          
          if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
            try { val = JSON.parse(val); } catch { /* keep as string */ }
          }

          // 1. Restore Media URLs for standard media columns
          if (schema.mediaColumns?.includes(col) && val) {
            if (Array.isArray(val)) {
              val = val.map(v => typeof v === 'string' && mediaUrlMap.has(v) ? mediaUrlMap.get(v) : v);
            } else if (typeof val === 'string' && mediaUrlMap.has(val)) {
              val = mediaUrlMap.get(val);
            }
          }

          // 2. Restore HTML Columns with embedded media
          if (schema.htmlColumns?.includes(col) && typeof val === 'string') {
            let htmlContent = val;
            // Find all src="media/..." inside the HTML
            const mediaMatches = [...htmlContent.matchAll(/src=["'](media\/[^"']+)["']/g)];
            for (const match of mediaMatches) {
              const mediaPath = match[1];
              if (mediaUrlMap.has(mediaPath)) {
                htmlContent = htmlContent.split(mediaPath).join(mediaUrlMap.get(mediaPath)!);
              }
            }
            val = htmlContent;
          }

          cleanRow[col] = val;
        }

        validRows.push(cleanRow);
      }

      if (validRows.length === 0) continue;

      try {
        // Use schema-defined conflict columns (composite PK tables like exam_subjects
        // use 'exam_id,subject_id' instead of 'id')
        const conflictCols = schema.conflictColumns ?? 'id';
        const { error } = await supabase
          .from(schema.name as never)
          .upsert(validRows as never[], { onConflict: conflictCols, ignoreDuplicates: false });

        if (error) {
          sheetResult.errors.push({ row: i + 2, message: `Lỗi DB: ${error.message}` });
          sheetResult.failed += validRows.length;
        } else {
          sheetResult.success += validRows.length;
        }
      } catch (err) {
        sheetResult.errors.push({ row: i + 2, message: `Lỗi không xác định: ${String(err)}` });
        sheetResult.failed += validRows.length;
      }

      await sleep(10);

      if (onProgress) {
        // DB import takes remaining 70% of progress
        const overall = 30 + ((si * rows.length + i + CHUNK_SIZE) / (importableSchemas.length * rows.length)) * 70;
        onProgress(Math.min(overall, 99), `Đang import bảng ${schema.label}...`);
      }
    }

    totalSuccess += sheetResult.success;
    totalFailed += sheetResult.failed;
    results.push(sheetResult);
  }

  onProgress?.(100, 'Hoàn tất khôi phục dữ liệu!');
  return { sheets: results, totalSuccess, totalFailed };
}

// ─── Template Download ────────────────────────────────────────────────────────

export function downloadTemplate(tableName: string): void {
  const schema = TABLE_SCHEMAS.find((s) => s.name === tableName);
  if (!schema) return;

  const wb = XLSX.utils.book_new();
  const headerRow = schema.columns.filter((c) => c !== 'created_at' && c !== 'updated_at');
  const sampleRow = headerRow.map((col) => schema.sampleRow[col] ?? '');

  const ws = XLSX.utils.aoa_to_sheet([headerRow, sampleRow]);
  ws['!cols'] = headerRow.map((col) => ({ wch: Math.max(col.length + 4, 18) }));

  XLSX.utils.book_append_sheet(wb, ws, schema.label);
  XLSX.writeFile(wb, `TQMaster_Template_${schema.name}.xlsx`);
}

// ─── Detect sheets in uploaded file ──────────────────────────────────────────

export async function detectSheetsInZip(file: File): Promise<string[]> {
  try {
    const zip = new JSZip();
    await zip.loadAsync(file);
    const excelFile = zip.files['database.xlsx'];
    if (!excelFile) return [];
    
    const excelBuffer = await excelFile.async('arraybuffer');
    const wb = XLSX.read(excelBuffer, { type: 'array' });
    return wb.SheetNames;
  } catch (err) {
    console.error('Failed to detect sheets in zip', err);
    return [];
  }
}

// Fallback for old .xlsx format detection
export async function detectSheetsInFile(file: File): Promise<string[]> {
  if (file.name.endsWith('.zip')) {
    return detectSheetsInZip(file);
  }
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  return wb.SheetNames;
}
