# Spec 38: App Android Riêng Cho Admin (Single-Admin, Single-Device) – Thông Báo Đơn Hàng

Feature Branch: `feat/admin-android-order-alert-app`
Status: Approved – Implemented (pending on-device verification)
Date: 2026-11-04 (Asia/Saigon)

---

## 1. Overview

App Android **chỉ dành cho admin, chỉ cài trên đúng 1 điện thoại của chủ dự án**. Không phát hành, không lên Play Store, không có trang tải APK. Admin đăng nhập tài khoản admin; khi có đơn mới, máy đổ chuông và hiện/đọc "Bạn có đơn hàng từ <tên người mua>", kể cả khi app đã tắt. Thay thế việc check email.

Giải pháp: Capacitor bọc web hiện tại (build chế độ `admin-app`), FCM cho push khi app đóng, Supabase Realtime khi app mở. Giao diện **thiết kế lại riêng cho mobile**, đẹp và chuyên nghiệp theo TQMaster Dashboard Theme.

## 2. Mô hình bảo mật "Chỉ admin – Chỉ máy của tôi" (nhiều lớp)

1. **Build riêng chỉ có khu admin**: bản app (`VITE_APP_MODE=admin-app`) chỉ chứa route đăng nhập admin và `/admin/*`; không có trang học sinh/mua hàng.
2. **Cổng admin phía server**: sau đăng nhập, app gọi RPC kiểm tra role admin (cơ chế role hiện có). Không phải admin → đăng xuất ngay, xoá session, hiện "Ứng dụng chỉ dành cho quản trị viên". Không tin kiểm tra phía client.
3. **Khoá 1 thiết bị (device binding)**: RPC `claim_admin_device(device_id, device_name)` chỉ cho phép **tối đa 1 thiết bị đang liên kết**. Máy đầu tiên đăng nhập admin thành công sẽ được liên kết; máy khác đăng nhập admin sẽ bị từ chối ("Tài khoản đã liên kết với thiết bị khác"). Muốn đổi máy phải **gỡ liên kết trên web admin** (mục "Thiết bị app").
4. **Chỉ thiết bị đã liên kết nhận push** và được đọc dữ liệu qua app (RPC kiểm tra `device_id` khớp).
5. **Khoá ứng dụng cục bộ**: mở app yêu cầu **vân tay/khuôn mặt hoặc mã PIN** của máy (BiometricAuth); tự khoá sau 1 phút ở nền.
6. **Hardening APK**: bản release ký bằng keystore riêng (giữ bí mật, không commit), `allowBackup=false`, tắt debug/WebView debugging, `FLAG_SECURE` (chặn chụp màn hình/recents), HTTPS-only, session lưu ở bộ nhớ an toàn.
7. **Phân phối**: APK chỉ build local và cài thủ công bằng cáp/ADB; không upload ở đâu.

> Lưu ý trung thực: về kỹ thuật không thể ngăn người khác sao chép file APK, nhưng nhờ lớp 2–5 thì APK đó vô dụng nếu không có tài khoản admin + thiết bị đã liên kết + sinh trắc học.

## 3. User Scenarios (Given-When-Then)

- **US-001 Đăng nhập admin**: Given mở app lần đầu, When nhập tài khoản admin hợp lệ, Then máy được liên kết và vào Dashboard mobile.
- **US-002 Chặn non-admin**: Given tài khoản học sinh, When đăng nhập trong app, Then bị đăng xuất và thấy màn "Chỉ dành cho quản trị viên"; không có dữ liệu nào được tải.
- **US-003 Chặn máy lạ**: Given tài khoản admin đã liên kết máy A, When đăng nhập từ máy B, Then bị từ chối, không nhận push, không vào được dữ liệu.
- **US-004 Push đơn mới khi app tắt**: Given đã liên kết, When có đơn mới, Then ≤ 5s hiện notification "Bạn có đơn hàng từ <tên> – <số tiền>đ" kèm âm riêng.
- **US-005 Foreground**: Given app đang mở, When có đơn mới, Then banner trong app + âm + TTS đọc tên (nếu bật), không trùng với push.
- **US-006 Bấm thông báo**: Then mở trang Đơn hàng với đơn đó nổi bật, sau khi qua khoá sinh trắc.
- **US-007 Khoá app**: Given app ở nền > 1 phút, When mở lại, Then yêu cầu vân tay/PIN.
- **US-008 Đổi máy**: Given admin vào web admin → "Thiết bị app" → Gỡ liên kết, Then máy cũ ngừng nhận push và bị đăng xuất; máy mới có thể liên kết.

## 4. Functional Requirements

