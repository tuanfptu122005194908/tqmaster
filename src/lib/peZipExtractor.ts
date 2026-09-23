/**
 * peZipExtractor.ts
 * Bộ xử lý giải nén file zip đề thi PE, trích xuất ảnh câu hỏi,
 * sắp xếp theo thứ tự tự nhiên (natural order) và tải lên Supabase Storage.
 */

import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { signStorageUrls } from '@/lib/signedImage';

const IMAGE_EXTENSIONS_REGEX = /\.(png|jpe?g|webp|gif|bmp)$/i;

export interface ExtractedImageItem {
  name: string;
  cleanName: string;
  size: number;
  entry: JSZip.JSZipObject;
}

/**
 * Kiểm tra xem một file có phải là file ảnh hợp lệ bên trong zip không.
 * Tự động loại bỏ file rác macOS (__MACOSX, .DS_Store), Windows (Thumbs.db).
 */
function isValidZipImageEntry(entry: JSZip.JSZipObject): boolean {
  if (entry.dir) return false;
  const name = entry.name;
  if (name.includes('__MACOSX') || name.startsWith('.') || name.includes('/.')) return false;
  if (name.toLowerCase().endsWith('thumbs.db')) return false;
  return IMAGE_EXTENSIONS_REGEX.test(name);
}

/**
 * Sắp xếp tên file theo thứ tự tự nhiên (Natural alphanumeric sort)
 * Ví dụ: Question1.png, Question2.png, Question10.png (thay vì Question10 đứng trước Question2)
 */
export function naturalSortNames<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
  );
}

/**
 * Quét file ZIP và trả về danh sách các file ảnh tìm thấy (đã sắp xếp thứ tự).
 */
export async function inspectZipImages(fileOrBlob: File | Blob): Promise<ExtractedImageItem[]> {
  const zip = await JSZip.loadAsync(fileOrBlob);
  const found: ExtractedImageItem[] = [];

  zip.forEach((relativePath, entry) => {
    if (isValidZipImageEntry(entry)) {
      const fileNameOnly = relativePath.split('/').pop() || relativePath;
      found.push({
        name: relativePath,
        cleanName: fileNameOnly,
        size: (entry as any)._data?.uncompressedSize || 0,
        entry,
      });
    }
  });

  return naturalSortNames(found);
}

/**
 * Suy đoán MIME type từ tên file ảnh.
 */
function getMimeType(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'bmp': return 'image/bmp';
    default: return 'application/octet-stream';
  }
}

/**
 * Chuẩn hóa tên file an toàn cho đường dẫn Supabase Storage.
 */
function sanitizeFileName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_');
}

/**
 * Upload mảng các ảnh đã trích xuất từ ZIP lên bucket `theory-images` (hoặc `theory-files`).
 */
export async function uploadExtractedZipImages(
  images: ExtractedImageItem[],
  theoryIdOrPrefix: string,
  onProgress?: (current: number, total: number, currentName: string) => void
): Promise<string[]> {
  if (images.length === 0) return [];

  const targetBucket = 'theory-images';
  const prefix = theoryIdOrPrefix || `pe_${Date.now()}`;
  const uploadedUrls: string[] = [];

  for (let i = 0; i < images.length; i++) {
    const item = images[i];
    onProgress?.(i + 1, images.length, item.cleanName);

    try {
      const blob = await item.entry.async('blob');
      const mimeType = getMimeType(item.cleanName);
      const safeName = sanitizeFileName(item.cleanName);
      const storagePath = `pe-extracts/${prefix}/${String(i + 1).padStart(2, '0')}_${Date.now()}_${safeName}`;

      const { error: upErr } = await supabase.storage.from(targetBucket).upload(storagePath, blob, {
        cacheControl: '31536000',
        upsert: true,
        contentType: mimeType,
      });

      if (upErr) {
        console.warn(`[peZipExtractor] Upload to ${targetBucket} failed, trying theory-files:`, upErr.message);
        // Fallback to theory-files bucket if theory-images bucket has issues
        const { error: fallbackErr } = await supabase.storage.from('theory-files').upload(storagePath, blob, {
          cacheControl: '31536000',
          upsert: true,
          contentType: mimeType,
        });

        if (fallbackErr) {
          throw fallbackErr;
        }

        const { data: { publicUrl } } = supabase.storage.from('theory-files').getPublicUrl(storagePath);
        uploadedUrls.push(publicUrl);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from(targetBucket).getPublicUrl(storagePath);
      uploadedUrls.push(publicUrl);
    } catch (err) {
      console.error(`[peZipExtractor] Error uploading image ${item.cleanName}:`, err);
      throw err;
    }
  }

  return uploadedUrls;
}

/**
 * Tải file ZIP từ URL từ xa (hỗ trợ ký URL cho bucket private), giải nén và trích xuất ảnh lên Storage.
 */
export async function extractZipImagesFromRemoteUrl(
  remoteUrl: string,
  theoryIdOrPrefix: string,
  onProgress?: (status: string, current?: number, total?: number) => void
): Promise<string[]> {
  onProgress?.('Đang kết nối và lấy đường dẫn file ZIP...');
  const signMap = await signStorageUrls([remoteUrl]);
  const fetchUrl = signMap.get(remoteUrl) || remoteUrl;

  onProgress?.('Đang tải file ZIP về bộ nhớ...');
  const response = await fetch(fetchUrl);
  if (!response.ok) {
    throw new Error(`Không thể tải file ZIP (HTTP ${response.status}: ${response.statusText})`);
  }

  const blob = await response.blob();
  onProgress?.('Đang giải nén và quét tìm hình ảnh đề thi...');
  const images = await inspectZipImages(blob);

  if (images.length === 0) {
    return [];
  }

  onProgress?.(`Tìm thấy ${images.length} ảnh đề thi, đang tải lên hệ thống...`, 0, images.length);
  const uploadedUrls = await uploadExtractedZipImages(
    images,
    theoryIdOrPrefix,
    (current, total, currentName) => {
      onProgress?.(`Đang lưu ảnh ${current}/${total}: ${currentName}`, current, total);
    }
  );

  return uploadedUrls;
}
