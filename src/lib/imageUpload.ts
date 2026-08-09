/**
 * imageUpload.ts
 * Utilities for compressing and uploading base64/data-URL images
 * to Supabase Storage bucket 'exam-images'.
 */

import { supabase } from '@/integrations/supabase/client';

const MAX_DIM = 1200; // max width or height in px
const QUALITY = 0.85;

/** Convert a base64 data URL to a compressed JPEG Blob */
async function compressDataUrl(dataUrl: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.round((height * MAX_DIM) / width);
          width = MAX_DIM;
        } else {
          width = Math.round((width * MAX_DIM) / height);
          height = MAX_DIM;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas context unavailable')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => blob ? resolve(blob) : reject(new Error('toBlob failed')),
        'image/jpeg',
        QUALITY,
      );
    };
    img.onerror = () => reject(new Error('image load failed'));
    img.src = dataUrl;
  });
}

export interface UploadImageResult {
  publicUrl: string;
}

/**
 * Upload a base64 data URL image to Supabase Storage.
 * Returns the public URL or throws on error.
 */
export async function uploadDataUrlImage(
  dataUrl: string,
  examId: string,
  pathSuffix: string, // e.g. "3_0" for question 3, image index 0
): Promise<string> {
  const blob = await compressDataUrl(dataUrl);
  const path = `${examId}/${pathSuffix}.jpg`;

  const { error } = await supabase.storage
    .from('exam-images')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('exam-images').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Batch upload images with progress callback.
 * items: array of { dataUrl, examId, pathSuffix }
 * Returns array of public URLs (null for failed items).
 */
export async function batchUploadImages(
  items: { dataUrl: string; examId: string; pathSuffix: string }[],
  onProgress: (done: number, total: number) => void,
): Promise<(string | null)[]> {
  const results: (string | null)[] = [];
  for (let i = 0; i < items.length; i++) {
    const { dataUrl, examId, pathSuffix } = items[i];
    try {
      const url = await uploadDataUrlImage(dataUrl, examId, pathSuffix);
      results.push(url);
    } catch (err) {
      console.error(`[imageUpload] failed to upload ${pathSuffix}:`, err);
      results.push(null);
    }
    onProgress(i + 1, items.length);
  }
  return results;
}
