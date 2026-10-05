# Kế hoạch Kỹ thuật

## 1. Cập nhật Parser (`src/lib/markdownExamParser.ts`)
- Thêm import `mammoth` và `parseHtmlToQuestions` (từ `src/lib/wordParser`).
- Trong hàm `extractExamsFromZip`:
  - Mở rộng regex lọc file: `/\.(md|txt|markdown|docx)$/i`.
  - Kiểm tra nếu là `.docx`:
    - Dùng `await entry.file.async('arraybuffer')` để lấy buffer.
    - Gọi `mammoth.convertToHtml({ arrayBuffer })` để thu được raw HTML.
    - Gọi `parseHtmlToQuestions(html)` để lấy ra `ParsedQuestion[]`.
    - Map `ParsedQuestion[]` sang `ParsedExamData` (format giống với markdown parser: title lấy từ filename, `totalQuestions`, `unansweredQuestions` đếm thủ công, map options sang `ParsedExamOption`). **Quan trọng**: Bổ sung mapping `imageDataUrl` và `extraImageDataUrls` vào interface `ParsedExamQuestion` và `ParsedExamOption`.
    - Gộp vào mảng `results`.

## 2. Cập nhật UI (`src/components/admin/BulkExamZipModal.tsx`)
- Đảm bảo input file accept cho file ZIP có `.docx`.
- Thay đổi thông điệp mô tả (nếu có) để thể hiện việc có hỗ trợ các file `.docx` nén bên trong ZIP.
- **Quan trọng**: Ở luồng `handleStartUpload`, cần duyệt qua các câu hỏi và option để lấy toàn bộ `imageDataUrl`, `extraImageDataUrls` rồi gọi `batchUploadImages(uploadItems)` để đẩy lên Supabase Storage lấy Public URL, SAU ĐÓ mới insert vào `questions` và `question_options`.

## 3. Clean up
- Sau khi implement và đảm bảo code compile TypeScript an toàn, xoá file test `CEA201_PT1_SEB_FALL26.zip` ở thư mục gốc.
