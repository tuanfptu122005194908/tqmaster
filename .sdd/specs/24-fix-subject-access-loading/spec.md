# Fix Subject Access Loading

Feature Branch: `fix/subject-access-loading`
Status: Implemented — approved by user on 2026-10-22 ("tiến hành đi"); production data verification pending authenticated access
Date: 2026-10-22 (Asia/Saigon)

## 1. Overview

Nhiều học viên đã mua môn bị hiển thị mất quyền; đơn hàng vẫn được duyệt và trang Người dùng hiện `00 môn`. Người dùng xác nhận không xóa đơn. Điều tra tập trung vào các luồng tự động tải quyền, không quy kết thao tác xóa đơn.

Đã xác nhận hai lỗi trong mã nguồn bằng cách thực thi chính các hàm hiện tại với Supabase giả lập, không ghi dữ liệu thật:

- `src/lib/AppContext.tsx:151-158`: lỗi đọc `user_subjects` chỉ được ghi console, sau đó `data = null` bị chuyển thành danh sách quyền rỗng. Lỗi `auth.getUser()` trả `user = null` cũng làm xóa quyền trong state dù chưa có sự kiện đăng xuất được xác nhận.
- `src/pages/admin/AdminUsers.tsx:54-96`: `fetchAll` gặp lỗi thì `break` và trả kết quả rỗng hoặc chưa đầy đủ như thành công. Khi ghép hồ sơ, người không xuất hiện trong phần quyền đã tải bị gán `subjectIds = []`. Lỗi một trang quyền có thể ảnh hưởng nhiều học viên, trong khi danh sách hồ sơ vẫn đủ.

Các yếu tố làm lỗi dễ thấy hoặc khó tự phục hồi:

- Phân trang AdminUsers không có thứ tự ổn định.
- Khởi tạo auth cho phép render trang trước khi tải xong quyền; state chưa tải được đang dùng cùng giá trị `[]` với trạng thái đã xác nhận không có quyền.
- Auth listener gọi lại `refreshPurchased` khi có session, gồm cả sự kiện làm mới token. Một lần đọc lỗi có thể ghi đè danh sách quyền đã tải đúng trước đó.
- Chưa có subscription cho thay đổi `user_subjects` ở phía học viên.
- Trigger trong migration `20260913000500_revoke_subject_access_on_order_delete.sql` chỉ cấp quyền khi trạng thái chuyển sang approved. Nó không tự khôi phục quyền thiếu của đơn vốn đã approved.

Giới hạn chứng cứ: đã chứng minh các lỗi code và tình huống tái hiện; chưa xác nhận bản ghi quyền trên production đã bị xóa hay chỉ không tải được. Không có phiên quản trị hoặc kết nối DB được xác thực trong phiên điều tra. Không dùng kết quả API giả lập để kết luận về dữ liệu thật.

## 2. User Scenarios & Testing

### US-001: Lỗi tải quyền không biến thành mất quyền

- **Given** học viên có 4 quyền đã tải thành công trong phiên hiện tại, **When** lần refresh tiếp theo bị lỗi API, **Then** không ghi đè snapshot thành 0 môn; hiển thị trạng thái cần thử lại và giữ kiểm soát truy cập thực ở DB/RLS.
- **Given** lần tải đầu tiên thất bại, **When** mở trang có nội dung trả phí, **Then** hiển thị trạng thái lỗi tải quyền và nút thử lại, không kết luận học viên chưa mua.
- **Given** lỗi xác minh auth tạm thời, **When** `getUser` trả lỗi kèm user null, **Then** không coi lỗi đó là đăng xuất thành công.
- **Given** học viên thực sự đăng xuất hoặc đổi tài khoản, **When** session thay đổi, **Then** snapshot quyền của tài khoản cũ bị xóa và request cũ không được ghi quyền sang tài khoản mới.

### US-002: Quản trị không thấy 00 môn do dữ liệu tải thiếu

- **Given** hơn 1.000 bản ghi quyền và hồ sơ học viên tải thành công, **When** trang quyền thứ hai lỗi, **Then** toàn bộ kết quả tải quyền được đánh dấu không đầy đủ; không công bố `00 môn` cho học viên chưa được kiểm tra.
- **Given** lỗi tải ở trang quyền đầu tiên, **When** render danh sách, **Then** hiển thị lỗi có thể thử lại, không hiện toàn bộ học viên như không có quyền.
- **Given** dữ liệu tải thành công đầy đủ, **When** tìm học viên, **Then** số môn và modal quyền khớp dữ liệu theo user_id; trạng thái không có quyền thật vẫn hiển thị đúng.

### US-003: Đồng bộ quyền sau khi quản trị duyệt hoặc cấp quyền

- **Given** học viên đang đăng nhập và quản trị thay đổi quyền, **When** nhận tín hiệu đồng bộ hoặc thử tải lại, **Then** snapshot được cập nhật từ kết quả đọc thành công cho đúng tài khoản.
- **Given** hai lần tải chồng nhau, **When** request cũ hoàn tất sau request mới hoặc sau đăng xuất, **Then** không ghi đè state mới bằng kết quả cũ.

### US-004: Phân biệt lỗi giao diện và thiếu quyền thật

