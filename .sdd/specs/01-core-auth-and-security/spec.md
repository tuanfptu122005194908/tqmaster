# Feature Specification: Core Authentication & Security Platform

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.1)

---

## 1. Overview

TQMaster Platform cung cấp một hệ thống Authentication & Security đồng nhất, kết hợp xác thực Supabase Auth, kiểm soát phân quyền (RBAC), kiểm soát phiên duy nhất (Single-Device Session Enforcement), giới hạn tài nguyên, cũng như bảo vệ toàn cục bằng Global Error Boundary và Vercel Security Headers.

Hệ thống cốt lõi (Core Platform) này giải quyết 3 bài toán chính:
1. **Xác thực đa kênh (Multi-channel Auth):** Email/Password, Google OAuth 2.0 (One Tap + Redirect), OTP Magic Link.
2. **Bảo mật bản quyền tài nguyên (Anti-Account Sharing):** Ép duy nhất 1 phiên đăng nhập tại một thời điểm qua Supabase Realtime `active_sessions`.
3. **An toàn hệ thống (System Safety):** Đảm bảo website không bị crash trắng trang nhờ `GlobalErrorBoundary` và ngăn chặn tấn công mạng bằng các Headers bảo mật trên Vercel.

---

## 2. User Scenarios & Testing

### User Story 1 – Đăng nhập đa phương thức & Bắt buộc đổi mật khẩu (Priority: P1)
Là một học viên, tôi muốn có thể đăng nhập linh hoạt nhưng vẫn đảm bảo tính bảo mật khi tài khoản được cấp từ Admin.

**Acceptance Scenarios**:
1. **Given** học viên sử dụng Google OAuth, **When** hoàn tất quy trình, **Then** hệ thống tự tạo tài khoản (nếu chưa có) và chuyển hướng về trang chủ với session hợp lệ.
2. **Given** học viên sử dụng tài khoản do Admin cấp (`must_change_password: true`), **When** đăng nhập lần đầu thành công, **Then** hệ thống khóa toàn bộ các route và ép buộc chuyển sang `ResetPasswordPage` (chế độ forced).

### User Story 2 – Cổng xác thực Email OTP (Priority: P1)
Là hệ thống, tôi muốn đảm bảo tất cả email đều là thật trước khi cho phép mua tài liệu.

**Acceptance Scenarios**:
1. **Given** học viên vừa đăng ký bằng email, **When** `email_confirmed_at` null, **Then** người dùng bị khóa ở `VerifyEmailPage` và phải nhập đúng mã 6 số gửi qua OTP.
2. **Given** người dùng nhập đúng mã, **Then** cờ `emailVerified` được kích hoạt ở `AppContext` và mở khóa các tính năng hệ thống.

### User Story 3 – Chống chia sẻ tài khoản (Single-Session Enforcement) (Priority: P1)
Là hệ thống, tôi muốn bảo vệ tài liệu bằng cách chỉ cho phép mỗi tài khoản đăng nhập trên 1 thiết bị/tab trình duyệt.

**Acceptance Scenarios**:
1. **Given** học viên A đang mở web ở tab 1, **When** học viên A đăng nhập trên tab 2 (hoặc chia sẻ cho bạn B đăng nhập ở máy khác), **Then** Tab 2 ghi đè `active_sessions` (latest login wins).
2. **Given** bảng `active_sessions` bị ghi đè, **When** Supabase Realtime gửi broadcast, **Then** Tab 1 nhận tín hiệu, tự động gọi `kickSelf()` đăng xuất, hiển thị thông báo "Tài khoản của bạn vừa đăng nhập trên một thiết bị khác" và đá về trang đăng nhập.
3. **Given** Tab 1 ở trạng thái ngủ (background), **When** người dùng quay lại tab (`visibilitychange`), **Then** hệ thống lập tức check lại `session_id` để kick.

### User Story 4 – An toàn giao diện (Global Error Boundary) (Priority: P2)
Là một người dùng, khi gặp lỗi ứng dụng, tôi muốn thấy giao diện thông báo thân thiện thay vì màn hình trắng tinh.

**Acceptance Scenarios**:
1. **Given** một Component bất kỳ quăng lỗi (throw Error), **When** React bắt đầu render, **Then** `GlobalErrorBoundary` bắt được lỗi, hiển thị Fallback UI "Đã xảy ra sự cố!" với nút "Tải lại trang" và "Về trang chủ".

### User Story 5 – Bảo mật Header (Vercel Security) (Priority: P2)
Là một chuyên gia bảo mật, tôi muốn ứng dụng chống lại các lỗ hổng Scanner (XSS, Clickjacking, MIME sniffing).

**Acceptance Scenarios**:
1. **Given** một request HTTP tới `tqmaster.vercel.app`, **Then** server response trả về các header `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy`, và `X-Frame-Options: DENY`.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Auth flows)**: Hỗ trợ luồng `signInWithPassword`, `signInWithOAuth` (Google), và `verifyOtp`.
- **FR-002 (Context API)**: `AppContext` là Nguồn Chân Lý (SSOT) chứa state `profile`, `isAdmin`, `authLoading`, `emailVerified`, `mustChangePassword`, và khởi tạo các listener Realtime.
- **FR-003 (Single-Session)**: Sử dụng `crypto.randomUUID()` để định danh `session_id` trên client. Khi login, upsert vào `active_sessions`. Kênh Realtime `active-session-${userId}-${sessionId}` luôn rình rập để `kickSelf`.
- **FR-004 (Error Boundary)**: Component `GlobalErrorBoundary` (kế thừa `React.Component`) bọc ngoài cùng `<App />` trong `main.tsx` hoặc cấp cao nhất `App.tsx`.
- **FR-005 (Security Headers)**: Cấu hình `vercel.json` định nghĩa mảng `headers` với CSP chặt chẽ (`default-src 'self'`), chặn iframe (`DENY`), và chặn mime sniffing (`nosniff`).

### Key Entities

**Table: profiles**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK, ref `auth.users.id` |
| `role` | text | `'user'` hoặc `'admin'` |
| `full_name` | text | Họ và tên |
| `email` | text | Email tài khoản |
| `must_change_password`| bool | Ép đổi mật khẩu (tùy chọn custom metadata) |

**Table: active_sessions**
| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid | PK, ref `auth.users.id` |
| `session_id` | text | Chuỗi UUID của tab/thiết bị đăng nhập gần nhất |
| `user_agent` | text | Thông tin thiết bị |
| `updated_at` | timestamptz | Cập nhật tự động khi upsert |

### Key Files
- `src/lib/AppContext.tsx`: Xử lý logic Auth, Session Enforcement, Realtime Subscription.
- `src/App.tsx`: Điều phối Router, Guard (`ProtectedRoute`, Forced Password Reset).
- `src/pages/AuthPage.tsx`, `VerifyEmailPage.tsx`, `ResetPasswordPage.tsx`: Cụm trang xác thực.
- `src/components/GlobalErrorBoundary.tsx`: Bắt lỗi Fallback UI.
- `vercel.json`: Chứa cấu hình Security Headers.

---

## 4. Success Criteria
- **SC-001**: 100% các phiên đăng nhập bị trùng lặp bị đăng xuất lập tức (<500ms) nhờ Supabase Realtime.
- **SC-002**: Không tồn tại bất kỳ trường hợp nào lỗi UI làm crash toàn bộ web hiện trang trắng.
- **SC-003**: Vượt qua các công cụ quét bảo mật Web Header (Pentest-Tools Scanner) không bị cảnh báo X-Frame hay CSP.
