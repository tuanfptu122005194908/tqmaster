# Feature Specification: Exam, Questions & Analytics Management

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.2)

---

## 1. Overview

Hệ thống quản trị đề thi (`/admin/exams`), báo cáo lỗi câu hỏi (`/admin/reports`) và thống kê đáp án & phân tích độ khó (`/admin/exam-stats`) là hệ sinh thái tạo lập và giám sát chất lượng nội dung đánh giá năng lực học tập của TQMaster. 

Hệ thống cho phép biên soạn và nhập liệu hàng trăm câu hỏi trắc nghiệm qua nhiều phương thức (Soạn thủ công, Nhập text/markdown, Tải file Word `.docx` chứa công thức KaTeX & hình ảnh inline, Nhập hàng loạt file `.zip` chứa nhiều đề thi), quản lý phương án lựa chọn quan hệ (`question_options`), phân tích phân phối đáp án A-B-C-D, xác định câu hỏi khó nhất và xử lý phản hồi từ học sinh với thông báo thời gian thực.

---

## 2. User Scenarios & Testing

### User Story 1 – Quản lý bộ đề thi & Sắp xếp niên đại FPT (Priority: P1)
Là một Quản trị viên, tôi muốn tạo đề thi mới và muốn các đề thi tự động được sắp xếp theo đúng mốc thời gian kỳ thi chuẩn FPT (SU > SP > FA).

**Acceptance Scenarios**:
1. **Given** Quản trị viên ở `/admin/exams`, **When** tạo đề thi với tiêu đề như "Đề thi thử SU26 - PE", thời gian 60 phút và gán vào môn học, **Then** đề thi được lưu vào `exams` và liên kết với `exam_subjects`.
2. **Given** danh sách đề thi chứa các mã kỳ như SU26, SP26, FA25, **When** danh sách hiển thị, **Then** hệ thống dùng hàm `sortExams` sắp xếp thứ tự chính xác: Năm mới hơn xếp trước, trong cùng năm sắp xếp theo: SU (Hè - Tháng 6) > SP (Xuân - Tháng 1) > FA (Thu - Tháng 9).
3. **Given** đề thi chứa các cấu hình hiển thị đặc biệt (ví dụ: đề thi dạng ảnh chụp), **When** lưu thông tin, **Then** các trường thuộc tính được đồng bộ chính xác.

### User Story 2 – Nhập câu hỏi từ Word / Markdown / Zip (Priority: P1)
Là một Quản trị viên, tôi muốn nhập nhanh hàng chục câu hỏi kèm công thức Toán/Lý/Code LaTeX và hình ảnh minh họa từ tài liệu có sẵn.

**Acceptance Scenarios**:
1. **Given** Quản trị viên mở một đề thi, **When** tải file Word `.docx`, **Then** thư viện `mammoth` và bộ phân giải `wordParser` trích xuất danh sách câu hỏi qua HTML, tự động tách hình ảnh dạng base64, nén ảnh và tải lên Supabase Storage bucket `exam-images`, lưu các câu hỏi vào `questions` và đáp án vào `question_options`.
2. **Given** file chứa công thức toán LaTeX (ví dụ: `$E=mc^2$`, `$$\int_0^1 x dx$$`), **When** hiển thị trên giao diện quản trị hoặc phòng thi, **Then** component `RichContent` dùng KaTeX kết xuất công thức toán học sắc nét.
3. **Given** Quản trị viên có bộ tài liệu nén `.zip`, **When** mở `BulkExamZipModal`, **Then** hệ thống tự động giải nén trong trình duyệt, phân tích cấu trúc từng file đề thi và nhập đồng loạt nhiều đề vào ngân hàng câu hỏi.

### User Story 3 – Thống kê phân phối đáp án & Phân tích câu hỏi khó (Priority: P2)
Là một Quản trị viên, tôi muốn kiểm tra tỷ lệ đáp án đúng (A, B, C, D) của các đề thi để phát hiện đề thi bị lệch đáp án, đồng thời xem học sinh hay làm sai ở câu nào nhất.

**Acceptance Scenarios**:
1. **Given** Quản trị viên truy cập `/admin/exam-stats`, **When** trang tải xong, **Then** hệ thống thống kê tổng số câu hỏi và số lượng/tỷ lệ % đáp án đúng là A, B, C, D cho từng đề, nhóm theo từng môn học.
2. **Given** một đề thi có số lượng đáp án đúng phân bổ không đều (ví dụ: 80% là đáp án A), **Then** Quản trị viên phát hiện ngay qua thanh tỷ lệ trực quan màu sắc.
3. **Given** bảng phân tích lượt làm bài từ `exam_attempts` và `attempt_answers`, **When** Quản trị viên chọn xem độ khó, **Then** hệ thống liệt kê các câu hỏi có tỷ lệ trả lời sai cao nhất để giáo viên kịp thời bổ sung giải thích hoặc điều chỉnh tài liệu lý thuyết.

### User Story 4 – Tiếp nhận & Xử lý báo cáo lỗi câu hỏi (Priority: P2)
Là một Quản trị viên, tôi muốn nhận và giải quyết phản ánh của học sinh khi làm bài thi để cải thiện chất lượng đề thi.

