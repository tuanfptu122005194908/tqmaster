# Plan: Tự động Cấp quyền khi Tạo Đơn và Khôi phục Quyền Môn học (Auto Grant & Repair Subject Access)

Feature Branch: `feat/auto-grant-and-repair-subject-access`  
Status: Draft (Pending User Approval)  
Date: 2026-10-22 (Asia/Saigon)  

---

## 1. Kiến trúc Kỹ thuật & Luồng Dữ liệu (Technical Architecture)

### 1.1 Trigger Cấp quyền Đơn hàng hoàn chỉnh (PostgreSQL)
Trigger `trg_order_subject_access_change` sẽ thay thế trigger cũ, bắt sự kiện:
- `AFTER INSERT OR UPDATE ON public.orders`
- Khi `INSERT`: nếu `NEW.status = 'approved'`, thêm các môn học từ `public.order_items` tương ứng vào `public.user_subjects` với `ON CONFLICT (user_id, subject_id) DO NOTHING`.
- Khi `UPDATE`:
  - Chuyển sang `approved`: thêm quyền môn học.
  - Chuyển từ `approved` sang `rejected`: thu hồi quyền môn học (chỉ thu hồi những môn không nằm trong đơn `approved` khác).
- Sự kiện `BEFORE DELETE` giữ nguyên logic hiện có để thu hồi quyền nếu xóa đơn `approved`.

### 1.2 RPC `repair_subject_access_by_admin()`
- Định nghĩa hàm bảo mật PostgreSQL:
  ```sql
  CREATE OR REPLACE FUNCTION public.repair_subject_access_by_admin()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  ```
- Kiểm tra quyền: `IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Unauthorized'; END IF;`
- Thực hiện insert bù quyền cho các đơn hàng `status = 'approved'` còn tồn tại trong bảng `orders` mà chưa có bản ghi trong `user_subjects`.
- Trả về JSON chứa:
  - `restored_grants_count`: Số lượng môn học vừa được cấp bù.
  - `affected_users_count`: Số lượng học viên được khôi phục quyền.

### 1.3 Giao diện Quản trị (`AdminUsers.tsx`)
- Thêm nút hành động phụ cạnh nút "Xuất Email" và "Thêm tài khoản":
  - Tiêu đề: **Đồng bộ quyền đơn hàng** (icon `RefreshCw`).
  - Giao diện: Nền trắng viền xám nhạt `#e2e8f0`, chữ `#0f172a`, hover hiệu ứng mượt.
  - Khi bấm: Hiển thị confirm xác nhận.
  - Gọi RPC `supabase.rpc('repair_subject_access_by_admin')`.
  - Hiển thị Toast thông báo kết quả: ví dụ *"Đã khôi phục thành công X môn học cho Y học viên!"*.
  - Tự động gọi lại `fetch()` để tải mới danh sách người dùng và cập nhật ngay lập tức số môn trên màn hình.

---

## 2. Kế hoạch Triển khai (Implementation Sequence)

1. **Bước 1**: Tạo file migration `supabase/migrations/20261022020000_auto_grant_and_repair_subject_access.sql`:
   - Định nghĩa hàm trigger mở rộng `handle_order_subject_access()`.
   - Gắn trigger vào bảng `orders` cho cả sự kiện `INSERT` và `UPDATE`.
   - Định nghĩa RPC `repair_subject_access_by_admin()`.
   - Chạy lệnh backfill cấp bù quyền một lần ngay trong migration.
2. **Bước 2**: Cập nhật TypeScript types trong `src/integrations/supabase/types.ts` để nhận diện RPC mới `repair_subject_access_by_admin`.
3. **Bước 3**: Cập nhật `src/pages/admin/AdminUsers.tsx`:
   - Thêm state `repairingAccess` và hàm `handleSyncSubjectAccess`.
   - Render nút hành động "Đồng bộ quyền đơn hàng" trên thanh công cụ Admin.
4. **Bước 4**: Bổ sung Unit Test trong `src/pages/admin/__tests__/AdminUsers.test.tsx` kiểm thử hành vi gọi đồng bộ quyền.
5. **Bước 5**: Chạy toàn bộ test `npm test`, kiểm tra linter và build.
6. **Bước 6**: Đồng bộ Knowledge Graph bằng `graphify update .`.
7. **Bước 7**: Commit và tự động push lên cả 2 kho lưu trữ (`origin` và `tqmaster`).

---

## 3. Rủi ro & Biện pháp Phòng ngừa (Risks & Mitigations)

| Rủi ro | Mức độ | Biện pháp phòng ngừa |
| :--- | :--- | :--- |
| Trùng lặp môn học đã có của học viên | Thấp | Dùng `ON CONFLICT (user_id, subject_id) DO NOTHING` — nếu học viên đã có quyền thì giữ nguyên, không gây lỗi. |
| Cấp nhầm quyền cho đơn đã xóa | Không thể xảy ra | Query lấy dữ liệu từ bảng `public.orders`, các đơn đã xóa không còn tồn tại nên không thể bị quét trúng. |
| Học viên mua cùng môn ở 2 đơn khác nhau, hủy 1 đơn | Thấp | Trigger đã có điều kiện kiểm tra các đơn `approved` khác của cùng user_id trước khi thu hồi. |
| Người dùng thường gọi RPC sửa quyền | Thấp | RPC được khóa chặt chẽ bằng `public.has_role(auth.uid(), 'admin')`, chặn triệt để mọi truy cập trái phép. |
