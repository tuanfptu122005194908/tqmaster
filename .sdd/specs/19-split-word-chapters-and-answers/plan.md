# Kế hoạch Kỹ thuật (Technical Plan)

## 1. Cập nhật `src/lib/wordParser.ts`
- **Lưu ý**: Chỉ mở rộng Regex, không xoá hay thay thế logic phân tích hiện tại đang hoạt động ổn định.
- Sửa `ANSWER_RE`: 
  Từ `/^(?:đáp án|dap an|answer|key|đáp án đúng|dap an dung)\s*[:.\s]\s*(.*)/i`
  Thành `/^(?:>|➤|\*|-)?\s*(?:đáp án|dap an|answer|key|đáp án đúng|dap an dung)\s*[:.\s]\s*(.*)/i`
- Thêm `EXPLANATION_RE`:
  `/^(?:>|➤|\*|-)?\s*(?:lời giải chi tiết|giai thich|giải thích|explanation)\s*[:.\s]\s*(.*)/i`
- Trong vòng lặp qua từng line, nếu gặp `EXPLANATION_RE`, ta đẩy (flush) option cuối cùng lại và bỏ qua text này, không lưu nó vào option. 

## 2. Cập nhật `src/lib/markdownExamParser.ts`
- Ở hàm `extractExamsFromZip`, khi xử lý `.docx`, sau khi gọi `parseHtmlToQuestions(html)`, chúng ta nhận được mảng `ParsedQuestion`.
- Thay vì đẩy tất cả `parsedQ` vào 1 `ParsedExamData`, ta sẽ dùng `reduce` hoặc vòng lặp để gom nhóm `parsedQ` theo `q.chapterName`.
- Lặp qua từng nhóm (group):
  - Khởi tạo title. Nếu file chỉ có 1 chapter chung (vd: "Tổng hợp"), thì title giữ nguyên `filename`. Nếu có nhiều chapter (vd: "CHƯƠNG 1", "CHƯƠNG 2"), title sẽ là `${filename} - ${chapterName}`.
  - Tạo `ParsedExamData` cho từng nhóm và đẩy vào mảng `results`.
