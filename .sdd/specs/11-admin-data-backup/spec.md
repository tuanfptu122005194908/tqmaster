---
id: "11-admin-data-backup"
title: "User Story 11 - Hệ thống Sao lưu và Phục hồi Dữ liệu (Backup & Restore)"
status: "IMPLEMENTED"
created_date: "2026-03-11"
---

# 1. Overview
Hệ thống sao lưu và phục hồi thảm họa (`/admin/backup`) là phân hệ an toàn dữ liệu trọng yếu dành riêng cho Quản trị viên cấp cao của TQMaster. 

Hệ thống cung cấp cơ chế bảo vệ và di chuyển dữ liệu đa tầng toàn diện, gồm 2 mảng tính năng chính:
1. **Snapshot SQL & ZIP (Khuyên dùng)**: Tạo bản sao lưu cấu trúc & dữ liệu quan hệ dạng câu lệnh SQL chuẩn, hoặc gói nén `.zip` chạy ngầm thông qua Edge Functions (Background Worker).
2. **Excel Backup & Restore (.xlsx)**: Dành riêng cho người đọc (để gửi giáo viên duyệt đề hoặc nhập hàng loạt nhanh). Xuất nhập dữ liệu bằng file Excel, tự động nhận diện khóa ngoại và xử lý theo từng khối an toàn.

---

# 2. User Scenarios

### User Story 1 – Sao lưu và Phục hồi ngầm bằng Background Worker (Priority: P0)
Là một Quản trị viên đối với cơ sở dữ liệu rất lớn, tôi muốn kích hoạt tác vụ sao lưu/phục hồi chạy ngầm trên máy chủ đám mây để không phải treo tab trình duyệt.

**Acceptance Scenarios**:
1. **Given** Quản trị viên tại tab "Sao lưu toàn bộ (khuyên dùng)", **When** nhấn nút tạo tác vụ ở `BackgroundBackupPanel`, **Then** hệ thống gọi Edge Function `backup-worker`, ghi nhận trạng thái `pending` vào bảng `backup_jobs`.
2. **Given** quá trình sao lưu đang diễn ra, **When** tác vụ thay đổi tiến độ, **Then** thanh tiến độ UI chạy tăng dần nhờ kênh Realtime lắng nghe CSDL. Quản trị viên có thể tắt máy đi ngủ.
3. **When** tác vụ thành công, **Then** có nút tải file trực tiếp từ Storage. Tương tự đối với `BackgroundRestorePanel` (Tải file zip lên và giải nén ngầm bằng `restore-worker`).

### User Story 2 – Tạo Snapshot SQL / Phục hồi Tức thời (Priority: P1)
Là một Quản trị viên muốn chuyển nhanh dữ liệu giữa các môi trường, tôi muốn trích xuất dữ liệu thành 1 file `.sql`.

**Acceptance Scenarios**:
1. **Given** Quản trị viên tại `SnapshotExportPanel`, **When** nhấn xuất, **Then** hệ thống fetch data và biên dịch file `.sql` chứa các lệnh `INSERT INTO ... ON CONFLICT DO UPDATE`.
2. **Given** file `.sql` đã tải, **When** Quản trị viên vào `SnapshotRestorePanel` và upload lên, **Then** hệ thống thực thi từng khối lệnh giao dịch an toàn (không phá hủy dữ liệu) và báo thành công.

### User Story 3 – Xuất Excel Đọc được & Khôi phục từng phần (Priority: P1)
Là một Quản trị viên, tôi muốn tải dữ liệu về định dạng `.xlsx` để xem offline, hoặc import file `.xlsx` chứa ngân hàng câu hỏi mới vào.

**Acceptance Scenarios**:
1. **Given** Quản trị viên tại `BackupExportPanel` (tab Excel), **When** nhấn xuất, **Then** tải về file Excel với mỗi bảng là 1 sheet, hỗ trợ chế độ "Xuất câu hỏi đọc được" cho giáo viên.
2. **Given** Quản trị viên có file Excel dữ liệu mới, **When** tải file vào `BackupImportPanel`, **Then** hệ thống đọc từng sheet và upsert đúng thứ tự ràng buộc khóa ngoại (ví dụ: `subjects` trước, `questions` sau).
3. **When** tiến trình import gặp lỗi 1 vài dòng, **Then** hiện hộp thoại `ImportResultDialog` báo cáo số dòng thành công/thất bại chi tiết mà không làm chết toàn bộ tiến trình.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Background Services)**: Sử dụng 2 Edge Functions `backup-worker` và `restore-worker`. Đồng bộ trạng thái UI thông qua Supabase Realtime tracking bảng `backup_jobs` và `restore_jobs`.
- **FR-002 (SQL Generator)**: Modun `backupCore.ts` phải generate ra các câu query PostgreSQL an toàn, sử dụng `ON CONFLICT` để tránh crash do trùng lặp khóa chính.
- **FR-003 (Excel Processor)**: Sử dụng thư viện `xlsx` (SheetJS) thuần túy chạy trên Client (hoặc Server) để xuất nhập file `.xlsx`. Khi import, phân lô nhỏ (chunking) để tránh treo giao diện.
- **FR-004 (Security & RLS)**: Giao diện và API bắt buộc kiểm tra role `admin`. Có cảnh báo màu cam (ShieldAlert) yêu cầu bảo mật dữ liệu tuyệt đối.

### Key Entities
- **backup_jobs**: Quản lý lịch sử và tiến độ sao lưu ngầm (`status`, `progress`, `file_url`).
- **restore_jobs**: Quản lý lịch sử và tiến độ khôi phục ngầm.

### Key Files
- `src/pages/admin/AdminBackup.tsx`: Giao diện chính chứa các Tabs (Snapshot, Excel).
- `src/components/backup/BackgroundBackupPanel.tsx`: UI gọi `backup-worker`.
- `src/components/backup/SnapshotExportPanel.tsx`: UI export file SQL trực tiếp.
- `src/components/backup/BackupImportPanel.tsx`: UI import file Excel, xử lý chunks và hiển thị kết quả qua `ImportResultDialog`.
- `src/lib/backupCore.ts`: Lõi xử lý dữ liệu và SQL.
- `supabase/functions/backup-worker/index.ts`: Lõi Edge Function chạy ngầm.

---

## 4. Success Criteria
- **SC-001**: Background workers hoạt động ổn định bất kể việc người dùng ngắt kết nối trình duyệt.
- **SC-002**: Import Excel tuân thủ đúng 100% thứ tự Foreign Key Constraints của DB.
- **SC-003**: Cảnh báo rủi ro bảo mật dữ liệu được hiển thị rõ ràng trên UI cho quản trị viên.
