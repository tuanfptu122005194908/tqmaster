# Feature Specification: Exam, Questions & Analytics Management

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented

---

## 1. Overview
Hệ thống quản trị đề thi (`/admin/exams`), báo cáo lỗi câu hỏi (`/admin/reports`) và thống kê đáp án (`/admin/exam-stats`) là hệ thống tạo lập nội dung đánh giá năng lực học tập của TQMaster. 

Hệ thống cho phép biên soạn và nhập liệu hàng trăm câu hỏi trắc nghiệm qua nhiều phương thức (Soạn thủ công, Nhập text/markdown, Tải file Word `.docx` chứa công thức KaTeX & hình ảnh, Nhập hàng loạt file `.zip`), quản lý phương án lựa chọn quan hệ (`question_options`), phân tích phân phối đáp án và xử lý phản ánh từ học sinh.

---

## 2. User Scenarios & Testing

### User Story 1 – Quản lý bộ đề thi & sắp xếp niên đại (Priority: P1)
Là một Quản trị viên, tôi muốn tạo đề thi mới và muốn các đề thi tự động được sắp xếp theo đúng mốc thời gian kỳ thi (SU > SP > FA).

**Acceptance Scenarios**:
1. **Given** Quản trị viên ở `/admin/exams`, **When** tạo đề thi với tiêu đề như "Đề thi thử SU26 - PE", thời gian 60 phút và gán vào môn học, **Then** đề thi được lưu vào `exams` và liên kết với `exam_subjects`.
2. **Given** danh sách đề thi chứa các mã kỳ như SU26, SP26, FA25, **When** danh sách hiển thị, **Then** hệ thống dùng hàm `sortExams` sắp xếp thứ tự chính xác: Năm mới hơn xếp trước, trong cùng năm sắp xếp theo: SU (Hè - Tháng 6) > SP (Xuân - Tháng 1) > FA (Thu - Tháng 9).

### User Story 2 – Nhập câu hỏi từ Word / Markdown / Zip (Priority: P1)
Là một Quản trị viên, tôi muốn nhập nhanh hàng chục câu hỏi kèm công thức Toán/Lý/Code LaTeX và hình ảnh minh họa từ tài liệu có sẵn.

**Acceptance Scenarios**:
1. **Given** Quản trị viên mở một đề thi, **When** tải file Word `.docx`, **Then** thư viện `mammoth` và `wordParser` trích xuất danh sách câu hỏi, tự động tách hình ảnh dạng base64, nén ảnh và tải lên Supabase Storage bucket `exam-images`, lưu các câu hỏi vào `questions` và đáp án vào `question_options`.
2. **Given** file chứa công thức toán LaTeX (ví dụ: `$E=mc^2$`, `$$\int_0^1 x dx$$`), **When** hiển thị trên giao diện, **Then** component `RichContent` dùng KaTeX kết xuất công thức toán học sắc nét.
3. **Given** Quản trị viên có bộ tài liệu nén `.zip`, **When** mở `BulkExamZipModal`, **Then** hệ thống đọc các file trong zip và giải nén nhập tự động nhiều đề thi cùng lúc.

### User Story 3 – Thống kê phân phối đáp án đúng (Thống kê A-B-C-D) (Priority: P2)
Là một Quản trị viên, tôi muốn kiểm tra tỷ lệ đáp án đúng (A, B, C, D) của các đề thi để phát hiện đề thi bị lệch đáp án.

**Acceptance Scenarios**:
1. **Given** Quản trị viên truy cập `/admin/exam-stats`, **When** trang tải xong, **Then** hệ thống thống kê tổng số câu hỏi và số lượng/tỷ lệ % đáp án đúng là A, B, C, D cho từng đề, nhóm theo từng môn học.
2. **Given** một đề thi có số lượng đáp án đúng phân bổ không đều (ví dụ: 80% là đáp án A), **Then** Quản trị viên phát hiện ngay qua thanh tỷ lệ trực quan.

### User Story 4 – Xử lý báo cáo sai sót câu hỏi (Priority: P2)
Là một Quản trị viên, tôi muốn nhận và giải quyết phản ánh của học sinh khi làm bài thi.

**Acceptance Scenarios**:
1. **Given** học sinh bấm "Báo lỗi câu hỏi" trong quá trình thi, **When** Quản trị viên vào `/admin/reports`, **Then** danh sách báo cáo hiển thị nội dung câu hỏi, lý do báo cáo, học viên gửi và ngày gửi.
2. **Given** một báo cáo đã được sửa trong ngân hàng câu hỏi, **When** Quản trị viên click "Đánh dấu đã giải quyết", **Then** trạng thái báo cáo chuyển thành `resolved`.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Quản trị đề thi toàn diện: `title`, `description`, `duration_min`, `is_active`, gán đa môn học qua `exam_subjects`.
- **FR-002**: Câu hỏi và phương án PHẢI lưu dạng quan hệ: bảng `questions` (`content`, `chapter_name`, `order_num`, `image_url`, `extra_images`) và `question_options` (`question_id`, `label`, `content`, `is_correct`, `image_url`).
- **FR-003**: Hỗ trợ 3 phương thức nạp câu hỏi:
  1. Soạn thảo trực tiếp từng câu hỏi và đáp án.
  2. Dán text cú pháp Markdown (`parseMarkdownExam`).
  3. Upload file Word `.docx` tự động trích xuất text + ảnh inline + công thức KaTeX (`parseHtmlToQuestions`).
  4. Upload file `.zip` chứa nhiều đề thi hàng loạt (`BulkExamZipModal`).
- **FR-004**: Hiển thị công thức toán học và ký tự đặc biệt thông qua `<RichContent>` tích hợp KaTeX.
- **FR-005**: Thống kê đáp án (`/admin/exam-stats`) truy vấn tổng hợp phẳng theo đáp án đúng `is_correct = true`.
- **FR-006**: Quản lý báo cáo câu hỏi (`/admin/reports`) kết nối trực tiếp với bảng `question_reports`.

### Key Entities
- **exams**: `id`, `title`, `description`, `duration_min`, `is_active`, `created_at`.
- **exam_subjects**: `id`, `exam_id`, `subject_id`.
- **questions**: `id`, `exam_id`, `content`, `chapter_name`, `order_num`, `image_url`, `extra_images` (mảng text).
- **question_options**: `id`, `question_id`, `label` (A, B, C, D...), `content`, `is_correct` (boolean), `image_url`.
- **question_reports**: `id`, `user_id`, `exam_id`, `question_index`, `reason`, `status` (`pending` | `resolved`), `created_at`.

---

## 4. Success Criteria
- **SC-001**: Nhập file Word 50 câu hỏi kèm hình ảnh hoàn thành trong < 15 giây.
- **SC-002**: Công thức toán học kết xuất chính xác, không bị vỡ font hoặc tràn khung hiển thị.
- **SC-003**: Sắp xếp danh sách đề thi phản ánh đúng trình tự niên đại của trường.
