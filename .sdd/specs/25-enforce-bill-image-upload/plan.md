# Plan: Bắt buộc tải ảnh bill khi thanh toán

## 1. Context & Objectives
Khắc phục tình trạng đơn hàng được duyệt hoặc tạo mà không có ảnh bill chuyển khoản do cơ chế "silent failure" khi upload ảnh và sự dễ dãi của Edge Function.

## 2. Technical Approach
1. **CartPage.tsx (`src/pages/user/CartPage.tsx`)**:
   - Tìm đoạn code `const { error: upErr } = await supabase.storage.from('bill-images').upload(path, billFile);`
   - Bổ sung logic bắt lỗi: `if (upErr) { alert('Lỗi tải ảnh...'); setSubmitting(false); return; }`
2. **Edge Function (`supabase/functions/create-order/index.ts`)**:
   - Tìm đoạn kiểm tra body parameters.
   - Thêm `if (!billImagePath) return json({ error: 'Bắt buộc phải có ảnh bill chuyển khoản' }, 400);` để chặn request không hợp lệ từ server.

## 3. Deployment / Migration Steps
- Deploy lại ứng dụng frontend.
- Cập nhật Edge Function bằng Supabase CLI (tuy nhiên project này chưa sử dụng Supabase CLI local integration nên chúng ta chỉ sửa file mã nguồn, quản trị viên sẽ push lên qua GitHub Action hoặc CLI sau).

## 4. Rollback Plan
- Revert code lại nếu phát hiện tỉ lệ drop-off tăng cao bất thường do lỗi hạ tầng storage.
