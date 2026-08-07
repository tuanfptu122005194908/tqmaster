# Feature Specification: Live Chat Support (User ↔ Admin)

**Feature Branch**: `feat/13-live-chat-support`

**Created**: 2026-08-07

**Status**: Draft

**Input**: User yêu cầu tính năng Live Chat trực tiếp. Admin có thể xem, trả lời, và xoá tin nhắn thủ công. Hỗ trợ gửi tin nhắn chứa hình ảnh đính kèm. Khi admin xoá, tin nhắn sẽ bị xoá hẳn khỏi hệ thống. Không có tính năng tự động xoá sau 24h.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - User gửi tin nhắn cho Admin (Priority: P1)

Là một **user đã đăng nhập**, tôi muốn mở cửa sổ chat nổi (floating chat widget) để gửi câu hỏi trực tiếp cho admin, nhằm được hỗ trợ nhanh mà không cần rời khỏi trang hiện tại.

**Why this priority**: Đây là luồng chính của tính năng. Không có P1 thì mọi thứ còn lại vô nghĩa.

**Independent Test**: User gõ tin nhắn → submit → tin nhắn xuất hiện trong bubble chat với trạng thái "đã gửi".

**Acceptance Scenarios**:

1. **Given** user đã đăng nhập và ở bất kỳ trang nào, **When** user click vào floating chat button (góc dưới phải), **Then** cửa sổ chat mở lên, hiển thị lịch sử tin nhắn cũ (nếu có) và ô nhập văn bản.
2. **Given** cửa sổ chat đang mở, **When** user gõ tin nhắn và nhấn Enter hoặc nút Gửi, **Then** tin nhắn được lưu vào DB và hiển thị ngay lập tức trong giao diện với trạng thái "đang chờ phản hồi".
3. **Given** user đã gửi tin nhắn, **When** admin phản hồi, **Then** tin nhắn mới của admin xuất hiện real-time trong cửa sổ chat của user (via Supabase Realtime).
4. **Given** user đang không mở cửa sổ chat, **When** admin gửi tin nhắn mới, **Then** floating button hiển thị badge đỏ với số lượng tin chưa đọc.

---

### User Story 2 - Admin xem và phản hồi tất cả cuộc trò chuyện (Priority: P1)

Là một **admin**, tôi muốn có một trang quản lý chat riêng biệt để xem danh sách tất cả cuộc trò chuyện, chọn từng user và trả lời, nhằm hỗ trợ nhiều khách hàng cùng lúc.

**Why this priority**: Admin là phía nhận và trả lời — đây là lý do tính năng tồn tại.

**Independent Test**: Mở `/admin/chat` → thấy danh sách conversation → click vào 1 conversation → gõ và gửi tin → kiểm tra user nhận được real-time.

**Acceptance Scenarios**:

1. **Given** admin ở `/admin/chat`, **When** có cuộc trò chuyện mới hoặc có tin nhắn mới, **Then** danh sách bên trái hiển thị conversation với badge "Chưa đọc" kèm số lượng tin nhắn chưa đọc.
2. **Given** admin click vào một conversation, **When** conversation mở ra, **Then** toàn bộ lịch sử tin nhắn hiển thị và tất cả tin nhắn của user trong conversation đó được đánh dấu `is_read = true`.
3. **Given** admin đang xem một conversation, **When** admin gõ và gửi tin, **Then** tin nhắn xuất hiện ngay trong giao diện admin và user nhận được real-time.
4. **Given** admin đang xem trang chat, **When** có tin nhắn mới từ bất kỳ user nào, **Then** conversation đó nhảy lên đầu danh sách và hiển thị badge chưa đọc.

---

### User Story 3 - Admin xoá tin nhắn thủ công (Priority: P2)

Là một **admin**, tôi muốn có khả năng xoá bất kỳ tin nhắn nào trong cuộc trò chuyện (xoá vĩnh viễn), để loại bỏ các nội dung không cần thiết hoặc spam. Khi tôi xoá, tin nhắn sẽ biến mất khỏi màn hình của cả tôi và user.

**Why this priority**: Cần thiết để quản trị nội dung, thay thế cho cơ chế tự động xoá cũ.

**Independent Test**: Admin hover vào tin nhắn → bấm xoá → kiểm tra DB thấy tin nhắn đã mất → kiểm tra màn hình user thấy tin nhắn biến mất real-time.

**Acceptance Scenarios**:

1. **Given** admin đang xem một conversation, **When** admin click nút "Xoá" trên một tin nhắn bất kỳ, **Then** tin nhắn đó bị xoá vĩnh viễn khỏi database.
2. **Given** tin nhắn vừa bị xoá, **When** user đang mở cửa sổ chat, **Then** tin nhắn đó biến mất khỏi màn hình của user ngay lập tức (via Supabase Realtime DELETE event).
3. **Given** hệ thống lưu trữ tin nhắn, **When** admin xoá tin nhắn, **Then** không có bản ghi nào bị giữ lại (hard delete), hoàn toàn không thể khôi phục. Hình ảnh đính kèm (nếu có) trên Supabase Storage cũng sẽ bị xóa theo.

---

### User Story 4 - Gửi hình ảnh trong cửa sổ Chat (Priority: P2)

Là một **user hoặc admin**, tôi muốn có thể đính kèm và gửi hình ảnh trong cửa sổ chat, để mô tả vấn đề hoặc hướng dẫn một cách trực quan hơn.

**Why this priority**: Hình ảnh giúp giải quyết vấn đề hỗ trợ khách hàng nhanh hơn nhiều so với chỉ dùng văn bản.

**Independent Test**: Nhấn nút đính kèm ảnh → chọn ảnh → gửi → ảnh hiển thị trong tin nhắn và người kia nhận được ảnh.

**Acceptance Scenarios**:

