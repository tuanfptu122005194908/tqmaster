# Feature Specification: Interactive Exam Engine & Assessment

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.1)

---

## 1. Overview
Hệ thống phòng thi trực tuyến (`/exams/:id`) là tính năng cốt lõi của nền tảng TQMaster, mô phỏng sát nhất kỳ thi trắc nghiệm khách quan trên máy tính của Đại học FPT. 

Hệ thống cung cấp giao diện làm bài tập trung cao độ (Full-screen, Zoom tài liệu, Kéo di chuyển ảnh đề, Chế độ đề thi ảnh Fit-content ôm sát khung hình), đồng hồ đếm ngược với cảnh báo âm thanh, ma trận điều hướng câu hỏi, chế độ thẻ ghi nhớ (Flashcard mode), cơ chế chấm điểm tức thì và phân tích chi tiết kết quả sau khi nộp bài.

---

## 2. User Scenarios & Testing

### User Story 1 – Làm bài thi tính giờ chuẩn cấu trúc FPT (Priority: P1)
Là một học viên, tôi muốn làm đề thi trắc nghiệm có đồng hồ đếm ngược để rèn luyện áp lực thời gian thực tế.

**Acceptance Scenarios**:
1. **Given** học viên truy cập `/exams/:id`, **When** đề thi tải xong, **Then** đồng hồ đếm ngược bắt đầu chạy theo `duration_min` của đề thi (VD: 60:00).
2. **Given** học viên chọn phương án cho câu hỏi hiện tại, **When** click vào ô đáp án A/B/C/D, **Then** phương án được chọn được đánh dấu xanh dương, nút số câu trên bảng ma trận chuyển sang màu xanh lá ("Đã làm").
3. **Given** câu hỏi khó cần xem lại sau, **When** học viên bấm icon Cờ ("Đánh dấu"), **Then** câu hỏi được gắn cờ vàng trên thanh ma trận.
4. **Given** đồng hồ đếm ngược về 00:00, **When** hết giờ, **Then** hệ thống tự động phát âm thanh cảnh báo và tự động nộp bài mà không cần học sinh bấm.

### User Story 2 – Trải nghiệm đề thi dạng ảnh ôm sát & Căn đỉnh (Fit-Content Frame) (Priority: P1)
Là một học viên làm các đề thi được số hóa từ đề thi giấy hoặc bản scan ảnh câu hỏi, tôi muốn khung đề thi ôm sát ảnh, không có khoảng đen thừa và không bị tràn cuộn dọc khó chịu.

**Acceptance Scenarios**:
1. **Given** đề thi là dạng ảnh scan (nội dung câu hỏi chứa ảnh trọn gói), **When** câu hỏi hiển thị, **Then** khung chứa ảnh tự động co dãn theo kích thước thực tế của ảnh (`fit-content`), căn sát mép trên (`align-top`) và triệt tiêu hoàn toàn hiện tượng tràn viền cuộn dọc.
2. **Given** học viên cần đọc kỹ chi tiết sơ đồ hoặc code trong ảnh, **When** học viên dùng công cụ Zoom In (+), **Then** ảnh phóng to mượt mà, cho phép nhấn giữ chuột trái để kéo rê (Drag to Pan).
3. **Given** học viên muốn nhìn toàn cảnh, **When** click đúp hoặc click icon Maximize, **Then** ảnh mở rộng trong modal toàn màn hình (Lightbox).

### User Story 3 – Báo cáo câu hỏi có sai sót (Priority: P2)
Là một học viên, tôi muốn phản ánh ngay khi phát hiện câu hỏi bị lỗi đáp án, lỗi ảnh hoặc công thức.

**Acceptance Scenarios**:
1. **Given** học viên đang ở một câu hỏi, **When** click nút "Báo lỗi" (icon cờ hoặc cảnh báo), **Then** modal phản ánh mở ra.
2. **When** học viên chọn lý do (Sai đáp án, Mờ ảnh, Lỗi công thức...) và nhập giải trình, nhấn "Gửi báo cáo", **Then** phản ánh được lưu vào bảng `question_reports` và thông báo cảm ơn xuất hiện.

### User Story 4 – Chấm điểm tức thì & Xem lại lời giải chi tiết (Priority: P1)
Là một học viên, tôi muốn biết điểm số ngay sau khi nộp và xem lại những câu làm sai để rút kinh nghiệm.

