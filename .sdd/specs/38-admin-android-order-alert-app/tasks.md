# Tasks 38 (v2): Admin-Only, Single-Device Android App

- [x] T01 Migration `admin_devices` (1 thiết bị active) + RLS + RPC claim/unlink/update_token; cập nhật `types.ts`
- [x] T02 Cài Capacitor + plugins (push, device, haptics, preferences, biometric, TTS); `cap add android`
- [x] T03 Hardening Android: allowBackup=false, cleartext off, FLAG_SECURE, tắt WebView debug, keystore riêng, `.gitignore`
- [x] T04 Build mode `admin-app`: entry, router chỉ login + `/admin/*`, layout mobile + BottomNav
- [x] T05 Màn Splash + Login (UI Cóc Vàng, glass card) + admin gate + thông báo lỗi non-admin/máy lạ
- [x] T06 `claim_admin_device` flow + tự đăng xuất khi bị gỡ liên kết
- [x] T07 `BiometricLock` + auto-lock 60s
- [x] T08 Dashboard mobile (4 stat card đúng palette) + badge đơn chờ
- [x] T09 Danh sách đơn: `OrderCard`, duyệt/từ chối, pull-to-refresh, skeleton, empty state
- [x] T10 Push: đăng ký FCM token, kênh `orders_alert`, tap → mở đơn
- [x] T11 Foreground: Realtime + dedupe + `AlertBanner` + âm + rung + TTS
- [x] T12 `AlertSettings` (chọn âm có nghe thử, TTS, rung, gửi thử, khối thiết bị)
- [x] T13 Web admin trang "Thiết bị app" (xem + Gỡ liên kết)
- [x] T14 `_shared/fcm.ts` + mở rộng `notify-admin-new-order` (FCM, dọn token, cờ email)
- [x] T15 Thêm `order_alert.wav` vào `res/raw`
- [x] T16 Vitest: gate non-admin, 1-thiết-bị, dedupe, gating native; chạy `npm test` (114/114 passing)
- [x] T17 Hướng dẫn Firebase + build APK ký + cài lên máy (`SETUP.md`)
- [x] T18 Cài Android SDK 34-36 + JDK 21 + build APK Release signed thành công (`TQMaster-Admin.apk`)
- [x] T19 `graphify update .`, commit, push `origin` + `tqmaster`

> Ghi chú: File APK đã sẵn sàng tại `TQMaster-Admin.apk` ở thư mục gốc. Người dùng có thể cài trực tiếp lên điện thoại.
