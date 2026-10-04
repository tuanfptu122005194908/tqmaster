# Feature Specification: Exam, Questions & Analytics Management

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.2)

---

## 1. Overview
Hệ thống quản trị đề thi (`/admin/exams`), báo cáo lỗi câu hỏi (`/admin/reports`) và thống kê đáp án & phân tích độ khó (`/admin/exam-stats`) là hệ sinh thái tạo lập và giám sát chất lượng nội dung đánh giá năng lực học tập của TQMaster. 

Hệ thống cho phép biên soạn hàng trăm câu hỏi trắc nghiệm qua nhiều phương thức (Soạn thủ công, Nhập text/markdown, Tải file Word `.docx` chứa công thức KaTeX & hình ảnh inline, Nhập hàng loạt file `.zip`), xử lý lỗi "Dính đề bài vào Đáp án A" tự động, phân tích phân phối đáp án A-B-C-D, và xử lý các đề xuất sửa đáp án từ học viên theo thời gian thực (nhóm theo đề xuất).

---

## 2. User Scenarios & Testing

### User Story 1 – Quản lý bộ đề thi & Sắp xếp niên đại FPT (Priority: P1)
Là một Quản trị viên, tôi muốn tạo đề thi mới và muốn các đề thi tự động được sắp xếp theo đúng mốc thời gian kỳ thi chuẩn FPT.

**Acceptance Scenarios**:
1. **Given** danh sách đề thi chứa các mã kỳ như SU26, SP26, FA25, **When** danh sách hiển thị, **Then** hệ thống dùng hàm `sortExams` sắp xếp thứ tự chính xác: Năm mới hơn xếp trước, trong cùng năm sắp xếp theo: SU (Hè) > SP (Xuân) > FA (Thu).
2. **Given** thao tác xóa đề thi, **When** nhấn xóa, **Then** tất cả câu hỏi, tùy chọn và hình ảnh liên kết (nếu có cascading) sẽ bị xóa tương ứng.
3. **Given** thao tác đổi đáp án đúng của 1 câu hỏi, **When** click chọn, **Then** UI lập tức (Optimistic UI) cập nhật giao diện, đồng thời lưu xuống DB để đảm bảo độ mượt.

### User Story 2 – Nhập câu hỏi từ Word / Markdown / Zip (Priority: P1)
Là một Quản trị viên, tôi muốn upload file chứa câu hỏi kèm hình ảnh hoặc mã toánh học, hệ thống sẽ tự động bóc tách.

**Acceptance Scenarios**:
1. **Given** file `.docx` chứa text và hình inline, **When** tải lên, **Then** `mammoth.convertToHtml()` đọc base64 ảnh, hệ thống tự nén qua canvas và upload song song lên Storage, cuối cùng sinh ra danh sách câu hỏi.
2. **Given** file `.md` chứa cấu trúc Markdown, **When** tải lên, **Then** `parseMarkdownExam` bóc tách từng câu.
3. **Given** tình trạng file docx bị lỗi định dạng dính nội dung đề bài vào Option A, **When** hệ thống phát hiện hoặc người dùng bấm "Tự động sửa lỗi dính Đáp án A", **Then** `detectGluedOptionA` tách đoạn đề bài trả lại cho `content` và lấy đáp án thật cho Option A.

### User Story 3 – Báo cáo lỗi câu hỏi từ Học viên (Priority: P2)
Là Quản trị viên, tôi muốn nhận và xử lý các báo cáo sai đáp án của học sinh.

**Acceptance Scenarios**:
1. **Given** có nhiều học sinh cùng báo cáo 1 câu hỏi nên chọn đáp án B, **When** Quản trị viên mở `/admin/reports`, **Then** các báo cáo này được nhóm lại chung thành 1 thẻ "Đề xuất đáp án: B" với số lượng báo cáo kèm ghi chú.
2. **When** Quản trị viên bấm "Chấp nhận sửa", **Then** hệ thống set đáp án cũ thành `false`, set đáp án đề xuất thành `true`, đổi status báo cáo thành `approved` và thông báo thành công.

