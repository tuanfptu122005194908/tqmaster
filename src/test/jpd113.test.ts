import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { parseMarkdownExam } from '../lib/markdownExamParser';

describe('JPD113 Japanese Exam Parsing', () => {
  const fePath = path.resolve(__dirname, 'fixtures/JPD113_SU26_FE.md');
  const rePath = path.resolve(__dirname, 'fixtures/JPD113_SU26_RE.md');

  it('correctly parses JPD113_SU26_FE.md with zero duplicate options and exact 4 options per question', () => {
    expect(fs.existsSync(fePath)).toBe(true);
    const content = fs.readFileSync(fePath, 'utf-8');
    const result = parseMarkdownExam(content, 'JPD113_SU26_FE.md');

    expect(result.questions.length).toBe(30);
    expect(result.unansweredQuestions.length).toBe(0);

    // Verify all 30 questions have exactly 4 options: A, B, C, D
    for (const q of result.questions) {
      expect(q.options.length, `Question ${q.orderNum} should have 4 options`).toBe(4);
      expect(q.options.map(o => o.label)).toEqual(['A', 'B', 'C', 'D']);
      const correctCount = q.options.filter(o => o.isCorrect).length;
      expect(correctCount, `Question ${q.orderNum} should have exactly 1 correct answer`).toBe(1);
    }

    // Check Question 26 specifically (from user request)
    const q26 = result.questions.find(q => q.orderNum === 26);
    expect(q26).toBeDefined();
    // Dialogue content should preserve Speaker A and Speaker B
    expect(q26!.content).toContain('A. この料理は何ですか。');
    expect(q26!.content).toContain('B. （ ）です。');
    expect(q26!.options[0].content).toBe('ぶたにくの料理');
    expect(q26!.options[0].isCorrect).toBe(true);
    expect(q26!.options[1].content).toBe('くにの料理');
    expect(q26!.options[2].content).toBe('ぶたにくで料理');
    expect(q26!.options[3].content).toBe('ぶたにくから料理');

    // Check Question 25 specifically
    const q25 = result.questions.find(q => q.orderNum === 25);
    expect(q25).toBeDefined();
    expect(q25!.content).toContain('A. はじめまして、パクです。よろしくお願いします。');
    expect(q25!.content).toContain('B. ナタポンです。（ ）。');
    expect(q25!.options[0].content).toBe('こちらこそ');
    expect(q25!.options[0].isCorrect).toBe(true);
  });

  it('correctly parses JPD113_SU26_RE.md with dialogue rollback and exact 4 options per question', () => {
    expect(fs.existsSync(rePath)).toBe(true);
    const content = fs.readFileSync(rePath, 'utf-8');
    const result = parseMarkdownExam(content, 'JPD113_SU26_RE.md');

    expect(result.questions.length).toBe(30);
    expect(result.unansweredQuestions.length).toBe(0);

    for (const q of result.questions) {
      expect(q.options.length, `Question ${q.orderNum} should have 4 options`).toBe(4);
      expect(q.options.map(o => o.label)).toEqual(['A', 'B', 'C', 'D']);
      const correctCount = q.options.filter(o => o.isCorrect).length;
      expect(correctCount, `Question ${q.orderNum} should have exactly 1 correct answer`).toBe(1);
    }

    // Check Question 1 (Dialogue Speaker A and B in question body)
    const q1 = result.questions.find(q => q.orderNum === 1);
    expect(q1).toBeDefined();
    expect(q1!.content).toContain('A. 「それは 辞書(じしょ)ですか。」');
    expect(q1!.content).toContain('B. 「はい、( )。」');
    expect(q1!.options[0].content).toBe('そうです');
    expect(q1!.options[0].isCorrect).toBe(true);
    expect(q1!.options[1].content).toBe('いいです');
    expect(q1!.options[2].content).toBe('ちがいます');
    expect(q1!.options[3].content).toBe('わかりました');

    // Check Question 7 (3-turn dialogue: A - B - A)
    const q7 = result.questions.find(q => q.orderNum === 7);
    expect(q7).toBeDefined();
    expect(q7!.content).toContain('A. 「IMCの 電話番号(でんわばんごう)は 何番(なんばん)ですか。」');
    expect(q7!.content).toContain('B. 「3413の3756です。」');
    expect(q7!.content).toContain('A. 「( )、ありがとうございました。」');
    expect(q7!.options[0].content).toBe('そうですか');
    expect(q7!.options[0].isCorrect).toBe(true);
    expect(q7!.options[1].content).toBe('じゃ');
    expect(q7!.options[2].content).toBe('そうですよ');
    expect(q7!.options[3].content).toBe('どうも');
  });
});
