# Feature Specification: 11 - Admin Data Backup & Disaster Recovery System

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.0)

---

## 1. Overview
Hệ thống sao lưu và phục hồi thảm họa (`/admin/backup`) là phân hệ an toàn dữ liệu trọng yếu dành riêng cho Quản trị viên cấp cao của TQMaster. 

Hệ thống cung cấp cơ chế bảo vệ và di chuyển dữ liệu đa tầng toàn diện:
1. **Excel Backup & Restore** (.xlsx): Xuất nhập dữ liệu theo từng bảng hoặc toàn bộ cơ sở dữ liệu qua SheetJS, hỗ trợ xuất câu hỏi dạng bảng đọc được (Readable Questions Format) và tải file mẫu (Template).
2. **SQL / ZIP Snapshot Engine**: Tạo bản sao lưu cấu trúc & dữ liệu quan hệ dạng câu lệnh SQL chuẩn (`INSERT ... ON CONFLICT DO UPDATE`) hoặc gói nén `.zip`, cho phép khôi phục toàn vẹn cơ sở dữ liệu trong trường hợp sự cố.
3. **Background Async Workers**: Thực thi tác vụ sao lưu và phục hồi dung lượng lớn ngầm trên Edge Functions (`backup-worker`, `restore-worker`), theo dõi tiến độ thời gian thực qua bảng `backup_jobs` và `restore_jobs` mà không bị gián đoạn do ngắt kết nối trình duyệt.

---

## 2. User Scenarios & Testing

### User Story 1 – Xuất dữ liệu Excel Toàn bộ hoặc Theo bảng chọn (Priority: P1)
Là một Quản trị viên, tôi muốn tải dữ liệu các bảng về máy tính dưới định dạng file Excel để xem offline hoặc phân tích số liệu.

**Acceptance Scenarios**:
1. **Given** Quản trị viên ở `/admin/backup` tab "Xuất Excel", **When** nhấn "Xuất tất cả (Full Backup)", **Then** hệ thống tải về 1 file `.xlsx` với mỗi bảng là 1 sheet riêng, đặt tên theo pattern `TQMaster_Backup_YYYYMMDD_HHmmss.xlsx`.
2. **Given** Quản trị viên chỉ muốn xuất 1 vài bảng (VD: `subjects`, `questions`), **When** tích chọn các bảng tại `BackupTableSelector` và bấm "Xuất đã chọn", **Then** hệ thống chỉ xuất các bảng được chọn.
3. **Given** Quản trị viên muốn gửi file ngân hàng câu hỏi cho giáo viên duyệt đề, **When** chọn "Xuất câu hỏi đọc được", **Then** file Excel có các cột A, B, C, D trên cùng 1 hàng và ô đáp án đúng được tô nền màu xanh lá.

### User Story 2 – Phục hồi dữ liệu từ file Excel (Priority: P1)
Là một Quản trị viên, tôi muốn tải file Excel lên để nhập dữ liệu hàng loạt hoặc khôi phục dữ liệu đã sửa đổi.

**Acceptance Scenarios**:
1. **Given** Quản trị viên tải file Excel hợp lệ lên tab "Nhập Excel", **When** bấm "Tiến hành nhập", **Then** hệ thống đọc từng sheet và thực hiện `upsert` theo đúng thứ tự ràng buộc khóa ngoại (FK constraints): `subjects` -> `exams` -> `exam_subjects` -> `questions` -> `question_options`.
2. **Given** một số dòng trong file Excel bị thiếu trường bắt buộc hoặc sai định dạng, **When** import hoàn tất, **Then** hộp thoại `ImportResultDialog` hiển thị chi tiết số dòng thành công, số dòng lỗi và thông báo lỗi tương ứng mà không làm gián đoạn các dòng hợp lệ khác.

### User Story 3 – Xuất & Khôi phục Snapshot SQL / ZIP (Priority: P0)
Là một Quản trị viên, tôi muốn tạo bản snapshot dự phòng chuẩn SQL của toàn bộ cơ sở dữ liệu để có thể khôi phục tức thời khi chuyển môi trường hoặc khôi phục thảm họa.

**Acceptance Scenarios**:
1. **Given** Quản trị viên tại tab "Snapshot SQL", **When** nhấn "Tạo Snapshot SQL", **Then** hệ thống truy vấn toàn bộ bản ghi của các bảng nghiệp vụ, biên dịch thành file SQL chứa các câu lệnh `INSERT INTO ... ON CONFLICT DO UPDATE`.
2. **Given** file snapshot SQL tải về, **When** Quản trị viên tải file vào panel "Phục hồi Snapshot" và nhấn xác nhận, **Then** hệ thống thực thi từng khối lệnh giao dịch an toàn và thông báo kết quả phục hồi thành công.

### User Story 4 – Sao lưu & Phục hồi ngầm qua Background Worker (Priority: P1)
Là một Quản trị viên đối với cơ sở dữ liệu lớn (> 50.000 câu hỏi), tôi muốn kích hoạt tác vụ sao lưu chạy ngầm trên máy chủ để không phải chờ đợi trên trình duyệt.

