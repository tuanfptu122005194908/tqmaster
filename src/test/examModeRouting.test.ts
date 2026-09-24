import { describe, it, expect } from 'vitest';
import { checkIsTextExam } from '../lib/examRouting';

describe('checkIsTextExam routing logic', () => {
  it('should classify Word exam with text options and 0 images as Text Exam', () => {
    const questions = [
      {
        content: 'What is the pooled variance?',
        options: [
          { content: '293.5' },
          { content: '280.6' },
          { content: '277.8' },
          { content: '296.2' },
        ],
      },
    ];
    expect(checkIsTextExam(questions)).toBe(true);
  });

  it('should classify Word exam with text options and 1-2 inline images as Text Exam (Fix regression)', () => {
    // 50-question exam where question 10 has a diagram image, but all questions have text options
    const questions = Array.from({ length: 50 }, (_, i) => ({
      content: `Question ${i + 1}`,
      image_url: i === 9 ? 'https://example.com/diagram.png' : null,
      options: [
        { content: 'Option A' },
        { content: 'Option B' },
        { content: 'Option C' },
        { content: 'Option D' },
      ],
    }));

    expect(checkIsTextExam(questions)).toBe(true);
  });

  it('should classify pure screenshot exams (FUOverflow) where options are empty as Image Exam', () => {
    // 50 questions, each is a screenshot, options are empty in database
    const questions = Array.from({ length: 50 }, (_, i) => ({
      content: null,
      image_url: `https://example.com/screenshot_${i + 1}.png`,
      options: [
        { content: '' },
        { content: '' },
        { content: '' },
        { content: '' },
      ],
    }));

    expect(checkIsTextExam(questions)).toBe(false);
  });

  it('should classify PE scanned documents as Image Exam', () => {
    const questions = [
      {
        content: '',
        image_url: 'https://example.com/pe_page_1.png',
        options: [
          { content: null },
          { content: null },
          { content: null },
          { content: null },
        ],
      },
      {
        content: '',
        image_url: 'https://example.com/pe_page_2.png',
        options: [
          { content: null },
          { content: null },
          { content: null },
          { content: null },
        ],
      },
    ];

    expect(checkIsTextExam(questions)).toBe(false);
  });

  it('should return false for empty questions list', () => {
    expect(checkIsTextExam([])).toBe(false);
  });
});
