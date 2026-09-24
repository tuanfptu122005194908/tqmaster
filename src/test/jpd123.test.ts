import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseMarkdownExam } from '../lib/markdownExamParser';

describe('JPD123 Japanese Exam Parsing', () => {
  const fePath = path.resolve(__dirname, 'fixtures/JPD123_SU26_FE.md');
  const rePath = path.resolve(__dirname, 'fixtures/JPD123_SU26_RE.md');

  it('checks JPD123_SU26_FE.md', () => {
    expect(fs.existsSync(fePath)).toBe(true);
    const content = fs.readFileSync(fePath, 'utf-8');
    const result = parseMarkdownExam(content, 'JPD123_SU26_FE.md');

    expect(result.questions.length).toBe(30);
    expect(result.unansweredQuestions.length).toBe(0);

    for (const q of result.questions) {
      expect(q.options.length, `Question ${q.orderNum} should have 4 options`).toBe(4);
      expect(q.options.map(o => o.label)).toEqual(['A', 'B', 'C', 'D']);
      const correctCount = q.options.filter(o => o.isCorrect).length;
      expect(correctCount, `Question ${q.orderNum} should have exactly 1 correct answer`).toBe(1);
    }
  });

  it('checks JPD123_SU26_RE.md', () => {
    expect(fs.existsSync(rePath)).toBe(true);
    const content = fs.readFileSync(rePath, 'utf-8');
    const result = parseMarkdownExam(content, 'JPD123_SU26_RE.md');

    expect(result.questions.length).toBe(30);
    expect(result.unansweredQuestions.length).toBe(0);

    for (const q of result.questions) {
      expect(q.options.length, `Question ${q.orderNum} should have 4 options`).toBe(4);
      expect(q.options.map(o => o.label)).toEqual(['A', 'B', 'C', 'D']);
      const correctCount = q.options.filter(o => o.isCorrect).length;
      expect(correctCount, `Question ${q.orderNum} should have exactly 1 correct answer`).toBe(1);
    }
  });
});
