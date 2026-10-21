# Tasks: Fix Subject Access Loading

- [x] Đọc skill speckit và constitution; tham khảo CodeGraph và Graphify.
- [x] Rà luồng cấp/đọc/thu hồi quyền, auth listener, migrations, restore và cleanup.
- [x] Ghi nhận người dùng xác nhận không xóa đơn; không dùng lỗi xóa đơn làm kết luận sự cố.
- [x] Tái hiện lỗi đọc quyền học viên từ code hiện tại với Supabase giả lập.
- [x] Tái hiện lỗi admin trả rỗng/partial-success khi một trang quyền lỗi.
- [x] Chạy baseline npm test: 1 file, 6 test pass.
- [x] Viết spec.md, plan.md, tasks.md trước khi sửa source.
- [x] Người dùng duyệt spec theo review gate của skill: "tiến hành đi".
- [x] Sửa state quyền, phân biệt lỗi đọc với không có quyền thật.
- [x] Ràng buộc request/snapshot theo user_id và xử lý response cũ.
- [x] Sửa phân trang admin, xử lý lỗi và thử lại.
- [x] Sửa các quyết định UI khi trạng thái quyền chưa xác định.
- [x] Đồng bộ quyền sau thay đổi với cleanup đúng session.
- [x] Viết/chạy test hồi quy quyền học: 32/32 pass; build và lint module mới pass. Typecheck có đúng 4 lỗi nền đã đối chiếu với HEAD gốc.
- [x] Chuẩn bị đối soát chỉ đọc theo UUID trong supabase/diagnostics/subject_access_audit.sql.
- [x] Cập nhật Graphify.
- [x] Chuẩn bị giao code: source, test, spec và graph sẵn sàng commit; kết quả commit/dual-push được ghi nhận trong phản hồi cuối sau khi thực hiện.

### Công việc phụ thuộc dữ liệu production (chưa có kết nối xác thực)

- Chạy đối soát chỉ đọc. Không suy ra quyền thực sự đã mất từ API giả lập hoặc query anon bị RLS che dữ liệu.
- Chỉ khi phát hiện thiếu bản ghi thật: lập danh sách và phạm vi khôi phục để review trước khi ghi dữ liệu. Không có thay đổi production DB trong bản sửa này.
