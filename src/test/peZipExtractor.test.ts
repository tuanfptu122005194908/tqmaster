import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import { parseTheoryDescription, formatTheoryDescription } from '../lib/theoryMetadata';
import { naturalSortNames, inspectZipImages } from '../lib/peZipExtractor';

describe('theoryMetadata Utility', () => {
  it('should parse plain description without metadata', () => {
    const raw = 'Tài liệu ôn tập đề thi PE FER202';
    const result = parseTheoryDescription(raw);
    expect(result.description).toBe('Tài liệu ôn tập đề thi PE FER202');
    expect(result.preview_images).toEqual([]);
  });

  it('should handle null or undefined description', () => {
    expect(parseTheoryDescription(null)).toEqual({ description: '', preview_images: [] });
    expect(parseTheoryDescription(undefined)).toEqual({ description: '', preview_images: [] });
    expect(parseTheoryDescription('')).toEqual({ description: '', preview_images: [] });
  });

  it('should format and parse description with preview images', () => {
    const text = 'Đề thi PE DBI202 - FA25 đề 1';
    const images = [
      'https://example.com/img1.png',
      'https://example.com/img2.png',
      'https://example.com/img3.png',
    ];

    const formatted = formatTheoryDescription(text, images);
    expect(formatted).toContain('<!--PE_META:');
    expect(formatted).toContain(text);

    const parsed = parseTheoryDescription(formatted);
    expect(parsed.description).toBe(text);
    expect(parsed.preview_images).toEqual(images);
  });

  it('should handle empty images array by returning clean description', () => {
    const text = 'Đề thi PE không có ảnh';
    const formatted = formatTheoryDescription(text, []);
    expect(formatted).toBe(text);
    expect(formatted).not.toContain('<!--PE_META:');
  });

  it('should handle JSON string description format gracefully', () => {
    const jsonStr = JSON.stringify({
      description: 'Mô tả dạng JSON',
      preview_images: ['https://example.com/q1.png'],
    });
    const parsed = parseTheoryDescription(jsonStr);
    expect(parsed.description).toBe('Mô tả dạng JSON');
    expect(parsed.preview_images).toEqual(['https://example.com/q1.png']);
  });
});

describe('peZipExtractor Engine', () => {
  it('should sort file names in natural order (Question1 -> Question2 -> Question10)', () => {
    const files = [
      { name: 'Question10.png' },
      { name: 'Question1.png' },
      { name: 'Question2.png' },
      { name: 'Question20.png' },
      { name: 'Question3.png' },
    ];

    const sorted = naturalSortNames(files);
    expect(sorted.map(f => f.name)).toEqual([
      'Question1.png',
      'Question2.png',
      'Question3.png',
      'Question10.png',
      'Question20.png',
    ]);
  });

  it('should inspect and extract only valid image files from zip, ignoring macOS artifacts and non-images', async () => {
    const zip = new JSZip();
    zip.file('Question1.png', 'fake image content 1');
    zip.file('Question2.jpg', 'fake image content 2');
    zip.file('Question10.jpeg', 'fake image content 10');
    zip.file('readme.txt', 'this is text');
    zip.file('solution.java', 'public class Solution {}');
    zip.file('__MACOSX/._Question1.png', 'mac metadata');
    zip.file('.DS_Store', 'mac desktop services');
    zip.file('subfolder/Thumbs.db', 'windows thumbnail cache');

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const images = await inspectZipImages(zipBlob);

    expect(images.length).toBe(3);
    expect(images.map(img => img.cleanName)).toEqual([
      'Question1.png',
      'Question2.jpg',
      'Question10.jpeg',
    ]);
  });
});
