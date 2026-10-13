# Tasks: 23-support-bullet-and-content-answer-docx

- [x] 1. Khảo sát codebase qua CodeGraph và phân tích mẫu file `Bo_De_1_Tong_Quan_SOC_Quy_Dinh.docx`.
- [x] 2. Viết tài liệu SDD (`spec.md`, `plan.md`, `tasks.md`).
- [x] 3. Trình bày Spec và chờ người dùng duyệt (Review Gate).
- [x] 4. Nâng cấp `src/lib/wordParser.ts`:
  - [x] 4.1. Thêm `OPTION_HEADER_RE`, `BULLET_RE`, mở rộng `CHAPTER_RE`.
  - [x] 4.2. Thêm hàm `matchAnswerToOptions` so khớp đáp án văn bản đa tầng.
  - [x] 4.3. Bổ sung nhận diện bullet options tự động sinh nhãn A, B, C...
  - [x] 4.4. Thêm cơ chế fallback so khớp nội dung đáp án trong `parseHtmlToQuestions`.
- [x] 5. Viết unit test tự động trong `src/lib/__tests__/wordParser.test.ts`:
  - [x] 5.1. Test kiểm tra file mẫu mới `Bo_De_1_Tong_Quan_SOC_Quy_Dinh.docx` (đủ 23 câu, đủ đáp án).
  - [x] 5.2. Test kiểm tra file mẫu cũ `full-quiz-chuong-16-den-28-390-cau.docx` (chắc chắn không hồi quy).
  - [x] 5.3. Test kiểm tra trích xuất qua file ZIP chứa file docx dạng này (`extractExamsFromZip`).
- [x] 6. Chạy kiểm thử tự động `npm test` và kiểm tra TypeScript build.
- [x] 7. Cập nhật Knowledge Graph: `graphify update .`.
- [x] 8. Tự động commit và đẩy mã nguồn lên cả 2 remote (`origin` và `tqmaster`).