**Acceptance Scenarios**:
1. **Given** học viên bấm "Nộp bài" và xác nhận, **When** bài được chấm, **Then** giao diện kết quả hiển thị: Điểm thang 10, Số câu đúng / Tổng câu, Thời gian hoàn thành, và phát âm thanh tương ứng (Chiến thắng nếu đạt điểm cao).
2. **Given** màn hình kết quả thi, **When** học viên chuyển sang chế độ "Xem lại bài làm", **Then**:
   - Phương án đúng hiển thị màu xanh lá kèm tick xanh.
   - Phương án học sinh chọn sai hiển thị màu đỏ kèm dấu X đỏ.
   - Cho phép lọc xem "Chỉ câu sai" hoặc "Chỉ câu đã đánh dấu cờ".

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Trình thi tải dữ liệu câu hỏi từ bảng `questions` và đáp án từ `question_options` theo quan hệ 1-N (không dùng mảng JSON phẳng).
- **FR-002**: Toàn bộ nội dung câu hỏi và các phương án lựa chọn PHẢI được hiển thị qua `<RichContent>` hỗ trợ LaTeX/KaTeX và định dạng Markdown.
- **FR-003**: Cung cấp công cụ điều khiển hình ảnh nâng cao: Phóng to (Zoom In), Thu nhỏ (Zoom Out), Kéo rê chuột (Drag-to-pan) và Mở toàn màn hình (Fullscreen lightbox).
- **FR-004 (Image Exam Frame Optimization)**: Khung hiển thị đề thi dạng ảnh áp dụng kỹ thuật căn chỉnh `fit-content` ôm sát hình ảnh, căn lề trên cùng và loại bỏ khoảng cách dọc dư thừa, đem lại trải nghiệm đọc đề liền mạch.
- **FR-005**: Đồng hồ đếm ngược chạy độc lập với cảnh báo âm thanh và màu đỏ khi còn dưới 5 phút, tự động kích hoạt hàm nộp bài khi hết giờ.
- **FR-006**: Bảng điều hướng câu hỏi (Navigation Palette) thể hiện 4 trạng thái trực quan:
  1. Câu đang xem (Viền xanh, nền sáng).
  2. Câu đã chọn đáp án (Màu xanh lá).
  3. Câu đánh dấu xem lại (Màu cam có biểu tượng cờ).
  4. Câu chưa làm (Màu trắng xám).
- **FR-007**: Báo lỗi câu hỏi PHẢI lưu vào bảng `question_reports` kèm `user_id`, `exam_id`, `question_index` và `reason`.
- **FR-008**: Sau khi nộp, lưu bản ghi lần thi vào `exam_attempts` và câu trả lời chi tiết vào bảng `attempt_answers`.

### Key Entities
- **exams**: `id`, `title`, `duration_min`, `is_active`.
- **questions**: `id`, `exam_id`, `content`, `image_url`, `extra_images`, `order_num`, `chapter_name`.
- **question_options**: `id`, `question_id`, `label`, `content`, `is_correct`, `image_url`.
- **question_reports**: `id`, `user_id`, `exam_id`, `question_index`, `reason`, `status`.
- **exam_attempts**: `id`, `user_id`, `exam_id`, `score`, `total_questions`, `correct_count`, `duration_seconds`, `created_at`.
- **attempt_answers**: `id`, `attempt_id`, `question_id`, `selected_option_id`, `is_correct`.

### Key Files
- `src/pages/user/ExamPage.tsx` — Động cơ phòng thi trực tuyến, điều khiển thời gian, giao diện trắc nghiệm, khung hiển thị đề thi ảnh
- `src/components/exam/RichContent.tsx` — Kết xuất công thức toán học KaTeX và Markdown
- `src/lib/sound.ts` — Quản lý âm thanh hiệu ứng làm bài thi, nộp bài thành công và hết giờ

---

## 4. Success Criteria
- **SC-001**: Chuyển câu hỏi tức thì (< 16ms, mượt 60fps) không bị giật lag.
- **SC-002**: Không mất tiến trình làm bài nếu người dùng vô tình tải lại trang (lưu local draft state).
- **SC-003**: Khung đề thi dạng ảnh ôm sát ảnh 100%, không bị vỡ bố cục hoặc tràn cuộn ngang/dọc không đáng có.
- **SC-004**: Chấm điểm chính xác tuyệt đối 100% theo đáp án `is_correct` của hệ thống.
