# Technical Plan: Sửa Lỗi Điều Hướng Đề Thi Dạng Word Vào Giao Diện Text Exam

**Feature Identifier**: `21-fix-word-exam-text-mode-routing`  
**Status**: 📋 In Review  

---

## 1. Kiến trúc Kỹ thuật & Luồng Xử Lý

### A. Chuẩn hóa Phân Loại Đề Thi (`isTextExam`)
Trích xuất hàm helper độc lập `checkIsTextExam(questions: Question[]): boolean` (để dễ unit test và tái sử dụng):
```typescript
export function checkIsTextExam(questions: Array<{
  image_url?: string | null;
  content?: string | null;
  options: Array<{ content?: string | null }>;
}>): boolean {
  if (!questions || questions.length === 0) return false;
  
  // 1. Kiểm tra options có text hay không
  const hasTextOptions = questions.some(q => 
    q.options && q.options.some(o => !!o.content?.trim())
  );
  if (hasTextOptions) return true;

  // 2. Không có câu nào có ảnh
  const imageQuestionCount = questions.filter(q => !!q.image_url).length;
  if (imageQuestionCount === 0) return true;

  // 3. Ít hơn 50% câu có ảnh và câu hỏi có nội dung văn bản
  const hasQuestionContent = questions.some(q => !!q.content?.trim());
  if (imageQuestionCount < questions.length / 2 && hasQuestionContent) {
    return true;
  }

  return false;
}
```

### B. Hỗ trợ Chế độ Luyện tập (Practice Mode) trên Text Exam
Trong `isTextExam` UI tại `src/pages/user/ExamPage.tsx`:
1. Màn hình làm bài (`!submitted`): Áp dụng cho cả `examMode === 'exam'` và `examMode === 'practice'`.
2. Khi `examMode === 'practice'`:
   - Click chọn đáp án: Gọi `toggleAnswer(opt.label)`.
   - Hiển thị phản hồi: Nếu `currentAnswers.includes(opt.label)`, thẻ đáp án hiển thị màu xanh nếu đúng (`opt.is_correct`), hoặc đỏ nếu sai kèm hiển thị đáp án đúng màu xanh.
   - Thêm nút "Báo lỗi câu này" nhỏ gọn ở góc dưới hoặc thanh công cụ, mở modal `reportingQuestion` khi cần.
3. Khi `submitted === true`:
   - Hiển thị màn hình kết quả hoặc review.

### C. Phòng thủ Giao diện Image Exam (Fallback Defense)
Trong trường hợp một câu hỏi nào đó hiển thị ở Image Exam mà options lại có text:
- Cho phép hiển thị nội dung `opt.content` bên cạnh `opt.label` trong nút đáp án để người dùng vẫn đọc được đáp án bình thường mà không bị trống.

---

## 2. Kế hoạch Triển khai Chi tiết

1. **Bước 1**: Tạo helper `checkIsTextExam` trong `src/lib/examUtils.ts` (hoặc trực tiếp trong `ExamPage.tsx` và export) và viết bộ unit test `src/test/examModeRouting.test.ts`.
2. **Bước 2**: Cập nhật logic `isTextExam` trong `src/pages/user/ExamPage.tsx` bằng hàm helper.
3. **Bước 3**: Cập nhật phần Sidebar của `isTextExam` để hỗ trợ cả chế độ `examMode === 'practice'`.
4. **Bước 4**: Kiểm thử tự động `npm test` và kiểm tra giao diện bằng browser subagent.
5. **Bước 5**: Chạy `graphify update .` và tự động đẩy lên 2 remotes `origin` và `tqmaster`.
