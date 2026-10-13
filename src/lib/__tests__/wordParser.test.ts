import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { parseHtmlToQuestions, matchAnswerToOptions, normalizeForCompare } from '../wordParser';
import { extractExamsFromZip } from '../markdownExamParser';

describe('wordParser - New Bullet & Content Answer Format', () => {
  it('normalizes strings correctly for matching', () => {
    expect(normalizeForCompare('"(ISC)2."')).toBe('(isc)2');
    expect(normalizeForCompare('  Threat Hunter;  ')).toBe('threat hunter');
  });

  it('matches single exact answer text to option label', () => {
    const options = [
      { label: 'A', content: 'CompTIA' },
      { label: 'B', content: '(ISC)2' },
      { label: 'C', content: 'IEEE' },
      { label: 'D', content: 'GIAC' },
    ];
    expect(matchAnswerToOptions('(ISC)2', options)).toEqual(['B']);
  });

  it('matches multiple comma-separated answers to option labels', () => {
    const options = [
      { label: 'A', content: 'security monitoring' },
      { label: 'B', content: 'threat intelligence' },
      { label: 'C', content: 'proxy service' },
      { label: 'D', content: 'firewall appliance' },
      { label: 'E', content: 'intrusion prevention' },
      { label: 'F', content: 'log management' },
    ];
    const ansText = 'log management, security monitoring, threat intelligence';
    expect(matchAnswerToOptions(ansText, options)).toEqual(['A', 'B', 'F']);
  });

  it('parses Bo_De_1_Tong_Quan_SOC_Quy_Dinh.docx correctly (23 questions, all answered)', async () => {
    const filePath = path.resolve(process.cwd(), 'Bo_De_1_Tong_Quan_SOC_Quy_Dinh.docx');
    const buffer = fs.readFileSync(filePath);
    const { value: html } = await mammoth.convertToHtml({ buffer });

    const questions = parseHtmlToQuestions(html);
    expect(questions.length).toBe(23);

    // Verify all 23 questions have valid options and detected correct answers
    for (const q of questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(4);
      expect(q.correctAnswers.length).toBeGreaterThanOrEqual(1);
    }

    // Verify specific questions
    expect(questions[0].correctAnswers).toEqual(['B']); // Q1: (ISC)2
    expect(questions[1].correctAnswers).toEqual(['C']); // Q2: SOAR
    expect(questions[2].correctAnswers).toEqual(['A']); // Q3: Tier 3 SME
    expect(questions[3].correctAnswers).toEqual(['A', 'B', 'F']); // Q4: choose 3
    expect(questions[7].correctAnswers).toEqual(['A', 'C', 'E']); // Q8: technologies, processes, people
    expect(questions[10].correctAnswers).toEqual(['D', 'E']); // Q11: street address, credit card number
    expect(questions[20].correctAnswers).toEqual(['B', 'D']); // Q21: Wi-Fi, Keep device OS updated
    expect(questions[22].correctAnswers).toEqual(['B', 'C', 'D']); // Q23: choose 3
  });

  it('preserves backwards compatibility with standard format (full-quiz-chuong-16-den-28-390-cau.docx)', async () => {
    const filePath = path.resolve(process.cwd(), 'full-quiz-chuong-16-den-28-390-cau.docx');
    const buffer = fs.readFileSync(filePath);
    const { value: html } = await mammoth.convertToHtml({ buffer });

    const questions = parseHtmlToQuestions(html);
    expect(questions.length).toBe(390);

    // Question 1 should be chapter 16 and answer A
    expect(questions[0].chapterName).toContain('Chương 16');
    expect(questions[0].options.length).toBe(4);
    expect(questions[0].correctAnswers).toEqual(['A']);
  });

  it('recognizes Bo_De_1 inside a ZIP archive using extractExamsFromZip', async () => {
    const docxPath = path.resolve(process.cwd(), 'Bo_De_1_Tong_Quan_SOC_Quy_Dinh.docx');
    const docxBuffer = fs.readFileSync(docxPath);

    // Create a zip with the docx file inside
    const zip = new JSZip();
    zip.file('Bo_De_1_Tong_Quan_SOC_Quy_Dinh.docx', docxBuffer);
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Mock File for extractExamsFromZip
    const file = new File([zipBuffer], 'test_exams.zip', { type: 'application/zip' });

    const exams = await extractExamsFromZip(file);
    expect(exams.length).toBeGreaterThanOrEqual(1);

    const exam = exams[0];
    expect(exam.totalQuestions).toBe(23);
    expect(exam.questions.length).toBe(23);
    // Ensure all questions have answers detected
    expect(exam.unansweredQuestions.length).toBe(0);
  });
});
