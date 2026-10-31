# Feature Specification: Tối ưu Toàn diện: Nén Hàng loạt Ảnh Đề thi & Tự động Dọn dẹp attempt_answers (Spec 35)

**Status**: Draft (Chờ người dùng duyệt - Review Gate)  
**Created**: 2026-10-31  
**Feature Directory**: `.sdd/specs/35-compress-images-and-purge-attempt-answers/`  

---

## 1. Overview & Problem Statement

Sau khi di chuyển thành công toàn bộ tài liệu lý thuyết sang Google Drive và giải phóng 473 MB, hệ thống TQMaster còn 2 vấn đề lớn về hạn mức Free Tier của Supabase:
1. **Dung lượng Ảnh Đề thi & Lý thuyết chưa tối ưu**:
   - `question-images`: **13,164 ảnh đề thi** (~323 MB), phần lớn lưu ở định dạng PNG/JPG nguyên bản chưa nén.
   - `theory-images`: **749 ảnh** (~116 MB).
   - Tổng cộng **439 MB** ảnh. Cần giải pháp nén toàn diện:
     - Nén hàng loạt toàn bộ ảnh cũ về chuẩn WebP chất lượng 82% (giảm 60–70% dung lượng, tiết kiệm ~290 MB).
     - Đảm bảo cơ chế mặc định trên ứng dụng: **Bất kỳ ảnh nào mới tải lên trong tương lai đều được tự động nén WebP trước khi gửi lên Storage**.
2. **Dung lượng Database Disk bị phình to bởi `attempt_answers`**:
   - Bảng `attempt_answers` hiện có **282,902 dòng** chiếm **64 MB** trên tổng số dung lượng database.
   - Học sinh chỉ cần xem lại chi tiết từng câu đúng/sai trong vòng 1 ngày sau khi thi. Dữ liệu lịch sử vĩnh viễn (điểm số, số câu đúng, ngày nộp, xếp hạng) đã được lưu trọn vẹn trong bảng `exam_attempts` (chỉ 1 MB).
   - Cần cơ chế dọn dẹp tự động các câu trả lời chi tiết của bài thi đã làm quá 1 ngày để giữ dung lượng database luôn dưới 100 MB (giới hạn Free là 500 MB).

---

## 2. User Scenarios & Acceptance Criteria (Given-When-Then)

### Scenario 1: Mặc định tự động nén mọi ảnh mới tải lên (Default Auto-Compression)
- **Given**: Admin tải ảnh đề thi qua file Word (`.docx`), upload file ZIP đề thi PE, tải ảnh qua `FileUploader`, hoặc học sinh gửi ảnh bill/chat.
- **When**: Người dùng chọn bất kỳ file ảnh nào (PNG, JPG, JPEG dung lượng lớn 1–5 MB).
- **Then**: Hệ thống tự động xử lý client-side bằng `compressImageFile` (HTML5 Canvas chuyển đổi sang `image/webp`, quality 82%, kích thước tối đa 1280–1600px).
- **And**: Dung lượng file giảm 70–90% trước khi truyền qua mạng lên Supabase Storage, gắn `cacheControl: '31536000'`.

### Scenario 2: Nén hàng loạt In-Place 13,164 ảnh `question-images` & 749 ảnh `theory-images`
- **Given**: 13,164 ảnh trong `question-images` và 749 ảnh trong `theory-images` trên Supabase Storage.
- **When**: Thực thi script nén hàng loạt `scripts/compress_question_and_theory_images.mjs` với 16 luồng song song dùng thư viện `sharp`.
- **Then**: Script tải từng ảnh, nén sang WebP quality 82%, ghi đè trực tiếp (In-place Overwrite) với `x-upsert: true`.
- **And**: Tất cả URL câu hỏi trắc nghiệm và đề thi giữ nguyên tính toàn vẹn (không bị đứt gãy link ảnh), dung lượng giảm từ 439 MB xuống còn ~130–150 MB (tiết kiệm ~290 MB).

