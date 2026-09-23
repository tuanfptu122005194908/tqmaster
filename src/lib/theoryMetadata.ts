/**
 * theoryMetadata.ts
 * Quản lý đóng gói & bóc tách metadata ảnh đề thi PE trong trường description của theories.
 * Đảm bảo 100% không cần migration database trên production Supabase.
 */

export interface TheoryMetadata {
  description: string;
  preview_images: string[];
}

const PE_META_REGEX = /<!--PE_META:([\s\S]*?)-->/;

/**
 * Phân tích trường description thô thành mô tả sạch của người dùng và danh sách URL ảnh trích xuất.
 */
export function parseTheoryDescription(rawDesc: string | null | undefined): TheoryMetadata {
  if (!rawDesc) {
    return { description: '', preview_images: [] };
  }

  // 1. Kiểm tra block comment ẩn <!--PE_META:...-->
  const match = rawDesc.match(PE_META_REGEX);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      const cleanDesc = rawDesc.replace(PE_META_REGEX, '').trim();
      const images = Array.isArray(parsed.preview_images)
        ? parsed.preview_images.filter((img: unknown): img is string => typeof img === 'string' && img.trim().length > 0)
        : [];
      return {
        description: cleanDesc,
        preview_images: images,
      };
    } catch {
      // Tiếp tục fallback nếu JSON lỗi cú pháp
    }
  }

  // 2. Kiểm tra nếu toàn bộ description là JSON string
  const trimmed = rawDesc.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.preview_images || parsed.description !== undefined) {
        const images = Array.isArray(parsed.preview_images)
          ? parsed.preview_images.filter((img: unknown): img is string => typeof img === 'string' && img.trim().length > 0)
          : [];
        return {
          description: typeof parsed.description === 'string' ? parsed.description : '',
          preview_images: images,
        };
      }
    } catch {
      // Tiếp tục fallback
    }
  }

  // 3. Fallback: Mô tả thuần túy không có ảnh
  return { description: rawDesc, preview_images: [] };
}

/**
 * Đóng gói mô tả văn bản của người dùng và danh sách URL ảnh trích xuất thành chuỗi lưu DB.
 */
export function formatTheoryDescription(cleanDesc: string, previewImages: string[]): string {
  const clean = (cleanDesc || '').trim();
  const validImages = (previewImages || []).filter(img => typeof img === 'string' && img.trim().length > 0);

  if (validImages.length === 0) {
    return clean;
  }

  const meta = JSON.stringify({ preview_images: validImages });
  return clean ? `${clean}\n\n<!--PE_META:${meta}-->` : `<!--PE_META:${meta}-->`;
}
