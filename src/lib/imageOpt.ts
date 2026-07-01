// Helpers for fast image loading from Supabase Storage.
// Uses the storage render endpoint for on-the-fly resize + WebP.
export function optimizedImage(url: string | null | undefined, width = 480, quality = 70): string | undefined {
  if (!url) return undefined;
  try {
    // Only transform Supabase storage URLs
    if (url.includes('/storage/v1/object/public/')) {
      const transformed = url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/');
      const sep = transformed.includes('?') ? '&' : '?';
      return `${transformed}${sep}width=${width}&quality=${quality}&resize=contain`;
    }
    return url;
  } catch {
    return url;
  }
}
