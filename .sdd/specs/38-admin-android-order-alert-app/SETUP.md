# Hướng dẫn cài app TQMaster Admin (Android, dùng riêng)

App chỉ dành cho admin, chỉ chạy trên **1 điện thoại** của bạn. Làm lần lượt:

## 1. Chạy migration & deploy function (một lần)
1. Supabase → SQL Editor → chạy file `supabase/migrations/20261104000000_admin_devices.sql`.
2. Deploy 2 function đã sửa: `create-order` và `notify-admin-new-order`
   (`supabase functions deploy create-order notify-admin-new-order`).

## 2. Tạo Firebase (miễn phí) để có thông báo khi app tắt
1. https://console.firebase.google.com → **Add project** (tên bất kỳ, tắt Analytics cũng được).
2. **Project settings → Your apps → Android**: package name = `com.tqmaster.adminalert` → tải `google-services.json`
   → đặt vào `android/app/google-services.json` (đã được `.gitignore`, không bị commit).
3. **Project settings → Service accounts → Generate new private key** → tải file JSON.
4. Đưa key vào Supabase secret (không commit):
   `supabase secrets set FCM_SERVICE_ACCOUNT="$(cat service-account.json)"`
   (PowerShell: `supabase secrets set FCM_SERVICE_ACCOUNT=(Get-Content service-account.json -Raw)`).

## 3. Cài công cụ build
- **Android Studio** mới nhất (kèm Android SDK) và **JDK 21** (Capacitor 8 yêu cầu; máy bạn đang có JDK 17).
- Đặt biến môi trường `JAVA_HOME` trỏ tới JDK 21.

## 4. Tạo keystore riêng (giữ bí mật, sao lưu!)
```
keytool -genkeypair -v -keystore tqmaster-admin.jks -alias tqmaster -keyalg RSA -keysize 2048 -validity 10000
```
Tạo `android/keystore.properties` (đã `.gitignore`):
```
storeFile=../../tqmaster-admin.jks
storePassword=MẬT_KHẨU
keyAlias=tqmaster
keyPassword=MẬT_KHẨU
```

## 5. Build & cài lên máy
```
npm run android:sync
cd android
./gradlew assembleRelease
```
APK nằm ở `android/app/build/outputs/apk/release/app-release.apk`.
Nối điện thoại (bật USB debugging) rồi `adb install -r app-release.apk`, hoặc copy file sang máy và mở.
**Không upload APK ở bất kỳ đâu.**

## 6. Thiết lập trên điện thoại
1. Mở app → đăng nhập tài khoản admin → máy được **liên kết**; xác thực vân tay/PIN.
2. Cho phép **Thông báo**. Tắt tối ưu pin cho app (Cài đặt → Ứng dụng → TQMaster Admin → Pin → Không hạn chế),
   bật "Tự khởi động" với Xiaomi/Oppo/Vivo.
3. Vào **Cài đặt → Gửi thông báo thử** để nghe chuông + giọng đọc.
4. Cài sẵn giọng đọc tiếng Việt (Google Text-to-Speech) nếu máy chưa có.

## Đổi máy / mất máy
Web admin → **Cài đặt hệ thống → Thiết bị app → Gỡ liên kết**. Mất máy: gỡ liên kết + đổi mật khẩu admin.

## Bật lại email (tuỳ chọn)
Mặc định email tắt. Bật: `update system_settings set value='true' where key='admin_email_enabled';`
