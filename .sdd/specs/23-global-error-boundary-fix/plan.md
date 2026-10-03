---
title: Plan for Global Error Boundary
---

# Kế hoạch kỹ thuật (Technical Plan)

## 1. Tạo `GlobalErrorBoundary.tsx`
- Do React Error Boundary bắt buộc phải sử dụng class component, chúng ta sẽ tạo một class kế thừa từ `React.Component`.
- Trong component này, chúng ta sẽ override hàm `static getDerivedStateFromError(error)` để cập nhật state `hasError`.
- Override hàm `componentDidCatch(error, errorInfo)` để có thể log lỗi ra console (hoặc Sentry nếu có) giúp việc debug sau này dễ dàng.
- Phần `render()`:
  - Nếu `hasError` là `true`: Hiển thị một Fallback UI mang tính thẩm mỹ (chuẩn TQMaster Theme) thay vì màn hình trắng, sử dụng các components quen thuộc (lucide-react icons, Tailwind/CSS classes chuẩn của dự án).
  - Ngược lại: trả về `this.props.children`.

## 2. Tích hợp vào `App.tsx`
- Import `GlobalErrorBoundary` vào `App.tsx`.
- Bọc ngoài cấu trúc routing (cụ thể là quanh `AppShell` hoặc `Routes`) để đảm bảo bất kỳ lỗi nào từ các trang con (như `CartPage`, `HomePage`) đều bị bắt lại.

## 3. Quản lý UI
- Đảm bảo Fallback UI không bị kẹt. Nên cung cấp các nút `Về trang chủ` (`window.location.href = '/'`) và `Tải lại trang` (`window.location.reload()`).
- Màu sắc cho Fallback UI nên dùng các biến CSS chuẩn trong `adminVars` hoặc màu chung (như `--danger`, `--background`, `--primary`).
