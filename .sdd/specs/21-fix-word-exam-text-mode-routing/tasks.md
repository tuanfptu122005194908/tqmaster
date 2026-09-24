# Tasks Breakdown: Sửa Lỗi Điều Hướng Đề Thi Dạng Word Vào Giao Diện Text Exam

**Feature Identifier**: `21-fix-word-exam-text-mode-routing`  
**Status**: ✅ Completed  

---

- [x] **Task 1: Tạo bộ kiểm thử tự động (Unit Test First)**
  - File: `src/test/examModeRouting.test.ts`
  - Viết test cases xác thực `checkIsTextExam`:
    - Đề thi từ Word (có text options, có 1-2 câu ảnh công thức) -> PHẢI là `true`.
    - Đề thi hoàn toàn text không ảnh -> PHẢI là `true`.
    - Đề thi scan FUOverflow (tất cả câu là ảnh, options rỗng text) -> PHẢI là `false`.
    - Đề thi PE chụp ảnh -> PHẢI là `false`.

- [x] **Task 2: Triển khai helper `checkIsTextExam` & Cập nhật `ExamPage.tsx`**
  - File: `src/lib/examRouting.ts` & `src/pages/user/ExamPage.tsx`
  - Thay thế logic điều kiện bằng `checkIsTextExam`.

- [x] **Task 3: Khôi phục và chuẩn hóa giao diện Dedicated Text Exam theo commit `ce4d499`**
  - File: `src/pages/user/ExamPage.tsx`
  - Khôi phục chính xác bố cục chuẩn của commit `ce4d49938d86a4f9f9e9b39e02058927bb332b0a`:
    - Bên trái: Vùng đọc câu hỏi (Reading Mode) gọn gàng, hiển thị công thức/ảnh và các phương án A, B, C, D rõ ràng.
    - Bên phải (Chế độ Ôn tập / Practice & Review): Hiển thị danh sách đáp án với huy hiệu `[Hiện tại: Đúng]` màu xanh nổi bật cho đáp án chính xác, form ghi chú và nút gửi báo cáo lỗi câu hỏi.
    - Bên phải (Chế độ Thi thử / Exam): Hiển thị ô chọn checkbox đáp án, đánh dấu câu hỏi, bản đồ câu hỏi 1..50 và nút nộp bài.
    - Tiêu đề sidebar hiển thị chuẩn `Bộ đề gồm {questions.length} câu`.

- [x] **Task 4: Fallback hiển thị text đáp án trong Image Exam UI**
  - File: `src/pages/user/ExamPage.tsx`
  - Đảm bảo nếu một câu hỏi trong Image Exam có `opt.content`, nút đáp án vẫn hiển thị text gọn gàng, không bị trống.

- [x] **Task 5: Chạy kiểm thử tự động, build và sync Knowledge Graph**
  - Chạy `npm test` để xác nhận mọi test suites pass (38/38 tests pass).
  - Chạy `graphify update .` để đồng bộ đồ thị tri thức.
  - Đẩy code lên 2 remote repositories: `origin` và `tqmaster`.