- **Given** một đơn approved và các order_items, **When** chạy đối soát chỉ đọc bằng quyền quản trị hợp lệ, **Then** báo các cặp `(user_id, subject_id)` thiếu trong user_subjects theo UUID, không nối bằng email.
- **Given** đối soát chưa chứng minh thiếu bản ghi, **When** sửa luồng đọc, **Then** không tự động cấp lại hàng loạt hoặc đổi trạng thái đơn hàng.

## 3. Requirements

### Functional Requirements

- **FR-001**: Phân biệt chưa tải, đang tải, thành công và lỗi quyền học. Không quy đổi lỗi đọc thành danh sách quyền rỗng thành công.
- **FR-002**: Giữ snapshot đã xác thực gần nhất cho cùng tài khoản khi refresh lỗi; RLS vẫn là cơ chế bảo vệ nội dung thực. Chưa có snapshot thì hiển thị trạng thái chưa xác định và khả năng thử lại.
- **FR-003**: Chỉ chấp nhận dữ liệu của request còn hiệu lực, đúng user_id. Xóa snapshot trên đăng xuất/đổi tài khoản được xác nhận; không chia sẻ cache giữa tài khoản.
- **FR-004**: AdminUsers phải thất bại rõ ràng nếu bất kỳ trang dữ liệu thiết yếu nào lỗi; không dùng kết quả chưa đầy đủ để tính số môn hoặc cho phép thao tác dựa trên dữ liệu thiếu.
- **FR-005**: Phân trang có thứ tự ổn định theo khóa duy nhất. Xác minh tải vượt 1.000 bản ghi và giới hạn trả về của API; không kết thúc sớm chỉ vì kích thước trang bị server giới hạn.
- **FR-006**: Có cách thử lại hữu ích cho học viên và admin. Đồng bộ quyền khi quyền thay đổi, hoặc khi quay lại ứng dụng theo cơ chế phù hợp; cleanup subscription khi đổi session.
- **FR-007**: Các màn hình phụ thuộc quyền không hiện khóa học là chưa mua hoặc tự điều hướng khỏi trang khi trạng thái quyền chưa xác định.
- **FR-008**: Cung cấp đối soát chỉ đọc approved orders/order_items với user_subjects; không tự ghi production, không tự sửa theo email và không thay đổi trạng thái đơn để kích lại trigger.
- **FR-009**: Chỉ lập và thực hiện khôi phục các quyền thực sự thiếu sau khi có báo cáo đối soát và xác nhận phạm vi; tôn trọng các trường hợp thu hồi có chủ đích.
- **FR-010**: Có kiểm thử hồi quy cho lỗi API, lỗi auth, lỗi trang thứ hai, empty-success thật, đăng xuất/đổi tài khoản và request hoàn tất sai thứ tự.

### Key Entities

- `user_subjects`: `id`, `user_id`, `subject_id`, `granted_by`, `granted_at`.
- `orders`: `id`, `user_id`, `status`.
- `order_items`: `id`, `order_id`, `subject_id`.
- `profiles`, `user_roles`: danh sách hồ sơ và vai trò phục vụ quản trị.
- Auth session, snapshot quyền theo user_id, trạng thái tải và mã request.

### Key Files (proposed)

- `src/lib/AppContext.tsx` — tải quyền, state auth, đồng bộ và chống response cũ.
- `src/pages/admin/AdminUsers.tsx` — phân trang, lỗi tải và số môn.
- `src/App.tsx` và các màn hình phụ thuộc quyền (`HomePage`, `SubjectDetailPage`, `StudyHubPage`, `ProfilePage`, `CartPage`) — chỉ sửa nơi cần phản ánh trạng thái quyền chưa xác định.
- Các test trong `src/lib/__tests__/` hoặc cạnh module được tách để kiểm thử.
- `src/lib/fetchAllById.ts`, `src/lib/subjectAccess.ts`, `src/lib/adminUsers.ts`, `src/hooks/useSubjectAccess.ts` — phân trang và tải quyền có kiểm soát lỗi, kiểm thử độc lập.
- `src/components/SubjectAccessBoundary.tsx`, `src/components/common/RetryNotice.tsx` — trạng thái tải/thử lại trước khi quyết định UI theo quyền.
- `supabase/diagnostics/subject_access_audit.sql` — báo cáo chỉ đọc các quyền thiếu so với đơn approved, không tự cấp lại.
- Tài liệu/query đối soát chỉ đọc sau review; migration khôi phục không thuộc phần sửa giao diện mặc định.

## 4. Success Criteria

- **SC-001**: Trường hợp dữ liệu thật/giả lập vẫn có 4 quyền nhưng API đọc lỗi không còn hiển thị như đã xác nhận 0 quyền.
- **SC-002**: Lỗi trang quyền thứ hai không khiến học viên ngoài trang đầu bị hiện `00 môn`.
- **SC-003**: Kết quả tải thành công nhưng rỗng thật vẫn phản ánh đúng không có quyền; lỗi mạng không được dùng để cấp quyền mới.
- **SC-004**: Đăng xuất và đổi tài khoản không giữ hay phục hồi quyền của người cũ bởi request chậm.
- **SC-005**: Kiểm thử hồi quy liên quan và `npm test` thành công; build/type checks phù hợp hoàn tất sau triển khai.
- **SC-006**: Báo cáo điều tra phân biệt rõ lỗi code đã tái hiện, dữ liệu production đã xác minh và các vấn đề chưa xác minh.
