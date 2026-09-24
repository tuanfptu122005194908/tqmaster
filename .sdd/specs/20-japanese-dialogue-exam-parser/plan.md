# Technical Implementation Plan: Japanese Dialogue Exam Parser & Option Disambiguation

**Feature Identifier**: `20-japanese-dialogue-exam-parser`  
**Status**: 📋 Planned  

---

## 1. Kiến trúc & Phân tích Thuật toán

### 1.1. Hiện trạng luồng phân tích (Flow Analysis)
1. **markdownExamParser.ts**:
   - `matchOptionLine(line)` phát hiện tiền tố `A.`, `B.`, `C.`, `D.`...
   - Nếu `optMatch.isDefinite` là `true` (ví dụ `B.`), parser coi ngay dòng này là Option B hợp lệ bất kể trước đó chưa từng có Option A nào (`optionsList.length === 0` và `curOpt === null`).
   - Nếu trước đó `A.` và `B.` bị coi là options tạm, khi gặp dòng `A.` thực sự tiếp theo:
     - Biến `curOpt.label` lúc này là `'B'`.
     - Nhánh kiểm tra rollback hiện tại chỉ xử lý khi `curOpt.label === 'A' && optMatch.label === 'A'`, do đó bỏ lỡ hoàn toàn trường hợp `curOpt.label === 'B'` (hoặc 'C'). Dòng `A.` thực sự bị nuốt vào nội dung của Option B!

2. **wordParser.ts**:
   - Tương tự, nếu có các phương án giả hoặc thoại A, B trong thân câu hỏi Word, cần hỗ trợ rollback toàn bộ về thân câu hỏi khi phát hiện bộ lựa chọn trắc nghiệm A-D chính thức.

### 1.2. Thuật toán cải tiến (Enhanced Algorithm)

#### Bước 1: Ngăn chặn Option B mồ côi (Prevent Orphan Option B)
- Một chuỗi phương án trắc nghiệm **luôn luôn** phải bắt đầu bằng phương án `A` (hoặc nhãn đầu tiên).
- Khi đang ở trạng thái `currentSection === 'question'` (chưa có phương án nào), nếu gặp `B.`, `C.`, `D.`...:
  - Đây **chắc chắn không phải là điểm bắt đầu** của danh sách phương án trắc nghiệm.
  - Đây là một dòng nội dung (ví dụ lượt thoại của nhân vật B trong câu hỏi hội thoại).
  - Hành động: Giữ dòng này vào `contentLines`, KHÔNG mở option mới.

#### Bước 2: Cơ chế Phục hồi Toàn diện (Self-Healing Full Rollback on Real Option A)
- Khi gặp một dòng khớp với `A.` (hoặc `**A.**`, `(A)`, v.v.):
  - Kiểm tra xem sau dòng này (trong cùng khối câu hỏi) có các dòng khớp với `B.` (hoặc chuỗi `B.`, `C.`) hay không:
    ```typescript
    const subsequentLines = rq.lines.slice(idx + 1);
    const hasSubsequentB = subsequentLines.some(subL => {
      const sm = matchOptionLine(subL.trim());
      return sm && sm.label === 'B';
    });
    ```
  - Nếu `hasSubsequentB` là `true` VÀ:
    - Đã có options tạm trước đó (hoặc `curOpt` đang mở, hoặc `optionsList.length > 0`):
    - **Hành động Rollback**:
      1. Nếu `curOpt` đang mở: hoàn nguyên `curOpt` thành các dòng text dạng `[Label]. [Content]` (hoặc nguyên bản) đẩy lại vào `contentLines`.
      2. Nếu `optionsList` đã có các option trước đó: lấy từng option cũ hoàn nguyên thành `[Label]. [Content]` đẩy lại vào `contentLines`.
      3. Xóa sạch `optionsList = []` và `curOpt = null`.
      4. Bắt đầu mở Option A thực sự từ dòng hiện tại:
         ```typescript
         currentSection = 'option';
         curOpt = {
           label: 'A',
           contentLines: optMatch.content ? [optMatch.content] : [],
         };
         ```

#### Bước 3: Chuẩn hóa dòng thoại đơn lẻ (Normalize Standalone Dialogue Markers)
- Trong trường hợp dòng thoại chỉ có `B.` và lời thoại nằm ở dòng kế tiếp (ví dụ: `B.\n\n（ ）です。`):
  - Khi hoàn nguyên hoặc khi gom dòng, đảm bảo liên kết `B. （ ）です。` được định dạng sạch đẹp, dễ đọc cho học viên trên web.

---

## 2. Kế hoạch triển khai kỹ thuật

### Task 1: Cải tiến `src/lib/markdownExamParser.ts`
- Cập nhật logic trong vòng lặp parse `for (let idx = 0; idx < rq.lines.length; idx++)`:
  1. Kiểm tra điều kiện mở Option đầu tiên: Không cho phép mở `curOpt` nếu nhãn khác `'A'` khi `optionsList.length === 0` và `curOpt === null`.
  2. Bổ sung cơ chế phát hiện True Option A và rollback toàn bộ các options tạm trước đó (`curOpt` và `optionsList`) về `contentLines`.
  3. Xử lý trường hợp dòng `B.` trơ trọi kèm theo dòng trống.

### Task 2: Cập nhật `src/lib/wordParser.ts`
- Đồng bộ cơ chế rollback tương tự khi gặp lại `A.` có `B.` theo sau trong file Word.

### Task 3: Bổ sung Test Suite `src/test/jpd113.test.ts`
- Viết test tự động kiểm thử toàn diện:
  - 30 câu hỏi của `JPD113_SU26_FE.md`.
  - 30 câu hỏi của `JPD113_SU26_RE.md`.
  - Kiểm tra cụ thể Câu 26, Câu 25 của FE và Câu 1, Câu 7 của RE.
  - Khẳng định 100% câu hỏi có đúng 4 options A, B, C, D, nội dung thoại nằm trọn vẹn trong `content`.

### Task 4: Chạy kiểm thử tự động toàn dự án (`npm test`)
- Đảm bảo 100% các file test (`pro192.test.ts`, `markdownExamParser.test.ts`, `wordParser.test.ts`, `peZipExtractor.test.ts`, `richContent.test.ts`) đều vượt qua.

### Task 5: Đồng bộ & Push code lên 2 Remotes (Dual-Repo)
- Commit với semantic message chuẩn SDD.
- Push đồng thời lên `origin` và `tqmaster`.
