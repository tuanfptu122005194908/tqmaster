import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseMarkdownExam } from '../lib/markdownExamParser';

describe('PRO192_SU26_FE parse test', () => {
  it('should parse PRO192_SU26_FE.md correctly', () => {
    const filePath = 'd:/wd c sang d/Downloads/PRO192_SU26_FE.md';
    if (!fs.existsSync(filePath)) {
      console.log('File not found at:', filePath);
      return;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = parseMarkdownExam(content, 'PRO192_SU26_FE.md');
    console.log('Parsed title:', result.title);
    console.log('Total questions:', result.totalQuestions);
    console.log('Unanswered count:', result.unansweredQuestions.length);
    console.log('Unanswered questions:', result.unansweredQuestions);

    expect(result.totalQuestions).toBe(50);
    expect(result.unansweredQuestions.length).toBe(0);

    let imperfectCount = 0;
    result.questions.forEach(q => {
      const optLabels = q.options.map(o => o.label).join(', ');
      const hasMissingA = !q.options.some(o => o.label === 'A');
      const optCount = q.options.length;
      if (optCount < 4 || hasMissingA || q.correctAnswers.length === 0) {
        imperfectCount++;
        console.log(`IMPERFECT: Q${q.orderNum} (Opts: ${optCount}) [${optLabels}] Correct: ${q.correctAnswers.join(',')}`);
      }
    });

    console.log('Imperfect count:', imperfectCount);
    expect(imperfectCount).toBe(0);
  });
});
