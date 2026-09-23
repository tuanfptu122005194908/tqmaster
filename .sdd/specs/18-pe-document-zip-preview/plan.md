# Technical Implementation Plan: PE Document ZIP Image Extraction & Inline Exam Viewer

**Feature**: `.sdd/specs/18-pe-document-zip-preview/`  
**Status**: 📋 Planning  

---

## 1. Technical Architecture & Data Strategy

### 1.1 Metadata Serialization
Để đảm bảo không cần migration database trên production Supabase, danh sách ảnh trích xuất được đóng gói an toàn trong trường `theories.description`:
```
[Nội dung mô tả của Admin nếu có]

<!--PE_META:{"preview_images":["https://.../img1.png","https://.../img2.png"]}-->
```
- Module `src/lib/theoryMetadata.ts` cung cấp hai hàm:
  - `parseTheoryDescription(rawDesc: string | null | undefined): { description: string; preview_images: string[] }`
  - `formatTheoryDescription(cleanDesc: string, previewImages: string[]): string`

### 1.2 ZIP Extraction Engine (`src/lib/peZipExtractor.ts`)
- Sử dụng `JSZip` có sẵn trong `package.json`.
- Trích xuất ảnh theo luồng:
  1. Đọc zip từ `File` hoặc fetch từ `signedUrl` của `theory.url`.
  2. Quét toàn bộ entries trong zip:
     - Bỏ qua entry thư mục (`entry.dir`).
     - Bỏ qua các file ẩn/metadata hệ thống (`__MACOSX`, `.DS_Store`, `Thumbs.db`).
     - Lọc các file có đuôi `png|jpe?g|webp|gif|bmp`.
  3. Sắp xếp thứ tự tự nhiên (Natural Sort):
     - Dùng `Intl.Collator` hoặc `name.localeCompare(other.name, undefined, { numeric: true, sensitivity: 'base' })` để thứ tự câu hỏi không bị đảo lộn (ví dụ: `1.png`, `2.png`, ... `10.png`, không bị nhảy `10.png` lên trước `2.png`).
  4. Upload từng ảnh lên bucket `theory-images` với tiền tố đường dẫn:
     `pe-extracts/${theoryId || Date.now()}/${idx + 1}_${fileName}`.
  5. Thu thập mảng URL công khai và trả về danh sách `preview_images`.

### 1.3 Full-Screen Image Viewer Modal (`src/components/common/ExamImageViewerModal.tsx`)
- Tái sử dụng phong cách xem ảnh cao cấp của mục đề thi (`ExamPage.tsx`), nâng cấp thêm:
  - Thanh tiêu đề chứa tên đề thi, số trang, nút Download file ZIP gốc.
  - Phóng to / Thu nhỏ (Zoom in/out, Reset fit).
  - Phím tắt bàn phím: Mũi tên trái (Prev), Mũi tên phải (Next), Phím Esc (Đóng).
  - Filmstrip thumbnail phía dưới để nhảy trang tức thì.

---

## 2. Implementation Phases

- **Phase 1**: Tạo core utilities `src/lib/theoryMetadata.ts` và `src/lib/peZipExtractor.ts`.
- **Phase 2**: Tạo component `src/components/common/ExamImageViewerModal.tsx`.
- **Phase 3**: Cập nhật `src/pages/admin/AdminTheory.tsx`:
  - Nút trích xuất ảnh trên từng hàng tài liệu PE.
  - Nút trích xuất hàng loạt cho các tài liệu PE hiện có.
  - Tích hợp tự động trích xuất khi upload file zip mới trong modal.
  - Huy hiệu hiển thị số lượng ảnh trích xuất.
- **Phase 4**: Cập nhật `src/pages/user/SubjectDetailPage.tsx`:
  - Nâng cấp render tab PE: hiển thị preview ảnh đề thi theo dạng grid/filmstrip.
  - Tích hợp Modal xem ảnh toàn màn hình.
  - Bảo toàn nút tải file ZIP gốc cho sinh viên.
- **Phase 5**: Kiểm thử tự động `npm test` và kiểm thử thủ công quy trình tải/trích xuất zip.
