# Feature Specification: Live Chat Support (User ↔ Admin)

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.0)

---

## 1. Overview
Hệ thống Hỗ trợ Trực tuyến Real-time (`ChatWidget.tsx` và `/admin/chat`) kết nối hai chiều tức thời giữa học viên và ban quản trị TQMaster, giải quyết thắc mắc về tài liệu, hỗ trợ thanh toán và xử lý sự cố trong quá trình ôn thi mà không cần rời khỏi nền tảng.

Hệ thống hoạt động dựa trên cơ sở dữ liệu Supabase Realtime (kênh `postgres_changes`), bao gồm widget nổi (Floating Widget) ở góc dưới màn hình học viên và trung tâm điều phối tin nhắn đa kênh (Multi-conversation Workspace) tại trang quản trị viên, hỗ trợ gửi ảnh đính kèm, đếm số tin chưa đọc thời gian thực và quản trị xóa tin nhắn an toàn.

---

## 2. User Scenarios & Testing

### User Story 1 – Học viên gửi tin nhắn và nhận phản hồi tức thì (Priority: P1)
Là một học viên đã đăng nhập, tôi muốn mở cửa sổ chat nổi để nhắn tin hỏi admin và nhận được câu trả lời ngay tại trang đang học.

**Acceptance Scenarios**:
1. **Given** học viên đăng nhập và đang ở bất kỳ trang nào (ngoại trừ trang admin), **When** click vào biểu tượng Chat nổi (góc dưới bên phải), **Then** cửa sổ chat (`ChatWindow`) mở ra với danh sách tin nhắn cũ và ô nhập văn bản.
2. **Given** học viên nhập tin nhắn và bấm Gửi (hoặc nhấn Enter), **Then** tin nhắn được lưu vào `chat_messages` và hiển thị ngay trên màn hình với trạng thái "Đã gửi".
3. **Given** Quản trị viên trả lời từ trang quản trị, **When** tin nhắn được tạo, **Then** tin nhắn mới của admin xuất hiện real-time trong cửa sổ chat của học viên kèm âm thanh/hiệu ứng thông báo.
4. **Given** học viên đang đóng cửa sổ chat, **When** admin nhắn tin tới, **Then** nút icon chat nổi hiển thị huy hiệu (Badge) màu đỏ với số lượng tin nhắn chưa đọc.

### User Story 2 – Quản trị viên xử lý hội thoại đa học viên (Priority: P1)
Là một Quản trị viên, tôi muốn có không gian làm việc chuyên nghiệp tại `/admin/chat` để theo dõi và trả lời nhiều học viên cùng lúc.

**Acceptance Scenarios**:
1. **Given** Quản trị viên truy cập `/admin/chat`, **When** trang tải, **Then** cột bên trái hiển thị danh sách tất cả các cuộc trò chuyện (`conversations`), sắp xếp theo tin nhắn mới nhất lên đầu kèm chỉ số tin nhắn chưa đọc.
2. **Given** Quản trị viên nhấp vào một cuộc trò chuyện, **When** khung chat bên phải mở ra, **Then** toàn bộ lịch sử tin nhắn hiển thị và tất cả tin nhắn của học viên trong hội thoại đó tự động được đánh dấu `is_read = true`.
3. **Given** Quản trị viên nhập phản hồi và gửi, **Then** học viên nhận được tin nhắn tức thì qua Supabase Realtime.

### User Story 3 – Gửi hình ảnh minh họa qua Chat (Priority: P2)
Là học viên hoặc quản trị viên, tôi muốn gửi ảnh chụp màn hình lỗi hoặc biên lai thanh toán trực tiếp qua chat.

**Acceptance Scenarios**:
1. **Given** người dùng ở trong cửa sổ chat, **When** bấm icon đính kèm ảnh (Image) và chọn file ảnh (PNG, JPG, WebP tối đa 5MB), **Then** ảnh được upload lên Supabase Storage bucket `chat-attachments`.
2. **When** ảnh tải lên hoàn tất, **Then** tin nhắn được gửi đi kèm đường dẫn ảnh `image_url` và hiển thị xem trước sắc nét trong bong bóng chat.
3. **Given** một hình ảnh trong tin nhắn, **When** người dùng nhấp vào ảnh, **Then** ảnh mở rộng ở chế độ xem toàn cảnh (Lightbox zoom).

### User Story 4 – Quản trị viên xóa tin nhắn (Priority: P2)
Là một Quản trị viên, tôi muốn xóa tin nhắn vi phạm, spam hoặc nội dung không phù hợp.

