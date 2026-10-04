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


---

## Merged from 14-rich-text-exam-import

# Feature Specification: Rich Text Exam Import — LaTeX, Hình Ảnh Inline & Nhận Biết Câu Hỏi Thông Minh

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.0)  
**Version**: 2.0  

---

## 1. Tổng quan & Vấn đề giải quyết

Hệ thống nhập ngân hàng đề thi thông minh của TQMaster giải quyết triệt để các hạn chế của việc nhập liệu thủ công hoặc trích xuất văn bản thô (raw text):
1. **LaTeX / KaTeX Rendering**: Tự động nhận diện và kết xuất công thức toán học, biểu thức giải tích, ma trận, ký hiệu vật lý (`$...$`, `$$...$$`, `\(...\)`, `\[...\]`) mà không làm tăng kích thước bundle ban đầu nhờ cơ chế Lazy Import KaTeX.
2. **Trích xuất ảnh nhúng từ Word (.docx)**: Sử dụng `mammoth` với chế độ HTML conversion để trích xuất ảnh inline dưới dạng Base64, nén ảnh tự động qua canvas và tải lên Supabase Storage bucket `exam-images`.
3. **Nhận biết câu hỏi thông minh**: Tự động phân tách cấu trúc `Câu N:` / `A.` / `B.` / `C.` / `D.` kể cả khi có công thức, đoạn code hoặc hình ảnh xen kẽ giữa các phương án.
4. **Nhập hàng loạt từ file ZIP (`BulkExamZipModal.tsx`)**: Cho phép Quản trị viên tải lên file nén `.zip` chứa nhiều đề thi (Word, Markdown kèm thư mục ảnh), tự động bóc tách và tạo đồng loạt nhiều đề thi.

---

## 2. User Scenarios & Testing

### User Story 1 – Nhập file Word (.docx) chứa công thức & ảnh inline (Priority: P0)
Là một Quản trị viên, tôi muốn upload file Word chứa câu hỏi, công thức toán và hình ảnh minh họa để hệ thống tự động tạo câu hỏi hoàn chỉnh.

**Acceptance Scenarios**:
1. **Given** một file `.docx` chứa 40 câu hỏi trắc nghiệm kèm 15 hình ảnh sơ đồ nhúng trong file,
2. **When** Quản trị viên tải file lên tại màn hình chi tiết đề thi (`AdminExams.tsx`),
3. **Then**:
   - Bộ giải mã `wordParser.ts` bóc tách chính xác 40 câu hỏi và phương án A-D.
   - Hình ảnh được gán đúng câu hỏi tương ứng (không bị lệch sang câu kế tiếp).
   - Ảnh được tải lên bucket `exam-images` và URL được gán vào `questions.image_url` hoặc `extra_images`.
   - Các phương án A, B, C, D được lưu vào bảng `question_options`.

### User Story 2 – Hiển thị công thức Toán học KaTeX chuẩn xác (Priority: P0)
Là học viên hoặc quản trị viên, tôi muốn nhìn thấy công thức toán học hiển thị đẹp mắt, sắc nét thay vì các ký tự mã thô.

**Acceptance Scenarios**:
1. **Given** nội dung câu hỏi chứa biểu thức toán học (ví dụ: `$$\int_0^1 x^2 dx$$` hoặc `$\frac{-b \pm \sqrt{\Delta}}{2a}$`),
2. **When** component `<RichContent>` kết xuất nội dung,
3. **Then** KaTeX chuyển đổi thành mã HTML toán học trực quan, căn giữa với công thức dạng block và nằm mượt cùng dòng với công thức inline.
4. **Given** công thức toán bị lỗi cú pháp gõ từ người dùng, **Then** hệ thống tự động bọc trong thẻ `<code>` làm fallback an toàn, không làm crash ứng dụng.

### User Story 3 – Nhập đề thi từ văn bản Markdown (Priority: P1)
Là một Quản trị viên, tôi muốn copy-paste nội dung đề thi dạng Markdown từ ChatGPT hoặc tài liệu text để tạo nhanh câu hỏi.

**Acceptance Scenarios**:
1. **Given** Quản trị viên dán đoạn text Markdown tuân thủ cú pháp `Câu 1: ... A. ... B. ...`,
2. **When** nhấn "Phân tích cú pháp",
3. **Then** bộ phân giải `markdownExamParser.ts` nhận diện tiêu đề câu hỏi, các phương án lựa chọn và đáp án đúng (được đánh dấu sao `*` hoặc chữ in hoa).

