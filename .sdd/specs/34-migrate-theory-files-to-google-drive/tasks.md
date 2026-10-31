# Tasks: Chuyển Đổi & Di Chuyển Theory Files sang Google Drive (Spec 34)

- [x] **Task 1**: Xây dựng script `scripts/export_theories_to_local.mjs` để tải toàn bộ 127 files (~473 MB) từ Supabase Storage về máy tính, phân loại vào 24 thư mục môn học.
- [x] **Task 2**: Thực thi script và tải hoàn tất 100% tài liệu về máy cho người dùng (127/127 files, 24 thư mục).
- [x] **Task 3**: Nâng cấp UI trong `src/pages/user/SubjectDetailPage.tsx` để nhận diện và hiển thị giao diện chuyên dụng cho link Thư mục Google Drive.
- [x] **Task 4**: Viết unit test, chạy `npm test` (104 tests passed), kiểm tra `npm run build`.
- [x] **Task 5**: Upload toàn bộ tài liệu lên Google Drive (16 luồng song song), cập nhật database Supabase sang link Google Drive, và cô lập phân quyền độc lập cho 24 thư mục môn học (Phương án 1 - ngăn chặn xem chéo môn).
- [ ] **Task 6**: Cập nhật `graphify update .`, commit và đẩy code lên cả 2 remote (`origin` và `tqmaster`).
