/**
 * wordParser.ts
 * Smart parser for mammoth HTML output → structured exam questions.
 * Handles:
 *  - "Câu N:" / "Cau N:" / "Question N:" / "Q N:" / "Bài N:" and bare "N." question markers
 *  - "A." / "A)" option markers (A–H)
 *  - "Đáp án:" / "Answer:" / "Key:" answer keys (both global at document end/start and per-question)
 *  - Option marks like *A., [x] A.
 *  - Matching question option resets (premises converted to question content)
 *  - "Chương N" chapter markers
 *  - <img src="data:..."> inline images mapped to correct question/option with text preserved
 */

import { matchOptionLine, extractAnswerLabels } from './markdownExamParser';

export interface ParsedOption {
  label: string;          // 'A' | 'B' | 'C' | 'D' | ...
  content: string;
  imageDataUrl?: string;  // base64 data URL extracted from img tag in option
}

export interface ParsedQuestion {
  orderNum: number;
  content: string;
  chapterName: string;
  imageDataUrl?: string;        // primary image for question
  extraImageDataUrls: string[]; // additional images for question
  options: ParsedOption[];
  correctAnswers: string[];     // e.g. ['A'], ['B', 'C']
}

/** Check if an option line is explicitly marked as correct, e.g. *A., [x] A., A*. */
function checkOptionMarkedCorrect(text: string): boolean {
  return /^\s*(?:\*|\[[xX]\]|\([xX]\))\s*[A-Ha-h][.:)]/i.test(text) ||
         /^\s*[A-Ha-h]\*\s*[.:)]/i.test(text);
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
      // For block elements (p, div, h1-h6, li, tr, etc.), add newline after
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
  // Explicit question prefix pattern (e.g. Câu 1:, Question 1., Q1:, Bài 1:)
  const EXPLICIT_PREFIX_RE = /^(?:câu|cau|question|q\b|q\.|bài|bai)\s*(\d+)[.:)\s-]\s*(.*)/i;

  // Determine document question style:
  // If the document has any explicit question prefix, lock question detection to explicit prefix only!
  // This prevents IP addresses (e.g. 172.16.16.0/22?), numbered lists (1. item A, 2. item B),
  // or decimals from being misidentified as questions.
  const hasExplicitPrefix = lines.some(l => EXPLICIT_PREFIX_RE.test(l.text.trim()));

  // Fallback for documents that ONLY use bare numbers (1. Question text, 2. Question text)
  // Must be followed by whitespace AND a letter (never a digit, preventing 172.16 or 1.1)
  const BARE_NUMBER_RE = /^(\d+)[.:)]\s+([A-Za-z\u00C0-\u024F\u1EA0-\u1EF9].*)/;

  const ANSWER_RE = /^(?:đáp án|dap an|answer|key|đáp án đúng|dap an dung)\s*[:.\s]\s*(.*)/i;
  const CHAPTER_RE = /^(?:#+|\[)?\s*(chương\s+\S[^\]\n]*)/i;

  // Pre-scan: Build global answer map from lines like "Đáp án: 1A 2BC 3D" or "Answer: 1. A, 2. B"
  const globalAnswerMap: Record<number, string[]> = {};
  for (const line of lines) {
    const am = ANSWER_RE.exec(line.text.trim());
    if (am) {
      const rest = am[1].trim();
      const tokens = rest.split(/[\s,;]+/);
      let matchedAny = false;
      for (const tok of tokens) {
        const m = tok.match(/^(\d+)[.:)]?([A-Ha-h]+)$/i) || tok.match(/^(\d+)\s*[-=:]\s*([A-Ha-h]+)$/i);
        if (m) {
          globalAnswerMap[parseInt(m[1])] = m[2].toUpperCase().split('');
          matchedAny = true;
        }
      }
      // Also try pattern "1. A, 2. B, 3. C"
      if (!matchedAny) {
        const pairs = rest.matchAll(/(\d+)[.:)]?\s*([A-Ha-h]+)/gi);
        for (const p of pairs) {
          globalAnswerMap[parseInt(p[1])] = p[2].toUpperCase().split('');
        }
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
      // If correctAnswers still empty, check globalAnswerMap
      if (cur.correctAnswers.length === 0 && globalAnswerMap[cur.orderNum]) {
        cur.correctAnswers = globalAnswerMap[cur.orderNum];
      }
      questions.push(cur);
    }
  };

  for (let lIdx = 0; lIdx < lines.length; lIdx++) {
    const line = lines[lIdx];
    const { text, imgBefore } = line;
    const trimmed = text.trim();

    // 1. Check for Chapter marker
    const chapM = CHAPTER_RE.exec(trimmed);
    if (chapM && !EXPLICIT_PREFIX_RE.test(trimmed)) {
      currentChapter = chapM[1].replace(/\]$/, '').trim();
      continue;
    }

    // 2. Check for Question marker
    let isQuestion = false;
    let detectedOrder = 0;
    let questionContent = '';

    if (hasExplicitPrefix) {
      const qM = EXPLICIT_PREFIX_RE.exec(trimmed);
      if (qM) {
        isQuestion = true;
        detectedOrder = parseInt(qM[1]) || (qNum + 1);
        questionContent = qM[2] || '';
      }
    } else {
      const bM = BARE_NUMBER_RE.exec(trimmed);
      if (bM) {
        const num = parseInt(bM[1]);
        // Validate bare number sequence: either first question (<=5) or strictly sequential (+1)
        if (qNum === 0 ? num <= 5 : (num === qNum + 1 || num === qNum + 2)) {
          isQuestion = true;
          detectedOrder = num;
          questionContent = bM[2] || '';
        }
      }
    }

    if (isQuestion) {
      pushCur();
      qNum = detectedOrder;
      inOption = false;
      currentOptLabel = '';
      cur = {
        orderNum: qNum,
        content: questionContent,
        chapterName: currentChapter,
        imageDataUrl: imgBefore,
        extraImageDataUrls: [],
        options: [],
        correctAnswers: globalAnswerMap[qNum] ?? [],
      };
      continue;
    }

    // 3. Check for Per-Question Answer marker (e.g. "Đáp án: A" or "Answer: B, C" under options)
    const ansMatch = ANSWER_RE.exec(trimmed);
    if (ansMatch && cur) {
      const rest = ansMatch[1].trim();
      const labels = extractAnswerLabels(rest);
      if (labels.length > 0) {
        cur.correctAnswers = Array.from(new Set([...cur.correctAnswers, ...labels]));
        continue;
      }
    }

    // 4. Check for Option marker (A., B., C., D...)
    const isMarked = checkOptionMarkedCorrect(trimmed);
    const cleanedForOpt = trimmed
      .replace(/^\s*(?:\*|\[[xX]\]|\([xX]\))\s*/, '')
      .replace(/^([A-Ha-h])\*\s*([.:)])/i, '$1$2');
    const optMatch = matchOptionLine(cleanedForOpt);
    let isOpt = false;

    if (optMatch && cur) {
      if (optMatch.isDefinite) {
        isOpt = true;
      } else if (inOption && ['B', 'C', 'D', 'E', 'F', 'G', 'H'].includes(optMatch.label)) {
        isOpt = true;
      }

      // Self-healing: Detect when options reset back to 'A'
      // Example: Matching question where premises are listed as A., B., C.,
      // followed by actual multiple-choice options A., B., C., D.
      if (optMatch.label === 'A' && cur.options.length > 0) {
        const subsequentHasB = lines.slice(lIdx + 1, lIdx + 15).some(sub => {
          const sm = matchOptionLine(sub.text.trim());
          return sm && sm.label === 'B';
        });
        if (subsequentHasB) {
          // If previous option A was just started on false sentence (single opt), rollback
          if (cur.options.length === 1 && currentOptLabel === 'A') {
            const falseOpt = cur.options.pop()!;
            const restored = /^(?:A\b|Câu|Question)/i.test(falseOpt.content)
              ? falseOpt.content
              : `A ${falseOpt.content}`;
            cur.content = cur.content ? `${cur.content}\n\n${restored}` : restored;
          } else {
            // Previous options (e.g. A, B, C) were actually matching premises!
            const prevTexts = cur.options.map(o => `${o.label}. ${o.content}`).join('\n');
            cur.content = cur.content ? `${cur.content}\n${prevTexts}` : prevTexts;
            cur.options = [];
          }
          currentOptLabel = 'A';
          isOpt = true;
        }
      } else if (optMatch.label === 'A' && !inOption) {
        // Lookahead for B to confirm it's truly an option and not regular text starting with 'A ...'
        const subsequentLines = lines.slice(lIdx + 1, lIdx + 15);
        const subMatches = subsequentLines
          .map(sub => matchOptionLine(sub.text.trim()))
          .filter(Boolean);
        const firstBIdx = subMatches.findIndex(m => m && m.label === 'B');
        const anotherAExists = firstBIdx > 0 && subMatches.slice(0, firstBIdx).some(m => m && m.label === 'A');

        if (!anotherAExists && firstBIdx !== -1) {
          isOpt = true;
        }
      }
    }

    if (isOpt && optMatch && cur) {
      // finalize previous option content
      if (inOption && cur.options.length > 0) {
        cur.options[cur.options.length - 1].content =
          cur.options[cur.options.length - 1].content.trim();
      }
      currentOptLabel = optMatch.label;
      inOption = true;

      // Clean content from leading asterisk or checkmark
      let cleanContent = optMatch.content || '';
      cleanContent = cleanContent.replace(/^\s*\*\s*/, '').trim();

      if (isMarked && !cur.correctAnswers.includes(currentOptLabel)) {
        cur.correctAnswers.push(currentOptLabel);
      }

      cur.options.push({
        label: currentOptLabel,
        content: cleanContent,
        imageDataUrl: imgBefore,
      });
      continue;
    }

    // 5. Continuation line (appends to current option or question content)
    if (cur) {
      if (inOption && cur.options.length > 0) {
        const lastOpt = cur.options[cur.options.length - 1];
        if (text) lastOpt.content += (lastOpt.content ? '\n' : '') + text;
        if (imgBefore && !lastOpt.imageDataUrl) lastOpt.imageDataUrl = imgBefore;
      } else {
        if (text) cur.content += (cur.content ? '\n' : '') + text;
        // Images before or within question body
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
