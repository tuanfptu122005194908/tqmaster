---
feature: "23-support-bullet-and-content-answer-docx"
status: "approved"
created_at: "2026-10-13"
---

# 1. Overview
Hệ thống quản trị đề thi (Admin Exams) và nạp đề thi hàng loạt (Bulk Exam Zip Modal) hiện tại đang hỗ trợ các file Word (`.docx`), Markdown (`.md`), Text (`.txt`) có cấu trúc truyền thống:
- Các lựa chọn phải có tiền tố chữ cái rõ ràng: `A.`, `B.`, `C.`, `D.`, `(A)`, `**A**`, v.v.
- Dòng đáp án phải ghi rõ chữ cái của đáp án: ví dụ `Đáp án: A`, `➤ Đáp án đúng: A`, `Đáp án: A, B`.

Tuy nhiên, có nhiều định dạng đề thi Word thực tế (tiêu biểu như file `Bo_De_1_Tong_Quan_SOC_Quy_Dinh.docx`) sử dụng định dạng khác:
1. Có dòng tiêu đề danh sách lựa chọn: `Các lựa chọn:`.
2. Các phương án trả lời không có chữ cái A, B, C, D mà sử dụng gạch đầu dòng / bullet point: `• CompTIA`, `• (ISC)2`, `• IEEE`, `• GIAC`.
3. Dòng đáp án không ghi chữ cái (A, B...) mà ghi **chính xác nội dung của phương án đúng**: ví dụ `Đáp án: (ISC)2` hoặc danh sách chọn nhiều đáp án ngăn cách bởi dấu phẩy như `Đáp án: log management, security monitoring, threat intelligence`.

**Mục tiêu của tính năng:**
- Nâng cấp bộ phân tích file Word (`wordParser.ts`) và nạp đề từ Zip (`markdownExamParser.ts`) để nhận diện hoàn hảo định dạng này.
- **Quy tắc bất biến:** Tuyệt đối chỉ bổ sung (update thêm), bảo toàn 100% các khả năng nhận diện cũ của hệ thống (không gây lỗi hồi quy / regression đối với các định dạng Word và Markdown hiện có).
- Hỗ trợ cả khi tải trực tiếp file Word (`.docx`) đơn lẻ và khi đóng gói file Word dạng này vào file nén `.zip` để import hàng loạt.

# 2. User Scenarios
- **Scenario 1 (Upload Word đơn lẻ)**:
  - **Given** Quản trị viên đang ở trang Quản lý Đề thi (`AdminExams.tsx`), chọn chức năng Nhập từ Word.
  - **When** Quản trị viên tải lên file `.docx` có định dạng bullet options và đáp án bằng text (như `Bo_De_1_Tong_Quan_SOC_Quy_Dinh.docx`).
  - **Then** Hệ thống nhận diện đầy đủ 23/23 câu hỏi; các bullet points tự động được gán nhãn A, B, C, D, E, F...; nội dung dòng đáp án được tự động so khớp với các phương án để chọn đúng phương án (ví dụ `(ISC)2` -> `B`, các câu chọn nhiều đáp án như Q4 -> `[A, B, F]`), không để sót câu hỏi nào thiếu đáp án.

- **Scenario 2 (Upload qua file ZIP)**:
  - **Given** Quản trị viên mở modal "Nhập đề thi hàng loạt từ file ZIP" (`BulkExamZipModal.tsx`).
  - **When** Quản trị viên tải lên file `.zip` chứa một hoặc nhiều file Word định dạng trên.
  - **Then** Hệ thống giải nén, phân tích thành công từng file Word, nhận diện đầy đủ câu hỏi, các lựa chọn và đáp án đúng, hiển thị xem trước trực quan và cho phép lưu vào cơ sở dữ liệu.

- **Scenario 3 (Tương thích ngược 100%)**:
  - **Given** Quản trị viên tải lên file Word định dạng cũ (như `full-quiz-chuong-16-den-28-390-cau.docx`).
  - **When** Hệ thống phân tích file.
  - **Then** Tất cả các câu hỏi, phân tách chương và đáp án A, B, C, D theo chuẩn cũ vẫn được nhận diện nguyên vẹn 100% như trước.

