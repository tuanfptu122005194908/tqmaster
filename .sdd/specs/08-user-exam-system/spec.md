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


---

## Merged from 20-japanese-dialogue-exam-parser

# Feature Specification: Japanese Dialogue Exam Parser & Option Disambiguation

**Feature Identifier**: `20-japanese-dialogue-exam-parser`  
**Feature Branch**: `main`  
**Status**: ✅ Implemented  
**Version**: 1.0  
**Priority**: P0 (Data Parsing Accuracy & Exam Quality)  

---

## 1. Tổng quan & Vấn đề giải quyết

### 1.1. Hiện trạng & Bối cảnh
Trong các đề thi trắc nghiệm ngoại ngữ, đặc biệt là tiếng Nhật (môn JPD113, JLPT, Minna no Nihongo) hoặc tiếng Anh/Trung/Hàn:
Rất nhiều câu hỏi có dạng **hội thoại đối thoại (Dialogue)** giữa 2 người nói được ký hiệu là **A** và **B** (ví dụ: `A. この料理は何ですか。`, `B. （ ）です。` hoặc `A. 「それは 辞書ですか。」`, `B. 「はい、( )。」`).
Phía sau đoạn hội thoại mới là 4 phương án trắc nghiệm thực sự (`A.`, `B.`, `C.`, `D.`), theo sau là đáp án (`> **Đáp án:** - Câu 26: **A**`).

### 1.2. Vấn đề phát sinh
1. **Nhận nhầm người nói thoại thành phương án lựa chọn**:
   - Ký hiệu người nói `A.` và `B.` bị bộ phân tích (`markdownExamParser.ts`, `wordParser.ts`) nhận diện nhầm thành Option A và Option B.
2. **Sinh ra phương án B mồ côi (Orphan Option B)**:
   - Khi dòng tiêu đề chứa `A. ...` (như `**Câu 26.** A. この料理は何ですか。`) và dòng kế tiếp là `B.`, parser kích hoạt tạo ngay Option B dù chưa có Option A nào trong danh sách phương án.
3. **Trùng lặp nhãn phương án (Duplicate Options A & B) & sai lệch đáp án**:
   - Khi parser gặp 4 phương án thực sự `A.`, `B.`, `C.`, `D.` ở cuối câu hỏi, do đang ở trạng thái Option B của lời thoại, parser nuốt phương án `A.` thực sự vào Option B hoặc sinh ra danh sách gồm nhiều Option A và nhiều Option B.
   - Khi đáp án là `A`, cả lời thoại của nhân vật A và phương án A đều bị đánh dấu là đáp án đúng (`isCorrect = true`).
   - Giao diện bài thi hiển thị 5 đến 7 phương án lộn xộn, mất đi nội dung đối thoại trong câu hỏi.

### 1.3. Mục tiêu giải pháp
- Tự động nhận diện chính xác các dòng đối thoại `A.` / `B.` trong thân câu hỏi và giữ lại trong `content` của câu hỏi.
- Áp dụng cơ chế **Self-Healing Option Rollback & True Option Detection**:
  - Nhận diện bộ phương án trắc nghiệm thực sự (thường là cụm `A.`, `B.`, `C.`, `D.` ở cuối câu hỏi trước phần `Đáp án`).
  - Nếu trước đó đã ghi nhận nhầm các dòng `A.` / `B.` thoại vào options, parser sẽ tự động hoàn nguyên (rollback) các dòng thoại đó trở lại vào nội dung câu hỏi.
  - Ngăn chặn triệt để việc khởi tạo phương án `B` khi chưa có phương án `A` hợp lệ.
- Đảm bảo 100% các câu hỏi hội thoại tiếng Nhật trong cả 2 đề `JPD113_SU26_FE.md` và `JPD113_SU26_RE.md` (và các đề tương tự) được bóc tách chính xác:
  - Đúng số lượng câu hỏi.
  - Nội dung hội thoại đầy đủ cả 2 lượt thoại A và B.
  - Đúng chuẩn 4 phương án A, B, C, D duy nhất.
  - Gán đáp án đúng chính xác tuyệt đối.

---

## 2. User Scenarios (Given - When - Then)

### Scenario 1 – Bóc tách câu hỏi hội thoại có A trên tiêu đề và B trên dòng mới (Câu 26 FE)
- **Given**: File Markdown chứa câu hỏi dạng:
  ```markdown
  **Câu 26.** A. この料理は何ですか。

  B.

  （ ）です。

  A. ぶたにくの料理
  B. くにの料理
  C. ぶたにくで料理
  D. ぶたにくから料理

  > **Đáp án:**
  > - Câu 26: **A**
  ```
- **When**: Quản trị viên nhập đề thi qua `parseMarkdownExam` hoặc upload file Markdown/Zip trên Web.
- **Then**:
  - Nội dung câu hỏi (`content`) chứa đầy đủ:
    ```
    A. この料理は何ですか。
    B. （ ）です。
    ```
  - Danh sách phương án (`options`) chỉ có đúng 4 phương án:
    - A: `ぶたにくの料理` (isCorrect: true)
    - B: `くにの料理` (isCorrect: false)
    - C: `ぶたにくで料理` (isCorrect: false)
    - D: `ぶたにくから料理` (isCorrect: false)
  - Không có phương án thừa hoặc phương án B bị trùng lặp.

