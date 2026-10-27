export const PRIVATE_STORAGE_BUCKETS = ['question-images', 'exam-images', 'theory-files', 'theory-images'] as const;
export type StorageAsset = { bucket: string; path: string };
const isControlCharacter = (character: string) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127;

/** Tokens are never object identity. Decode the object key exactly once. */
export function parseStorageUrl(raw: string): StorageAsset | null {
  if (!raw) return null;
  let url: URL;
  let project: URL;
  try {
    project = new URL(import.meta.env.VITE_SUPABASE_URL);
    url = new URL(raw, project);
  } catch { throw new Error('Đường dẫn tài liệu không hợp lệ.'); }
  if (url.origin !== project.origin) return null;
  const match = url.pathname.match(/^\/storage\/v1\/object\/(?:(?:public|sign|authenticated)\/)?([^/]+)\/(.+)$/);
  if (!match || !PRIVATE_STORAGE_BUCKETS.some(bucket => bucket === match[1])) return null;
  let path: string;
  try { path = decodeURIComponent(match[2]); }
  catch { throw new Error('Đường dẫn tài liệu không hợp lệ.'); }
  if (!path || [...path].some(isControlCharacter) || path.split(/[\\/]/).some(part => part === '.' || part === '..')) {
    throw new Error('Đường dẫn tài liệu không hợp lệ.');
  }
  return { bucket: match[1], path };
}

export function safeDownloadName(name: string | null | undefined, fallback: string): string {
  const clean = (value: string) => [...value].filter(character => !isControlCharacter(character)).join('').split(/[\\/]/).pop()?.trim();
  const candidate = clean(name ?? '') || clean(fallback);
  return candidate && candidate !== '.' && candidate !== '..' ? candidate : 'tai-lieu';
}
