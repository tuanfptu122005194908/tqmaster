# Feature Specification: Đẩy Tài Liệu PE PRO192 Lên Google Drive & Tích Hợp Web (Spec 41)

**Status**: Completed  
**Created**: 2026-11-05  
**Feature Directory**: `.sdd/specs/41-upload-pro192-pe-to-gdrive/`  

---

## 1. Mục tiêu & Bối cảnh (Overview & Problem Statement)

- **Bối cảnh**:
  - Người dùng cung cấp thư mục tài liệu `downloaded_theories` chứa 4 bộ đề thi PE mới nhất của kỳ Summer 2026 (SU26) môn **PRO192** (Object-Oriented Programming):
    1. `PRO192 - SU26 - B1 - PE - Paper 10 [6984]` (5 ảnh đề thi webp + 4 file zip materials)
    2. `PRO192 - SU26 - B1 - PE - Paper 9 [7044]` (5 ảnh đề thi webp + 4 file zip materials)
    3. `PRO192 - SU26 - B5 - PE - NO2 [FuExam-1215]` (6 ảnh đề thi webp + 1 file zip materials)
    4. `PRO192 - SU26 - PE - Paper 2 [7011]` (10 ảnh đề thi webp + 4 file zip materials)
  - Yêu cầu người dùng: Đẩy toàn bộ tài liệu này lên Google Drive thư mục môn `PRO192`, đồng thời hiển thị vào mục tài liệu PE trên website TQMaster.
- **Giải pháp**:
  - Tự động đóng gói từng đề thành file ZIP trọn bộ kèm các file tài liệu và ảnh đề gốc.
  - Tạo các thư mục con tương ứng trên Google Drive trong thư mục cha của môn PRO192 (`Kỳ 2/PRO192` - ID: `169DaNM4A1jxlS4u_3bX0fOg28z2zkFSv`) với quyền công khai (`anyoneWithLink` / reader).
  - Tải ảnh preview câu hỏi lên Supabase Storage bucket `theory-images` để học sinh có thể lướt xem trước đề thi dạng filmstrip trực quan ngay trên website.
  - Lưu metadata cấu trúc `<!--PE_META:{"preview_images": [...]}-->` vào bảng `theories` với `category: 'pe'`.
  - Liên kết các đề PE vào cả 2 môn học trong hệ thống: `PRO192` (`7af75eb1-b56d-4d46-8647-c9bfd9048d5e`) và `PRO192 (Khoá Học)` (`e6688086-7449-4d87-89df-9dfc4337582e`).

---

## 2. Kịch bản Người dùng & Tiêu chí Nghiệm thu (User Scenarios Given-When-Then)

### Kịch bản 1: Tải tài liệu đề thi PE lên Google Drive
- **Given**: Thư mục `downloaded_theories` có 4 thư mục đề thi PE của môn PRO192.
- **When**: Chạy script upload chuyên dụng `scripts/upload_pro192_pe.py`.
- **Then**: 
  - Tạo 4 thư mục con trên Google Drive với quyền `reader` cho `anyone`.
  - Tải lên đầy đủ các file zip tài liệu, ảnh đề gốc và file nén tổng hợp `.zip`.
  - Ghi nhận `drive_folder_url` của từng đề thi.

### Kịch bản 2: Hiển thị đề thi PE trên giao diện môn học Web TQMaster
- **Given**: Học sinh truy cập trang chi tiết môn học `PRO192` hoặc `PRO192 (Khoá Học)`.
- **When**: Bấm vào tab "Tài liệu PE" (`category: 'pe'`).
- **Then**:
  - Danh sách hiển thị 4 đề thi PE SU26 mới:
    - `Đề_Thi_PE_-_PRO192_-_SU26_-_B1_-_Paper_10`
    - `Đề_Thi_PE_-_PRO192_-_SU26_-_B1_-_Paper_9`
    - `Đề_Thi_PE_-_PRO192_-_SU26_-_B5_-_NO2`
    - `Đề_Thi_PE_-_PRO192_-_SU26_-_Paper_2`
  - Mỗi đề có dải ảnh preview câu hỏi (filmstrip) có thể bấm vào phóng to xem trực tiếp.
  - Thẻ tài liệu có nút mở thẳng thư mục Google Drive để học sinh tải trọn bộ hoặc xem tài liệu online mà không tốn egress của Supabase Storage.

---

## 3. Yêu cầu Nghiệp vụ & Kỹ thuật (Functional Requirements)

- **FR-001**: Quét và đóng gói từng đề thi PE PRO192 trong `downloaded_theories`:
  - Phân loại rõ ràng danh sách ảnh câu hỏi (`.webp`) và file đính kèm (`.zip`).
  - Tạo file nén tổng hợp `{title}.zip` chứa đầy đủ ảnh và file bài tập.
- **FR-002**: Tạo thư mục trên Google Drive thông qua Google Drive API (sử dụng token đã xác thực từ plugin Google Drive):
  - Đặt quyền `reader` công khai cho `anyone`.
  - Tải tất cả các file lẻ và file ZIP tổng hợp lên Google Drive.
- **FR-003**: Tải ảnh preview câu hỏi lên Supabase Storage bucket `theory-images` tại đường dẫn:
  - `pe-extracts/{theory_id}/{idx}_{timestamp}_q{idx}.webp`
  - Cho phép người học xem trước ảnh đề thi mượt mà, tức thì.
- **FR-004**: Đăng ký bản ghi mới vào bảng `public.theories`:
  - `title`: Tên đề chuẩn hóa.
  - `description`: Chứa comment metadata `<!--PE_META:{"preview_images": [...]}-->`.
  - `category`: `'pe'`.
  - `type`: `'file'`.
  - `url`: Google Drive folder URL.
  - `file_name`: Tên file zip tổng hợp.
  - `created_by`: Admin ID (`d6b4218e-9081-4fcd-b19f-f7854bf147dd`).
- **FR-005**: Liên kết bản ghi `theories` vào bảng `public.theory_subjects`:
  - Liên kết với subject `PRO192` (`7af75eb1-b56d-4d46-8647-c9bfd9048d5e`).
  - Liên kết với subject `PRO192 (Khoá Học)` (`e6688086-7449-4d87-89df-9dfc4337582e`).

---

## 4. Key Entities & Files

- `scripts/upload_pro192_pe.py`: Script tự động hóa toàn diện từ đọc file, nén, upload Google Drive, upload Storage, ghi Supabase DB.
- `scratch/gdrive_upload_state.json`: Lưu trạng thái đồng bộ Drive để tránh trùng lặp.
- `src/pages/user/SubjectDetailPage.tsx`: Giao diện hiển thị đề thi PE và filmstrip preview.
- Supabase DB Tables: `theories`, `theory_subjects`, `subjects`.

---

## 5. Tiêu chí Thành công (Success Criteria)

- **SC-001**: 100% 4 bộ đề thi PE PRO192 SU26 được tải lên Google Drive an toàn và mở quyền truy cập công khai.
- **SC-002**: 100% ảnh câu hỏi có mặt trong Supabase Storage `theory-images` và render sắc nét trên filmstrip.
- **SC-003**: Học sinh truy cập môn `PRO192` và `PRO192 (Khoá Học)` trên website nhìn thấy ngay 4 đề thi PE mới kèm link Drive và ảnh preview.
- **SC-004**: Tất cả unit tests (`npm test`) tiếp tục pass 100% (114/114 tests) và hoàn thành Dual-repo Git Push (`origin` và `tqmaster`).