### User Story 4 – Nhập hàng loạt đề thi từ file Zip (Bulk Exam Zip Import) (Priority: P1)
Là một Quản trị viên có bộ tài liệu đề thi của cả học kỳ, tôi muốn kéo thả 1 file `.zip` duy nhất để tạo hàng loạt đề thi cùng lúc.

**Acceptance Scenarios**:
1. **Given** Quản trị viên mở `BulkExamZipModal` tại `/admin/exams`,
2. **When** tải file `.zip` chứa nhiều file `.docx` hoặc `.md` kèm ảnh,
3. **Then** thư viện `jszip` giải nén trực tiếp trong trình duyệt, quét duyệt cây thư mục và hiển thị danh sách đề thi phát hiện được kèm trạng thái xem trước.
4. **When** Quản trị viên bấm "Bắt đầu nhập hàng loạt",
5. **Then** thanh tiến độ hiển thị tuần tự các giai đoạn: Đọc file -> Phân tích câu hỏi -> Tải ảnh lên Storage -> Lưu database, hoàn tất việc tạo nhiều đề thi tự động.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Hệ thống PHẢI sử dụng `mammoth.convertToHtml()` để đọc cấu trúc file Word, bảo toàn thẻ HTML và dữ liệu Base64 của ảnh nhúng.
- **FR-002**: Tự động nén ảnh qua HTML Canvas trước khi upload để tiết kiệm dung lượng lưu trữ và băng thông.
- **FR-003**: Bộ phân giải `wordParser.ts` và `markdownExamParser.ts` PHẢI hỗ trợ nhận diện đáp án đúng qua nhiều định dạng đánh dấu:
  - Gạch chân (Underline)
  - Tô đậm (Bold)
  - Chữ màu đỏ
  - Ký tự ngôi sao `*` hoặc tiền tố `Ans:`
- **FR-004**: Component `<RichContent>` PHẢI Lazy Load thư viện `katex` qua dynamic import `import('katex')` để không làm nặng bundle tải trang ban đầu.
- **FR-005**: Modal `BulkExamZipModal.tsx` sử dụng `jszip` xử lý giải nén client-side, hỗ trợ batching và hiển thị tiến độ % hoàn thành rõ ràng.
- **FR-006**: Có bộ unit tests tự động bảo vệ logic parser trong thư mục `src/test/`:
  - `markdownExamParser.test.ts`
  - `wordParser.test.ts`
  - `richContent.test.ts`
  - `pro192.test.ts`

### Key Entities
- **exams**: `id`, `title`, `duration_min`, `is_active`.
- **questions**: `id`, `exam_id`, `content`, `image_url`, `extra_images`, `chapter_name`, `order_num`.
- **question_options**: `id`, `question_id`, `label`, `content`, `is_correct`, `image_url`.

### Key Files
- `src/lib/wordParser.ts` — Động cơ chuyển đổi Word HTML sang danh sách câu hỏi và tách ảnh
- `src/lib/markdownExamParser.ts` — Động cơ phân tích cú pháp đề thi từ Markdown
- `src/components/exam/RichContent.tsx` — Component kết xuất toán học KaTeX và Markdown
- `src/components/admin/BulkExamZipModal.tsx` — Modal nhập hàng loạt đề thi từ file Zip
- `src/lib/imageOpt.ts` & `src/lib/imageUpload.ts` — Tối ưu hóa và nén hình ảnh trước khi lưu trữ
- `src/test/markdownExamParser.test.ts` — Bộ kiểm thử tự động cho Markdown Parser
- `src/test/wordParser.test.ts` — Bộ kiểm thử tự động cho Word Parser

---

## 4. Success Criteria
- **SC-001**: Nhập file Word 50 câu hỏi kèm hình ảnh hoàn thành trong < 15 giây.
- **SC-002**: Tỷ lệ nhận diện đúng số lượng câu hỏi và đáp án đạt 100% đối với tài liệu tuân thủ chuẩn cấu trúc.
- **SC-003**: Công thức toán học LaTeX hiển thị mượt mà, đúng chuẩn ký hiệu học thuật, không có hiện tượng vỡ layout.
- **SC-004**: Toàn bộ các test suite tự động trong `src/test/` đều vượt qua (`passed`).
