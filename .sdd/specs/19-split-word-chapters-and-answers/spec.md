---
Feature Branch: feat/19-split-word-chapters-and-answers
Status: Pending Review
---
# 1. Overview
Hệ thống hiện tại khi import file `.docx` sẽ gộp toàn bộ câu hỏi vào một đề thi (Exam) duy nhất. Hơn nữa, nó chưa nhận diện tốt định dạng đáp án có chứa ký tự đặc biệt như `➤ Đáp án đúng: A` và lời giải chi tiết `Lời giải chi tiết: ...`.
Yêu cầu mới: 
- Nâng cấp bộ phân tích file Word (`wordParser.ts` / `markdownExamParser.ts`) để nhận dạng thêm (fallback/mở rộng) định dạng đáp án có chứa ký tự đặc biệt như `➤ Đáp án đúng: A`.
- Tách (split) các câu hỏi theo từng chương (Chapter). Nếu file Word có nhiều chương, hệ thống sẽ sinh ra nhiều đề (Exam) tương ứng (mỗi chương là 1 đề). Logic nhận diện đề cũ (1 file là 1 đề) vẫn được giữ nguyên cho các file không chia chương.
- Bỏ qua hoặc nhận diện phần `Lời giải chi tiết` để không bị gộp vào nội dung đáp án cuối cùng.
- **LƯU Ý QUAN TRỌNG:** TUYỆT ĐỐI KHÔNG ĐƯỢC PHÁ VỠ HAY THAY THẾ TOÀN BỘ LOGIC CŨ. Mọi luồng xử lý câu hỏi, đáp án, và fallback cũ phải được bảo toàn 100%, chỉ bổ sung/mở rộng regex để đáp ứng file có định dạng mới này.

# 2. User Scenarios
- **Given** người dùng đang ở tính năng Import hàng loạt từ file ZIP hoặc Word
- **When** người dùng tải lên file `.docx` có cấu trúc chia nhiều chương và có định dạng `➤ Đáp án đúng: X \n Lời giải chi tiết: ...`
- **Then** hệ thống sẽ tách file Word đó ra làm nhiều đề thi (mỗi chương 1 đề thi). Các đáp án đúng sẽ được nhận diện chính xác, không bị lẫn chữ "Lời giải chi tiết" vào trong nội dung option.

# 3. Functional Requirements
- **FR-01**: Cập nhật regex `ANSWER_RE` trong `src/lib/wordParser.ts` để cho phép các ký tự đặc biệt (như `➤`, `*`, `>`) nằm trước từ khoá "Đáp án đúng".
- **FR-02**: Thêm logic nhận diện "Lời giải chi tiết" (Explanation) trong `wordParser.ts` để không gộp phần text này vào Option cuối cùng của câu hỏi. Mặc định có thể bỏ qua text này hoặc lưu vào trường `explanation` nếu schema hỗ trợ.
- **FR-03**: Cập nhật hàm `extractExamsFromZip` (hoặc luồng xử lý file Word) trong `src/lib/markdownExamParser.ts`. Nhóm các câu hỏi (ParsedQuestion) theo `chapterName`.
- **FR-04**: Ứng với mỗi `chapterName` khác nhau trong 1 file, tạo ra một `ParsedExamData` riêng biệt với `title` CHỈ LÀ tên chương (ví dụ: `CHƯƠNG 1: GIỚI THIỆU MÔN HỌC & PHÉP ĐO (MEASUREMENT)`), không gộp kèm tên file Word.
- **FR-05**: Đảm bảo danh sách các đề thi được tạo ra (`ParsedExamData[]`) phải được sắp xếp theo thứ tự chương hợp lý (Natural Sort) để khi lưu vào cơ sở dữ liệu, chúng hiển thị đúng thứ tự 1, 2, 3... thay vì 1, 10, 11, 2.

# 4. Key Files
- `src/lib/wordParser.ts`: Cập nhật regex và luồng parse html.
- `src/lib/markdownExamParser.ts`: Cập nhật logic group questions by chapter và tạo nhiều `ParsedExamData`.

# 5. Success Criteria
- **SC-01**: Tải lên file `full-quiz-chuong-1-den-15-450-cau.docx` sẽ tạo ra được 15 đề (Exams), tương ứng với 15 chương.
- **SC-02**: Hệ thống nhận diện đúng đáp án (A, B, C, D) mà không bị lỗi. Option D (hoặc option cuối) không bị dính chữ "Lời giải chi tiết".
