/**
 * markdownExamParser.ts
 * High-performance parser for Markdown exam files (.md / .txt) & ZIP archives.
 * Supports:
 * - Title (# Title or filename) and Description (> description)
 * - Questions with various markers: "**Câu 1.**", "**Câu 1:**", "Câu 1.", "### Câu 1", etc.
 * - Chapter headers: "# Chương 1", "[Chương 2]", "Chương 3 - OOP", etc.
 * - Multi-line questions with code blocks, math formulas, lists
 * - Options: "A.", "**A.**", "A)", "A:", multiline and code options (A–H)
 * - Correct answers: "> **Đáp án:** \n > - Câu 1: **C**", "> - Câu 15: **A, B**", "Đáp án: A", "**Đáp án:** C"
 * - Standalone answer keys and summary tables
 * - JSZip archive extraction (recursive, ignores OSX metadata)
 */

import JSZip from 'jszip';

export interface ParsedExamOption {
  label: string; // 'A' | 'B' | 'C' | 'D' | ...
  content: string;
  isCorrect: boolean;
}

export interface ParsedExamQuestion {
  orderNum: number;
  content: string;
  chapterName: string;
  options: ParsedExamOption[];
  correctAnswers: string[]; // e.g. ['A'], ['A', 'B']
}

export interface ParsedExamData {
  id?: string;
  filename: string;
  title: string;
  description: string;
  durationMin: number;
  questions: ParsedExamQuestion[];
  totalQuestions: number;
  unansweredQuestions: number[]; // Question numbers without detected correct answers
  selected?: boolean; // UI selection flag
}

export interface MarkdownParserOptions {
  stripAnswers?: boolean;
}

/**
 * Extract isolated answer labels (A-H) from text
 * Handles formats like:
 * - "**B**", "**AB**", "**BC**", "**CE**", "**ABC**"
 * - "**B, E, F**", "**A, B**", "A, B"
 * - "**A và B**", "A & C", "A hoặc D", "A and B"
 * - "Đáp án: [C]", "> - Câu 8: **AB**", "> - Câu 1: **C**"
 * - "C. Troubleshooting and standardization"
 * - "A." / "B)"
 * Avoids false positive matches inside Vietnamese/English words like "tự động", "giải thích", "devise a plan"
 */
