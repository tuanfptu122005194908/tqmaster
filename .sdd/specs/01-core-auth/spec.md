# Feature Specification: Core Authentication & Profile

**Feature Branch**: `[main]`
**Status**: ✅ Implemented

---

## Overview

TQMaster sử dụng Supabase Auth làm nền tảng xác thực. Hỗ trợ 3 luồng đăng nhập:
1. **Email/Password** (dành cho tài khoản do Admin tạo thủ công)
2. **Google OAuth** (Google One Tap + Redirect)
3. **OTP qua Email** (magic link / OTP)

---

## User Scenarios & Testing

### User Story 1 – Đăng nhập Email/Password (Priority: P1)
Là một user được Admin tạo tài khoản, tôi muốn đăng nhập bằng email + mật khẩu.

**Acceptance Scenarios**:
1. **Given** user chưa đăng nhập trên `/auth`, **When** nhập email + password hợp lệ, **Then** được redirect vào `/` với session active.
2. **Given** user mới được admin tạo lần đầu, **When** đăng nhập thành công, **Then** bị bắt đổi mật khẩu (forced reset via `ResetPasswordPage` with `forced=true`).

### User Story 2 – Đăng nhập Google OAuth (Priority: P1)
Là một user, tôi muốn đăng nhập bằng Google để không cần nhớ mật khẩu.

**Acceptance Scenarios**:
1. **Given** user nhấn "Đăng nhập bằng Google", **When** hoàn tất OAuth flow, **Then** session được tạo và redirect về `/`.
2. **Given** Google OAuth callback trên domain sai (redirect_uri mismatch), **When** hash chứa `access_token`, **Then** script redirect về `tqmaster.vercel.app` để xử lý token.

### User Story 3 – Xác thực Email OTP (Priority: P1)
Là một user, tôi muốn xác thực email để kích hoạt tài khoản.

**Acceptance Scenarios**:
1. **Given** user vừa đăng ký, **When** email chưa xác thực, **Then** bị hiển thị `VerifyEmailPage` thay vì app chính.
2. **Given** user click link xác thực, **When** token hợp lệ, **Then** email được đánh dấu `emailVerified = true` và vào app.

### User Story 4 – Đặt lại mật khẩu (Priority: P2)
**Acceptance Scenarios**:
1. **Given** user nhấn "Quên mật khẩu", **When** nhập email, **Then** Supabase gửi link reset.
2. **Given** user click link reset, **When** `passwordRecovery = true` trong AppContext, **Then** `ResetPasswordPage` hiển thị ngay (trước toàn bộ router).

### User Story 5 – Quản lý Profile (Priority: P2)
**Acceptance Scenarios**:
1. **Given** user trên `/profile`, **When** cập nhật avatar/tên/SĐT, **Then** bảng `profiles` được UPDATE.
2. **Given** user upload avatar, **When** chọn file ảnh, **Then** ảnh được upload lên Supabase Storage bucket `avatars`.

---

## Requirements

### Functional Requirements
- **FR-001**: Hỗ trợ đăng nhập qua Email/Password, Google OAuth, OTP Email.
- **FR-002**: Tài khoản tạo bởi admin có `created_by_admin: true` trong metadata → bypass trigger kiểm tra Google-only.
- **FR-003**: Sau lần đăng nhập đầu tiên của tài khoản admin-tạo, bắt buộc đổi mật khẩu (`must_change_password: true`).
- **FR-004**: Luồng `passwordRecovery` được xử lý trước router — hiển thị `ResetPasswordPage` ngay khi `RECOVERY` event được nhận.
- **FR-005**: Email verification gate: nếu `userEmail` tồn tại nhưng `emailVerified = false` → hiển thị `VerifyEmailPage`.
- **FR-006**: Avatar upload lên bucket `avatars` trong Supabase Storage.
- **FR-007**: `AppContext` expose: `profile`, `isAdmin`, `authLoading`, `emailVerified`, `userEmail`, `passwordRecovery`, `mustChangePassword`.

### Key Entities

**Table: profiles**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | = auth.users.id |
| `role` | text | `user` hoặc `admin` |
| `full_name` | text | |
| `avatar_url` | text | URL từ Supabase Storage |
| `phone_number` | text | |
| `email` | text | |
| `student_code` | text | |
| `username` | text | |

### Key Files
- `src/lib/AppContext.tsx` — Global auth state
- `src/pages/AuthPage.tsx` — Login UI (Email, Google, OTP tabs)
- `src/pages/VerifyEmailPage.tsx` — Email verification gate
- `src/pages/ResetPasswordPage.tsx` — Password reset (normal & forced)
- `src/pages/user/ProfilePage.tsx` — Profile management
- `src/App.tsx` — Auth guards (ProtectedRoute), boot ordering

---

## Success Criteria
- **SC-001**: Login flow hoàn tất < 30 giây.
- **SC-002**: Google OAuth hoạt động trên production domain `tqmaster.vercel.app`.
- **SC-003**: Email verification gate ngăn user vào app khi chưa verify.
- **SC-004**: Forced password change block user đến khi đổi xong.
