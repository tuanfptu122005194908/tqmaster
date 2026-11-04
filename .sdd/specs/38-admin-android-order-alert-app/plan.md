# Plan 38 (v2): Admin-Only, Single-Device Android App

## Kiến trúc

```
orders INSERT ─▶ notify-admin-new-order ─┬─ email (cờ, fallback)
                                         └─ FCM ─▶ chỉ thiết bị trong admin_devices (1 máy)
App (build admin-app): Login ─▶ RPC check admin ─▶ claim_admin_device ─▶ Biometric lock ─▶ Dashboard
Foreground: Realtime orders INSERT ─▶ banner + âm + TTS (dedupe order_id)
Web admin: "Thiết bị app" ─▶ unlink_admin_device
```

## Quyết định kỹ thuật

- **Build mode `admin-app`** (Vite `--mode admin-app`): entry/router riêng chỉ chứa login + `/admin/*` với layout mobile (BottomNav, card, safe-area). Tái sử dụng hooks/queries admin hiện có, không nhân đôi logic.
- **Gate server-side**: RPC `claim_admin_device`/`update_fcm_token`/`unlink_admin_device` đều SECURITY DEFINER, kiểm tra role admin + ràng buộc 1 thiết bị (unique partial index trên bản ghi active). `device_id` lấy từ `@capacitor/device` (Android ID).
- **Biometric**: `@aparajita/capacitor-biometric-auth`, khoá khi `appStateChange` nền > 60s.
- **Hardening**: `allowBackup=false`, `android:usesCleartextTraffic=false`, `FLAG_SECURE`, tắt `webContentsDebuggingEnabled` ở release, keystore riêng ngoài repo.
- **Foreground Alert Audio & TTS**: Tách biệt thành chuỗi tuần tự (Sequential): Phát chuông "ting" đanh to (0.4s), lắng nghe sự kiện `ended` (hoặc timeout 450ms), sau đó mới gọi TTS tiếng Việt âm lượng max (`volume: 1.0`). Tránh trùng lặp âm thanh.
- **Danh sách đơn & Phân loại trạng thái**: Hiển thị badge số lượng đơn cho từng tab: Chờ duyệt, Đã duyệt, Từ chối, Tất cả. Khi danh sách chờ duyệt trống, hiển thị thông báo thân thiện và nút chuyển nhanh sang xem các đơn đã duyệt/toàn bộ lịch sử.
- **UI**: Tailwind + Shadcn + lucide-react theo theme TQMaster; skeleton thương hiệu; haptics (`@capacitor/haptics`).

## Các bước

1. Migration `admin_devices` + RPC + RLS + types.
2. Capacitor + plugin + cấu hình Android hardening.
3. Entry `admin-app`, router, layout mobile, BottomNav.
4. Login + admin gate + claim device + xử lý lỗi non-admin/máy lạ.
5. BiometricLock + auto-lock.
6. Dashboard mobile, danh sách đơn (OrderCard, duyệt/từ chối), pull-to-refresh.
7. Push đăng ký + tap điều hướng; Realtime banner + TTS + dedupe.
8. AlertSettings (âm, TTS, rung, test).
9. Web admin "Thiết bị app" (xem + gỡ liên kết).
10. Edge Function FCM + dọn token + secrets.
11. Test Vitest + `npm test`; hướng dẫn Firebase + build APK ký; test thật trên máy.
12. `graphify update .`, commit, push `origin` + `tqmaster`.

## Rủi ro

- OEM chặn push nền → hướng dẫn tắt tối ưu pin.
- Mất máy → gỡ liên kết từ web + đổi mật khẩu; mất keystore → không cập nhật được app (backup keystore).
