---
id: "08-user-exam-system"
title: "User Story 8 - Hệ Thống Phòng Thi Trực Tuyến & Cỗ Máy Phân Tích (Interactive Exam Engine & Parser)"
status: "IMPLEMENTED"
created_date: "2026-03-01"
---

# 1. Overview
Hệ thống phòng thi trực tuyến (`/exams/:id`) là một trong những tính năng cốt lõi và phức tạp nhất của nền tảng. Hệ thống không chỉ cung cấp một **Giao diện làm bài tập trung cao độ** (Dedicated UI) mà còn tích hợp một **Cỗ máy phân tích dữ liệu (Parser Engine)** để chuyển đổi đề thi từ Markdown/Word thành cấu trúc thi kỹ thuật số.

Bản thân phòng thi hỗ trợ 2 giao diện riêng biệt:
1. **Dedicated Text Exam Layout**: Dành cho đề thi bóc tách được nội dung chữ và công thức KaTeX.
2. **Image Exam Layout**: Dành cho đề thi scan/chụp ảnh với cơ chế ôm sát ảnh (fit-content) và nút bấm ảo.

Kèm theo đó là bộ Parser thông minh giải quyết triệt để vấn đề nhầm lẫn giữa lời thoại đối thoại (Dialogue A/B) và phương án trắc nghiệm thực sự trong các đề thi ngoại ngữ.

---

# 2. User Scenarios

### User Story 1 – Trải nghiệm làm bài thi tập trung (Priority: P1)
Là một học viên, tôi muốn làm bài thi trong môi trường mô phỏng thực tế với áp lực thời gian và ma trận điều hướng trực quan.

**Acceptance Scenarios**:
1. **Given** học viên truy cập `/exams/:id`, **When** đề thi tải xong, **Then** đồng hồ đếm ngược bắt đầu chạy, ma trận câu hỏi (Navigation Palette) hiển thị trạng thái từng câu (Đang xem, Đã làm, Đánh dấu, Chưa làm).
2. **Given** học viên đang làm bài dạng chữ (Text Exam), **When** chọn đáp án A/B/C/D, **Then** hệ thống ghi nhận tức thời, hỗ trợ hiển thị RichContent (Toán học KaTeX, Code Snippet, Markdown) sắc nét.
3. **Given** học viên sử dụng Chế độ Luyện tập (Practice), **When** chọn đáp án, **Then** hệ thống phản hồi đúng/sai lập tức bằng âm thanh, viền màu (xanh/đỏ) và tự động làm nổi bật phương án đúng để rút kinh nghiệm tại chỗ.

### User Story 2 – Phân luồng giao diện thông minh (Text vs Image Exam) (Priority: P1)
Là một học viên, tôi muốn hệ thống tự động nhận diện tính chất của đề thi để hiển thị giao diện phù hợp nhất, tránh tình trạng hiển thị trơ trọi các nút A/B/C/D rỗng.

**Acceptance Scenarios**:
1. **Given** đề thi tải lên từ file Word/Markdown chứa cả chữ và ảnh, **When** người dùng mở đề thi, **Then** hệ thống nhận diện `isTextExam = true` (vì các options chứa text) và ưu tiên hiển thị Dedicated Text Exam Layout.
2. **Given** đề thi là dạng scan (ảnh chiếm hơn 50% câu hỏi và options rỗng), **When** mở bài, **Then** hệ thống nhận diện đây là Image Exam Layout.
3. **Given** ở Image Exam, **When** ảnh xuất hiện, **Then** khung ảnh sẽ tự động `fit-content` (ôm sát ảnh) và lùi lên sát viền trên, triệt tiêu viền đen dư thừa. Nếu muốn nhìn kỹ, học viên có thể Zoom In/Out, kéo rê (Drag-to-Pan) hoặc mở toàn màn hình (Lightbox Modal).

### User Story 3 – Phân tích chính xác câu hỏi đối thoại (Japanese Dialogue Parser) (Priority: P0)
Là giáo viên upload đề thi ngoại ngữ (VD: Tiếng Nhật JPD113), tôi muốn hệ thống không nhầm lẫn giữa nhân vật thoại (A, B) và phương án trắc nghiệm (A, B).

