---
status: "approved"
---

# Overview
Khi tải lên file `.docx` chứa nhiều chương (Chapter/Phần), trình phân tích (parser) không nhận diện được các dòng đánh dấu chương nếu chúng bắt đầu bằng các biểu tượng đặc biệt (ví dụ: emoji `📌`). Điều này dẫn đến việc tất cả câu hỏi trong file bị gộp chung vào một đề thi duy nhất có tên là "Tổng hợp" hoặc tên file gốc, thay vì được tách thành nhiều đề thi riêng biệt theo từng chương.

# User Scenarios
- **Given** người dùng tải lên một file `.docx` có chứa nhiều câu hỏi được chia theo các chương (ví dụ: "📌 Chương 16: Bán dẫn...").
- **When** hệ thống phân tích file Word,
- **Then** hệ thống cần phải bỏ qua các biểu tượng (emoji, bullet) ở đầu dòng và nhận diện chính xác từ khóa "Chương" / "Chapter" / "Phần" / "Part" để tách các câu hỏi thành các đề thi tương ứng với từng chương.

# Functional Requirements
- **FR-01**: Nâng cấp (không thay thế hoàn toàn) biểu thức chính quy (Regex) phân tích chương (`CHAPTER_RE`) trong `src/lib/wordParser.ts`. Vẫn giữ nguyên phần capture group cốt lõi cũ, chỉ nới lỏng thêm ở đầu dòng để cho phép các ký tự không phải chữ/số (như emoji, dấu chấm câu, dấu gạch ngang) đứng trước từ khóa chương.
- **FR-02**: Đảm bảo các dòng như "📌 Chương 16: ..." hoặc "✔️ Phần 1:" được nhận diện đúng và gán tên chương là "Chương 16: ..." hoặc "Phần 1: ...".
- **FR-03**: Tiếp tục duy trì tính đúng đắn cho các regex khác (`ANSWER_RE`, `EXPLANATION_RE`) để đảm bảo không phá vỡ logic hiện tại.

# Key Entities
- `CHAPTER_RE` (trong `src/lib/wordParser.ts`): Biểu thức chính quy cần được nới lỏng phần đầu.

# Key Files
- `src/lib/wordParser.ts`: Chứa các Regex dùng để phân tích file Word.

# Success Criteria
- **SC-01**: File `full-quiz-chuong-16-den-28-390-cau.docx` khi tải lên sẽ được tách thành 13 đề thi tương ứng với 13 chương, thay vì 1 đề 390 câu.
- **SC-02**: Không có lỗi hồi quy (regression) đối với các file Markdown và Word khác.
