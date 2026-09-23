# Tasks: PE Document ZIP Image Extraction & Inline Exam Viewer

- [x] **Task 1: Core Utilities**
  - [x] Tạo `src/lib/theoryMetadata.ts` (parse & format metadata lưu ảnh trong description)
  - [x] Tạo `src/lib/peZipExtractor.ts` (giải nén file zip, lọc và sắp xếp ảnh tự nhiên, tải ảnh lên `theory-images`)

- [x] **Task 2: Exam Image Viewer Modal Component**
  - [x] Tạo `src/components/common/ExamImageViewerModal.tsx` (xem ảnh toàn màn hình, chuyển trang, zoom, phím tắt, tải zip gốc)

- [x] **Task 3: Admin Management (`AdminTheory.tsx`)**
  - [x] Thêm nút "Trích xuất ảnh từ ZIP" trên từng tài liệu PE
  - [x] Thêm nút "Trích xuất ảnh ZIP hàng loạt" trên thanh công cụ PE
  - [x] Cập nhật form upload file zip mới để tự động nhận diện và trích xuất ảnh
  - [x] Hiển thị huy hiệu `📸 X ảnh` và nút xem nhanh ảnh trên danh sách quản trị

- [x] **Task 4: Student UI (`SubjectDetailPage.tsx`)**
  - [x] Hiển thị danh sách thumbnail ảnh đề thi trong tab PE
  - [x] Mở `ExamImageViewerModal` khi click vào bất kỳ ảnh nào
  - [x] Giữ nguyên nút "Tải về" file ZIP gốc

- [x] **Task 5: Verification & Sync**
  - [x] Chạy kiểm thử tự động `npm test` (29/29 tests passed)
  - [x] Chạy `npm run build` (build production thành công)
  - [ ] Chạy `graphify update .` để đồng bộ đồ thị tri thức
  - [ ] Đẩy code lên cả 2 remote repositories (`origin` và `tqmaster`)
