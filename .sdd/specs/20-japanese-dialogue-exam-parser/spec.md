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
