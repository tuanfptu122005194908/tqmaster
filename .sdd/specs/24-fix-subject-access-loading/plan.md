# Plan: Fix Subject Access Loading

Status: Implemented — user approved on 2026-10-22

## Evidence and scope

Thực thi các đoạn hàm lấy trực tiếp từ file hiện tại bằng Node + TypeScript transpiler, tiêm Supabase giả lập; không thay đổi source, không gọi production.

| Trường hợp đã chạy | Kết quả với code hiện tại |
| --- | --- |
| Học viên đã tải 4 quyền; lần đọc tiếp theo trả error/data null | purchasedIds bị thay thành [] |
| getUser trả lỗi xác minh tạm thời và user null | purchasedIds bị thay thành [] |
| Admin tải trang quyền đầu tiên lỗi | fetchAll trả [] như thành công; người có 4 quyền hiện 0 |
| Admin tải 1.000 quyền đầu rồi trang tiếp theo lỗi | fetchAll trả 1.000 dòng như hoàn tất; học viên nằm ngoài phần tải được hiện 0 dù dữ liệu vẫn có 4 quyền |

Các trường hợp trên không gọi delete/insert/update. Chúng phù hợp điều kiện người dùng cung cấp: nhiều học viên bị ảnh hưởng mà không có thao tác xóa.

Điều tra bổ sung phát hiện lỗi trong AdminOrders.remove (xóa quyền trước khi xóa đơn; bỏ qua lỗi kiểm tra đơn khác; có thể xóa quyền admin). Đã tái hiện riêng nhưng **không coi đó là nguyên nhân sự cố này** vì người dùng xác nhận không xóa đơn. Không trộn bản sửa luồng xóa vào phạm vi chính khi chưa có lý do.

Trong migrations có cleanup tài khoản chưa xác minh; schema hiện tại cascade cả orders khi xóa profile. Không dùng job này để giải thích việc cùng một tài khoản vẫn còn đơn approved mà chỉ mất số môn. Không thấy job hết hạn chỉ riêng quyền môn trong mã nguồn đã rà.

## Implementation sequence

1. Sau review, tách logic tải/state tối thiểu nếu cần để test có thể điều khiển response và thứ tự request.
2. Sửa refreshPurchased: kiểm tra lỗi auth và lỗi query trước khi thay state; trạng thái quyền riêng; snapshot gắn với user_id; bỏ response cũ; xử lý đăng xuất xác nhận.
3. Sửa AdminUsers: helper phân trang trả lỗi thay vì partial-success; thứ tự khóa duy nhất; xác nhận đủ dữ liệu; không gán 0 cho dữ liệu chưa tải. Giữ trạng thái lỗi/thử lại rõ ràng và chặn thao tác quyền khi dữ liệu chưa hợp lệ.
4. Thêm xử lý loading/error tối thiểu ở các nơi ra quyết định theo quyền. Không thay đổi thiết kế trang ngoài các trạng thái này.
5. Đồng bộ lại từ DB khi quyền thay đổi và khi cần thử lại. Subscription luôn theo đúng user_id và được tháo khi session thay đổi.
6. Thêm test meaningful cho các tình huống trong spec, chạy npm test và build/type checks phù hợp.
7. Chuẩn bị đối soát chỉ đọc theo UUID giữa approved orders/order_items và user_subjects. Khi có kênh dữ liệu được xác thực, kiểm tra một tài khoản được báo lỗi rồi tổng hợp toàn bộ cặp thiếu. Không dùng anon query trả rỗng để kết luận thiếu quyền vì RLS có thể ẩn dữ liệu.
8. Nếu có thiếu bản ghi thật, lập danh sách khôi phục và rà các thu hồi có chủ đích trước khi thực hiện. Phần này không tự động gộp vào migration hoặc thay đổi đơn hàng.
9. Sau triển khai, cập nhật Graphify; commit và dual-push theo skill khi hoàn tất các kiểm tra cần thiết.

## Validation

- Baseline đã chạy: `npm test -- --reporter=dot`, 1 file / 6 test pass. Suite hiện tại chỉ kiểm thử nhập đề Word, chưa bao phủ quyền học.
- Regression: success -> failure giữ snapshot cùng tài khoản; initial failure là unknown/error; success empty là không có quyền thật; auth failure khác logout; user switch và out-of-order response; hơn 1.000 quyền; lỗi trang thứ hai không phát hành partial result.
- UI: khi query quyền lỗi, admin thấy lỗi/thử lại thay cho 00 môn sai; học viên không bị dẫn sang mua lại do chưa tải được quyền.
- Production validation chưa thực hiện; không có session DB/admin được xác thực trong phiên này.

## Risks and constraints

- Giữ snapshot cũ không được bỏ qua kiểm tra RLS hoặc giữ quyền qua tài khoản khác. Sau refresh thành công phải phản ánh thu hồi thật.
- Realtime có thể mất sự kiện; cần đường thử lại, không chỉ phụ thuộc subscription.
- Không có audit xóa quyền trong schema đã thấy nên không suy ra ai đã xóa hoặc khi nào.
- Sửa luồng đọc không tự tạo lại bản ghi đã thiếu trong DB. Không hứa đã khôi phục production khi chưa có dữ liệu đối soát.

## Implementation and final validation

- `useSubjectAccess` giữ snapshot đúng user_id khi lỗi đọc; phân biệt loading/error/ready; kiểm soát thứ tự request và hủy hiệu lực khi đổi tài khoản hoặc unmount.
- AppProvider cập nhật định danh session trước các tác vụ bất đồng bộ; bỏ qua bootstrap/profile response cũ và không render tài khoản mới với profile cũ.
- Quyền được đọc lại khi có sự kiện đơn hàng (publication đã có), khi tab hiện lại, khi kết nối mạng lại và mỗi 60 giây trong tab đang hiện. Không phụ thuộc việc thêm publication cho user_subjects.
- Loader admin dùng phân trang theo khóa id, đọc đến trang rỗng và không dừng sớm nếu server giới hạn số dòng. Bất kỳ trang lỗi nào cũng hủy kết quả tổng hợp và hiện thử lại.
- Boundary chung trong UserLayout ngăn quyết định mua/khóa/điều hướng khi chưa có snapshot; trang tin tức được miễn vì không phụ thuộc quyền học.
- Đối soát: `supabase/diagnostics/subject_access_audit.sql`, transaction READ ONLY, nối bằng UUID và kết thúc bằng ROLLBACK. Chưa chạy trên production.
- `npm test -- --reporter=dot`: **7 file / 32 test pass** (26 test hồi quy mới, 6 test cũ).
- `npm run build`: **pass**. Các cảnh báo bundle lớn/Browserslist/bluebird là từ cấu hình và dependency hiện có.
- ESLint cho toàn bộ module và test mới: **pass, 0 error / 0 warning**.
- `git diff --check`: **pass**.
- `npx tsc -p tsconfig.app.json --noEmit`: **4 lỗi có sẵn**, đối chiếu bằng TypeScript compiler với source HEAD gốc cũng trả đúng 4 lỗi: `job` ở BackgroundBackupPanel (2), import `@/lib/supabase` ở SubjectCard (1), `setUnreadChatCount` của chức năng chat đã bỏ ở AppContext (1). Không thêm lỗi TypeScript mới; không sửa các lỗi ngoài phạm vi này.
- `graphify update .`: hoàn tất (2122 nodes / 3482 edges); SQL parser không được cài nên graph không phân tích SQL, không ảnh hưởng runtime hay query đối soát.
