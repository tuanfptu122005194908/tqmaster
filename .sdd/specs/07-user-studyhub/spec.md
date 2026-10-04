---
id: "07-user-studyhub"
title: "User Story 7 - Khóa học & Trải nghiệm Học tập (Student StudyHub)"
status: "IMPLEMENTED"
created_date: "2026-02-27"
---

# 1. Overview
Phân hệ **Khóa học & Học tập** (Student StudyHub) cung cấp trải nghiệm E-learning trọn vẹn từ lúc khám phá, xem chi tiết, đến làm bài tập và thi thử. 
Nó bao gồm ba màn hình cốt lõi:
1. **Trang chủ & Khóa học của tôi (`/` và `/my-courses`)**: Nơi khám phá lộ trình học tập, đệm bằng `sessionStorage` để tăng tốc độ.
2. **Chi tiết Môn học (`/subjects/:id`)**: Trung tâm học liệu gồm Đề thi, Lý thuyết, Tài liệu PE (có tính năng trích xuất ảnh ZIP), Thông báo, và Đánh giá.
3. **Phòng Thi (`/exams/:id`)**: Trải nghiệm làm bài thi mạnh mẽ với 3 chế độ (Ôn tập, Thi thử, Flashcard), tự động lưu nháp, phím tắt, phân tích điểm, và báo cáo câu hỏi lỗi.

Đồng thời, tích hợp riêng module xem trước file ZIP đề thi PE (Filmstrip & ExamImageViewerModal) và sửa lỗi bảo mật RLS giúp học viên có trải nghiệm học tập tốt nhất.

---

# 2. User Scenarios

### User Story 1 – Khám phá & Quản lý môn học (Priority: P1)
Là một học viên, tôi muốn duyệt các môn học trên hệ thống, phân loại theo học kỳ, và xem những môn mình đã sở hữu.

**Acceptance Scenarios**:
1. **Given** học viên truy cập trang chủ, **When** trang tải, **Then** hệ thống đọc cache `sessionStorage` (key: `tqmaster_active_subjects_v1`) hiển thị nội dung ngay lập tức <50ms, và ngầm lấy dữ liệu mới từ database.
2. **Given** học viên có tài khoản, **When** vào "Khóa học của tôi", **Then** các môn học đã thanh toán xuất hiện kèm theo thẻ thống kê (Tổng số môn, Đang học, Hoàn thành).
3. **Given** môn học đặc biệt Google Cloud Study Hub (`9d863b0b-22fa-4cb5-b467-15103a8904e5`), **When** user bấm vào nếu đã sở hữu, **Then** điều hướng riêng tới `/study-hub` (trang nhúng iFrame), nếu không thì chuyển hướng vào chi tiết môn bình thường.

### User Story 2 – Xem chi tiết Môn học & Tài liệu PE (Priority: P1)
Là học viên đã mua môn học, tôi muốn truy cập các tài liệu, đề thi và xem trực tiếp đề thực hành (PE) mà không cần giải nén.

**Acceptance Scenarios**:
1. **Given** học viên ở `/subjects/:id`, **When** chưa mua môn học, **Then** nội dung Đề thi và Lý thuyết bị khóa ổ khóa, yêu cầu thanh toán (trừ các môn miễn phí).
2. **Given** học viên đã mua môn học, **When** chuyển sang tab "Tài liệu PE / Video", **Then** hệ thống hiển thị danh sách tài liệu. Với tài liệu ZIP có ảnh, hệ thống render hàng "filmstrip" chứa các hình ảnh câu hỏi xem trước (chỉ 1 lần gọi DB).
3. **Given** bấm vào ảnh xem trước tài liệu PE, **When** modal `ExamImageViewerModal` mở ra, **Then** học viên có thể xem ảnh toàn màn hình, phóng to thu nhỏ, dùng phím mũi tên lật trang, và có nút tải file `.zip` gốc. Đảm bảo ảnh tải được nhờ cơ chế ký URL bảo mật `signStorageUrls`.

### User Story 3 – Trải nghiệm Phòng thi đa chế độ (Priority: P1)
Là một học viên, tôi muốn luyện thi dưới nhiều chế độ (Ôn tập, Flashcard, Thi thật) với sự hỗ trợ cao nhất như tự lưu nháp và báo cáo câu sai.

**Acceptance Scenarios**:
1. **Given** bài thi có 3 chế độ, **When** học viên chọn:
   - **Flashcard**: Dùng phím Space để lật thẻ (có âm thanh lật), phím Mũi tên để sang thẻ khác.
   - **Ôn tập (Practice)**: Click chọn đáp án hệ thống phát âm thanh đúng/sai ngay lập tức (instant feedback).
   - **Thi thử (Exam)**: Tính giờ ngược, tự động nộp khi hết giờ.
