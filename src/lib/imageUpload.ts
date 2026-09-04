/**
 * imageUpload.ts
 * Robust utilities for compressing and uploading exam question images
 * Supports auto-fallback between 'question-images' and 'exam-images' Supabase buckets.
 */

import { supabase } from '@/integrations/supabase/client';

const CANDIDATE_BUCKETS = ['question-images', 'exam-images'];
let cachedWorkingBucket: string | null = null;

const MAX_IMAGE_DIMENSION = 1920; // 1920px retains crisp text & math formulas
const JPEG_QUALITY = 0.88;

/**
 * Upload a Blob or File to Supabase Storage with bucket auto-fallback.
 * Tries 'question-images' first, then 'exam-images' if the bucket is not found.
 */
export async function uploadFileToExamStorage(
  path: string,
  fileOrBlob: Blob | File,
  contentType = 'image/jpeg'
): Promise<string> {
  const bucketsToTry = cachedWorkingBucket
    ? [cachedWorkingBucket, ...CANDIDATE_BUCKETS.filter(b => b !== cachedWorkingBucket)]
    : CANDIDATE_BUCKETS;

  let lastError: any = null;

  for (const bucket of bucketsToTry) {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, fileOrBlob, {
          contentType: contentType || 'image/jpeg',
          upsert: true,
          cacheControl: '3600',
        });

      if (!error) {
        cachedWorkingBucket = bucket;
        const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(path);
        return pubData.publicUrl;
      }

      lastError = error;
      // If error indicates bucket doesn't exist, try the next candidate bucket
      const errMsg = (error.message || '').toLowerCase();
      const isBucketNotFound = errMsg.includes('bucket not found') || (error as any).statusCode === 404 || (error as any).status === 404;

      if (!isBucketNotFound) {
        // If it's another error (like auth/permission), still try the alternative bucket once before throwing
        console.warn(`[imageUpload] Upload to bucket "${bucket}" failed: ${error.message}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw new Error(lastError?.message || 'Không thể upload ảnh lên hệ thống lưu trữ (Storage). Vui lòng kiểm tra quyền Admin hoặc cấu hình bucket.');
}

/**
 * Client-side compression for image File objects.
 * Resizes large dimensions to max 1920px and converts to high-quality JPEG Blob.
 * If the file is small (< 250KB) or an animated GIF / SVG, returns original file.
 */
export async function compressImageFile(
  file: File,
  maxDim = MAX_IMAGE_DIMENSION,
  quality = JPEG_QUALITY
): Promise<{ blob: Blob | File; contentType: string; ext: string }> {
  // If file is SVG or GIF, do not re-encode to preserve vector or animation
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    const ext = file.name.split('.').pop() || (file.type === 'image/gif' ? 'gif' : 'svg');
    return { blob: file, contentType: file.type, ext };
  }

  // If already a small JPEG or PNG (< 250KB), upload directly without re-compression
  if (file.size < 250 * 1024 && (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp')) {
    const ext = file.name.split('.').pop() || 'jpg';
    return { blob: file, contentType: file.type, ext };
  }

  try {
    const blob = await new Promise<Blob>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            resBlob => {
              if (resBlob) resolve(resBlob);
              else reject(new Error('Canvas toBlob failed'));
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = () => reject(new Error('Lỗi load ảnh vào trình duyệt'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Lỗi đọc file ảnh'));
      reader.readAsDataURL(file);
    });

    return { blob, contentType: 'image/jpeg', ext: 'jpg' };
  } catch (err) {
    console.warn('[imageUpload] Compression fallback to raw file:', err);
    const ext = file.name.split('.').pop() || 'jpg';
    return { blob: file, contentType: file.type || 'image/jpeg', ext };
  }
}

/**
 * Convert a base64 data URL to a compressed JPEG Blob
 */
async function compressDataUrl(
  dataUrl: string,
  maxDim = MAX_IMAGE_DIMENSION,
  quality = JPEG_QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        blob => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => reject(new Error('Lỗi load ảnh dataUrl'));
    img.src = dataUrl;
  });
}

/**
 * Upload a base64 data URL image to Supabase Storage.
 * Returns the public URL or throws on error.
 */
export async function uploadDataUrlImage(
  dataUrl: string,
  examId: string,
  pathSuffix: string
): Promise<string> {
  const blob = await compressDataUrl(dataUrl);
  const path = `${examId}/${pathSuffix}.jpg`;
  return uploadFileToExamStorage(path, blob, 'image/jpeg');
}

/**
 * Batch upload images from Word documents or data URLs with progress callback.
 * Returns array of public URLs (null for failed items).
 */
export async function batchUploadImages(
  items: { dataUrl: string; examId: string; pathSuffix: string }[],
  onProgress: (done: number, total: number) => void
): Promise<(string | null)[]> {
  const results: (string | null)[] = [];
  for (let i = 0; i < items.length; i++) {
    const { dataUrl, examId, pathSuffix } = items[i];
    try {
      const url = await uploadDataUrlImage(dataUrl, examId, pathSuffix);
      results.push(url);
    } catch (err) {
      console.error(`[imageUpload] Failed to upload ${pathSuffix}:`, err);
      results.push(null);
    }
    onProgress(i + 1, items.length);
  }
  return results;
}

/**
 * Single exam question image upload helper from a user-selected File object.
 * Compresses the image and uploads with fallback.
 */
export async function uploadExamQuestionFile(
  examId: string,
  file: File,
  index: number
): Promise<string> {
  const { blob, contentType, ext } = await compressImageFile(file);
  const path = `${examId}/${Date.now()}_${index}.${ext}`;
  return uploadFileToExamStorage(path, blob, contentType);
}
