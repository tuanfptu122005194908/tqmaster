# Feature Specification: Nút Dọn dẹp & Xoá Ảnh Bill Cũ trong Quản trị Đơn hàng (Spec 33)

**Status**: Approved & Completed (Đã triển khai & kiểm thử thành công)
**Created**: 2026-10-31
**Feature Directory**: `.sdd/specs/33-admin-clean-bill-images/`

## 1. Mục tiêu & Nghiệp vụ (Overview & Problem Statement)

- **Vấn đề**:
  - Học sinh khi đặt mua tài liệu/khoá học đều phải tải ảnh hoá đơn chuyển khoản lên hệ thống. Các ảnh này được lưu trong kho `bill-images` trên Supabase Storage.
  - Hiện tại có hơn **523 ảnh bill chiếm hơn 147 MB** dung lượng Storage. Sau khi Admin đã kiểm tra và duyệt đơn (`status = 'approved'`), các ảnh bill này không còn giá trị đối soát nhưng vẫn chiếm dụng bộ nhớ lâu dài.
- **Yêu cầu của người dùng**:
  1. Thêm một nút **"Xoá ảnh bill cũ"** trong trang Quản lý đơn hàng ([`AdminOrders.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/admin/AdminOrders.tsx)).
  2. Khi Admin bấm nút, hệ thống sẽ xoá sạch các file ảnh bill lưu trữ trên Storage và đặt lại trường `bill_image_url = NULL` trên các đơn hàng tương ứng.
  3. **Tuyệt đối an toàn (Zero Side-Effects)**:
     - Giữ nguyên 100% thông tin đơn hàng (`orders`, `order_items`, doanh thu, trạng thái, ngày duyệt, người duyệt).
     - **Tuyệt đối không ảnh hưởng đến quyền môn học** của học sinh (`user_subjects` và quyền vào học được bảo toàn 100%).
     - **Quy trình mua hàng không đổi**: Học sinh khi thanh toán tại Giỏ hàng ([`CartPage.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/user/CartPage.tsx)) vẫn **bắt buộc phải tải ảnh bill** như bình thường. Chỉ khi nào Admin chủ động bấm nút "Xoá ảnh bill cũ" thì ảnh mới được dọn dẹp.

---

## 2. Kịch bản Người dùng & Tiêu chí Nghiệm thu (User Scenarios Given-When-Then)

### Kịch bản 1: Học sinh mua hàng vẫn bắt buộc tải ảnh bill
- **Given**: Học sinh đang ở bước Thanh toán trong [`CartPage.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/user/CartPage.tsx).
- **When**: Bấm "Xác nhận đặt hàng" mà chưa chọn ảnh bill.
- **Then**: Hệ thống vẫn báo lỗi yêu cầu tải ảnh bill. Khi chọn ảnh, ảnh bill vẫn được upload lên kho `bill-images` kèm nén WebP và tạo đơn bình thường.

### Kịch bản 2: Admin mở modal "Xoá ảnh bill cũ" với các tuỳ chọn rõ ràng
- **Given**: Admin đang xem trang Quản trị Đơn hàng ([`AdminOrders.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/admin/AdminOrders.tsx)).
- **When**: Admin bấm nút **"Xoá ảnh bill cũ"** ở thanh công cụ trên cùng.
- **Then**: Một hộp thoại xác nhận hiện ra, thống kê rõ số lượng ảnh bill đang lưu trữ (ví dụ: *Đang có 523 ảnh bill (~147 MB)*) và cho phép Admin chọn:
  - **Lựa chọn A (Khuyên dùng)**: Chỉ xoá ảnh của các đơn **Đã duyệt (`approved`)** và **Đã huỷ (`rejected`)** — giữ lại ảnh của các đơn đang **Chờ duyệt (`pending`)** để Admin kiểm tra.
  - **Lựa chọn B**: Xoá **Tất cả ảnh bill từ trước đến nay** (kể cả đơn chờ duyệt).

### Kịch bản 3: Xoá sạch ảnh trên Storage và bảo toàn 100% dữ liệu đơn hàng
- **Given**: Admin xác nhận thực hiện xoá trong hộp thoại.
- **When**: Hệ thống tiến hành xoá các file trong bucket `bill-images` và cập nhật `bill_image_url = NULL` cho các đơn hàng tương ứng.
- **Then**:
  - Các file vật lý trong bucket `bill-images` bị xoá sạch, giải phóng hàng trăm MB Storage.
  - Tất cả các đơn hàng vẫn hiển thị đầy đủ thông tin: Mã đơn, Học viên, Số tiền, Trạng thái "Đã duyệt", Ngày tạo. Trong chi tiết đơn hiển thị ghi chú nhẹ: *"Ảnh bill đã được dọn dẹp để tiết kiệm dung lượng"*.
  - Quyền học của học viên (`user_subjects`) không hề bị thay đổi hay thu hồi.

---

## 3. Yêu cầu Chức năng (Functional Requirements)

- **FR-001**: Thêm nút **"Xoá ảnh bill cũ"** trên Header/Toolbar của [`src/pages/admin/AdminOrders.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/admin/AdminOrders.tsx) với icon `Trash2` / `FileImage` và thiết kế đồng bộ theo TQMaster Dashboard Theme.
- **FR-002**: Tạo component Modal xác nhận `CleanBillsModal` hiển thị số lượng ảnh bill hiện có và cho phép Admin chọn phạm vi xoá (Chỉ đơn đã xử lý vs Toàn bộ).
- **FR-003**: Tạo hàm tiện ích `cleanBillImages({ scope: 'processed_only' | 'all' })` thực hiện:
  1. Lấy danh sách đường dẫn `bill_image_url` từ bảng `orders`.
  2. Gọi `supabase.storage.from('bill-images').remove(paths)` để xoá file vật lý trên Storage.
  3. Cập nhật `orders.bill_image_url = NULL` theo danh sách ID đơn hàng đã xoá.
- **FR-004**: Cập nhật modal xem chi tiết đơn hàng (`openDetail` trong `AdminOrders.tsx`): nếu đơn hàng có `bill_image_url` đã bị xoá (null) nhưng đơn vẫn `approved`, hiển thị thông báo thân thiện thay vì lỗi tải ảnh.
- **FR-005**: Bảo đảm 100% luồng đặt hàng tại [`CartPage.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/user/CartPage.tsx) và luồng cấp quyền tại Edge Function `approve-order` không bị bất kỳ ảnh hưởng nào.

---

## 4. Key Files & Components

- [`src/pages/admin/AdminOrders.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/admin/AdminOrders.tsx): Nút bấm, Modal xác nhận, cập nhật UI chi tiết đơn.
- `src/lib/orderBillCleaner.ts`: Logic truy vấn và xoá file trong `bill-images` kèm cập nhật `orders.bill_image_url`.

---

## 5. Tiêu chí Thành công (Success Criteria)

- **SC-001**: Bấm nút xoá ảnh bill dọn dẹp thành công các file trong `bill-images` mà không làm thay đổi trạng thái đơn hàng (`approved`), không đụng chạm đến bảng `user_subjects`.
- **SC-002**: Toàn bộ unit tests (`npm test`) và build (`npm run build`) pass 100%.

