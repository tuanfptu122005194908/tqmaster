# Feature Specification: Chuyển Đổi & Di Chuyển Theory Files sang Google Drive theo Môn Học (Spec 34)

**Status**: In Progress (Đã tải 100% file về máy & Cập nhật UI Google Drive)
**Created**: 2026-10-31
**Feature Directory**: `.sdd/specs/34-migrate-theory-files-to-google-drive/`

---

## 1. Mục tiêu & Bối cảnh (Overview & Problem Statement)

- **Vấn đề**:
  - Bucket `theory-files` trên Supabase Storage hiện đang chứa **127 files tài liệu/đề thi PE nặng tới 473 MB** (chiếm gần một nửa tổng dung lượng 962 MB của Storage).
  - Không chỉ chiếm bộ nhớ, mỗi lần học sinh tải các file ZIP này về còn tiêu tốn băng thông tải ra (Egress bandwidth), nhanh chóng làm cạn kiệt giới hạn **5 GB Egress/tháng** của gói Supabase Free.
- **Giải pháp lựa chọn (Cách 1)**:
  - Gom toàn bộ tài liệu theo **Thư mục Google Drive cho từng Môn học**.
  - Tải tự động toàn bộ 127 file từ Supabase Storage về máy tính, tự động phân loại thành từng thư mục con theo đúng tên và mã 24 môn học (`DBI202`, `PRJ301`, `PRO192`...).
  - Người dùng chỉ cần kéo thả các thư mục môn học này lên Google Drive cá nhân.
  - Nâng cấp giao diện học viên ([`SubjectDetailPage.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/user/SubjectDetailPage.tsx)) để nhận diện link Google Drive thông minh: hiển thị nút nổi bật với icon Google Drive, 1-click mở thẳng thư mục để học sinh vừa xem online được vừa tải cả thư mục về máy.
  - Xóa sạch 473 MB trong bucket `theory-files` trên Supabase Storage sau khi hoàn tất.

---

## 2. Kịch bản Người dùng & Tiêu chí Nghiệm thu (User Scenarios Given-When-Then)

### Kịch bản 1: Trích xuất toàn bộ 127 file tài liệu phân loại theo 24 môn học
- **Given**: Bucket `theory-files` có 127 files nặng 473 MB liên kết với 24 môn học.
- **When**: Chạy script trích xuất `scripts/export_theories_to_local.mjs`.
- **Then**: Script tự động tải đầy đủ 100% file về thư mục `downloaded_theories/<tên-môn-học>/<tên-file>` trên máy tính, có log tiến độ rõ ràng và báo cáo tổng kết.

### Kịch bản 2: Học sinh truy cập trang chi tiết môn học có link Google Drive
- **Given**: Học sinh đã sở hữu môn học và môn học có mục tài liệu trỏ tới Google Drive folder (`https://drive.google.com/drive/folders/...` hoặc `https://drive.google.com/...`).
- **When**: Học sinh vào tab "Tài liệu lý thuyết / PE" trong [`SubjectDetailPage.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/user/SubjectDetailPage.tsx).
- **Then**:
  - Giao diện hiển thị thẻ tài liệu nổi bật với huy hiệu Google Drive và nút **"Mở Thư Mục Google Drive"**.
  - Bấm vào mở trực tiếp thư mục Drive trong tab mới để học sinh có thể xem trước online hoặc tải cả folder về máy.
  - Không tiêu tốn bất kỳ 1 byte băng thông nào của Supabase Storage.

### Kịch bản 3: Dọn dẹp sạch sẽ bucket `theory-files` trên Supabase Storage
- **Given**: Toàn bộ file đã được lưu trữ an toàn trên Google Drive và cập nhật link vào hệ thống.
- **When**: Chạy lệnh dọn dẹp `scripts/clean_supabase_theory_files.mjs`.
- **Then**:
  - Toàn bộ file trong bucket `theory-files` bị xóa vật lý trên Supabase Storage.
  - Dung lượng Storage của dự án Supabase giảm từ **962 MB xuống còn ~489 MB** (an toàn tuyệt đối dưới hạn mức 1,000 MB của gói Free).

---

## 3. Yêu cầu Kỹ thuật & Chức năng (Functional Requirements)

- **FR-001**: Xây dựng script Node.js `scripts/export_theories_to_local.mjs` kết nối trực tiếp Supabase qua Service Role Key, truy vấn mapping `theories` -> `theory_subjects` -> `subjects`, tải file đồng thời (concurrency 5) về thư mục `downloaded_theories/<Subject_Name>/`.
- **FR-002**: Nâng cấp component hiển thị tài liệu trong [`SubjectDetailPage.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/user/SubjectDetailPage.tsx):
  - Nhận diện URL Google Drive (`drive.google.com`).
  - Render style riêng biệt, hiện đại chuẩn TQMaster Dashboard Theme với icon Google Drive / Folder, nút mở trực tiếp tab mới.
- **FR-003**: Xây dựng script `scripts/clean_supabase_theory_files.mjs` để dọn sạch bucket `theory-files` trên Supabase Storage sau khi người dùng xác nhận đã upload lên Google Drive xong.

---

## 4. Key Files & Components

- `scripts/export_theories_to_local.mjs`: Tải 127 file về máy theo từng môn.
- `scripts/clean_supabase_theory_files.mjs`: Xoá sạch file trong bucket `theory-files` trên Supabase.
- [`src/pages/user/SubjectDetailPage.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/user/SubjectDetailPage.tsx): UI hiển thị thẻ Google Drive Folder.
- [`src/pages/admin/AdminTheory.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/admin/AdminTheory.tsx): Hỗ trợ gắn link Google Drive dễ dàng.

---

## 5. Tiêu chí Thành công (Success Criteria)

- **SC-001**: Tải thành công 127/127 file (~473 MB) về máy tính, phân loại vào 24 thư mục môn học.
- **SC-002**: Học sinh truy cập môn học có link Google Drive hiển thị trực quan, mượt mà.
- **SC-003**: Dung lượng Supabase Storage sau khi dọn dẹp giảm ít nhất 450 MB.
- **SC-004**: Tất cả unit test `npm test` và `npm run build` pass 100%.

