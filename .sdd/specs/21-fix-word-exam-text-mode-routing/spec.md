# Feature Specification: Sửa Lỗi Điều Hướng Đề Thi Dạng Word Vào Giao Diện Text Exam

**Feature Identifier**: `21-fix-word-exam-text-mode-routing`  
**Status**: ✅ Completed  
**Created Date**: 2026-09-25  

---

## 1. Tổng quan & Vấn đề giải quyết

### Hiện trạng lỗi (Bug Description)
Khi người dùng tải lên đề thi từ file Word (`.docx`), Markdown (`.md`) hoặc Text (`.txt`) trong trang quản trị:
- Đề thi chứa các câu hỏi dạng văn bản kèm các lựa chọn trắc nghiệm có nội dung chi tiết (ví dụ: `A. 293.5`, `B. 280.6`, `C. 277.8`, `D. 296.2`).
- Tuy nhiên, khi học viên mở đề thi để làm hoặc luyện tập tại `/exams/:id`, hệ thống lại hiển thị **giao diện đề thi ảnh (Image Exam Layout)** thay vì **giao diện đề thi văn bản (Dedicated Text Exam Layout)**.
- Hậu quả:
  1. Nội dung các phương án A, B, C, D bị dồn hết lên khung văn bản câu hỏi phía trên.
  2. Bốn nút bấm chọn đáp án bên dưới chỉ hiển thị trơ trọi ký tự `[ A ]`, `[ B ]`, `[ C ]`, `[ D ]` rỗng nội dung.
  3. Giao diện bị vỡ trải nghiệm người dùng, gây hiểu lầm là file Word bị lỗi hoặc hệ thống xử lý sai định dạng đề.

### Nguyên nhân gốc rễ (Root Cause Analysis)
Tại `src/pages/user/ExamPage.tsx` (dòng 400 - 406):
```tsx
const imageQuestionCount = questions.filter(q => q.image_url).length;
const isTextExam = questions.length > 0 && (
  imageQuestionCount === 0 ||
  (imageQuestionCount < questions.length / 2 &&
   !questions.some(q => q.options.some(o => o.content?.trim()))) // ❌ LỖI NGHIỆM TRỌNG: dấu phủ định '!'
);
```
- Khi một file Word có chứa dù chỉ **1 hình ảnh** (ví dụ: công thức toán học Word lưu dạng ảnh, sơ đồ, biểu đồ, logo trường hoặc đường kẻ phân cách), `imageQuestionCount > 0`.
- Biểu thức `!questions.some(q => q.options.some(o => o.content?.trim()))` yêu cầu **"tất cả options KHÔNG được có text"**.
- Với file Word, các options **luôn có text**, dẫn đến biểu thức trên trả về `false`.
- Kết quả: `isTextExam` bị đánh giá thành `false`, đẩy toàn bộ đề thi Word vào giao diện đề thi ảnh (Image Exam UI vốn chỉ thiết kế cho đề chụp màn hình không có chữ trong options).

Ngoài ra:
- Trong giao diện `isTextExam`, khối sidebar kiểm tra điều kiện `{examMode === 'exam' && !submitted ? (...) : (...)}`, dẫn đến khi vào chế độ `examMode === 'practice'` (Luyện tập), người dùng bị đẩy vào form "Báo cáo lỗi câu hỏi" thay vì màn hình chọn đáp án luyện tập.

---

## 2. User Scenarios & Acceptance Criteria (Given-When-Then)

### User Story 1 – Đề thi tải từ Word luôn vào giao diện Text Exam chuẩn (Priority: P0)
Là một học viên hoặc giáo viên tải file đề Word lên hệ thống, tôi muốn khi mở đề thi, giao diện hiển thị đúng chuẩn Text Exam với các phương án lựa chọn đầy đủ chữ số và công thức toán học.

