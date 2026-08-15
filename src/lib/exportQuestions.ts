/**
 * exportQuestions.ts
 * Xuất toàn bộ câu hỏi theo môn học / đề thi ra Excel đọc được
 * (không phải raw DB dump — từng sheet là 1 đề thi)
 */
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';
import { getExamScore } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubjectRow { id: string; name: string; semester: number; }
interface ExamRow    { id: string; title: string; duration_min: number; }
interface QuestionRow {
  id: string;
  exam_id: string;
  order_num: number;
  content: string | null;
  chapter_name: string | null;
  type: string;
}
interface OptionRow {
  question_id: string;
  label: string;
  content: string | null;
  is_correct: boolean;
}

// ─── Paginated fetcher ────────────────────────────────────────────────────────

async function fetchAll<T>(
  queryFn: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>
): Promise<T[]> {
  const PAGE = 1000;
  const result: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await queryFn(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    result.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return result;
}

// ─── Main export function ─────────────────────────────────────────────────────

export async function exportQuestionsReadable(
  onProgress?: (msg: string) => void
): Promise<{ fileName: string; totalSheets: number; totalQuestions: number }> {

  onProgress?.('Đang tải danh sách môn học...');
  const subjects = await fetchAll<SubjectRow>((f, t) =>
    supabase.from('subjects').select('id, name, semester').order('semester').order('name').range(f, t)
  );

  onProgress?.('Đang tải danh sách đề thi...');
  const exams = await fetchAll<ExamRow>((f, t) =>
    supabase.from('exams').select('id, title, duration_min').range(f, t)
  );

  onProgress?.('Đang tải mapping môn ↔ đề...');
  const examSubjects = await fetchAll<{ exam_id: string; subject_id: string }>((f, t) =>
    supabase.from('exam_subjects').select('exam_id, subject_id').range(f, t)
  );

  onProgress?.('Đang tải câu hỏi (có thể mất vài giây)...');
  const questions = await fetchAll<QuestionRow>((f, t) =>
    supabase.from('questions')
      .select('id, exam_id, order_num, content, chapter_name, type')
      .range(f, t)
  );

  onProgress?.('Đang tải đáp án...');
  const options = await fetchAll<OptionRow>((f, t) =>
    supabase.from('question_options')
      .select('question_id, label, content, is_correct')
      .range(f, t)
  );

  // ── Build lookup maps ──────────────────────────────────────────────────────
  const examById: Record<string, ExamRow> = {};
  for (const e of exams) examById[e.id] = e;

  // subjectId → examIds[]
  const subjectExamIds: Record<string, string[]> = {};
  for (const es of examSubjects) {
    if (!subjectExamIds[es.subject_id]) subjectExamIds[es.subject_id] = [];
    subjectExamIds[es.subject_id].push(es.exam_id);
  }

  // examId → questions[]
  const examQuestions: Record<string, QuestionRow[]> = {};
  for (const q of questions) {
    if (!examQuestions[q.exam_id]) examQuestions[q.exam_id] = [];
    examQuestions[q.exam_id].push(q);
  }
  // Sort questions by order_num within each exam
  for (const examId of Object.keys(examQuestions)) {
    examQuestions[examId].sort((a, b) => a.order_num - b.order_num);
  }

  // questionId → options (sorted by label)
  const questionOptions: Record<string, OptionRow[]> = {};
  for (const o of options) {
    if (!questionOptions[o.question_id]) questionOptions[o.question_id] = [];
    questionOptions[o.question_id].push(o);
  }
  for (const qid of Object.keys(questionOptions)) {
    questionOptions[qid].sort((a, b) => a.label.localeCompare(b.label));
  }

  // ── Collect all unique option labels ──────────────────────────────────────
  const allLabels = new Set<string>();
  for (const opts of Object.values(questionOptions)) {
    for (const o of opts) allLabels.add(o.label.toUpperCase());
  }
  const sortedLabels = [...allLabels].sort(); // A, B, C, D, E, ...

  // ── Build workbook ─────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();
  let totalSheets = 0;
  let totalQuestions = 0;

  // Overview sheet
  const overviewRows: any[] = [
    ['TQMaster — Xuất câu hỏi theo môn'],
    [`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`],
    [],
    ['Môn học', 'Kỳ', 'Số đề', 'Số câu hỏi'],
  ];

  for (const subject of subjects) {
    const examIds = (subjectExamIds[subject.id] ?? [])
      .filter(id => examQuestions[id]?.length > 0)
      .sort((a, b) => getExamScore(examById[b]?.title ?? '') - getExamScore(examById[a]?.title ?? ''));

    if (examIds.length === 0) continue;

    const totalQInSubject = examIds.reduce((s, id) => s + (examQuestions[id]?.length ?? 0), 0);
    overviewRows.push([subject.name, `Kỳ ${subject.semester}`, examIds.length, totalQInSubject]);

    onProgress?.(`Đang tạo sheet cho môn: ${subject.name}...`);

    // One sheet per exam in this subject
    for (const examId of examIds) {
      const exam = examById[examId];
      if (!exam) continue;
      const qs = examQuestions[examId] ?? [];
      if (qs.length === 0) continue;

      totalQuestions += qs.length;

      // Build rows: STT | Chương | Nội dung | A | B | C | D | ... | Đáp án đúng
      const headers = ['STT', 'Chương', 'Nội dung câu hỏi', ...sortedLabels, 'Đáp án đúng'];
      const dataRows: any[] = [];

      for (const q of qs) {
        const opts = questionOptions[q.id] ?? [];
        const optMap: Record<string, string> = {};
        const correctLabels: string[] = [];

        for (const o of opts) {
          const lbl = o.label.toUpperCase();
          optMap[lbl] = o.content ?? '(ảnh)';
          if (o.is_correct) correctLabels.push(lbl);
        }

        const row: any[] = [
          q.order_num,
          q.chapter_name ?? 'Tổng hợp',
          q.content ?? (q.type === 'image' ? '(Câu hình ảnh)' : ''),
          ...sortedLabels.map(l => optMap[l] ?? ''),
          correctLabels.join(', ') || '(chưa có)',
        ];
        dataRows.push(row);
      }

      const wsData = [headers, ...dataRows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Style header row
      for (let c = 0; c < headers.length; c++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c });
        if (!ws[addr]) continue;
        ws[addr].s = {
          font: { bold: true, color: { rgb: '1e3a8a' } },
          fill: { fgColor: { rgb: 'DBEAFE' } },
          alignment: { wrapText: true },
        };
      }

      // Mark correct answer cells green
      for (let ri = 0; ri < dataRows.length; ri++) {
        const correctLabels = (dataRows[ri][3 + sortedLabels.length] as string).split(', ');
        for (const lbl of correctLabels) {
          const ci = sortedLabels.indexOf(lbl.trim());
          if (ci === -1) continue;
          const addr = XLSX.utils.encode_cell({ r: ri + 1, c: 3 + ci });
          if (!ws[addr]) continue;
          ws[addr].s = {
            fill: { fgColor: { rgb: 'DCFCE7' } },
            font: { bold: true, color: { rgb: '15803d' } },
          };
        }
      }

      // Column widths
      ws['!cols'] = [
        { wch: 5 },   // STT
        { wch: 18 },  // Chương
        { wch: 60 },  // Nội dung
        ...sortedLabels.map(() => ({ wch: 35 })), // A B C D...
        { wch: 14 },  // Đáp án đúng
      ];

      // Sheet name: truncate to 31 chars (Excel limit), use exam title
      const rawName = exam.title.replace(/[\\/:*?[\]]/g, '').substring(0, 31);
      let sheetName = rawName;
      // Ensure unique sheet names
      let suffix = 1;
      while (wb.SheetNames.includes(sheetName)) {
        const base = rawName.substring(0, 28);
        sheetName = `${base}_${suffix++}`;
      }

      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      totalSheets++;
    }
  }

  // Prepend overview sheet
  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 40 }, { wch: 8 }, { wch: 8 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Tổng quan');
  // Move overview to front
  const idx = wb.SheetNames.indexOf('Tổng quan');
  if (idx > 0) {
    wb.SheetNames.splice(idx, 1);
    wb.SheetNames.unshift('Tổng quan');
  }

  // Save
  onProgress?.('Đang tạo file Excel...');
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const fileName = `TQMaster_CauHoi_${ts}.xlsx`;

  XLSX.writeFile(wb, fileName);
  return { fileName, totalSheets, totalQuestions };
}
