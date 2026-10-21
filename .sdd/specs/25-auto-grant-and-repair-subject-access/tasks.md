# Tasks: Tự động Cấp quyền khi Tạo Đơn và Khôi phục Quyền Môn học (Auto Grant & Repair Subject Access)

- [x] **Giai đoạn 1: Chuẩn bị & Cổng phê duyệt (Review Gate)**
  - [x] Khảo sát mã nguồn qua CodeGraph và Graphify.
  - [x] Lập bộ tài liệu `spec.md`, `plan.md`, `tasks.md` theo chuẩn SDD.
  - [x] Chờ người dùng phê duyệt spec trước khi viết code triển khai ("tiến hành đi").

- [x] **Giai đoạn 2: Migration Database**
  - [x] Tạo file migration `supabase/migrations/20261022020000_auto_grant_and_repair_subject_access.sql`.
  - [x] Nâng cấp trigger `handle_order_subject_access()` hỗ trợ cả `AFTER INSERT OR UPDATE`.
  - [x] Tạo trigger `trg_order_item_subject_access` trên `public.order_items` để tự cấp quyền khi chèn dòng đơn vào đơn đã duyệt.
  - [x] Tạo RPC `repair_subject_access_by_admin()` bảo mật theo role `admin`.
  - [x] Viết lệnh SQL backfill tự động cấp bù quyền cho các đơn hàng `approved` hợp lệ còn thiếu.

- [x] **Giai đoạn 3: Frontend & Types**
  - [x] Khai báo RPC `repair_subject_access_by_admin` trong `src/integrations/supabase/types.ts`.
  - [x] Cập nhật `src/pages/admin/AdminUsers.tsx`: Thêm nút "Đồng bộ quyền đơn hàng" với loading spinner và toast phản hồi.

- [x] **Giai đoạn 4: Kiểm thử tự động & Đảm bảo chất lượng**
  - [x] Cập nhật unit test trong `src/pages/admin/__tests__/AdminUsers.test.tsx`.
  - [x] Chạy bộ kiểm thử tự động `npm test` đảm bảo 100% tests pass (33/33 tests passed).
  - [x] Kiểm tra lint và production build (`npm run build` passed).

- [x] **Giai đoạn 5: Hoàn tất & Đồng bộ Repositories**
  - [x] Đồng bộ Knowledge Graph bằng `graphify update .`.
  - [x] Commit code với thông điệp semantic (`feat:`).
  - [x] Tự động đẩy code lên cả 2 remote repository (`origin` và `tqmaster`).
