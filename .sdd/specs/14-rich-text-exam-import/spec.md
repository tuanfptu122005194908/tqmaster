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