**Acceptance Scenarios**:
1. **Given** Quản trị viên tại panel "Sao lưu ngầm (Background Worker)", **When** nhấn "Khởi tạo tác vụ sao lưu", **Then** hệ thống tạo bản ghi mới trong bảng `backup_jobs` với trạng thái `pending` và gọi Edge Function `backup-worker`.
2. **Given** tác vụ đang chạy, **When** Quản trị viên theo dõi màn hình, **Then** thanh tiến độ (Progress bar) tăng dần từ 0% đến 100% nhờ kênh Supabase Realtime lắng nghe bảng `backup_jobs`.
3. **When** tác vụ hoàn tất, **Then** trạng thái chuyển sang `completed` và nút "Tải file backup" xuất hiện kèm link tải trực tiếp từ Storage.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Hệ thống PHẢI sử dụng thư viện `xlsx` (SheetJS) để tạo và đọc file Excel định dạng `.xlsx`, đảm bảo hiển thị đúng 100% tiếng Việt UTF-8.
- **FR-002**: Cơ chế Import Excel PHẢI xử lý theo từng khối (chunk 100 rows/request) và yield luồng để tránh nghẽn UI thread hoặc timeout request.
- **FR-003**: Quá trình Import PHẢI tuân thủ nghiêm ngặt thứ tự ràng buộc khóa ngoại (Foreign Keys).
- **FR-004**: Cung cấp tính năng tải file mẫu (Template download) cho tất cả các bảng dữ liệu cho phép import.
- **FR-005 (SQL Snapshot Engine)**: Modun `backupCore.ts` cung cấp chức năng sinh lệnh SQL chuẩn PostgreSQL với cú pháp `ON CONFLICT` cho phép khôi phục không phá hủy dữ liệu hiện hữu.
- **FR-006 (Background Async Worker Service)**:
  - Cung cấp 2 Edge Functions chuyên trách: `backup-worker` (tổng hợp dữ liệu và nén zip tải lên storage ngầm) và `restore-worker` (đọc file backup từ storage và giải phóng dữ liệu theo lô).
  - Trạng thái công việc được lưu trữ tại `backup_jobs` và `restore_jobs` (`status`: `'pending'` | `'processing'` | `'completed'` | `'failed'`).
- **FR-007 (Bảo mật truy cập)**: Toàn bộ API và giao diện `/admin/backup` PHẢI được bảo vệ bằng quyền quản trị viên (`role === 'admin'`) và RLS policies nghiêm ngặt.

### Key Entities

**Table: backup_jobs**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Khóa chính tác vụ sao lưu |
| `user_id` | uuid | Quản trị viên khởi tạo |
| `status` | text | `'pending'`, `'processing'`, `'completed'`, `'failed'` |
| `progress` | int | Tiến độ thực thi (0 - 100%) |
| `file_url` | text | Đường dẫn tải file sao lưu từ Supabase Storage |
| `error_message` | text | Ghi nhận lỗi nếu tác vụ thất bại |
| `created_at` | timestamptz | Thời điểm khởi tạo |
| `completed_at` | timestamptz | Thời điểm hoàn tất |

**Table: restore_jobs**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Khóa chính tác vụ phục hồi |
| `user_id` | uuid | Quản trị viên thực thi |
| `status` | text | Trạng thái phục hồi |
| `progress` | int | Tiến độ thực thi (0 - 100%) |
| `file_url` | text | Đường dẫn file nguồn phục hồi |
| `error_message` | text | Ghi nhận lỗi |
| `created_at` | timestamptz | Thời điểm bắt đầu |
| `completed_at` | timestamptz | Thời điểm hoàn tất |

### Key Files
- `src/pages/admin/AdminBackup.tsx` — Giao diện quản trị sao lưu & phục hồi đa chế độ
- `src/components/backup/BackupExportPanel.tsx` — Panel xuất dữ liệu Excel
- `src/components/backup/BackupImportPanel.tsx` — Panel nhập dữ liệu Excel
- `src/components/backup/SnapshotExportPanel.tsx` — Panel xuất bản sao lưu SQL Snapshot
- `src/components/backup/SnapshotRestorePanel.tsx` — Panel phục hồi bản sao lưu SQL
- `src/components/backup/BackgroundBackupPanel.tsx` — Panel điều khiển và theo dõi tác vụ sao lưu ngầm
- `src/components/backup/BackgroundRestorePanel.tsx` — Panel điều khiển và theo dõi tác vụ phục hồi ngầm
- `src/components/backup/BackupTableSelector.tsx` — Thành phần chọn lọc bảng dữ liệu
- `src/components/backup/ImportResultDialog.tsx` — Hộp thoại báo cáo kết quả chi tiết sau khi import
- `src/lib/excelBackup.ts` — Thư viện xử lý logic import/export Excel qua SheetJS
- `src/lib/backupCore.ts` — Động cơ trích xuất dữ liệu, định dạng SQL snapshot và nén ZIP
- `supabase/functions/backup-worker/index.ts` — Edge function chạy ngầm tổng hợp dữ liệu sao lưu
- `supabase/functions/restore-worker/index.ts` — Edge function chạy ngầm nạp lại dữ liệu phục hồi

---

## 4. Success Criteria
- **SC-001**: Xuất file Excel toàn bộ cơ sở dữ liệu hoàn tất trong < 15 giây với dataset 10.000 dòng.
- **SC-002**: Tác vụ sao lưu ngầm trên Edge Function tiếp tục chạy đến khi hoàn tất kể cả khi người dùng đóng trình duyệt.
- **SC-003**: Dữ liệu khôi phục từ snapshot SQL hoặc Excel bảo toàn 100% tính toàn vẹn quan hệ khóa ngoại.
