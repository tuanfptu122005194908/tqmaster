# Feature Specification: Core Authentication & Profile

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.0)

---

## 1. Overview

TQMaster sử dụng Supabase Auth làm nền tảng xác thực kết hợp hệ thống kiểm soát quyền truy cập và bảo mật tài khoản học viên. Hệ thống hỗ trợ 3 luồng đăng nhập chính:
1. **Email/Password** (dành cho tài khoản do Admin tạo thủ công, có cơ chế bắt buộc đổi mật khẩu lần đầu).
2. **Google OAuth** (Google One Tap + Redirect với bộ xử lý điều hướng callback tự động về production domain `tqmaster.vercel.app`).
3. **OTP qua Email** (Magic link / mã xác thực 6 số gửi qua Edge Function).

Đặc biệt, hệ thống tích hợp **Cơ chế chống chia sẻ tài khoản (Single-Device Session Enforcement / Anti-Account Sharing)** cấp tab trình duyệt, sử dụng Supabase Realtime để ngăn chặn việc nhiều người dùng cùng lúc trên 1 tài khoản học phí.

---

## 2. User Scenarios & Testing

### User Story 1 – Đăng nhập Email/Password (Priority: P1)
Là một user được Admin tạo tài khoản, tôi muốn đăng nhập bằng email + mật khẩu.

**Acceptance Scenarios**:
1. **Given** user chưa đăng nhập trên `/auth`, **When** nhập email + password hợp lệ, **Then** được redirect vào `/` với session active.
2. **Given** user mới được admin tạo lần đầu (`must_change_password: true`), **When** đăng nhập thành công, **Then** bị bắt đổi mật khẩu (forced reset via `ResetPasswordPage` với thuộc tính `forced={true}`).

### User Story 2 – Đăng nhập Google OAuth (Priority: P1)
Là một user, tôi muốn đăng nhập bằng Google để không cần nhớ mật khẩu.

**Acceptance Scenarios**:
1. **Given** user nhấn "Đăng nhập bằng Google", **When** hoàn tất OAuth flow, **Then** session được tạo và redirect về `/`.
2. **Given** Google OAuth callback trên domain phụ/sai (redirect_uri mismatch), **When** URL hash chứa `access_token`, **Then** script tự động redirect về `tqmaster.vercel.app` để bảo toàn token và session.

### User Story 3 – Xác thực Email OTP (Priority: P1)
Là một user, tôi muốn xác thực email để kích hoạt tài khoản trước khi đặt hàng hoặc làm bài thi.

**Acceptance Scenarios**:
1. **Given** user vừa đăng ký, **When** email chưa xác thực (`email_confirmed_at` null), **Then** giao diện bị chặn bởi `VerifyEmailPage` với giới hạn gửi lại mã OTP (cooldown 60s, tối đa 5 lần/giờ).
2. **Given** user nhập đúng OTP hoặc click link xác thực, **When** token hợp lệ, **Then** email được đánh dấu `emailVerified = true` và cho phép truy cập toàn bộ ứng dụng.

### User Story 4 – Đặt lại mật khẩu (Priority: P2)
Là một user quên mật khẩu, tôi muốn nhận email khôi phục mật khẩu để lấy lại tài khoản.

**Acceptance Scenarios**:
1. **Given** user nhấn "Quên mật khẩu", **When** nhập email, **Then** Supabase gửi link reset qua email.
2. **Given** user click link reset, **When** nhận sự kiện `PASSWORD_RECOVERY` trong `AppContext`, **Then** `ResetPasswordPage` hiển thị ngay lập tức (ưu tiên trước toàn bộ router thông thường).

### User Story 5 – Quản lý Hồ sơ cá nhân (Profile) (Priority: P2)
Là một user, tôi muốn cập nhật thông tin cá nhân và ảnh đại diện.

**Acceptance Scenarios**:
1. **Given** user tại trang `/profile`, **When** cập nhật Họ tên, Số điện thoại hoặc Mã sinh viên, **Then** bảng `profiles` được UPDATE thành công.
2. **Given** user chọn ảnh đại diện mới, **When** tải file ảnh (jpg, png, webp), **Then** ảnh được upload lên Supabase Storage bucket `avatars` và URL được ghi nhận vào `profiles.avatar_url`.

### User Story 6 – Kiểm soát phiên duy nhất & Chống chia sẻ tài khoản (Priority: P1)
Là hệ thống TQMaster, tôi muốn chỉ cho phép 1 thiết bị/tab đăng nhập tại một thời điểm để bảo vệ bản quyền tài liệu ôn thi.