**Acceptance Scenarios**:
1. **Given** Quản trị viên đang xem hội thoại, **When** bấm icon Thùng rác trên một tin nhắn và xác nhận, **Then** tin nhắn bị xóa khỏi bảng `chat_messages` (Hard delete).
2. **Given** tin nhắn vừa bị xóa, **When** học viên đang mở cửa sổ chat, **Then** tin nhắn đó biến mất tức thời khỏi màn hình học viên thông qua sự kiện Realtime `DELETE`.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Cung cấp Floating Chat Widget (`ChatWidget.tsx`) hiển thị toàn cục trên layout người dùng (`UserLayout`), ẩn trên giao diện Quản trị viên (`!isAdmin`).
- **FR-002**: Tự động khởi tạo hoặc tìm kiếm cuộc trò chuyện tương ứng của học viên trong bảng `conversations` khi mở chat.
- **FR-003**: Lưu trữ tin nhắn trong bảng `chat_messages` với các trường: `conversation_id`, `sender_id`, `sender_role` (`'user'` | `'admin'`), `content`, `image_url`, `is_read`, `created_at`.
- **FR-004 (Realtime Sync)**: Sử dụng hook `useChat.ts` đăng ký kênh Supabase Realtime theo dõi cả 3 sự kiện `INSERT`, `UPDATE`, `DELETE` trên bảng `chat_messages` để đồng bộ trạng thái hai chiều.
- **FR-005 (Unread Counter)**: `AppContext` cung cấp hàm `refreshUnreadChatCount` theo dõi tổng số tin nhắn chưa đọc từ học viên (`sender_role = 'user' AND is_read = false`) để hiển thị thông báo trên menu Admin.
- **FR-006 (Upload ảnh chat)**: Tải ảnh lên Supabase Storage bucket `chat-attachments` với quy chuẩn nén ảnh và giới hạn dung lượng 5MB.
- **FR-007 (Bảo trì tự động)**: Edge Function `cleanup-chat-messages` định kỳ ghi log bảo trì vào bảng `chat_cleanup_logs`.

### Key Entities

**Table: conversations**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Khóa chính cuộc trò chuyện |
| `user_id` | uuid | Học viên tham gia (tham chiếu `profiles.id`) |
| `created_at` | timestamptz | Thời điểm khởi tạo |
| `updated_at` | timestamptz | Thời điểm có tin nhắn mới nhất |

**Table: chat_messages**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Khóa chính tin nhắn |
| `conversation_id` | uuid | Tham chiếu `conversations.id` |
| `sender_id` | uuid | Người gửi (tham chiếu `profiles.id`) |
| `sender_role` | text | Vai trò người gửi: `'user'` hoặc `'admin'` |
| `content` | text | Nội dung văn bản |
| `image_url` | text | Đường dẫn ảnh đính kèm (nullable) |
| `is_read` | bool | Trạng thái đã xem tin nhắn |
| `created_at` | timestamptz | Thời gian gửi |

**Table: chat_cleanup_logs**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Khóa chính log dọn dẹp |
| `deleted_count` | int | Số lượng tin nhắn được xử lý |
| `executed_at` | timestamptz | Thời điểm thực thi |

### Key Files
- `src/components/chat/ChatWidget.tsx` — Nút chat nổi và logic hiển thị cửa sổ chat
- `src/components/chat/ChatWindow.tsx` — Cửa sổ chat học viên (danh sách tin nhắn, đính kèm ảnh, gửi tin)
- `src/components/chat/ChatMessage.tsx` — Bong bóng tin nhắn, hỗ trợ ảnh và định dạng thời gian
- `src/hooks/useChat.ts` — Custom hook quản lý logic kết nối Supabase Realtime và state tin nhắn
- `src/pages/admin/AdminChat.tsx` — Không gian làm việc quản trị chat đa hội thoại
- `supabase/functions/cleanup-chat-messages/index.ts` — Microservice dọn dẹp và bảo trì hệ thống chat

---

## 4. Success Criteria
- **SC-001**: Tin nhắn gửi và hiển thị trên màn hình đối phương trong < 200ms qua kết nối Realtime.
- **SC-002**: Tự động kết nối lại (Auto-reconnect) khi mạng học viên chập chờn mà không làm mất lịch sử trò chuyện.
- **SC-003**: Trạng thái tin nhắn đã đọc (`is_read`) đồng bộ chính xác 100% giữa hai bên.