# 3. Functional Requirements
- **FR-01 (Bỏ qua dòng Header Lựa chọn)**: Nhận diện và bỏ qua dòng tiêu đề phương án như `Các lựa chọn:`, `Lựa chọn:`, `Options:`, `Danh sách lựa chọn:` để không bị lẫn vào nội dung câu hỏi `content` hoặc đáp án.
- **FR-02 (Nhận diện Bullet Options)**: 
  - Nhận diện các dòng bắt đầu bằng ký tự bullet (`•`, `-`, `*`, `+`, `o`, `▪`, `▫`, `–`, `—`, `\u2022`, v.v.).
  - Khi một câu hỏi đang được phân tích và gặp các dòng bullet, tự động gán nhãn chữ cái tuần tự: Option 1 -> `A`, Option 2 -> `B`, Option 3 -> `C`, v.v.
  - Vẫn ưu tiên nhận diện nhãn có sẵn (`A.`, `B.`, `(A)`) nếu dòng có nhãn chữ cái.
- **FR-03 (So khớp đáp án bằng nội dung phương án)**:
  - Trong luồng xử lý dòng `Đáp án:` / `Answer:`, nếu hàm `extractAnswerLabels` không tìm thấy nhãn chữ cái A-H hợp lệ (trả về rỗng do đáp án được viết bằng văn bản):
  - Kích hoạt cơ chế so khớp nội dung:
    1. So khớp trực tiếp toàn bộ chuỗi đáp án (chuẩn hóa khoảng trắng, bỏ dấu ngoặc, case-insensitive) với nội dung của từng option. Nếu khớp 1 option duy nhất -> gán nhãn của option đó.
    2. Nếu không khớp trực tiếp toàn bộ chuỗi: tách chuỗi đáp án theo dấu phẩy (`,`), chấm phẩy (`;`), hoặc xuống dòng (`\n`). So khớp từng đoạn với các options trong câu hỏi để lấy danh sách các nhãn đúng (phục vụ các câu hỏi chọn nhiều đáp án như "Choose two", "Choose three").
    3. Fallback so khớp chứa (substring inclusion) nếu có sự khác biệt nhỏ về dấu câu.
- **FR-04 (Hỗ trợ chủ đề / Chapter mở rộng)**:
  - Bổ sung nhận diện dòng `Chủ đề:` / `Topic:` trong phần đầu file Word để gán vào `currentChapter`, giúp câu hỏi thuộc đúng chủ đề thay vì chỉ mặc định "Tổng hợp".
- **FR-05 (Đồng bộ xử lý cho file ZIP)**:
  - Đảm bảo hàm `extractExamsFromZip` trong `src/lib/markdownExamParser.ts` khi duyệt các file `.docx` bên trong file ZIP sẽ tận dụng toàn bộ logic cải tiến của `parseHtmlToQuestions`.

# 4. Key Entities
- `ParsedQuestion` & `ParsedOption`: Kiểu dữ liệu câu hỏi và lựa chọn trong `src/lib/wordParser.ts`.
- `ParsedExamData`: Kiểu dữ liệu đề thi trích xuất từ file Word/Zip trong `src/lib/markdownExamParser.ts`.

# 5. Key Files
- `src/lib/wordParser.ts`: Bộ phân tích HTML trích xuất từ file Word (bổ sung bullet options, header options, match answer by content, chủ đề chapter).
- `src/lib/markdownExamParser.ts`: Bộ trích xuất đề thi từ file Zip và file đơn lẻ.
- `src/pages/admin/AdminExams.tsx`: Trang quản lý và tải lên file Word đơn lẻ.
- `src/components/admin/BulkExamZipModal.tsx`: Modal tải lên và xử lý file ZIP chứa file Word.

# 6. Success Criteria
- **SC-01**: File `Bo_De_1_Tong_Quan_SOC_Quy_Dinh.docx` khi tải trực tiếp qua `AdminExams.tsx` nhận diện đủ 23/23 câu hỏi với 100% câu hỏi có đầy đủ các options và đáp án chính xác.
- **SC-02**: File `Bo_De_1_Tong_Quan_SOC_Quy_Dinh.docx` khi được nén trong file `.zip` và tải lên qua `BulkExamZipModal.tsx` nhận diện đúng đề thi, đủ 23 câu hỏi và đủ đáp án.
- **SC-03**: File Word cũ `full-quiz-chuong-16-den-28-390-cau.docx` vẫn được nhận diện chính xác 100% không có bất kỳ sai lệch nào (zero regression).
- **SC-04**: Toàn bộ unit tests chạy thành công (`npm test`).