### Scenario 3: Tự động dọn dẹp bảng `attempt_answers` cũ quá 1 ngày
- **Given**: Bảng `attempt_answers` chứa 282,902 dòng từ hơn 6,300 lượt thi cũ.
- **When**: Hàm PostgreSQL `public.purge_old_attempt_answers(1)` được kích hoạt (hoặc bấm nút "Dọn dẹp bài thi cũ" trên trang Admin).
- **Then**: Hệ thống xoá toàn bộ chi tiết câu trả lời của các bài thi đã nộp quá 1 ngày trước (`submitted_at < NOW() - INTERVAL '1 day'`).
- **And**: Bảng `exam_attempts` vẫn giữ nguyên 100% điểm số, thời gian, số câu đúng của học sinh, bảng xếp hạng và lịch sử thi không bị ảnh hưởng.
- **And**: Dung lượng bảng `attempt_answers` giảm từ 64 MB xuống dưới 1 MB, giải phóng ngay hơn 63 MB dung lượng database disk.

---

## 3. Functional Requirements

- **FR-001 (Default Compression Guard)**: Đảm bảo toàn bộ các module upload ảnh trên frontend:
  - [`src/components/FileUploader.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/components/FileUploader.tsx)
  - [`src/lib/imageUpload.ts`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/lib/imageUpload.ts) (`uploadDataUrlImage`, `uploadExamQuestionFile`, `batchUploadImages`)
  - [`src/lib/peZipExtractor.ts`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/lib/peZipExtractor.ts)
  đều bắt buộc áp dụng nén WebP (quality 82, resize bound) trước khi upload. Không cho phép đẩy file PNG/JPG thô lên Storage.
- **FR-002 (In-Place Batch Compression Script)**: Xây dựng script Node.js đa luồng `scripts/compress_question_and_theory_images.mjs` sử dụng `sharp` để nén tại chỗ toàn bộ ảnh trong `question-images` và `theory-images`.
- **FR-003 (Database Cleanup Function & RPC)**: Tạo migration SQL định nghĩa hàm `public.purge_old_attempt_answers(days_old int DEFAULT 1)` và cấp quyền thực thi cho role `service_role` và `authenticated` (Admin only).
- **FR-004 (Admin Maintenance UI)**: Thêm nút kích hoạt và hiển thị thông tin dọn dẹp `attempt_answers` trên giao diện Quản trị (`AdminDashboard` hoặc `AdminSettings`) giúp Admin có thể bấm dọn dẹp bất kỳ lúc nào chỉ với 1 click.
- **FR-005 (Automated Daily Cleanup Trigger)**: Thiết lập gọi tự động hàm dọn dẹp định kỳ (qua Supabase Cron hoặc client-side background trigger khi admin đăng nhập).

---

## 4. Key Entities & Key Files

### Key Entities
- Storage Buckets: `question-images`, `theory-images`.
- Database Tables: `attempt_answers`, `exam_attempts`.

### Key Files
- `scripts/compress_question_and_theory_images.mjs` (Script nén hàng loạt 16 luồng song song)
- `supabase/migrations/20261031160000_purge_old_attempt_answers.sql` (PostgreSQL function & RLS)
- [`src/lib/imageUpload.ts`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/lib/imageUpload.ts) (Đảm bảo chuẩn nén mặc định)
- [`src/components/FileUploader.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/components/FileUploader.tsx) (Tự động nén mọi ảnh tải lên)
- [`src/pages/admin/AdminDashboard.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/admin/AdminDashboard.tsx) hoặc [`AdminSettings.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/admin/AdminSettings.tsx) (Nút dọn dẹp bài thi cũ 1 click)

---

## 5. Success Criteria

- **SC-001**: 100% ảnh mới tải lên qua bất kỳ luồng nào đều tự động nén sang `image/webp` siêu nhẹ.
- **SC-002**: Dung lượng ảnh `question-images` + `theory-images` trên Supabase Storage giảm từ 439 MB xuống dưới 170 MB (tiết kiệm ~270–290 MB).
- **SC-003**: Bảng `attempt_answers` được dọn sạch ~280,000 dòng cũ, giải phóng ~63 MB dung lượng database disk ngay lập tức.
- **SC-004**: Tất cả lịch sử điểm số, bảng xếp hạng trên `exam_attempts` vẫn nguyên vẹn 100%.
- **SC-005**: 100% unit tests (`npm test`) pass và `npm run build` thành công không lỗi.