export function extractAnswerLabels(text: string): string[] {
  if (!text) return [];
  let cleaned = text.trim();

  // Strip blockquote markdown prefix e.g. "> - ", "> "
  cleaned = cleaned.replace(/^>\s*/, '').replace(/^-\s*/, '').trim();

  // If there's an explanation separator, take the prefix before explanation
  const parts = cleaned.split(
    /(?:\s+[—–]\s+|\s*\/\/\s*|\s*\(|(?:\.\s+|\s+)(?:là vì|do|vì|bởi vì|bởi|bằng cách|theo|giải thích|giai thich|explanation|reason|note|lưu ý|luu y)\b)/i
  );
  let targetStr = parts[0].trim();

  // If targetStr still has prefix like "Đáp án: ", "Câu 1: ", "Question 1: ", "Key: ", "1. ", "1: "
  targetStr = targetStr.replace(
    /^(?:\*{0,2}(?:đáp án|dap an|answer|key|chọn|đáp án đúng|dap an dung)\*{0,2}[:\s-]*)/i,
    ''
  ).trim();
  targetStr = targetStr.replace(/^(?:câu|cau|question|q)?\s*\d+[:.)\s-]+\s*/i, '').trim();

  // Strip outer markdown formatting like **...**, *...*, `...`, [...], (...)
  targetStr = targetStr.replace(/[*_`[\]()]/g, ' ').trim();

  if (!targetStr) return [];

  // Check 1: Contiguous letters without separators, e.g. "AB", "BC", "ABC", "CE", "ACD", "ABCD" (up to 8 chars, all A-H)
  if (/^[A-Ha-h]{1,8}$/.test(targetStr)) {
    const letters = targetStr.toUpperCase().split('');
    return Array.from(new Set(letters));
  }

  // Check 2: Delimited letters e.g. "A, B", "A, B, C", "A & B", "A và B", "A and B", "A/B", "A - B", "A; B", "A B"
  const delimitedCheck = targetStr.replace(/\b(?:và|and|hoặc|or)\b/gi, ',');
  if (/^[A-Ha-h](?:\s*[,;&/+\s-]\s*[A-Ha-h])+$/i.test(delimitedCheck.trim())) {
    const tokens = delimitedCheck.toUpperCase().match(/[A-H]/g);
    if (tokens && tokens.length > 0) {
      return Array.from(new Set(tokens));
    }
  }

  // Check 3: Letter followed by dot/dash/colon and option content, e.g. "C. Troubleshooting and standardization" or "C - Troubleshooting"
  const optionPrefixMatch = targetStr.match(/^([A-Ha-h])(?:\s*[-–—.:]\s*.*)?$/i);
  if (optionPrefixMatch) {
    return [optionPrefixMatch[1].toUpperCase()];
  }

  // Check 4: General fallback - sanitize non-answer words and search for isolated or grouped A-H tokens
  const sanitized = targetStr.replace(
    /\b(?:và|and|hoặc|or|đáp|án|câu|question|answer|key|is|are|đúng|dung|chọn|đáp án|dap an)\b/gi,
    ' '
  );

  const tokens: string[] = [];
  const wordTokens = sanitized.trim().split(/[\s,;&/+\-]+/);
  for (const w of wordTokens) {
    const cleanWord = w.replace(/[^A-Za-z]/g, '');
    if (/^[A-Ha-h]{1,8}$/.test(cleanWord)) {
      for (const char of cleanWord.toUpperCase()) {
        tokens.push(char);
      }
    }
  }

  return Array.from(new Set(tokens));
}

/**
 * Detect option markers in a line.
 * Supports:
 * - Bold/Italic with punctuation inside/outside: **A.**, **A)**, **A:**, **A**, *A.*, *A*, _A._, **A**.
 * - Parentheses/Brackets: (A), [A], (A):, (A).
 * - Plain letter with punctuation/dash: A., A), A:, A -, A–, A—
 * - Bare letter: A (iii), A 2, A All values..., A
 */
export function matchOptionLine(trimmed: string): { label: string; content: string; isDefinite: boolean } | null {
  if (!trimmed) return null;

  // 1. Markdown bold/italic with punctuation inside or outside:
  // e.g. **A.**, **A:**, **A)**, **A**, *A.*, *A*, _A._, **A**.
  let m = trimmed.match(/^(?:\*{1,2}|_{1,2})([A-Ha-h])(?:[.):-](?:\*{1,2}|_{1,2})|(?:\*{1,2}|_{1,2})[.):-]|\*{1,2}|_{1,2})(?:\s+(.*)|\s*$)/);
  if (m) {
    return { label: m[1].toUpperCase(), content: (m[2] || '').trim(), isDefinite: true };
  }

  // 2. Parenthesized or bracketed:
  // e.g. (A), [A], (A):, (A).
  m = trimmed.match(/^(?:\(([A-Ha-h])\)|\[([A-Ha-h])\])[.):-]?(?:\s+(.*)|\s*$)/);
  if (m) {
    return { label: (m[1] || m[2]).toUpperCase(), content: (m[3] || '').trim(), isDefinite: true };
  }

  // 3. Plain letter with punctuation / dash:
  // e.g. A., A), A:, A -
  m = trimmed.match(/^([A-Ha-h])(?:\s*[-–—]|[.):])(?:\s+(.*)|\s*$)/);
  if (m) {
    return { label: m[1].toUpperCase(), content: (m[2] || '').trim(), isDefinite: true };
  }

  // 4. Bare letter without punctuation:
  // e.g. A (iii), A 2, A All c values..., or just A on its own line
  m = trimmed.match(/^([A-Ha-h])(?:\s+(.*)|\s*$)/);
  if (m) {
    return { label: m[1].toUpperCase(), content: (m[2] || '').trim(), isDefinite: false };
  }

  return null;
}

// Words that commonly start an English sentence with article 'A' or 'An' (e.g. "A ball is thrown", "A network administrator enters...")
const englishArticleWords = /^(?:ball|car|particle|object|function|subset|set|matrix|vector|system|point|plane|line|curve|body|box|block|cylinder|circle|triangle|solid|wire|rod|person|man|woman|student|company|factory|bag|urn|die|coin|card|fair|random|real|constant|linear|continuous|differentiable|given|certain|sample|simple|single|standard|small|large|positive|negative|non-negative|non-zero|closed|open|bounded|finite|infinite|tree|graph|node|vertex|edge|table|row|column|sequence|series|polynomial|root|fraction|number|prime|rate|ratio|score|method|test|rule|formula|theorem|lemma|definition|problem|model|signal|field|force|mass|spring|pendulum|tank|pipe|current|voltage|circuit|charge|proton|electron|atom|molecule|gas|liquid|fluid|wave|beam|light|ray|sound|network|router|switch|packet|frame|device|host|server|client|user|technician|administrator|program|process|thread|computer|variable|class|interface|database|query|file|message|connection|port|service|protocol|layer|header|payload|bit|byte|channel|medium|key|value|token)\b/i;

/**
 * Parse a raw markdown string into structured exam data
 */
export function parseMarkdownExam(
  mdContent: string,
  filename: string = '',
  options: MarkdownParserOptions = {}
): ParsedExamData {
  const { stripAnswers = false } = options;

  // Normalize line breaks
  const rawText = mdContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = rawText.split('\n');

  let title = '';
  let description = '';
  let durationMin = 60;

  // Clean filename for title fallback
  const cleanFilename = filename
    ? filename.replace(/\.[^/.]+$/, '').replace(/^[\\/]/, '').trim()
    : '';

  title = cleanFilename;

  // Question marker regex
  const questionHeaderRegex = /^(?:#{1,6}\s+)?\*{0,2}(?:câu|cau|question)\s*(\d+)[.:)\s-]\*{0,2}/i;

  // Find where the first question starts
  let firstQuestionLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (questionHeaderRegex.test(line)) {
      firstQuestionLineIdx = i;
      break;
    }
  }

  // Extract header metadata before first question
  const headerLines = firstQuestionLineIdx !== -1 ? lines.slice(0, firstQuestionLineIdx) : lines.slice(0, 20);
  for (const hLine of headerLines) {
    const trimmed = hLine.trim();
    if (/^#\s+(.+)/.test(trimmed) && (!title || title === cleanFilename)) {
      title = trimmed.replace(/^#\s+/, '').trim();
    } else if (/^>\s+(.+)/.test(trimmed) && !description) {
      description = trimmed.replace(/^>\s+/, '').trim();
    } else if (/(?:thời gian|duration|time)[:\s]*(\d+)\s*(?:phút|min|p)/i.test(trimmed)) {
      const durMatch = trimmed.match(/(?:thời gian|duration|time)[:\s]*(\d+)\s*(?:phút|min|p)/i);
      if (durMatch) durationMin = parseInt(durMatch[1], 10);
    }
  }

  if (!title) {
    title = cleanFilename || 'Đề thi mới';
  }

  // Standalone global answer map if present (e.g. "Đáp án: 1A 2B 3CD" or table)
  const globalAnswerMap: Record<number, string[]> = {};
  for (const line of lines) {
    const m = line.match(/^(?:đáp án|answer)[:\s]+(.*)$/i);
    if (m && !line.includes('**Câu') && !line.includes('Câu')) {
      const tokens = m[1].trim().split(/[\s,;]+/);
      for (const tok of tokens) {
        const tm = tok.match(/^(\d+)[.:\s-]*([A-Ha-h]+)$/i);
        if (tm) {
          globalAnswerMap[parseInt(tm[1], 10)] = tm[2].toUpperCase().split('');
        }
      }
    }
  }

  // Regex for Answer line prefix:
  const ansPrefixRegex = /^(?:>\s*)?\*{0,2}(?:đáp án|dap an|answer|key|chọn|đáp án đúng|dap an dung)\*{0,2}[:\s-]*(.*)$/i;

  // Regex for Explanation header (locks answers to prevent overwrites):
  const explanationHeaderRegex = /^(?:>\s*)?\*{0,2}(?:giải thích|giai thich|explanation)\*{0,2}[:\s-]*(.*)$/i;

  // Split into raw question chunks
  interface RawQuestionBlock {
    orderNum: number;
    chapterName: string;
    headerText: string;
    lines: string[];
  }

  const rawQuestions: RawQuestionBlock[] = [];
  let currentRaw: RawQuestionBlock | null = null;
  let currentChapter = 'Tổng hợp';

  const startIdx = firstQuestionLineIdx !== -1 ? firstQuestionLineIdx : 0;
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for chapter header
    const chapMatch = trimmed.match(/^(?:#+|\[)?\s*(chương\s+\S[^\]\n]*)/i);
    if (chapMatch && !questionHeaderRegex.test(trimmed)) {
      currentChapter = chapMatch[1].replace(/\]$/, '').trim();
      continue;
    }

    // Check for question header e.g. "**Câu 1.**", "Câu 1:", "### Câu 1."
    const qMatch = trimmed.match(/^(?:#{1,6}\s+)?\*{0,2}(?:câu|cau|question)\s*(\d+)[.:)\s-]\*{0,2}\s*(.*)/i);
    if (qMatch) {
      if (currentRaw) rawQuestions.push(currentRaw);
      currentRaw = {
        orderNum: parseInt(qMatch[1], 10),
        chapterName: currentChapter,
        headerText: qMatch[2] ? qMatch[2].replace(/^\*{0,2}\.?\s*/, '').trim() : '',
        lines: [],
      };
      continue;
    }

    if (currentRaw) {
      currentRaw.lines.push(line);
    }
  }
  if (currentRaw) rawQuestions.push(currentRaw);

  const questions: ParsedExamQuestion[] = [];

  for (const rq of rawQuestions) {
    const qNum = rq.orderNum;
    let contentLines = rq.headerText ? [rq.headerText] : [];
    const optionsList: { label: string; content: string }[] = [];
    let correctAnswers: string[] = [];
    let curOpt: { label: string; contentLines: string[] } | null = null;
    let currentSection: 'question' | 'option' | 'answer' | 'explanation' = 'question';

    function flushOpt() {
      if (curOpt) {
        optionsList.push({
          label: curOpt.label,
          content: curOpt.contentLines.join('\n').trim(),
        });
        curOpt = null;
      }
    }

    for (let idx = 0; idx < rq.lines.length; idx++) {
      const line = rq.lines[idx];
      const trimmed = line.trim();

      // Horizontal separator
      if (/^[-*_]{3,}\s*$/.test(trimmed)) {
        flushOpt();
        currentSection = 'question';
        continue;
      }

      // Check for explicit "Đáp án:" line
      const ansMatch = trimmed.match(ansPrefixRegex);
      if (ansMatch) {
        flushOpt();
        currentSection = 'answer';
        const rest = ansMatch[1].trim();
        if (rest) {
          const labels = extractAnswerLabels(rest);
          if (labels.length > 0) correctAnswers = labels;
        }
        continue;
      }

      // Check for Explanation header (locks answers)
      if (explanationHeaderRegex.test(trimmed)) {
        flushOpt();
        currentSection = 'explanation';
        continue;
      }

      // If already in explanation section, skip processing lines as options or answers
      if (currentSection === 'explanation') {
        continue;
      }

      if (currentSection === 'answer') {
        if (correctAnswers.length === 0) {
          const labels = extractAnswerLabels(trimmed);
          if (labels.length > 0) {
            correctAnswers = labels;
          }
        }
        continue;
      }

      // Check for option marker
      const optMatch = matchOptionLine(trimmed);
      let isValidOption = false;

      if (optMatch) {
        if (optMatch.isDefinite) {
          isValidOption = true;
        } else if (currentSection === 'option' && curOpt) {
          // Inside option section already, any bare B-H is a subsequent option
          if (['B', 'C', 'D', 'E', 'F', 'G', 'H'].includes(optMatch.label)) {
            isValidOption = true;
          }
        } else if (optMatch.label === 'A') {
          // Starting option A without punctuation
          if (englishArticleWords.test(optMatch.content)) {
            isValidOption = false;
          } else {
            // Find subsequent candidate lines in this question
            const subsequentLines = rq.lines.slice(idx + 1);
            const subMatches = subsequentLines
              .map(subL => matchOptionLine(subL.trim()))
              .filter((m): m is NonNullable<typeof m> => Boolean(m));

            // Check if there is another 'A' before the first 'B'
            const firstBIdx = subMatches.findIndex(m => m.label === 'B');
            const anotherAExists = firstBIdx > 0 && subMatches.slice(0, firstBIdx).some(m => m.label === 'A');

            if (!anotherAExists && firstBIdx !== -1) {
              const hasC = subMatches.some(m => m.label === 'C');
              if (hasC || !englishArticleWords.test(optMatch.content)) {
                isValidOption = true;
              }
            }
          }
        }
      }

      if (isValidOption && optMatch) {
        flushOpt();
        currentSection = 'option';
        curOpt = {
          label: optMatch.label,
          contentLines: optMatch.content ? [optMatch.content] : [],
        };
      } else {
        if (currentSection === 'option' && curOpt) {
          curOpt.contentLines.push(line);
        } else {
          contentLines.push(line);
        }
      }
    }

    flushOpt();

    if (stripAnswers) {
      correctAnswers = [];
    } else if (correctAnswers.length === 0 && globalAnswerMap[qNum]) {
      correctAnswers = globalAnswerMap[qNum];
    }

    const finalOptions: ParsedExamOption[] = optionsList.map(o => ({
      label: o.label,
      content: o.content,
      isCorrect: !stripAnswers && correctAnswers.includes(o.label),
    }));

    questions.push({
      orderNum: qNum,
      content: contentLines.join('\n').trim(),
      chapterName: rq.chapterName,
      options: finalOptions,
      correctAnswers: stripAnswers ? [] : correctAnswers,
    });
  }

  // Normalize order numbers
  questions.forEach((q, idx) => {
    if (!q.orderNum) q.orderNum = idx + 1;
  });

  const unansweredQuestions = questions
    .filter(q => !q.options.some(o => o.isCorrect))
    .map(q => q.orderNum);

  return {
    filename,
    title,
    description,
    durationMin,
    questions,
    totalQuestions: questions.length,
    unansweredQuestions,
    selected: true,
  };
}

/**
 * Extract and parse all markdown/text exams from a ZIP file
 */
export async function extractExamsFromZip(
  file: File,
  options: MarkdownParserOptions = {}
): Promise<ParsedExamData[]> {
  const zip = await JSZip.loadAsync(file);
  const results: ParsedExamData[] = [];
  const entries: { path: string; file: JSZip.JSZipObject }[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    if (relativePath.includes('__MACOSX') || relativePath.startsWith('.') || relativePath.includes('/.')) return;
    if (/\.(md|txt|markdown)$/i.test(relativePath)) {
      entries.push({ path: relativePath, file: zipEntry });
    }
  });

  // Sort files naturally so exams keep logical order
  entries.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' }));

  for (const entry of entries) {
    const content = await entry.file.async('string');
    if (!content.trim()) continue;
    const filename = entry.path.split(/[\\/]/).pop() || entry.path;
    const parsed = parseMarkdownExam(content, filename, options);
    if (parsed.questions.length > 0) {
      results.push(parsed);
    }
  }

  return results;
}

/**
 * Extract and parse a single file (.md or .txt)
 */
export async function extractExamFromFile(
  file: File,
  options: MarkdownParserOptions = {}
): Promise<ParsedExamData> {
  const content = await file.text();
  return parseMarkdownExam(content, file.name, options);
}

