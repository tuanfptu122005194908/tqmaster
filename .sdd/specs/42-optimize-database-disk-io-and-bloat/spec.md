# Feature Specification: Khắc Phục Cạn Kiệt Disk IO & Tối Ưu Triệt Để Database Supabase (Spec 42)

**Status**: Completed  
**Created**: 2026-11-06  
**Feature Directory**: `.sdd/specs/42-optimize-database-disk-io-and-bloat/`  

---

## 1. Mục tiêu & Bối cảnh (Overview & Problem Statement)

- **Vấn đề**:
  - Dự án Supabase (`tuanfpt` - `vhljgmtithjeovtrghvy`) nhận cảnh báo: **"Your project is depleting its Disk IO Budget"** (Dự án đang cạn kiệt ngân sách Disk IOPS).
  - Khi cạn kiệt Disk IO Budget: Thời gian phản hồi của website tăng cao, CPU tăng vọt do IO wait, database có nguy cơ bị đóng băng (unresponsive) hoặc quá tải.
- **Kết quả điều tra thực tế từ Database trực tiếp (`supabase inspect db` & `supabase db query`)**:
  1. **pg_cron job chạy mỗi 1 phút (`* * * * *`)**:
     - Lệnh `SELECT public.cleanup_unverified_users()` đã bị gọi **79,680 lần**, chiếm tới **91.3% tổng thời gian thực thi của cả database**!
     - Quét và xoá trên `auth.users` liên tục 24/7 tạo transaction liên hồi, sinh WAL và ngốn sạch IOPS budget.
  2. **Bảng `attempt_answers` bị phình rác cực nặng (Bloat 84.7x, 65 MB)**:
     - Bảng thực tế chỉ có **1,854 dòng** (đáng lẽ < 200 KB) nhưng đang chiếm tới **65 MB** (Table waste 28 MB, Index waste 36 MB). Mỗi lần đọc/ghi hay vacuum đều phải đọc qua 65 MB phân mảnh.
  3. **Bảng `user_roles` bị quét 130 TRIỆU LẦN do RLS không cache**:
     - `user_roles_user_id_role_key` bị quét tới **130,763,243 lần**.
     - Các chính sách RLS trên các bảng lớn (`question_options`, `exams`, `profiles`, `question_reports`, `theories`...) gọi trực tiếp `has_role(...)` khiến Postgres đánh giá hàm cho từng dòng trong hàng trăm nghìn dòng dữ liệu.
  4. **Thiếu các Index quan trọng gây hàng triệu lần Sequential Scan (Quét toàn bảng)**:
     - `order_items`: **913,483 lần seq scan** vì thiếu index trên `subject_id`.
     - `question_reports`: **11,572 lần seq scan** vì thiếu index trên `status`.
  5. **Supabase Realtime WAL Churn**:
     - Hàm `realtime.list_changes` chạy **7.78 triệu lần** do việc cron job chạy mỗi phút sinh WAL liên tục.
- **Giải pháp tổng thể**:
  1. Đổi lịch chạy `cleanup-unverified-users` từ **1 phút/lần (`* * * * *`)** sang **1 lần/ngày lúc 3:30 AM (`30 3 * * *`)**, loại bỏ 99.9% số lần gọi thừa thãi.
  2. Thực hiện `VACUUM FULL` và `REINDEX TABLE` trên `attempt_answers`, thu hồi ngay **64 MB rác đĩa** (giảm 98% kích thước).
  3. Bổ sung các chỉ mục còn thiếu: `idx_order_items_subject_id` trên `order_items(subject_id)` và `idx_question_reports_status` trên `question_reports(status)`.
  4. Nâng cấp các chính sách RLS còn lại sang dạng `(SELECT public.has_role(auth.uid(), 'admin'))` (InitPlan cache 1 lần/truy vấn) để triệt tiêu 130 triệu lượt quét lặp.

---

## 2. Kịch bản Nghiệm thu (User Scenarios Given-When-Then)

### Kịch bản 1: Giảm tần suất cron job dọn dẹp tài khoản chưa kích hoạt
- **Given**: Job `cleanup-unverified-users` đang chạy mỗi phút (`* * * * *`).
- **When**: Cập nhật lịch trình sang `30 3 * * *` (mỗi ngày một lần vào 03:30 sáng).
- **Then**: Job chỉ chạy đúng 1 lần mỗi ngày, số lần gọi giảm từ 1,440 lần/ngày xuống 1 lần/ngày, triệt tiêu 99.9% gánh nặng Disk IO.

### Kịch bản 2: Giải phóng triệt để bloat bảng `attempt_answers`
- **Given**: Bảng `attempt_answers` có 1,854 dòng nhưng chiếm 65 MB đĩa (bloat 84.7x).
- **When**: Chạy `VACUUM FULL` và `REINDEX TABLE` cho `attempt_answers`.
- **Then**: Kích thước bảng và index giảm từ 65 MB xuống < 500 KB, Disk IO khi đọc/ghi giảm hơn 98%.

### Kịch bản 3: Tối ưu RLS Policy và loại bỏ Sequential Scan
- **Given**: `order_items` bị quét tuần tự 913k lần, `user_roles` bị quét 130 triệu lần.
- **When**: Thêm index `idx_order_items_subject_id`, `idx_question_reports_status` và sửa RLS bọc `(SELECT has_role(...))`.
- **Then**: Truy vấn lọc đơn hàng theo môn và kiểm tra trạng thái báo cáo chuyển thành Index Scan, số lượt gọi `user_roles` giảm về 1 lần/truy vấn.

---

## 3. Yêu cầu Chức năng & Kỹ thuật (Functional Requirements)

- **FR-001**: Di chuyển lịch trình cron job `cleanup-unverified-users` về `30 3 * * *` qua hàm `cron.alter_job`.
- **FR-002**: Chạy `VACUUM FULL public.attempt_answers;` và `REINDEX TABLE public.attempt_answers;`.
- **FR-003**: Tạo chỉ mục `CREATE INDEX IF NOT EXISTS idx_order_items_subject_id ON public.order_items (subject_id);`.
- **FR-004**: Tạo chỉ mục `CREATE INDEX IF NOT EXISTS idx_question_reports_status ON public.question_reports (status);`.
- **FR-005**: Tối ưu các RLS policy trên `exams`, `question_options`, `question_reports`, `profiles`, `subjects`, `theories` bọc `(SELECT public.has_role(auth.uid(), 'admin'))`.

---

## 4. Tiêu chí Thành công (Success Criteria)

- **SC-001**: Job `cleanup-unverified-users` được cấu hình thành công chạy lúc 03:30 AM mỗi ngày.
- **SC-002**: Dung lượng bảng `attempt_answers` giảm từ 65 MB xuống < 1 MB.
- **SC-003**: Các chỉ mục mới được tạo thành công trên Remote Database.
- **SC-004**: Tất cả 114 unit tests (`npm test`) tiếp tục pass 100%, không ảnh hưởng bất kỳ luồng nghiệp vụ nào của web và app.
- **SC-005**: Hoàn tất Dual-repo Git Push (`origin` và `tqmaster`).

