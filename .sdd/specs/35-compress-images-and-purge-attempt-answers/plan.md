# Technical Implementation Plan: Spec 35

## 1. Technical Architecture & Approach

### Part A: Đảm bảo Mặc định 100% Ảnh Tải Mới Luôn Được Nén (Frontend Client-Side Pre-Compression)
1. **Kiến trúc luồng upload ảnh**:
   - Khi người dùng/admin chọn file ảnh hoặc trích xuất ảnh từ Word/ZIP:
   - Trước khi bất kỳ lệnh `supabase.storage.from(...).upload(...)` nào được gọi, file ảnh bắt buộc đi qua pipeline `compressImageFile` trong `imageUpload.ts`:
     - Vẽ lên HTML5 Canvas với kích thước tối đa chuẩn (1200–1600px).
     - Render sang định dạng `image/webp` với chất lượng nén `quality = 0.82`.
     - Chỉ chuyển đổi nếu file nhẹ hơn ít nhất 15% so với ảnh gốc (nếu ảnh gốc đã là SVG/GIF hoặc file siêu nhỏ < 50KB thì giữ nguyên).
   - Kiểm tra và củng cố toàn bộ các component:
     - `FileUploader.tsx`: Áp dụng cho ảnh bìa môn học, ảnh tin tức, ảnh thông báo, mã QR.
     - `BulkExamZipModal.tsx`: Áp dụng khi import ảnh câu hỏi từ file Word/ZIP.
     - `peZipExtractor.ts`: Áp dụng khi giải nén đề thi PE.
     - `CartPage.tsx`: Áp dụng khi học sinh upload ảnh bill thanh toán.

### Part B: Nén Hàng Loạt In-Place 13,164 Ảnh `question-images` & 749 Ảnh `theory-images`
1. **Chiến lược nén tại chỗ (In-Place Overwrite)**:
   - Sử dụng script Node.js với thư viện `sharp` (`scripts/compress_question_and_theory_images.mjs`).
   - Đọc danh sách file từ `backup_sql/storage_objects_inventory.json` hoặc liệt kê trực tiếp qua Supabase Storage API.
   - Sử dụng worker pool với 16 luồng song song (`p-limit` hoặc concurrency loop).
   - Với mỗi ảnh:
     - Tải ảnh qua Storage API (hoặc URL public).
     - Dùng `sharp` giải mã, resize max dimension (1200px) và encode sang WebP quality 82.
     - Ghi đè file cũ bằng phương thức `PUT /storage/v1/object/:bucket/:path` với `x-upsert: true`, `Content-Type: image/webp`, `cache-control: 31536000`.
     - Ghi log tiến độ: Byte gốc, Byte sau nén, % tiết kiệm.
   - Vì ghi đè đúng `path` của file cũ nên toàn bộ câu hỏi trắc nghiệm trong database không cần cập nhật lại cột `image_url` (đảm bảo 100% không đứt link ảnh).

### Part C: Cơ Chế Tự Động Dọn Dẹp Bảng `attempt_answers` (Database Purge)
1. **PostgreSQL RPC Function**:
   - Viết migration `supabase/migrations/20261031160000_purge_old_attempt_answers.sql`:
   ```sql
   CREATE OR REPLACE FUNCTION public.purge_old_attempt_answers(days_old int DEFAULT 1)
   RETURNS jsonb
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public
   AS $$
   DECLARE
     v_deleted_count bigint;
   BEGIN
     -- Chỉ xoá các câu trả lời chi tiết của bài thi đã nộp quá `days_old` ngày
     WITH old_attempts AS (
       SELECT id FROM public.exam_attempts
       WHERE submitted_at < NOW() - (days_old || ' days')::interval
     ),
     deleted AS (
       DELETE FROM public.attempt_answers
       WHERE attempt_id IN (SELECT id FROM old_attempts)
       RETURNING id
     )
     SELECT COUNT(*) INTO v_deleted_count FROM deleted;

     RETURN jsonb_build_object(
       'success', true,
       'deleted_rows', v_deleted_count,
       'purged_at', NOW()
     );
   END;
   $$;
   ```
2. **Kích hoạt dọn dẹp**:
   - Chạy trực tiếp qua script quản trị để dọn sạch ngay ~282,000 dòng hiện tại.
   - Thêm nút trong giao diện Quản trị (`AdminDashboard` hoặc `AdminSettings`) với modal xác nhận và thông báo số dòng đã giải phóng.
   - Tự động gọi RPC khi Admin mở trang Dashboard (nếu đã qua 24 giờ kể từ lần dọn gần nhất) để giữ bảng luôn gọn gàng tự động.

---

## 2. Risk Assessment & Mitigation

| Rủi ro | Mức độ | Biện pháp giảm thiểu |
| :--- | :---: | :--- |
| Nén ảnh làm giảm độ nét của công thức toán học | Trung bình | Đặt `quality = 82` và `maxDim = 1200-1600px`, thuật toán Lanczos3 của sharp giữ nét từng chi tiết chữ và công thức. |
| Mất điểm số học sinh khi xoá `attempt_answers` | Rất thấp | Bảng `exam_attempts` giữ nguyên điểm số, thời gian, số câu đúng. Chỉ xoá bảng con `attempt_answers`. |
| Timeout khi nén 13,000 ảnh | Thấp | Script chạy độc lập ở máy local với 16 luồng song song, lưu checkpoint/state để có thể resume nếu gặp gián đoạn mạng. |

