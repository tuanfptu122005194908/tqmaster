# Hướng dẫn app TQMaster Admin (Android, dùng riêng)

App chỉ dành riêng cho bạn (Admin), chỉ chạy trên **1 điện thoại duy nhất**, giao diện chuẩn theme TQMaster, chống chụp màn hình, tự động đọc tên người mua khi có đơn hàng mới.

---

## Trạng thái triển khai tự động (ĐÃ HOÀN TẤT 100%)

- [x] **Database Supabase**: Đã chạy migration bảng `admin_devices` trên remote DB (`vhljgmtithjeovtrghvy`).
- [x] **Firebase Cloud Messaging (FCM)**: Đã tích hợp `google-services.json` vào Android app và nạp `FCM_SERVICE_ACCOUNT` vào Supabase Secrets.
- [x] **Edge Functions**: Đã deploy 2 functions `create-order` và `notify-admin-new-order` kích hoạt đẩy tin FCM tự động.
- [x] **Âm thanh & UI Tối ưu**: Chuông "TING" đanh to 0.4s -> tuần tự phát TTS tiếng Việt không bị overlap; hiển thị badge số lượng đơn trên các tab.
- [x] **Môi trường Build**: Android SDK 34-36, Build-Tools, JDK 21.
- [x] **Keystore Signing**: Bản Release signed `TQMaster-Admin.apk` (~7.26 MB) đã tích hợp đầy đủ Google Services.
- [x] **Unit Tests**: 114/114 tests passing, Web Production build `dist/` tách biệt 100%.

---

## 1. Cài file APK lên điện thoại của bạn

File APK đã được build sẵn và đặt ngay tại thư mục gốc dự án:
📁 **`TQMaster-Admin.apk`**
(Đường dẫn gốc: `android/app/build/outputs/apk/release/app-release.apk`)

Bạn có thể cài lên điện thoại theo 1 trong các cách sau:
- **Cách 1 (Nhanh nhất nếu cắm cáp USB)**:
  Bật "Gỡ lỗi USB" (USB Debugging) trên điện thoại, cắm cáp vào máy tính và chạy lệnh:
  ```powershell
  & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r TQMaster-Admin.apk
  ```
- **Cách 2 (Không cần cáp)**:
  Gửi file `TQMaster-Admin.apk` sang điện thoại (qua Zalo "Cloud của tôi", Telegram "Saved Messages", hoặc Google Drive cá nhân), tải về điện thoại rồi bấm cài đặt. Cho phép "Cài đặt ứng dụng không rõ nguồn gốc" nếu điện thoại hỏi.

---

## 2. Thiết lập trên điện thoại sau khi cài

1. **Mở app & Đăng nhập**:
   - Đăng nhập tài khoản admin của bạn.
   - Ngay khi đăng nhập thành công, thiết bị của bạn sẽ được **tự động liên kết độc quyền** với hệ thống. Mọi thiết bị khác cố tình đăng nhập sẽ bị từ chối truy cập.
2. **Kích hoạt Bảo mật Sinh trắc học**:
   - App sẽ tự động nhắc bạn bật vân tay/khuôn mặt/mã PIN mỗi khi mở app.
   - Màn hình app đã được cấu hình cấm chụp ảnh và cấm quay màn hình để chống rò rỉ dữ liệu.
3. **Cấp quyền Thông báo & Tắt tối ưu pin**:
   - Cho phép quyền **Thông báo**.
   - Vào Cài đặt máy → Ứng dụng → TQMaster Admin → Pin → Chọn **"Không hạn chế"** (để hệ điều hành không tự tắt app ngầm).
   - Nếu bạn dùng máy Xiaomi / Oppo / Vivo / Realme: Bật thêm quyền **"Tự khởi chạy" (Auto-start)**.
4. **Kiểm tra Chuông & Giọng đọc**:
   - Mở app, vào tab **Cài đặt** → bấm **"Gửi thông báo thử nghiệm"**.
   - Bạn sẽ nghe chuông riêng `order_alert.wav` cùng giọng đọc tiếng Việt: *"Bạn có đơn hàng mới từ Nguyễn Văn A!"*.

---

## 3. (Tuỳ chọn) Cấu hình Firebase để nhận Push khi app bị tắt hẳn (Killed)

> 💡 **Lưu ý**: Khi app đang chạy hoặc mở ngầm trong đa nhiệm (Background), hệ thống Realtime của Supabase đã tự động đẩy chuông và giọng đọc ngay lập tức.
> Nếu bạn muốn nhận thông báo qua Google FCM ngay cả khi bạn vuốt tắt app hoàn toàn khỏi màn hình đa nhiệm:

1. Vào [Firebase Console](https://console.firebase.google.com) → **Add project** (đặt tên ví dụ: `TQMaster Admin Alert`, tắt Google Analytics).
2. Chọn biểu tượng **Android**:
   - Android package name: `com.tqmaster.adminalert`
   - Bấm **Register app** → Tải file `google-services.json` → Copy vào thư mục `android/app/google-services.json`.
3. Bấm biểu tượng bánh răng ⚙️ (Project settings) → Tab **Service accounts** → Bấm nút **Generate new private key** → Tải file `.json` về máy.
4. Nạp Service Account vào Supabase Secrets bằng PowerShell:
   ```powershell
   supabase secrets set FCM_SERVICE_ACCOUNT=(Get-Content "đường-dẫn-file-service-account.json" -Raw)
   ```
5. Build lại app một lần với file cấu hình Google:
   ```powershell
   npm run android:sync
   cd android; .\gradlew.bat assembleRelease
   ```

---

## 4. Quản lý Thiết bị & Trường hợp Đổi máy / Mất máy

- **Xem thông tin thiết bị**: Vào Web Admin → **Cài đặt hệ thống** → Card **"Thiết bị App Admin (Android)"**. Tại đây bạn sẽ thấy tên máy, hãng máy, ngày liên kết và token.
- **Đổi điện thoại mới**: Vào Web Admin bấm nút **"Gỡ liên kết thiết bị này"**. Sau đó tải app lên điện thoại mới và đăng nhập lại.
- **Trường hợp mất điện thoại**: Vào Web Admin gỡ liên kết ngay lập tức và đổi mật khẩu tài khoản Admin.

---

## 5. Bật / Tắt Thông báo Email

Mặc định khi kích hoạt app mobile, hệ thống tự động tắt thông báo email đơn hàng mới để tránh làm phiền hộp thư của bạn.
Nếu sau này bạn muốn bật lại email song song:
Vào Supabase SQL Editor chạy:
```sql
UPDATE system_settings SET value = 'true' WHERE key = 'admin_email_enabled';
```