**Acceptance Scenarios**:
1. **Given** học viên A đang học trên Thiết bị 1 (hoặc Tab 1), **When** tài khoản của A đăng nhập trên Thiết bị 2 (hoặc Tab 2), **Then** Thiết bị 2 upsert bản ghi mới vào bảng `active_sessions` (`latest login wins`).
2. **Given** bản ghi `active_sessions` bị thay đổi, **When** kênh Realtime `active-session-${userId}-${sessionId}` nhận payload, **Then** Thiết bị 1 tự động bị đá (`kickSelf`), hiển thị thông báo: *"Tài khoản của bạn vừa đăng nhập trên một thiết bị khác. Bạn đã bị đăng xuất."* và chuyển hướng về màn hình đăng nhập.
3. **Given** học viên chuyển qua lại các tab trình duyệt, **When** quay lại tab sau một thời gian dài, **Then** sự kiện `visibilitychange` tự động đối soát `session_id` hiện tại với bảng `active_sessions` để xử lý ngay nếu đã bị đăng xuất ở tab khác.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Hỗ trợ 3 luồng xác thực linh hoạt: Email/Password, Google OAuth 2.0 và Email OTP.
- **FR-002**: Tài khoản tạo bởi admin có metadata `created_by_admin: true` → bypass trigger chặn đăng ký email tự do trong PostgreSQL.
- **FR-003**: Ép đổi mật khẩu lần đầu: Khi `must_change_password: true`, router chặn mọi đường dẫn và hiển thị `ResetPasswordPage` ở chế độ `forced`.
- **FR-004**: Luồng `passwordRecovery` được ưu tiên xử lý trước router khi nhận event `SIGNED_IN` / `PASSWORD_RECOVERY`.
- **FR-005**: Cổng xác thực email (Email verification gate): Nếu người dùng có `userEmail` nhưng `emailVerified = false`, hệ thống khóa toàn bộ view và hiển thị `VerifyEmailPage`.
- **FR-006**: Tải ảnh đại diện người dùng lên bucket `avatars` với cơ chế sinh tên file UUID an toàn.
- **FR-007**: `AppContext` đóng vai trò Single Source of Truth, cung cấp: `profile`, `isAdmin`, `authLoading`, `emailVerified`, `userEmail`, `passwordRecovery`, `mustChangePassword`, `refreshAuthUser`.
- **FR-008 (Single-Session Enforcement)**: Tạo định danh phiên `sessionId` duy nhất trong `sessionStorage` (fallback `localStorage` nếu bị chặn) bằng `crypto.randomUUID()`.
- **FR-009 (Realtime Collision Detection)**: Khi user đăng nhập, upsert vào bảng `active_sessions` với `onConflict: 'user_id'`. Đăng ký kênh Supabase Realtime với bộ lọc `user_id=eq.${userId}` và tên kênh độc nhất `active-session-${userId}-${sessionId}`.
- **FR-010 (Tab Visibility Check)**: Lắng nghe sự kiện `document.addEventListener('visibilitychange')` để kiểm tra tức thì tính hợp lệ của phiên khi user quay lại tab.

### Key Entities

**Table: profiles**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Khóa chính, tham chiếu `auth.users.id` |
| `role` | text | `'user'` hoặc `'admin'` |
| `full_name` | text | Họ và tên học viên |
| `avatar_url` | text | Đường dẫn ảnh từ bucket `avatars` |
| `phone_number` | text | Số điện thoại liên hệ |
| `email` | text | Email tài khoản |
| `student_code` | text | Mã sinh viên FPT (VD: SE180000) |
| `username` | text | Tên đăng nhập |

**Table: active_sessions**
| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | Khóa chính (Primary Key), tham chiếu `auth.users.id` |
| `session_id` | text | Chuỗi UUID phiên làm việc hiện tại của tab/thiết bị |
| `user_agent` | text | Thông tin trình duyệt/thiết bị đăng nhập |
| `updated_at` | timestamptz | Thời điểm phiên được cập nhật mới nhất |

### Key Files
- `src/lib/AppContext.tsx` — Global auth state, single-session enforcement (`getSessionId`, `enforceSingleSession`, `kickSelf`)
- `src/pages/AuthPage.tsx` — Giao diện đăng nhập (Tab Email, Google OAuth, OTP)
- `src/pages/VerifyEmailPage.tsx` — Màn hình bắt buộc xác thực mã OTP email
- `src/pages/ResetPasswordPage.tsx` — Màn hình đặt lại mật khẩu (chế độ bình thường và forced)
- `src/pages/user/ProfilePage.tsx` — Quản lý thông tin cá nhân và upload avatar
- `src/App.tsx` — Điều phối router, Auth guards (`ProtectedRoute`), bảo vệ quyền admin

---

## 4. Success Criteria
- **SC-001**: Thời gian hoàn tất quy trình đăng nhập < 30 giây.
- **SC-002**: Google OAuth hoạt động ổn định trên production domain `tqmaster.vercel.app`.
- **SC-003**: Cổng xác thực email ngăn chặn 100% học viên chưa verify truy cập vào các tính năng mua tài liệu hoặc thi thử.
- **SC-004**: Ép đổi mật khẩu ngăn chặn học viên truy cập vào các tính năng khác cho đến khi hoàn thành đổi mật khẩu.
- **SC-005**: Cơ chế Single-Session phản hồi và đăng xuất thiết bị cũ trong vòng < 500ms khi phát hiện phiên đăng nhập mới.
