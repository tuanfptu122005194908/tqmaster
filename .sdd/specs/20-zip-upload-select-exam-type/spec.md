---
Feature Branch: 20-zip-upload-select-exam-type
Status: Active
---

# 1. Overview
Tính năng tải đề thi hàng loạt từ file ZIP (hoặc MD/TXT) ở trang Quản lý Đề thi đang thiếu tùy chọn để xác định loại đề thi (FE hoặc PT) cho các đề thi được tạo ra. Hiện tại, loại đề thi mặc định không được thiết lập rõ ràng từ modal upload, gây bất tiện.
Yêu cầu là thêm một dropdown (hoặc radio) để người dùng có thể chọn loại đề thi (FE hoặc PT) trước khi tải lên, và lưu trường này vào database.

# 2. User Scenarios & Testing
- **Scenario 1: Upload đề thi ZIP và gán loại FE**
  - **Given** người dùng mở BulkExamZipModal
  - **When** người dùng cấu hình chọn môn, thời gian, và chọn Loại đề thi là "FE" (Final Exam)
  - **And** tải lên 1 file ZIP hợp lệ
  - **Then** các đề thi được tạo ra phải có nhãn loại đề là "FE"
- **Scenario 2: Upload đề thi ZIP và gán loại PT**
  - **Given** người dùng mở BulkExamZipModal
  - **When** người dùng cấu hình chọn Loại đề thi là "PT" (Progress Test)
  - **And** tải lên 1 file ZIP hợp lệ
  - **Then** các đề thi được tạo ra phải có nhãn loại đề là "PT"

# 3. Requirements
- `FR-01`: Thêm tuỳ chọn (select hoặc radio group) chọn loại đề (FE / PT) vào phần cấu hình của `BulkExamZipModal`.
- `FR-02`: Loại đề (exam_type) được chọn sẽ áp dụng cho tất cả các đề thi được phân tích từ file.
- `FR-03`: Trong hàm `handleStartUpload`, lưu trường `exam_type` khi insert vào bảng `exams`.

### Key Entities
- Bảng `exams` (trường `exam_type` kiểu 'FE' | 'PT')

### Key Files
- `src/components/admin/BulkExamZipModal.tsx`

# 4. Success Criteria
- `SC-01`: Dropdown/radio cho phép chọn loại đề hiển thị ở modal upload.
- `SC-02`: Upload thành công và dữ liệu đề thi trên danh sách hiển thị đúng loại FE/PT đã chọn.
