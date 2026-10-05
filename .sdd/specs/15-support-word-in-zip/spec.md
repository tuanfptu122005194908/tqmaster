---
Feature Branch: feat/15-support-word-in-zip
Status: Approved (Updated for Image Support)
---
# 1. Overview
Hệ thống hiện tại (tính năng Import Hàng Loạt từ ZIP) chỉ hỗ trợ đọc các file `.md` hoặc `.txt`.
Yêu cầu mới: Nâng cấp để hệ thống nhận diện và phân tích được cả file `.docx` (Word) nằm bên trong file ZIP. Cùng với việc nâng cấp, cần clean code, debug và xoá file ZIP test được cung cấp.

# 2. User Scenarios & Testing
- **Given** người dùng đang ở tính năng Import hàng loạt từ file ZIP
- **When** người dùng tải lên file ZIP có chứa các file `.docx` bên trong
- **Then** hệ thống tự động giải nén, phát hiện file `.docx`, convert file này sang HTML bằng `mammoth`, parse các câu hỏi bằng `parseHtmlToQuestions` và tổng hợp thành danh sách đề thi (giống như parse từ markdown).

# 3. Requirements
- **FR-01**: Cập nhật hàm `extractExamsFromZip` trong `src/lib/markdownExamParser.ts` để đọc và xử lý thêm đuôi file `.docx`.
- **FR-02**: Tích hợp `mammoth.convertToHtml` và `parseHtmlToQuestions` (từ `src/lib/wordParser.ts`) vào luồng `extractExamsFromZip` cho định dạng Word.
- **FR-03**: Map output của `parseHtmlToQuestions` sang cấu trúc `ParsedExamData` để hiển thị đồng nhất trên UI. Cấu trúc `ParsedExamQuestion` và `ParsedExamOption` phải được bổ sung trường `imageDataUrl` và `extraImageDataUrls`.
- **FR-04**: Cập nhật input file accept ở modal chọn file ZIP để thể hiện rằng có hỗ trợ `.docx`.
- **FR-05**: Hỗ trợ Upload ảnh lên Supabase Storage từ dữ liệu Base64 của file Word thông qua `batchUploadImages` trước khi insert dữ liệu câu hỏi ở `BulkExamZipModal.tsx`.
- **FR-06**: Clean code, debug để đảm bảo không có lỗi biên dịch/TypeScript.
- **FR-07**: Xoá bỏ file ZIP test `CEA201_PT1_SEB_FALL26.zip` trên thư mục dự án sau khi hoàn tất.

# 4. Success Criteria
- **SC-01**: Tải thành công file ZIP chứa `.docx` và hệ thống hiển thị chính xác số câu hỏi/đáp án đã nhận diện.
- **SC-02**: File ZIP test được dọn dẹp khỏi root directory.
- **SC-03**: Nếu file Word chứa hình ảnh, hình ảnh sẽ được parse, upload lên Supabase và lưu URL thành công vào các record của `questions` và `question_options`.
