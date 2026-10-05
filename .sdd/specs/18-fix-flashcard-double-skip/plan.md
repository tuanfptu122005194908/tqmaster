# Plan: Fix Flashcard Double Skip Bug

## Vấn đề hiện tại
File `ExamPage.tsx` đang có 2 `useEffect` đăng ký event listener cho sự kiện `keydown` trên `window`:
1. Dòng 134-164: Xử lý riêng cho `examMode === 'flashcard'`. Có chứa logic ArrowLeft/ArrowRight.
2. Dòng 291-314: Xử lý chung các phím tắt, cũng xử lý ArrowLeft/ArrowRight.

Vì cả hai event listener đều được trigger khi nhấn phím mũi tên ở chế độ flashcard, hàm `setCurrentIndex` được gọi 2 lần, làm cho câu hỏi bị nhảy đi 2 nấc.

## Giải pháp kỹ thuật
Gộp 2 `useEffect` lại. Xóa `useEffect` ở dòng 134-164 đi và chỉ giữ lại `useEffect` thứ hai (dòng 291-314).
Cập nhật `useEffect` thứ hai để bao gồm logic `activeEl.blur()` nếu người dùng ấn phím mũi tên hoặc phím cách để tránh bị focus nhầm vào các element khác (ví dụ: nút bấm).

## Các bước thực hiện
1. Tìm và xóa đoạn `useEffect` (dòng 134-164) xử lý "Flashcard keyboard shortcuts".
2. Trong `useEffect` xử lý "Keyboard shortcuts" (dòng 291-314):
   - Thêm logic `e.stopPropagation()` và `activeEl.blur()` khi `e.code === 'Space'`.
   - Thêm logic tương tự đối với `ArrowLeft` và `ArrowRight`.
3. Kiểm tra lại hành vi khi người dùng sử dụng các phím điều hướng và phím cách.
