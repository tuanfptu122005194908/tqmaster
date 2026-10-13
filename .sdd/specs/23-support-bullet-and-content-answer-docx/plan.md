# Technical Implementation Plan

## 1. Phân tích hiện trạng và thay đổi cần thực hiện

### A. Trong `src/lib/wordParser.ts`:
1. **Thêm hằng số Regex**:
   - `OPTION_HEADER_RE`: Nhận diện dòng báo hiệu bắt đầu các lựa chọn:
     ```typescript
     const OPTION_HEADER_RE = /^(?:các\s+lựa\s+chọn|lựa\s+chọn|danh\s+sách\s+lựa\s+chọn|options?)\s*[:.]?\s*$/i;
     ```
   - `BULLET_RE`: Nhận diện bullet points ở đầu dòng:
     ```typescript
     const BULLET_RE = /^[\u2022\u25E6\u25AA\u25AB\u2023\u2219\u25CB\u25CF\u25D8•\-*+o▪▫–—]\s+(.*)/;
     ```
   - Mở rộng `CHAPTER_RE`: Bổ sung thêm nhận diện tiền tố `chủ đề` / `topic`:
     ```typescript
     const CHAPTER_RE = /^[\s\W_]*((?:chương|chapter|phần|part|chủ\s*đề|topic)\s*[:\s]\s*\S[^\]\n]*)/i;
     ```

2. **Hàm hỗ trợ so khớp đáp án bằng nội dung phương án (`matchAnswerToOptions`)**:
   - Nhận vào `answerText: string` và `options: ParsedOption[]`.
   - Chuẩn hóa: loại bỏ dấu ngoặc đơn/kép ngoài cùng, dấu câu cuối dòng (`.`, `;`, `,`), chuẩn hóa khoảng trắng thừa, chuyển về chữ thường.
   - Chiến lược so khớp 3 lớp:
     1. Khớp chính xác toàn bộ chuỗi đáp án với nội dung của 1 option.
     2. Khớp từng phần tử khi đáp án được phân tách bằng dấu phẩy (`,`), chấm phẩy (`;`), hoặc xuống dòng (`\n`) (dành cho câu hỏi chọn nhiều đáp án: Choose two / Choose three).
     3. Khớp chuỗi con (substring matching) an toàn.
   - Trả về danh sách nhãn đúng `string[]` (ví dụ `['B']` hoặc `['A', 'B', 'F']`).

3. **Cập nhật vòng lặp parse câu hỏi trong `parseHtmlToQuestions`**:
   - Bỏ qua dòng `OPTION_HEADER_RE` nếu câu hỏi đang mở.
   - Khi dòng là `ANSWER_RE`:
     - Trước tiên gọi `extractAnswerLabels(rest)` như cũ.
     - Nếu `labels.length > 0`: gán `cur.correctAnswers = ...` như cũ.
     - Nếu `labels.length === 0`: gọi hàm `matchAnswerToOptions(rest, cur.options)`. Nếu tìm được các nhãn phù hợp, gán vào `cur.correctAnswers`.
     - Lưu `pendingAnswerText: rest` để trong trường hợp dòng đáp án xuất hiện ở vị trí đặc biệt, ta có thể so khớp lại sau khi đã gom đủ options.
   - Khi dòng là `BULLET_RE` và chưa có nhãn chữ cái A-H:
     - Gán nhãn tự động theo thứ tự: `String.fromCharCode(65 + cur.options.length)` (`A`, `B`, `C`...).
     - Đưa vào `cur.options`.
   - Khi finalize câu hỏi (`pushCur`):
     - Nếu `cur.correctAnswers.length === 0` và có `pendingAnswerText`: thử so khớp lại lần cuối với toàn bộ danh sách `cur.options`.

### B. Kiểm thử và xác nhận:
1. Tạo unit test `src/lib/__tests__/wordParser.test.ts` sử dụng `vitest`:
   - Test định dạng bullet options và đáp án bằng text từ `Bo_De_1_Tong_Quan_SOC_Quy_Dinh.docx`.
   - Test định dạng câu hỏi chọn nhiều đáp án (multiple-choice).
   - Test định dạng chữ cái truyền thống (A, B, C, D) từ `full-quiz-chuong-16-den-28-390-cau.docx` để bảo đảm 100% không bị regression.
2. Kiểm tra luồng giải nén file ZIP trong `markdownExamParser.ts` và `BulkExamZipModal.tsx`:
   - Tạo file zip thử nghiệm chứa file docx mới, test qua hàm `extractExamsFromZip`.
3. Chạy `npm test` để kiểm thử toàn diện.
4. Cập nhật Knowledge Graph: `graphify update .`.
5. Thực hiện Dual Git Push: `origin` và `tqmaster`.