**Acceptance Scenarios**:
1. **Given** học sinh bấm "Báo lỗi câu hỏi" trong quá trình thi (tại `/exams/:id`), **When** Quản trị viên vào `/admin/reports`, **Then** danh sách báo cáo hiển thị nội dung câu hỏi, lý do báo cáo (Sai đáp án, mờ ảnh, lỗi công thức), học viên gửi và ngày gửi.
2. **Given** Quản trị viên click vào nút "Sửa đề thi" trên báo cáo, **Then** hệ thống điều hướng trực tiếp sang `/admin/exams` với bộ lọc mở đúng đề thi và câu hỏi cần sửa.
3. **Given** báo cáo đã được khắc phục, **When** Quản trị viên click "Đánh dấu đã giải quyết", **Then** trạng thái bản ghi trong `question_reports` chuyển thành `resolved` và biến mất khỏi danh sách chờ xử lý.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Quản trị đề thi toàn diện: `title`, `description`, `duration_min`, `is_active`, gán đa môn học qua `exam_subjects`.
- **FR-002**: Câu hỏi và phương án PHẢI lưu dạng quan hệ: bảng `questions` (`content`, `chapter_name`, `order_num`, `image_url`, `extra_images`) và `question_options` (`question_id`, `label`, `content`, `is_correct`, `image_url`).
- **FR-003**: Hỗ trợ 4 phương thức nạp câu hỏi:
  1. Soạn thảo trực tiếp từng câu hỏi và đáp án trên giao diện.
  2. Dán text cú pháp Markdown (`parseMarkdownExam`).
  3. Upload file Word `.docx` tự động trích xuất text + ảnh inline + công thức KaTeX (`parseHtmlToQuestions`).
  4. Upload file `.zip` chứa nhiều đề thi hàng loạt (`BulkExamZipModal`).
- **FR-004**: Hiển thị công thức toán học và ký tự đặc biệt thông qua `<RichContent>` tích hợp KaTeX và Markdown.
- **FR-005 (Thống kê đáp án & Hiệu suất)**: Màn hình `/admin/exam-stats` truy vấn tổng hợp phân phối đáp án đúng `is_correct = true`, thống kê tổng số câu hỏi, tỉ lệ lựa chọn từng phương án và điểm số trung bình từ `exam_attempts`.
- **FR-006 (Quản lý Báo cáo phản ánh)**: Màn hình `/admin/reports` kết nối trực tiếp với bảng `question_reports`, cung cấp bộ lọc trạng thái (`pending` / `resolved`) và lối tắt sang trang sửa đề thi tương ứng.
- **FR-007 (Realtime Badge Counter)**: `AppContext` cung cấp hàm `refreshPendingReportsCount` lắng nghe số lượng báo cáo chờ xử lý và hiển thị chấm đỏ thông báo trên menu quản trị.

### Key Entities
- **exams**: `id`, `title`, `description`, `duration_min`, `is_active`, `created_at`.
- **exam_subjects**: `id`, `exam_id`, `subject_id`.
- **questions**: `id`, `exam_id`, `content`, `chapter_name`, `order_num`, `image_url`, `extra_images` (mảng text).
- **question_options**: `id`, `question_id`, `label` (A, B, C, D...), `content`, `is_correct` (boolean), `image_url`.
- **question_reports**: `id`, `user_id`, `exam_id`, `question_index`, `reason`, `status` (`'pending'` | `'resolved'`), `created_at`.
- **exam_attempts**: `id`, `user_id`, `exam_id`, `score`, `total_questions`, `correct_count`, `duration_seconds`, `created_at`.
- **attempt_answers**: `id`, `attempt_id`, `question_id`, `selected_option_id`, `is_correct`.

### Key Files
- `src/pages/admin/AdminExams.tsx` — Quản trị ngân hàng đề thi & câu hỏi
- `src/pages/admin/AdminExamStats.tsx` — Thống kê phân phối đáp án A-B-C-D và báo cáo độ khó đề thi
- `src/pages/admin/AdminQuestionReports.tsx` — Trung tâm tiếp nhận và xử lý báo cáo lỗi câu hỏi
- `src/components/admin/BulkExamZipModal.tsx` — Modal giải nén và nhập hàng loạt đề thi từ file Zip
- `src/lib/wordParser.ts` — Bộ trích xuất HTML & ảnh nhúng từ tài liệu Word `.docx`
- `src/lib/markdownExamParser.ts` — Bộ phân tích cú pháp đề thi từ văn bản Markdown
- `src/components/exam/RichContent.tsx` — Bộ kết xuất công thức KaTeX & định dạng văn bản giàu

---

## 4. Success Criteria
- **SC-001**: Nhập file Word 50 câu hỏi kèm hình ảnh hoàn thành trong < 15 giây.
- **SC-002**: Công thức toán học kết xuất chính xác, không bị vỡ font hoặc tràn khung hiển thị.
- **SC-003**: Sắp xếp danh sách đề thi phản ánh đúng trình tự niên đại của Đại học FPT (SU > SP > FA).
- **SC-004**: Thống kê đáp án và báo cáo lỗi phản hồi nhanh < 500ms khi mở trang.