### User Story 4 – Thống kê phân phối đáp án (Priority: P2)
Là Quản trị viên, tôi muốn xem thống kê lượng đáp án A, B, C, D để đảm bảo đề thi không bị lệch (ví dụ toàn đáp án A).

**Acceptance Scenarios**:
1. **Given** trang `/admin/exam-stats`, **When** tải dữ liệu, **Then** hệ thống fetch toàn bộ dữ liệu (sử dụng pagination song song để tránh limit) và gom nhóm theo Môn học -> Đề thi.
2. **Given** một đề thi có 50 câu A và 10 câu B, **When** hiển thị biểu đồ thanh, **Then** hệ thống xuất hiện cảnh báo (Alert) màu cam về sự chênh lệch (unbalanced). Nếu đồng đều sẽ hiện tick xanh.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Word & Zip Import)**: Sử dụng `mammoth` đọc Docx in-memory, bóc tách text và Base64 Image. Nén ảnh và tải lên qua `batchUploadImages`. Zip được xử lý bằng `jszip`.
- **FR-002 (Glued Option Fix)**: Logic `handleFixAllGluedOptionA` phải duyệt tất cả câu hỏi, dùng RegEx phát hiện mẫu "Câu X" nằm bên trong nội dung của Option A và tách trả về cho câu hỏi gốc.
- **FR-003 (Reports Grouping)**: Bảng `question_reports` cần được fetch kèm theo `user`, `suggested_option`. Các báo cáo có cùng một tập `suggested_option_id` cho cùng 1 câu hỏi phải được gom nhóm (`comboKey`) trên giao diện admin để duyệt 1 lần.
- **FR-004 (Stats Aggregation)**: Thống kê phải tính toán lượng đáp án đúng bằng cách lookup các options có `is_correct = true`. Phải thực hiện cảnh báo lệch đáp án nếu chênh lệch giữa max và min vượt quá 15% tổng số câu hỏi.
- **FR-005 (Optimistic UI)**: Khi click chuyển đáp án đúng, UI state `setQuestions` phải được cập nhật ngay lập tức trước khi chờ response từ Supabase để tăng UX.

### Key Entities
- **exams**: `id`, `title`, `duration_min`, `is_active`, `created_by`.
- **questions**: `id`, `exam_id`, `content`, `type`, `image_url`, `extra_images`, `chapter_name`, `order_num`.
- **question_options**: `id`, `question_id`, `label`, `content`, `is_correct`, `image_url`.
- **question_reports**: `id`, `question_id`, `user_id`, `suggested_option_id`, `note`, `status` (`pending`, `approved`, `rejected`), `created_at`.

### Key Files
- `src/pages/admin/AdminExams.tsx`: Chứa toàn bộ giao diện quản lý đề thi, import Word, Text, Markdown, sửa lỗi Option A.
- `src/pages/admin/AdminQuestionReports.tsx`: Xử lý, gom nhóm báo cáo lỗi của học sinh.
- `src/pages/admin/AdminExamStats.tsx`: Phân tích thống kê và phân phối A/B/C/D.
- `src/lib/wordParser.ts` / `src/lib/markdownExamParser.ts`: Logic parsing cốt lõi.
- `src/lib/imageUpload.ts`: Hàm batch upload ảnh.

---

## 4. Success Criteria
- **SC-001**: Nhập file Word có hình ảnh thành công, tự động nén và tải lên Storage không gây crash ứng dụng.
- **SC-002**: Tính năng tự động phát hiện và sửa lỗi "Dính đề bài vào Đáp án A" hoạt động đúng trên 90% trường hợp thực tế từ ngân hàng đề FPT.
- **SC-003**: Cảnh báo phân bổ đáp án (Stats) hoạt động chuẩn xác với sai số 0%, nhận biết được đề thi thiếu đáp án hoặc lệch.
- **SC-004**: Nhóm báo cáo lỗi hiển thị gọn gàng, Admin click "Duyệt" 1 lần sẽ xử lý xong hàng loạt báo cáo cùng loại cho 1 câu hỏi.
