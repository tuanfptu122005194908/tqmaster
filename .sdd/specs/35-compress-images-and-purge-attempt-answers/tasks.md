# Tasks: Nén Hàng loạt Ảnh Đề thi & Tự Động Dọn dẹp attempt_answers (Spec 35)

- [x] **Task 1**: Kiểm tra và hoàn thiện cơ chế tự động nén ảnh WebP mặc định cho tất cả các luồng upload mới trên frontend (`FileUploader.tsx`, `imageUpload.ts`, `peZipExtractor.ts`).
- [x] **Task 2**: Xây dựng script Node.js đa luồng `scripts/compress_question_and_theory_images.mjs` sử dụng `sharp` để nén in-place toàn bộ ảnh trong `question-images` và `theory-images`. (Đã hoàn tất nén 2,109 ảnh, tiết kiệm 125.89 MB, 0 lỗi).
- [x] **Task 3**: Tạo migration SQL `supabase/migrations/20261031160000_purge_old_attempt_answers.sql` định nghĩa hàm `purge_old_attempt_answers`.
- [x] **Task 4**: Thực thi dọn dẹp ban đầu cho 282,902 dòng trong `attempt_answers`, xác nhận giải phóng ~63 MB database disk (đã dọn 282,022 dòng, bảo lưu toàn bộ điểm số trong `exam_attempts`).
- [x] **Task 5**: Thêm UI/nút dọn dẹp nhanh trên trang Admin kèm cơ chế tự động kích hoạt định kỳ.
- [/] **Task 6**: Chạy bộ kiểm thử tự động `npm test` và kiểm tra `npm run build`.
- [ ] **Task 7**: Cập nhật `graphify update .`, commit và đẩy code lên cả 2 remote (`origin` và `tqmaster`).