1. **Given** đang ở giao diện chat, **When** click vào icon đính kèm ảnh, **Then** hệ thống mở hộp thoại chọn file ảnh (png, jpg, jpeg, webp) giới hạn dung lượng (vd 5MB).
2. **Given** đã chọn ảnh, **When** nhấn gửi, **Then** ảnh được upload lên Supabase Storage và lưu URL vào database kèm theo tin nhắn.
3. **Given** tin nhắn có chứa ảnh, **When** hiển thị trong cửa sổ chat, **Then** ảnh được render trực tiếp trong bong bóng chat với kích thước vừa phải, có thể click để xem to (nếu cần).

---

### Edge Cases

### Edge Cases

- Điều gì xảy ra nếu admin đang xem conversation đúng lúc có tin nhắn bị xoá? → Supabase Realtime sẽ trigger `DELETE` event, UI xoá tin nhắn khỏi danh sách hiển thị.
- Điều gì xảy ra nếu mạng bị ngắt khi đang chat? → Supabase Realtime tự reconnect; UI hiển thị indicator "Đang kết nối lại...".
- Tin nhắn chứa chỉ whitespace hoặc rỗng → KHÔNG được gửi, ô nhập bị highlight lỗi.
- Tin nhắn quá dài (> 2000 ký tự) → Bị giới hạn ở phía UI với character counter; backend cũng validate.
- User bị xoá tài khoản → Conversation và messages orphan được xoá cascade theo `profiles`.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống PHẢI cung cấp floating chat widget hiển thị trên tất cả trang của user (sau khi đăng nhập, không hiển thị với admin).
- **FR-002**: Hệ thống PHẢI lưu mỗi tin nhắn với các trường: `id`, `conversation_id`, `sender_id`, `sender_role`, `content`, `is_read`, `created_at`.
- **FR-003**: Hệ thống PHẢI đánh dấu `is_read = true` cho tất cả tin nhắn từ phía user khi admin mở conversation tương ứng.
- **FR-004**: Hệ thống PHẢI đánh dấu `is_read = true` cho tất cả tin nhắn từ phía admin khi user mở chat widget.
- **FR-005**: Hệ thống PHẢI cập nhật `conversations.last_message_at` mỗi khi có tin nhắn mới (thông qua trigger hoặc logic ứng dụng).
- **FR-006**: Hệ thống PHẢI cho phép admin xoá thủ công bất kỳ tin nhắn nào. Khi xoá, thực hiện hard delete trong database.
- **FR-007**: Xoá tin nhắn PHẢI phát ra sự kiện Realtime DELETE để các client đang mở giao diện cập nhật ngay lập tức.
- **FR-008**: Admin PHẢI có trang `/admin/chat` liệt kê tất cả conversations, sắp xếp theo `last_message_at` giảm dần, phân biệt rõ trạng thái đã đọc / chưa đọc.
- **FR-009**: Hệ thống PHẢI sử dụng Supabase Realtime để đẩy tin nhắn mới tức thì (không cần refresh).
- **FR-010**: Tin nhắn PHẢI được giới hạn tối đa 2000 ký tự, validate cả ở frontend và DB constraint.
- **FR-011**: Hệ thống PHẢI cho phép đính kèm ảnh (png, jpg, webp) dung lượng tối đa 5MB. Ảnh phải được upload lên Supabase Storage bucket `chat-images`.

### Non-Functional Requirements

- **NFR-001**: Tin nhắn mới (và thao tác xoá tin nhắn) phải phản hồi trên phía người nhận trong < 1 giây (Supabase Realtime latency).
- **NFR-003**: RLS (Row Level Security) PHẢI đảm bảo user chỉ đọc được conversation của chính mình; admin đọc được tất cả conversations.

### Key Entities

### Key Entities

- **conversations**: `id` (uuid PK), `user_id` (uuid → profiles, NOT NULL), `created_at` (timestamptz), `last_message_at` (timestamptz), `status` (text: `open` | `closed`, default `open`).
- **chat_messages**: `id` (uuid PK), `conversation_id` (uuid → conversations, NOT NULL), `sender_id` (uuid → profiles, NOT NULL), `sender_role` (text: `user` | `admin`), `content` (text, max 2000 chars, nullable if image present), `image_url` (text, nullable), `is_read` (boolean, default `false`), `created_at` (timestamptz).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User gửi tin nhắn và admin nhận được real-time trong < 1 giây (tính từ lúc nhấn gửi đến khi tin hiển thị phía admin).
- **SC-002**: Admin có thể xoá bất kỳ tin nhắn nào; tin nhắn bị xoá biến mất ngay lập tức trên màn hình của user nếu user đang mở chat.
- **SC-003**: Admin mở `/admin/chat` và thấy tất cả conversations được sắp xếp đúng thứ tự (mới nhất lên đầu), với badge unread count chính xác.
- **SC-005**: RLS đảm bảo không có user nào đọc được tin nhắn của user khác — có thể verify bằng cách query trực tiếp Supabase với user token khác nhau.

---

## Assumptions

- Mỗi user chỉ có **một conversation active** với admin tại một thời điểm (1-to-1 chat, không phải group chat).
- Supabase Realtime (`postgres_changes`) được enable cho bảng `chat_messages` và `conversations`.
- "Admin đã đọc" = khi admin click vào conversation trong `/admin/chat` — không cần scroll qua từng tin nhắn.
- Floating chat widget chỉ hiển thị cho **user thông thường** (role `user`), không hiển thị cho admin.
- Responsive/mobile UI nằm trong scope — chat widget hoạt động tốt trên mobile.
- Cho phép đính kèm ảnh, nhưng không hỗ trợ các định dạng file khác (pdf, docx) hay tính năng typing indicator, emoji reactions trong v1 này.
