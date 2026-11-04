# Tasks 40: Khắc Phục Thông Báo Đơn Hàng & Mở Rộng Biểu Đồ Di Động

- [x] T01 Cập nhật `supabase/functions/notify-admin-new-order/index.ts` (mở rộng xác thực cho nội bộ và xử lý log chi tiết)
- [x] T02 Cập nhật `supabase/functions/create-order/index.ts` (gọi `notify-admin-new-order` có headers xác thực chính xác)
- [x] T03 Cập nhật CSDL: Chạy `ALTER TABLE public.orders REPLICA IDENTITY FULL;` trên remote DB
- [x] T04 Deploy 2 functions `create-order` và `notify-admin-new-order` lên Supabase Remote
- [x] T05 Gửi test push thực tế từ server qua node script để xác nhận điện thoại nhận được chuông và notification
- [x] T06 Tái cấu trúc layout `MobileRevenueChart.tsx`: Tăng chiều cao lên 220px, chuyển Segmented Bar thành full-width row không đè chữ
- [x] T07 Cập nhật CSS phong cách TQMaster trong `src/app-admin/admin-app.css` cho thanh chọn thời gian và biểu đồ mới
- [x] T08 Thêm nút test Push Notification trong `src/app-admin/screens/SettingsScreen.tsx`
- [x] T09 Chạy kiểm thử tự động `npm test` xác minh 114/114 tests pass
- [x] T10 Đồng bộ mã nguồn lên Android (`npm run android:sync`) và biên dịch Release APK (`assembleRelease`)
- [x] T11 Cập nhật tri thức `graphify update .`, commit và đẩy lên 2 remotes `origin` và `tqmaster`

