/**
 * wordParser.ts
 * Smart parser for mammoth HTML output → structured exam questions.
 * Handles:
 *  - "Câu N:" / "Cau N:" / "N." question markers
 *  - "A." / "A)" option markers (A–H)
 *  - "Đáp án:" / "Answer:" answer keys
 *  - "Chương N" chapter markers
 *  - <img src="data:..."> inline images mapped to correct question/option
 */

export interface ParsedOption {
  label: string;       // 'A' | 'B' | 'C' | 'D' | ...
  content: string;
  imageDataUrl?: string; // base64 data URL extracted from img tag in option
}

export interface ParsedQuestion {
  orderNum: number;
  content: string;
  chapterName: string;
  imageDataUrl?: string;       // first image before first option
  extraImageDataUrls: string[]; // additional images before first option
  options: ParsedOption[];
  correctAnswers: string[];    // e.g. ['A'], ['B', 'C']
}

/** Parse raw HTML from mammoth.convertToHtml() into structured questions */
export function parseHtmlToQuestions(html: string): ParsedQuestion[] {
  // Use a DOM parser to walk nodes
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  // Collect all child nodes as a flat list of "segments"
  type Segment =
    | { type: 'text'; text: string }
    | { type: 'img'; dataUrl: string };

  const segments: Segment[] = [];

  function collectSegments(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text) segments.push({ type: 'text', text });
    } else if (node.nodeName === 'IMG') {
      const el = node as HTMLImageElement;
      const src = el.getAttribute('src') || '';
      if (src.startsWith('data:')) {
        segments.push({ type: 'img', dataUrl: src });
      }
    } else {
      // For block elements (p, div, h1-h6, li, etc.), add newline after
      const isBlock = /^(p|div|h[1-6]|li|tr|br|hr)$/i.test(node.nodeName);
      node.childNodes.forEach(child => collectSegments(child));
      if (isBlock) {
        segments.push({ type: 'text', text: '\n' });
      }
    }
  }

  body.childNodes.forEach(n => collectSegments(n));

  // Build a line-by-line structure, tracking image positions
  type Line = { text: string; imgBefore?: string };
  const lines: Line[] = [];
  let currentLine = '';
  let pendingImg: string | undefined;

  for (const seg of segments) {
    if (seg.type === 'img') {
      // Store image — will be flushed with next text line
      if (currentLine.trim()) {
        lines.push({ text: currentLine.trim(), imgBefore: pendingImg });
        currentLine = '';
        pendingImg = seg.dataUrl;
      } else {
        pendingImg = seg.dataUrl;
      }
    } else {
      // text segment
      const parts = seg.text.split('\n');
      for (let i = 0; i < parts.length; i++) {
        currentLine += parts[i];
        if (i < parts.length - 1) {
          // newline: flush current line
          const trimmed = currentLine.trim();
          if (trimmed || pendingImg) {
            lines.push({ text: trimmed, imgBefore: pendingImg });
            pendingImg = undefined;
          }
          currentLine = '';
        }
      }
    }
  }
  // flush last line
  if (currentLine.trim() || pendingImg) {
    lines.push({ text: currentLine.trim(), imgBefore: pendingImg });
  }

  // --- Regex patterns ---
  const QUESTION_RE = /^(?:câu\s+|cau\s+)?(\d+)[.:)]\s*(.*)/i;
  const OPTION_RE   = /^([A-Ha-h])[.)]\s*(.*)/;
  const ANSWER_RE   = /^(?:đáp án|answer)\s*[:.\s]\s*(.*)/i;
  const CHAPTER_RE  = /^(?:#+|\[)?\s*(chương\s+\S[^\]\n]*)/i;

  // Build answer map from "Đáp án: 1A 2BC 3D" line
  const answerMap: Record<number, string[]> = {};
  for (const line of lines) {
    const am = ANSWER_RE.exec(line.text);
    if (am) {
      const tokens = am[1].trim().split(/[\s,;]+/);
      for (const tok of tokens) {
        const m = tok.match(/^(\d+)([A-Ha-h]+)$/i);
        if (m) answerMap[parseInt(m[1])] = m[2].toUpperCase().split('');
      }
    }
  }

  const questions: ParsedQuestion[] = [];
  let cur: ParsedQuestion | null = null;
  let currentChapter = 'Tổng hợp';
  let qNum = 0;
  let inOption = false;
  let currentOptLabel = '';

  const pushCur = () => {
    if (cur) {
      cur.content = cur.content.trim();
      if (cur.options.length > 0) {
        cur.options[cur.options.length - 1].content =
          cur.options[cur.options.length - 1].content.trim();
      }
      questions.push(cur);
    }
  };

  for (const line of lines) {
    const { text, imgBefore } = line;

    // Skip answer lines
    if (ANSWER_RE.test(text)) continue;

    // Chapter marker
    const chapM = CHAPTER_RE.exec(text);
    if (chapM && !QUESTION_RE.test(text)) {
      currentChapter = chapM[1].replace(/\]$/, '').trim();
      continue;
    }

    // Question marker
    const qM = QUESTION_RE.exec(text);
    if (qM) {
      pushCur();
      qNum++;
      inOption = false;
      currentOptLabel = '';
      cur = {
        orderNum: qNum,
        content: qM[2] || '',
        chapterName: currentChapter,
        imageDataUrl: imgBefore,
        extraImageDataUrls: [],
        options: [],
        correctAnswers: answerMap[qNum] ?? [],
      };
      continue;
    }

    // Option marker
    const optM = OPTION_RE.exec(text);
    if (optM && cur) {
      // finalize previous option
      if (inOption && cur.options.length > 0) {
        cur.options[cur.options.length - 1].content =
          cur.options[cur.options.length - 1].content.trim();
      }
      currentOptLabel = optM[1].toUpperCase();
      inOption = true;
      cur.options.push({
        label: currentOptLabel,
        content: optM[2] || '',
        imageDataUrl: imgBefore,
      });
      continue;
    }

    // Continuation line
    if (cur) {
      if (inOption && cur.options.length > 0) {
        // append to current option
        const lastOpt = cur.options[cur.options.length - 1];
        if (text) lastOpt.content += (lastOpt.content ? '\n' : '') + text;
        if (imgBefore && !lastOpt.imageDataUrl) lastOpt.imageDataUrl = imgBefore;
      } else {
        // append to question content
        if (text) cur.content += (cur.content ? '\n' : '') + text;
        // image before first option
        if (imgBefore) {
          if (!cur.imageDataUrl) {
            cur.imageDataUrl = imgBefore;
          } else {
            cur.extraImageDataUrls.push(imgBefore);
          }
        }
      }
    }
  }

  pushCur();
  return questions;
}
