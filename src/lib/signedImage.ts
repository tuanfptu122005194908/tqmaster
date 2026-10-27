/**
 * signedImage.ts
 * Ảnh đề thi / câu hỏi được lưu trong bucket PRIVATE.
 * Các URL lưu trong DB vẫn ở dạng ".../object/public/<bucket>/<path>",
 * nên ở phía client ta đổi chúng sang signed URL có hạn dùng.
 */
import { supabase } from '@/integrations/supabase/client';

import { parseStorageUrl, type StorageAsset } from './storageAsset';

const EXPIRES_IN = 60 * 60 * 4;
type CacheEntry = { url: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();
let authGeneration = 0;
export const getStorageAuthGeneration = () => authGeneration;

export function clearStorageUrlCache() {
  authGeneration++;
  cache.clear();
}
export function assertStorageSession(generation: number) {
  if (generation !== authGeneration) throw new Error('Phiên đăng nhập đã thay đổi. Vui lòng thử lại.');
}

/** Preview cache only. Download actions always mint their own short-lived links. */
export async function signStorageUrls(
  urls: (string | null | undefined)[], options: { forceRefresh?: boolean } = {},
): Promise<Map<string, string>> {
  const generation = authGeneration;
  const result = new Map<string, string>();
  const requested = new Map<string, StorageAsset>();
  const pending = new Map<string, Set<string>>();
  const startedAt = Date.now();
  for (const raw of urls) {
    if (!raw || result.has(raw) || requested.has(raw)) continue;
    const parsed = parseStorageUrl(raw);
    if (!parsed) { result.set(raw, raw); continue; }
    requested.set(raw, parsed);
    const key = `${parsed.bucket}/${parsed.path}`;
    const entry = cache.get(key);
    if (!options.forceRefresh && entry && entry.expiresAt > Date.now()) {
      result.set(raw, entry.url);
    } else {
      cache.delete(key);
      const paths = pending.get(parsed.bucket) ?? new Set<string>();
      paths.add(parsed.path); pending.set(parsed.bucket, paths);
    }
  }
  for (const [bucket, paths] of pending) {
    const list = [...paths];
    for (let i = 0; i < list.length; i += 100) {
      const chunk = list.slice(i, i + 100);
      const {data, error} = await supabase.storage.from(bucket).createSignedUrls(chunk, EXPIRES_IN);
      assertStorageSession(generation);
      if (error || !data) throw new Error('Không thể tạo liên kết tài liệu. Vui lòng thử lại.');
      // A slow/paused request must not publish an already-expired capability.
      const expiresAt = startedAt + (EXPIRES_IN - 300) * 1000;
      if (expiresAt <= Date.now()) throw new Error('Liên kết đã hết hạn trong lúc tải. Vui lòng thử lại.');
      for (const path of chunk) {
        const entry = data.find(item => item.path === path);
        if (!entry?.signedUrl || entry.error) throw new Error('Không thể truy cập một tệp tài liệu. Vui lòng thử lại.');
        cache.set(`${bucket}/${path}`, {url:entry.signedUrl,expiresAt});
      }
    }
  }
  assertStorageSession(generation);
  for (const [raw, parsed] of requested) {
    const entry = cache.get(`${parsed.bucket}/${parsed.path}`);
    if (!entry || entry.expiresAt <= Date.now()) throw new Error('Không thể làm mới liên kết tài liệu. Vui lòng thử lại.');
    result.set(raw, entry.url);
  }
  return result;
}

export async function signStorageUrl(url: string | null | undefined, options: { forceRefresh?: boolean } = {}): Promise<string | null> {
  if (!url) return null;
  const map = await signStorageUrls([url], options);
  return map.get(url) ?? null;
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