**Acceptance Scenarios**:
1. **Given** một câu hỏi có đoạn hội thoại `A. この料理は何ですか。` và `B. （ ）です。`, theo sau là 4 lựa chọn `A. / B. / C. / D.`, **When** Parser xử lý file, **Then** tính năng **Self-Healing Option Rollback** kích hoạt.
2. **Then** đoạn hội thoại A/B bị gom nhầm sẽ được hoàn nguyên (rollback) về làm nội dung câu hỏi (content). Chỉ 4 lựa chọn cuối cùng mới được phân loại vào mảng Options.
3. **Then** phương án B (mồ côi) sẽ không bao giờ được tạo nếu chưa tồn tại phương án A hợp lệ trong danh sách (Ngăn ngừa Orphan Option B).

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Routing Logic `isTextExam`)**: Giao diện PHẢI chuyển đổi chuẩn xác thông qua logic: Nếu đề thi có chữ trong Options (dù có ảnh hay không) -> Text Exam. Nếu đề thi toàn ảnh chụp (Options trống rỗng) -> Image Exam.
- **FR-002 (Image Exam Interactivity)**: Khung ảnh phải dùng `object-fit: contain`, `max-width: fit-content` kết hợp công cụ Zoom và Pan (Kéo rê chuột) mượt mà.
- **FR-003 (Dialogue Parser Engine)**: `markdownExamParser.ts` và `wordParser.ts` PHẢI tích hợp cơ chế Rollback Options. Cụ thể: Nếu gặp chuỗi phương án A thực sự, toàn bộ các options ảo (sinh ra do hội thoại trước đó) phải được gộp lại vào chuỗi `contentLines` của câu hỏi.
- **FR-004 (Practice & Flashcard Modes)**: Tại màn hình Text Exam, phải hỗ trợ đầy đủ 2 chế độ:
  - `practice`: Cung cấp nút chọn với feedback tức thì (đúng sai) và nút "Báo lỗi câu này" gọn gàng bên sidebar.
  - `flashcard`: Hỗ trợ lật thẻ bằng Spacebar.
- **FR-005 (Exam Timer & Sound)**: Đồng hồ phải chạy theo chu kỳ 1s, chuyển màu đỏ/rung khi dưới 5 phút. Phát âm thanh cảnh báo và tự động submit bảng `exam_attempts` khi về 0.

### Key Entities
- **exams**: `id`, `title`, `duration_min`.
- **questions**: `id`, `exam_id`, `content`, `image_url` (dành cho Image Exam).
- **question_options**: `id`, `question_id`, `label`, `content`, `is_correct`.
- **exam_attempts** / **attempt_answers**: Lưu vết bài thi, điểm, và lịch sử câu trả lời để hiển thị tại màn Report.

### Key Files
- `src/pages/user/ExamPage.tsx`: Component lõi bao bọc toàn bộ Timer, Matrix, và phân nhánh Text vs Image Exam UI.
- `src/lib/markdownExamParser.ts`: Bộ não Parser chứa logic Self-Healing Option Rollback.
- `src/components/exam/RichContent.tsx`: Kết xuất nội dung văn bản, toán học KaTeX.

---

## 4. Success Criteria
- **SC-001**: 100% đề thi JPD113 (Tiếng Nhật) được bóc tách chính xác 4 phương án, không mất hội thoại, gán đúng đáp án (Zero Regression).
- **SC-002**: Không xảy ra tình trạng "nút đáp án rỗng chữ" khi học sinh tải đề Word lên hệ thống nhờ sửa lỗi `isTextExam`.
- **SC-003**: Đề thi Image Exam ôm sát màn hình không bị tràn cuộn vô lý.
- **SC-004**: Tất cả unit tests (bao gồm `markdownExamParser.test.ts` và `jpd113.test.ts`) PASS hoàn toàn trên CI/CD.