2. **Given** học viên đang làm bài dở, **When** vô tình tải lại trang, **Then** bài làm (đáp án, đánh dấu, thời gian còn lại) tự động khôi phục nhờ tính năng Auto-save vào `localStorage`.
3. **Given** học viên chuẩn bị nộp bài, **When** bấm "Nộp bài", **Then** hiển thị Modal xác nhận tổng kết (Số câu đã làm, Số câu chưa làm, Số câu cắm cờ), kèm thông báo cảnh báo màu cam nếu còn sót câu.
4. **Given** có câu hỏi sai đáp án trên hệ thống, **When** học viên bấm nút "Báo cáo lỗi", **Then** popup hiện lên cho phép học viên tick chọn đáp án đúng thực tế và ghi chú, dữ liệu gửi vào bảng `question_reports`.
5. **Given** học viên đã nộp bài, **When** làm sai một số câu, **Then** hệ thống hiện nút "Làm lại các câu sai", bấm vào sẽ reset vòng thi chỉ với các câu đã chọn sai trước đó.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Caching & Performance)**: `HomePage.tsx` PHẢI dùng `sessionStorage` để cache môn học nhằm loại bỏ thời gian chờ khi back trang.
- **FR-002 (PE Document Inline Extraction)**: `SubjectDetailPage.tsx` PHẢI hiển thị inline preview các ảnh ZIP trích xuất. Ảnh được ký qua `signStorageUrls` để vượt RLS, đồng thời RLS DB (`can_access_theory_asset`) phải cho phép user đã mua môn học / môn miễn phí tải ảnh từ `pe-extracts/`.
- **FR-003 (Exam Engine - Multi Modes)**: Trang `ExamPage.tsx` PHẢI hỗ trợ 3 chế độ (`practice`, `exam`, `flashcard`), có phản hồi âm thanh (Click, Correct, Incorrect, Success, Flip).
- **FR-004 (Exam Auto-Save)**: Trạng thái bài thi (answers, flagged, timeLeft) PHẢI được sync theo thời gian thực xuống `localStorage` với key `exam_draft_{examId}_{mode}`.
- **FR-005 (Exam Error Reporting)**: Cung cấp tính năng báo cáo câu hỏi sai (chọn `suggested_option_id`, nhập `note`), lưu dữ liệu vào `question_reports`.
- **FR-006 (Exam Analytics & Redo)**: Sau khi nộp bài, phân tích điểm số theo từng chương (Chapter Analytics), và hỗ trợ tạo luồng làm lại (Redo) cho các câu hỏi sai.

### Key Entities
- **subjects**: `id`, `name`, `semester`, `price`, `thumbnail_url`.
- **exams**: `id`, `title`, `duration_min`, `is_active`.
- **questions**: `id`, `exam_id`, `content`, `image_url`, `order_num`, `chapter_name`.
- **question_options**: `id`, `question_id`, `label`, `content`, `is_correct`.
- **theories**: `id`, `category`, `description` (lưu trữ metadata `preview_images`), `url` (file ZIP gốc).
- **question_reports**: `question_id`, `user_id`, `suggested_option_id`, `note`.
- **exam_attempts** / **attempt_answers**: Lưu kết quả nộp bài thi thực tế.

### Key Files
- `src/pages/user/HomePage.tsx`: Giao diện danh mục môn học, Dashboard học tập, cơ chế caching.
- `src/pages/user/SubjectDetailPage.tsx`: Hiển thị chi tiết (Tabs), chặn truy cập nếu chưa thanh toán, Viewer hiển thị ảnh PE.
- `src/pages/user/ExamPage.tsx`: Engine chạy đề thi khổng lồ với 3 chế độ, sound, auto-save, error reporting, pre-loading sliding window.
- `src/components/common/ExamImageViewerModal.tsx`: Viewer ảnh PE toàn màn hình.

---

## 4. Success Criteria
- **SC-001**: User mở trang chủ có danh sách môn học ngay lập tức (không thấy loading layout nếu có cache).
- **SC-002**: Ảnh trích xuất từ file ZIP PE hiển thị 100% không bị gãy link 403 (nhờ hàm RLS và ký URL).
- **SC-003**: Load đề thi 100 câu không bị giật lag nhờ cơ chế *Sliding Window Preload* 4 ảnh kế tiếp.
- **SC-004**: Đang làm đề bị tắt trình duyệt, mở lại trạng thái (giây, đáp án) khôi phục chính xác 100%.
- **SC-005**: User báo cáo được câu hỏi sai và lưu đúng thông tin xuống CSDL.
