# Technical Plan

1. Mở file `src/lib/wordParser.ts`.
2. Định vị hằng số `CHAPTER_RE`.
   ```typescript
   const CHAPTER_RE = /^(?:#+|\[)?\s*(chương\s+\S[^\]\n]*)/i;
   ```
3. Cập nhật `CHAPTER_RE` để cho phép các ký tự không phải là chữ hoặc số (như emoji, ký hiệu) ở đầu dòng, cũng như hỗ trợ cả `chapter`, `phần`, `part`:
   ```typescript
   const CHAPTER_RE = /^[\s\W_]*((?:chương|chapter|phần|part)\s+\S[^\]\n]*)/i;
   ```
   **Lưu ý**: `\W` khớp với bất kỳ ký tự nào không phải là `[a-zA-Z0-9_]`, bao gồm cả emoji như `📌`. Do đó `^[\s\W_]*` sẽ bỏ qua toàn bộ khoảng trắng, dấu câu, gạch dưới và emoji ở đầu chuỗi trước khi bắt đầu bắt chữ "chương".
4. Kiểm tra lại việc trích xuất bằng RegExp xem index của capture group có thay đổi hay không. 
   - Pattern cũ có 1 capture group `(chương\s+...)`. `chapM[1]` là tên chương.
   - Pattern mới cũng có 1 capture group chính: `((?:chương|chapter|phần|part)...)`. (Do `(?:...)` là non-capturing group).
   - Vì vậy `chapM[1]` vẫn đúng và mã tại dòng 184 vẫn hoạt động chính xác.
5. Kiểm tra chạy server/test xem có lỗi gì không.