**Acceptance Criteria (AC-1.1)**:
- **Given** đề thi được nhập từ file Word (`.docx`), Markdown (`.md`) hoặc Text (`.txt`) có nội dung phương án (`opt.content` không rỗng), kể cả khi có một số câu chứa ảnh minh họa hoặc biểu đồ.
- **When** người dùng mở làm bài tại `/exams/:id`.
- **Then** hệ thống nhận diện `isTextExam === true` và hiển thị giao diện Dedicated Text Exam.
- **Then** các thẻ đáp án hiển thị đầy đủ cả nhãn (A, B, C, D) và nội dung chi tiết kèm định dạng KaTeX/RichContent.

### User Story 2 – Chế độ Luyện tập (Practice Mode) hoạt động mượt mà trên Text Exam (Priority: P0)
Là một học viên luyện tập trắc nghiệm trên đề thi dạng text, tôi muốn có thể chọn đáp án từng câu và nhận phản hồi đúng/sai tức thì (âm thanh + đổi màu xanh/đỏ).

**Acceptance Criteria (AC-2.1)**:
- **Given** học viên truy cập đề thi dạng text với `mode=practice`.
- **When** học viên click chọn một đáp án.
- **Then** hệ thống phản hồi tức thì:
  - Nếu đúng: hiển thị viền/nền xanh lá, biểu tượng tích xanh, phát âm thanh `playSound.correct()`.
  - Nếu sai: hiển thị viền/nền đỏ, biểu tượng gạch chéo X, phát âm thanh `playSound.incorrect()`, và làm nổi bật đáp án đúng.
- **Then** nút "Báo lỗi câu này" hiển thị tinh tế, không chiếm dụng toàn bộ sidebar của học viên.

### User Story 3 – Đề thi chụp ảnh (Image Exam / Scan / FUOverflow) vẫn giữ nguyên giao diện ảnh (Priority: P1)
Là một học viên làm đề thi số hóa từ bản scan ảnh màn hình (trong đó options không có text mà nằm trong ảnh), tôi muốn giao diện ảnh fit-content và 4 nút A/B/C/D bên dưới hoạt động bình thường.

**Acceptance Criteria (AC-3.1)**:
- **Given** đề thi dạng ảnh chụp (hơn 50% câu hỏi có `image_url` và các options trong database không có nội dung chữ).
- **When** mở bài thi.
- **Then** hệ thống nhận diện `isTextExam === false` và hiển thị giao diện Image Exam căn đỉnh, zoom kéo rê và nút chọn A, B, C, D như thiết kế chuẩn.

---

## 3. Functional Requirements (FR)

- **FR-001**: Chuẩn hóa điều kiện `isTextExam`:
  - `hasTextOptions = questions.some(q => q.options.some(o => !!o.content?.trim()))`
  - Nếu `hasTextOptions === true` HOẶC `imageQuestionCount === 0` HOẶC `(imageQuestionCount < questions.length / 2 && hasQuestionContent)` => `isTextExam = true`.
- **FR-002**: Đảm bảo Text Exam hỗ trợ cả `examMode === 'exam'` và `examMode === 'practice'`.
- **FR-003**: Tại giao diện Image Exam (fallback), nếu có bất kỳ câu hỏi nào có `opt.content`, nút chọn đáp án vẫn hỗ trợ hiển thị nội dung an toàn để tránh trường hợp nút rỗng.

---

## 4. Key Files Impacted

- `src/pages/user/ExamPage.tsx`: Cập nhật logic `isTextExam` và tích hợp chế độ `practice` trong Dedicated Text Exam UI.
- `src/test/examModeRouting.test.ts`: Tạo bộ unit test tự động xác thực độ chuẩn xác của logic phân loại Text Exam vs Image Exam.

---

## 5. Success Criteria (SC)

- **SC-001**: 100% đề thi tải lên từ Word có nội dung phương án đều mở đúng giao diện Text Exam.
- **SC-002**: Không làm gãy bất kỳ đề thi dạng ảnh scan / FUOverflow hiện có.
- **SC-003**: Toàn bộ unit tests và type-checking vượt qua thành công.
