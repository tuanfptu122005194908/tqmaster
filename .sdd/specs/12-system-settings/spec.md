---
id: "12-system-settings"
title: "User Story 12 - Quản lý Cài đặt Hệ thống (System Settings)"
status: "IMPLEMENTED"
created_date: "2026-03-12"
---

# 1. Overview
Trang Cài đặt hệ thống (`/admin/settings`) cung cấp cho Quản trị viên khả năng kiểm soát tập trung toàn bộ các thông số vận hành của nền tảng TQMaster mà không cần can thiệp mã nguồn hay deploy lại ứng dụng.

Hệ thống quản lý các nhóm cấu hình cốt lõi:
1. **Thông tin nhận diện website**: Tên nền tảng (`site_name`).
2. **Thông tin thanh toán ngân hàng (VietQR Động)**: Tên ngân hàng (`bank_name`), Số tài khoản (`bank_account`), Tên chủ tài khoản (`bank_owner`). 
3. **Kênh hỗ trợ & Mạng xã hội**: Thông tin liên hệ (`contact_info`), Đường dẫn Facebook (`facebook_url`), và Kênh YouTube (`youtube_url`).

Toàn bộ dữ liệu được lưu trữ linh hoạt theo cặp khóa-giá trị (Key-Value) trong bảng `system_settings` và được nạp vào bộ nhớ dùng chung qua `AppContext`.

---

# 2. User Scenarios

### User Story 1 – Cấu hình tài khoản ngân hàng & Tự động tạo VietQR (Priority: P1)
Là một Quản trị viên, tôi muốn cập nhật số tài khoản ngân hàng và hệ thống tự động cập nhật mã QR cho toàn bộ trang checkout.

**Acceptance Scenarios**:
1. **Given** Quản trị viên truy cập `/admin/settings`, **When** trang tải, **Then** các trường thông tin ngân hàng hiển thị đầy đủ.
2. **Given** Quản trị viên thay đổi "Tên ngân hàng" và "Số tài khoản", **When** đang gõ, **Then** khung xem trước (Preview) bên dưới lập tức hiển thị mã VietQR tĩnh tương ứng với thông tin vừa gõ (Sử dụng API `img.vietqr.io`).
3. **Given** thông tin đã đúng, **When** nhấn "Lưu cấu hình", **Then** các bản ghi được `upsert` vào bảng `system_settings`. Học viên khi vào `/cart` sẽ lập tức quét được mã QR với thông tin ngân hàng mới.

### User Story 2 – Quản lý liên kết Mạng xã hội & Hỗ trợ (Priority: P2)
Là một Quản trị viên, tôi muốn thay đổi đường dẫn Fanpage hoặc Kênh YouTube khi có đợt chiến dịch mới mà không phải nhờ lập trình viên sửa code.

**Acceptance Scenarios**:
1. **Given** Quản trị viên ở section "Thông tin website", **When** nhập đường dẫn Facebook mới và nhấn "Lưu cấu hình", **Then** khóa `facebook_url` được cập nhật.
2. **Given** học viên nhấp vào icon Facebook trên `TopNav`, **Then** trình duyệt mở đúng liên kết mới được cấu hình.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Global Settings Form)**: Form cài đặt sử dụng UI Dashboard chuẩn (Card, Icons). Có nút "Lưu cấu hình" ở cả Header và Footer, tự động disabled khi đang gọi API (`saving`).
- **FR-002 (Upsert Logic)**: Khi lưu, frontend thực hiện song song mảng lệnh `supabase.from('system_settings').upsert()` với danh sách các biến định trước (`KEYS`).
- **FR-003 (Dynamic VietQR Preview)**: Không hỗ trợ upload ảnh tĩnh cho QR nữa, mà bắt buộc sử dụng API sinh VietQR tự động dựa trên `bank_name`, `bank_account`, `bank_owner` để tránh sai sót ảnh một đằng tài khoản một nẻo.
- **FR-004 (Global Context Injection)**: Mảng settings này được fetch 1 lần lúc boot ứng dụng ở `AppContext.tsx` và phân phát xuống mọi Component cần thiết.
- **FR-005 (Bảo mật)**: UI `/admin/settings` bị ẩn và API được bảo vệ nghiêm ngặt qua RLS, chỉ user có `role = 'admin'` mới có thể UPSERT.

### Key Entities
**Table: system_settings**
| Column | Type | Notes |
|---|---|---|
| `key` | text | Khóa cấu hình (`bank_name`, `facebook_url`...) (PK) |
| `value` | text | Giá trị cấu hình |
| `updated_at` | timestamptz | Thời điểm cập nhật cuối cùng |
| `updated_by` | uuid | ID quản trị viên thao tác |

### Key Files
- `src/pages/admin/AdminSettings.tsx` — Giao diện form cài đặt chính.
- `src/lib/AppContext.tsx` — Nạp global settings.

---

## 4. Success Criteria
- **SC-001**: Lưu toàn bộ hệ thống settings mượt mà, có báo Toast notification thành công.
- **SC-002**: VietQR preview render tức thời dựa trên dữ liệu ngân hàng đang gõ trên form.
- **SC-003**: Không có logic upload/lưu trữ ảnh thủ công rườm rà, ngăn chặn triệt để lỗi "Lưu sai hình ảnh mã QR".
