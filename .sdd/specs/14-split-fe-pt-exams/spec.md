# Header
Feature Branch: feature/split-fe-pt-exams
Status: Active

## 1. Overview
Yêu cầu tách danh sách đề thi ra thành 2 tab "Đề thi FE" và "Đề thi PT". Người quản trị (Admin) khi tạo đề hoặc tải đề lên sẽ được chọn rõ ràng loại đề thi là FE (Final Exam) hay PT (Progress Test). Ở giao diện người dùng, hệ thống tự động đưa đề thi vào đúng tab tương ứng dựa trên loại đề.

## 2. User Scenarios & Testing
- **Given** Admin mở trang Quản lý Đề thi (AdminExams).
- **When** bấm "Tạo đề", form hiển thị thêm tuỳ chọn "Loại đề: FE hay PT".
- **Then** Admin có thể chọn lưu đề thi dưới dạng FE hoặc PT rõ ràng.
- **Given** người dùng ở trang chi tiết môn học.
- **When** người dùng nhìn vào thanh điều hướng tab.
- **Then** người dùng thấy các tab "Đề thi FE" và "Đề thi PT".
- **Given** người dùng bấm vào "Đề thi FE".
- **Then** hệ thống hiển thị danh sách các đề thi có loại là FE.
- **Given** người dùng bấm vào "Đề thi PT".
- **Then** hệ thống hiển thị danh sách các đề thi có loại là PT.

## 3. Requirements
- **FR-001**: Thêm trường `exam_type` (chuỗi: 'FE' | 'PT', mặc định 'FE') vào bảng `exams` trong Database Supabase.
- **FR-002**: Cập nhật Admin UI (`AdminExams.tsx`): Thêm radio/select cho phép chọn `exam_type` khi tạo và sửa đề thi.
- **FR-003**: Cập nhật User UI (`SubjectDetailPage.tsx`):
  - Đổi tên tab `exams` thành "Đề thi FE".
  - Thêm tab `exams_pt` với tên "Đề thi PT" ngay sau "Đề thi FE".
  - Lọc danh sách `feExams` = `exams.filter(e => e.exam_type !== 'PT')`
  - Lọc danh sách `ptExams` = `exams.filter(e => e.exam_type === 'PT')`
- **FR-004**: Tái sử dụng logic render UI giao diện danh sách đề thi (với các nút Flashcard, Ôn tập, Thi thử) cho cả 2 tab.

### Key Entities
- Bảng `exams`:
  - Thêm cột `exam_type` kiểu `text` (mặc định `'FE'`).

### Key Files
- `src/integrations/supabase/types.ts`
- `src/pages/admin/AdminExams.tsx`
- `src/pages/user/SubjectDetailPage.tsx`

## 4. Success Criteria
- **SC-001**: Trong Admin tạo/sửa đề thi có thể chọn loại đề (FE / PT).
- **SC-002**: Ở giao diện User, đề FE hiển thị trong tab FE, đề PT hiển thị trong tab PT.
- **SC-003**: Không làm hỏng các đề thi hiện tại (các đề cũ mặc định tự động hiểu là FE).
