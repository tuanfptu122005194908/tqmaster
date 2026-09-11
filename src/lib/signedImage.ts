/**
 * signedImage.ts
 * Ảnh đề thi / câu hỏi được lưu trong bucket PRIVATE.
 * Các URL lưu trong DB vẫn ở dạng ".../object/public/<bucket>/<path>",
 * nên ở phía client ta đổi chúng sang signed URL có hạn dùng.
 */
import { supabase } from '@/integrations/supabase/client';

const PRIVATE_BUCKETS = ['question-images', 'exam-images'] as const;
const EXPIRES_IN = 60 * 60 * 4; // 4 giờ

type CacheEntry = { url: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();

function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  if (!url) return null;
  for (const bucket of PRIVATE_BUCKETS) {
    const markers = [`/storage/v1/object/public/${bucket}/`, `/storage/v1/object/${bucket}/`];
    for (const marker of markers) {
      const idx = url.indexOf(marker);
      if (idx !== -1) {
        const path = url.slice(idx + marker.length).split('?')[0];
        return { bucket, path: decodeURIComponent(path) };
      }
    }
  }
  return null;
}

/** Ký hàng loạt URL. Trả về map từ URL gốc -> URL đã ký (hoặc giữ nguyên nếu không phải bucket riêng tư). */
export async function signStorageUrls(urls: (string | null | undefined)[]): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const now = Date.now();
  const todo = new Map<string, { bucket: string; path: string }[]>();

  for (const raw of urls) {
    if (!raw || result.has(raw)) continue;
    const parsed = parseStorageUrl(raw);
    if (!parsed) {
      result.set(raw, raw);
      continue;
    }
    const key = `${parsed.bucket}/${parsed.path}`;
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now) {
      result.set(raw, cached.url);
      continue;
    }
    const list = todo.get(parsed.bucket) ?? [];
    list.push(parsed);
    todo.set(parsed.bucket, list);
    result.set(raw, raw); // fallback tạm
  }

  for (const [bucket, items] of todo) {
    const paths = Array.from(new Set(items.map(i => i.path)));
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100);
      const { data, error } = await supabase.storage.from(bucket).createSignedUrls(chunk, EXPIRES_IN);
      if (error || !data) continue;
      for (const entry of data) {
        if (!entry.signedUrl || !entry.path) continue;
        cache.set(`${bucket}/${entry.path}`, {
          url: entry.signedUrl,
          expiresAt: now + (EXPIRES_IN - 300) * 1000,
        });
      }
    }
  }

  // Gán lại các URL vừa ký
  for (const raw of urls) {
    if (!raw) continue;
    const parsed = parseStorageUrl(raw);
    if (!parsed) continue;
    const cached = cache.get(`${parsed.bucket}/${parsed.path}`);
    if (cached) result.set(raw, cached.url);
  }

  return result;
}

/** Ký một URL đơn lẻ. */
export async function signStorageUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const map = await signStorageUrls([url]);
  return map.get(url) ?? url;
}

type AnyQuestion = {
  image_url?: string | null;
  extra_images?: string[] | null;
  options?: { image_url?: string | null }[] | null;
  question_options?: { image_url?: string | null }[] | null;
  [key: string]: any;
};

/** Đổi toàn bộ URL ảnh trong danh sách câu hỏi sang signed URL. */
export async function signQuestionImages<T extends AnyQuestion>(questions: T[]): Promise<T[]> {
  const urls: (string | null | undefined)[] = [];
  for (const q of questions) {
    urls.push(q.image_url);
    if (Array.isArray(q.extra_images)) urls.push(...q.extra_images);
    for (const o of q.options ?? []) urls.push(o?.image_url);
    for (const o of q.question_options ?? []) urls.push(o?.image_url);
  }
  if (urls.every(u => !u)) return questions;

  const map = await signStorageUrls(urls);
  const swap = (u?: string | null) => (u ? map.get(u) ?? u : u);

  return questions.map(q => ({
    ...q,
    image_url: swap(q.image_url),
    extra_images: Array.isArray(q.extra_images) ? q.extra_images.map(u => swap(u) as string) : q.extra_images,
    options: q.options ? q.options.map(o => ({ ...o, image_url: swap(o?.image_url) })) : q.options,
    question_options: q.question_options
      ? q.question_options.map(o => ({ ...o, image_url: swap(o?.image_url) }))
      : q.question_options,
  })) as T[];
}