### Scenario 2 – Bóc tách câu hỏi hội thoại có cả A và B nằm dưới tiêu đề (Câu 1 RE)
- **Given**: File Markdown chứa câu hỏi dạng:
  ```markdown
  **Câu 1.** Chọn đáp án thích hợp để điền vào chỗ trống:

  A. 「それは 辞書(じしょ)ですか。」

  B.

  「はい、( )。」

  A. そうです
  B. いいです
  C. ちがいます
  D. わかりました

  > **Đáp án:**
  > - Câu 1: **A**
  ```
- **When**: Hệ thống phân tích đề thi.
- **Then**:
  - Dòng `A. 「それは 辞書(じしょ)ですか。」` và `B. 「はい、( )。」` được xếp vào nội dung câu hỏi (`content`).
  - Danh sách options gồm đúng 4 lựa chọn: A (`そうです`), B (`いいです`), C (`ちがいます`), D (`わかりました`).
  - Chỉ duy nhất phương án A (`そうです`) được đánh dấu `isCorrect: true`.

### Scenario 3 – Bóc tách câu hỏi hội thoại nhiều lượt thoại A - B - A (Câu 7 RE)
- **Given**: Câu hỏi đối thoại 3 lượt:
  ```markdown
  A. 「IMCの 電話番号(でんわばんごう)は 何番(なんばん)ですか。」
  B. 「3413の3756です。」
  A. 「( )、ありがとうございました。」

  A. そうですか
  B. じゃ
  C. そうですよ
  D. どうも
  ```
- **When**: Hệ thống bóc tách dữ liệu.
- **Then**:
  - Toàn bộ 3 lượt thoại nằm trong phần nội dung câu hỏi.
  - Các lựa chọn trắc nghiệm A-D tách biệt hoàn toàn và chỉ gồm 4 đáp án đúng của bài.

### Scenario 4 – Không ảnh hưởng đến câu hỏi trắc nghiệm thông thường (Regression Prevention)
- **Given**: Các đề thi thông thường (môn PRO192, NWC204, v.v.) không có hội thoại, hoặc có code snippet bọc trong code block/brace.
- **When**: Chạy bộ kiểm thử tự động toàn diện (`npm test`).
- **Then**: 100% các bài test hiện tại tiếp tục PASS mà không có bất kỳ xung đột nào.

---

## 3. Functional Requirements (Yêu cầu chức năng)

- **FR-001**: Không cho phép tạo `Option B` nếu chưa có `Option A` hợp lệ đang hoạt động trong câu hỏi. Mọi dòng bắt đầu bằng `B.` hoặc `B:` khi chưa có `Option A` đều được coi là nội dung câu hỏi.
- **FR-002**: Cơ chế phát hiện chuỗi phương án thực sự (True Options Sequence Detection):
  - Khi gặp dòng bắt đầu bằng `A.`, nếu phía sau nó trong cùng khối câu hỏi tồn tại ít nhất `B.` (hoặc chuỗi `B.`, `C.`) và trước đó đã có các options tạm:
  - Toàn bộ options tạm trước đó được hoàn nguyên (rollback) về `contentLines` của câu hỏi.
  - Thiết lập lại `curOpt` bắt đầu từ dòng `A.` thực sự này.
- **FR-003**: Hỗ trợ chuẩn hóa dòng hội thoại tách rời:
  - Nếu một dòng chỉ chứa `B.` (hoặc `B:`) đứng riêng và dòng kế tiếp là lời thoại, tự động gom nhóm giữ tính liền mạch của lời thoại.
- **FR-004**: Áp dụng đồng bộ cho cả `markdownExamParser.ts` và `wordParser.ts`.
- **FR-005**: Bổ sung bộ test case tự động chuyên sâu cho đề tiếng Nhật (`jpd113.test.ts`) kiểm tra tất cả 30 câu hỏi của cả `JPD113_SU26_FE` và `JPD113_SU26_RE`.

---

## 4. Key Entities & Files

### 4.1. Key Files
- `src/lib/markdownExamParser.ts`: Bộ phân tích đề thi từ Markdown text và file Zip.
- `src/lib/wordParser.ts`: Bộ phân tích đề thi từ file Word (.docx).
- `src/test/markdownExamParser.test.ts`: Test suite cho Markdown parser.
- `src/test/jpd113.test.ts`: Test suite chuyên sâu kiểm tra đề tiếng Nhật.

---

## 5. Success Criteria (Tiêu chí thành công)

- **SC-001**: Toàn bộ câu hỏi trong `JPD113_SU26_FE.md` và `JPD113_SU26_RE.md` có đúng 4 phương án trắc nghiệm (A, B, C, D).
- **SC-002**: Không có câu hỏi nào bị thiếu nội dung hội thoại A / B trong phần đề bài (`content`).
- **SC-003**: Tỷ lệ câu hỏi không nhận diện được đáp án đúng (`unansweredQuestions`) là 0 đối với các đề có đáp án đầy đủ.
- **SC-004**: 100% unit test của toàn bộ dự án (`npm test`) vượt qua thành công (Zero regression).


---

## Merged from 21-fix-word-exam-text-mode-routing

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
