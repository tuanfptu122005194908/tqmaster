import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { parseHtmlToQuestions } from '../lib/wordParser';

describe('wordParser', () => {
  const sampleDocxPath = 'd:/wd c sang d/Downloads/Phần mềm làm việc/Tool lấy ảnh FUO/tool viết lại đề/output/NWC204_SU26_RE.docx';

  it('should parse NWC204_SU26_RE.docx with exactly 50 questions and preserve text + image in Question 10', async () => {
    if (!fs.existsSync(sampleDocxPath)) {
      console.warn('Sample docx not found, skipping file read test');
      return;
    }

    const buffer = fs.readFileSync(sampleDocxPath);
    const result = await mammoth.convertToHtml({ buffer });
    const questions = parseHtmlToQuestions(result.value);

    // 1. Total questions must be 50 (not split into 53 by IP addresses or numbered lists)
    expect(questions).toHaveLength(50);

    // 2. Question 10 must have both text and image
    const q10 = questions[9];
    expect(q10.orderNum).toBe(10);
    expect(q10.content).toContain('Refer to the exhibit');
    expect(q10.content).toContain('172.16.16.0/22');
    expect(q10.imageDataUrl).toBeTruthy();
    expect(q10.imageDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(q10.options).toHaveLength(5);
    expect(q10.options.map(o => o.label)).toEqual(['A', 'B', 'C', 'D', 'E']);

    // 3. Question 21 (matching with premise options A, B, C followed by real A, B, C, D)
    const q21 = questions[20];
    expect(q21.orderNum).toBe(21);
    expect(q21.content).toContain('Match the commands to the correct actions');
    expect(q21.options.map(o => o.label)).toEqual(['A', 'B', 'C', 'D']);
    expect(q21.options[0].content).toBe('A3-B5-C1');

    // 4. Question 33 (numbered items 1. and 2. inside question body)
    const q33 = questions[32];
    expect(q33.orderNum).toBe(33);
    expect(q33.content).toContain('backbone cabling');
    expect(q33.options.map(o => o.label)).toEqual(['A', 'B', 'C', 'D']);

    // 5. Question 50 (last question)
    const q50 = questions[49];
    expect(q50.orderNum).toBe(50);
    expect(q50.content).toContain('SSH');
    expect(q50.options.map(o => o.label)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('should parse per-question answer keys correctly', () => {
    const html = `
      <p><strong>Câu 1: </strong>Which protocol is connection-oriented?</p>
      <p><strong>A. </strong>UDP</p>
      <p><strong>B. </strong>TCP</p>
      <p><strong>C. </strong>IP</p>
      <p><strong>Đáp án: </strong>B</p>
      <p><strong>Câu 2: </strong>Select two routing protocols.</p>
      <p><strong>A. </strong>OSPF</p>
      <p><strong>B. </strong>BGP</p>
      <p><strong>C. </strong>DNS</p>
      <p><strong>Answer: </strong>A, B</p>
    `;
    const questions = parseHtmlToQuestions(html);
    expect(questions).toHaveLength(2);
    expect(questions[0].correctAnswers).toEqual(['B']);
    expect(questions[1].correctAnswers).toEqual(['A', 'B']);
  });

  it('should detect options marked with asterisk or checkmark as correct answers', () => {
    const html = `
      <p><strong>Câu 1: </strong>What is the capital of Vietnam?</p>
      <p><strong>*A. </strong>Hanoi</p>
      <p><strong>B. </strong>Da Nang</p>
      <p><strong>C. </strong>Ho Chi Minh City</p>
    `;
    const questions = parseHtmlToQuestions(html);
    expect(questions).toHaveLength(1);
    expect(questions[0].correctAnswers).toEqual(['A']);
    expect(questions[0].options[0].content).toBe('Hanoi');
  });

  it('should parse bare numbers sequentially when no prefix exists', () => {
    const html = `
      <p>1. What is IPv4 address size?</p>
      <p>A. 32 bits</p>
      <p>B. 64 bits</p>
      <p>C. 128 bits</p>
      <p>2. What is IPv6 address size?</p>
      <p>A. 32 bits</p>
      <p>B. 64 bits</p>
      <p>C. 128 bits</p>
    `;
    const questions = parseHtmlToQuestions(html);
    expect(questions).toHaveLength(2);
    expect(questions[0].orderNum).toBe(1);
    expect(questions[1].orderNum).toBe(2);
  });
});