- **FR-001** Capacitor Android (`com.tqmaster.adminalert`), build mode `admin-app` chỉ gồm route admin.
- **FR-002** Bảng `admin_devices` (`id`, `user_id`, `device_id` unique, `device_name`, `fcm_token`, `linked_at`, `last_seen_at`) với ràng buộc **tối đa 1 hàng active**; RLS chỉ admin; thao tác ghi qua RPC SECURITY DEFINER (`claim_admin_device`, `unlink_admin_device`, `update_fcm_token`).
- **FR-003** RPC kiểm tra role admin phía server; non-admin nhận lỗi 403 và app tự đăng xuất.
- **FR-004** Mở rộng `notify-admin-new-order`: gửi FCM tới thiết bị đang liên kết; token chết tự xoá; email có cờ bật/tắt.
- **FR-005** Kênh Android `orders_alert` IMPORTANCE_HIGH, âm riêng `res/raw/order_alert.mp3`.
- **FR-006** Realtime foreground + dedupe theo `order_id` + toast + TTS tiếng Việt.
- **FR-007** Khoá sinh trắc/PIN (`@aparajita/capacitor-biometric-auth`), tự khoá sau 60s ở nền.
- **FR-008** Web admin: mục **"Thiết bị app"** hiển thị máy đã liên kết, thời gian online gần nhất, nút **Gỡ liên kết**.
- **FR-009** Mọi mã native chỉ chạy khi `Capacitor.isNativePlatform()`; web production không đổi.
- **FR-010** Secrets (service account FCM, keystore) không commit; `.gitignore` cập nhật.

## 5. Yêu Cầu Giao Diện (UI/UX – "đẹp chuẩn chỉnh")

Theo TQMaster Dashboard Theme (nền `#f4f7fc`, thẻ trắng bo 20–24px, viền `#e2e8f0`, nút gradient `#3b82f6→#1d4ed8`, font Inter, tiêu đề 800–900), tối ưu mobile-first:

1. **Splash & Login**: logo linh vật Cóc Vàng, nền gradient mềm, thẻ đăng nhập kính mờ, nút gradient lớn, thông báo lỗi thân thiện.
2. **Màn khoá sinh trắc**: logo + icon vân tay nhịp nhẹ, nút "Mở khoá".
3. **Trang chủ Admin mobile**: 4 stat card (Doanh thu / Đơn hàng / Giá trị TB / Học sinh) đúng palette; "Đơn chờ duyệt" nổi bật với badge đếm đỏ.
4. **Danh sách đơn**: thẻ đơn dạng card vuốt, badge trạng thái (Approved/Pending/Rejected đúng màu), tên người mua, số tiền, thời gian tương đối; pull-to-refresh; nút duyệt/từ chối lớn dễ bấm.
5. **Bottom navigation** 3 tab (Tổng quan, Đơn hàng, Cài đặt – phần thông báo nằm trong Cài đặt) (Tổng quan, Đơn hàng, Thông báo, Cài đặt) với icon `lucide-react`, safe-area chuẩn, hiệu ứng chuyển mượt.
6. **Banner đơn mới**: thẻ trượt từ trên xuống kèm rung nhẹ, hiển thị tên + số tiền + nút "Xem đơn".
7. **Cài đặt thông báo**: chọn âm (có nghe thử), công tắc đọc tên, công tắc rung, nút "Gửi thông báo thử", khối "Thiết bị đã liên kết".
8. **Trạng thái**: skeleton loading thương hiệu, empty state có linh vật, hỗ trợ dark status bar, touch target ≥ 44px.

## 6. Key Entities / Key Files

- `orders`, role admin hiện có, `admin_devices` (mới), Edge Function `notify-admin-new-order`.
- `capacitor.config.ts`, `android/`, `src/app-admin/` (entry, router, layout mobile, `BottomNav`, `OrderCard`, `AlertBanner`, `BiometricLock`, `AlertSettings`), `src/lib/native/*`, `supabase/migrations/<ts>_admin_devices.sql`, `supabase/functions/_shared/fcm.ts`, trang web `AdminDeviceLink`, tests Vitest.

## 7. Cần từ bạn

1. Firebase project (miễn phí) cho `com.tqmaster.adminalert` → `google-services.json` + Service Account key.
2. Android Studio + JDK 17 (hoặc mình hướng dẫn build bằng Gradle CLI).
3. Điện thoại: bật cài app ngoài Play Store; tắt tối ưu pin cho app; có vân tay/PIN.

## 8. Success Criteria

- **SC-001** Tài khoản non-admin đăng nhập app: 100% bị chặn và đăng xuất, 0 dữ liệu tải về.
- **SC-002** Máy thứ 2 đăng nhập admin bị từ chối 100% khi đã có máy liên kết (có test RPC).
- **SC-003** Notification ≤ 5s khi app tắt, đúng tên người mua, có âm riêng.
- **SC-004** TTS không đọc trùng; gỡ liên kết trên web làm máy cũ ngừng nhận push ngay.
- **SC-005** App khoá lại sau 60s ở nền; chụp màn hình/recents bị chặn.
- **SC-006** UI đạt theme TQMaster, hiển thị đúng trên màn 360–430px, không tràn ngang.
- **SC-007** `npm test` pass 100% (≥105 test cũ + test mới); web production không đổi hành vi.

## 9. Out of Scope

iOS, Play Store, nhiều thiết bị cùng lúc, thông báo cho học sinh, thay đổi luồng duyệt đơn.
