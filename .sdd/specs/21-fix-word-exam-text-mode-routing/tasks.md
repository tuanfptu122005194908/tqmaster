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

- [x] **Task 3: Hỗ trợ Chế độ Luyện tập (Practice Mode) trên Dedicated Text Exam**
  - File: `src/pages/user/ExamPage.tsx`
  - Cho phép học viên chọn đáp án trong practice mode, hiển thị kết quả đúng (xanh)/sai (đỏ) tức thì.
  - Tách nút Báo lỗi câu hỏi thành nút bấm tiện ích thay vì chiếm trọn sidebar.

- [x] **Task 4: Fallback hiển thị text đáp án trong Image Exam UI**
  - File: `src/pages/user/ExamPage.tsx`
  - Đảm bảo nếu một câu hỏi trong Image Exam có `opt.content`, nút đáp án vẫn hiển thị text gọn gàng, không bị trống.

- [x] **Task 5: Chạy kiểm thử tự động, build và sync Knowledge Graph**
  - Chạy `npm test` để xác nhận mọi test suites pass (38/38 tests pass).
  - Chạy `graphify update .` để đồng bộ đồ thị tri thức.
  - Đẩy code lên 2 remote repositories: `origin` và `tqmaster`.


