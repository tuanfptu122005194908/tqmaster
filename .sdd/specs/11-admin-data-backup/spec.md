# Feature Specification: 11 - Admin Data Backup (Excel Import / Export)

**Feature Branch**: `[main]`

**Status**: Active

---

## 1. Background & Problem

Toàn bộ dữ liệu của hệ thống TQMaster (môn học, đề thi, câu hỏi, người dùng, đơn hàng...) đang được lưu trữ 100% trên Supabase PostgreSQL. Nếu xảy ra sự cố mất dữ liệu (xóa nhầm, lỗi migration, gói Supabase hết hạn...) thì không có cách nào khôi phục thủ công. Tính năng này cho phép Admin chủ động **sao lưu và phục hồi dữ liệu** thông qua file Excel (.xlsx), không phụ thuộc vào database.

---

## 2. Scope (Phạm vi)

Tính năng áp dụng cho **trang Admin** (`/admin/backup`), chỉ dành cho người dùng có `role = admin`.

### Các bảng dữ liệu được hỗ trợ (Export & Import):

| STT | Bảng DB            | Mô tả                          | Export | Import |
|-----|--------------------|--------------------------------|--------|--------|
| 1   | `subjects`         | Danh sách môn học              | ✅     | ✅     |
| 2   | `exams`            | Danh sách đề thi               | ✅     | ✅     |
| 3   | `exam_subjects`    | Mapping đề thi và môn học      | ✅     | ✅     |
| 4   | `questions`        | Ngân hàng câu hỏi              | ✅     | ✅     |
| 5   | `question_options` | Các phương án trả lời          | ✅     | ✅     |
| 5   | `theories`         | Tài liệu lý thuyết             | ✅     | ✅     |
| 6   | `profiles`         | Thông tin học viên             | ✅     | ❌     |
| 7   | `orders`           | Danh sách đơn hàng             | ✅     | ❌     |
| 8   | `order_items`      | Chi tiết đơn hàng              | ✅     | ❌     |
| 9   | `exam_attempts`    | Lịch sử làm bài               | ✅     | ❌     |
| 10  | `news_posts`       | Tin tức                        | ✅     | ✅     |
| 11  | `announcements`    | Thông báo                      | ✅     | ✅     |
| 12  | `discount_codes`   | Mã giảm giá                    | ✅     | ✅     |

> **Ghi chú Import:** Các bảng `profiles`, `orders`, `order_items`, `exam_attempts` chỉ hỗ trợ **Export** (xem/backup). Việc import các bảng này tiềm ẩn rủi ro bảo mật và tính toàn vẹn dữ liệu cao nên bị giới hạn ở phiên bản đầu.

---

## 3. User Stories

### Story 1 - Export Toàn bộ Database (Full Backup) — P0
> *Là Admin, tôi muốn tải toàn bộ database về máy trong 1 file Excel nhiều sheet, để tôi có thể lưu trữ dự phòng bất cứ lúc nào.*

**Acceptance Scenarios:**
1. **Given** Admin ở `/admin/backup`, **When** nhấn "Xuất tất cả (Full Backup)", **Then** hệ thống tải về 1 file `.xlsx` với mỗi bảng là 1 sheet riêng, đặt tên theo pattern `TQMaster_Backup_YYYYMMDD_HHmmss.xlsx`.
2. **Given** quá trình export đang chạy, **When** dữ liệu đang fetch, **Then** nút export hiển thị trạng thái loading với spinner và text "Đang xuất dữ liệu...".
3. **Given** 1 bảng nào đó rỗng (không có dữ liệu), **When** export, **Then** sheet vẫn được tạo với row tiêu đề (header), không bỏ qua sheet đó.

### Story 2 - Export theo từng bảng (Selective Export) — P1
> *Là Admin, tôi muốn có thể chọn lọc export chỉ 1 hoặc vài bảng cụ thể, để việc backup nhanh hơn và file gọn hơn.*

**Acceptance Scenarios:**
1. **Given** Admin đã tích chọn các bảng muốn export, **When** nhấn "Xuất đã chọn", **Then** hệ thống chỉ export các bảng được chọn vào file Excel.
2. **Given** Admin chưa chọn bảng nào, **When** nhấn "Xuất đã chọn", **Then** nút bị disabled và hiển thị tooltip "Vui lòng chọn ít nhất 1 bảng".

### Story 3 - Export Câu hỏi Readable (Dạng đọc được) — P1
> *Là Admin, tôi muốn xuất dữ liệu câu hỏi của từng đề thi thành định dạng Excel đọc được cho con người (có đầy đủ đáp án A, B, C, D trên cùng 1 hàng, đáp án đúng tô màu) thay vì raw data.*

**Acceptance Scenarios:**
1. **Given** Admin nhấn "Xuất câu hỏi theo môn", **When** file Excel tải xong, **Then** file có sheet tổng quan và các sheet tương ứng với từng đề thi (1 sheet / 1 đề).
2. **Given** file Excel được mở, **When** xem nội dung, **Then** mỗi câu hỏi nằm trên 1 hàng, các lựa chọn A, B, C, D nằm thành các cột, và lựa chọn đúng được tô nền màu xanh lá.

### Story 3 - Import dữ liệu từ Excel (Restore) — P1
> *Là Admin, tôi muốn upload file Excel backup lên để khôi phục hoặc import hàng loạt dữ liệu (môn học, câu hỏi...), thay thế việc nhập tay.*

**Acceptance Scenarios:**
1. **Given** Admin upload file Excel đúng định dạng (có sheet `subjects`), **When** xác nhận import, **Then** hệ thống đọc từng row và upsert vào database, hiển thị kết quả (số row thành công / thất bại).
2. **Given** file Excel có row bị lỗi (thiếu trường bắt buộc, sai kiểu dữ liệu), **When** import, **Then** hệ thống **không dừng** hoàn toàn mà ghi lại lỗi theo dòng và tiếp tục các dòng khác, sau đó báo cáo tổng kết ở cuối.
3. **Given** file Excel không đúng định dạng (sai tên sheet, thiếu cột bắt buộc), **When** Admin upload, **Then** hệ thống hiển thị thông báo lỗi validation trước khi import thực sự diễn ra.
4. **Given** hệ thống đang import (batch lớn), **When** import đang chạy, **Then** hiển thị progress bar % hoàn thành.

### Story 4 - Template Download — P2
> *Là Admin, tôi muốn tải về file Excel mẫu cho từng bảng để biết đúng định dạng khi import.*

**Acceptance Scenarios:**
1. **Given** Admin nhấn "Tải template" cho bảng `questions`, **When** download, **Then** hệ thống trả về file Excel có 1 row header và 1-2 row ví dụ dữ liệu mẫu.

---

## 4. Functional Requirements

- **FR-001**: Hệ thống PHẢI sử dụng thư viện `xlsx` (SheetJS) để tạo và đọc file Excel. Không dùng CSV (thiếu hỗ trợ Unicode/Tiếng Việt).
- **FR-002**: Hệ thống PHẢI xử lý batch khi import (chunk 100 rows/request) để tránh timeout Supabase.
- **FR-003**: Tất cả thao tác Import/Export PHẢI được bảo vệ bởi RLS policy Admin-only.
- **FR-004**: File export PHẢI có header row theo đúng tên cột database (snake_case) (Trừ trường hợp Export Câu hỏi Readable).
- **FR-005**: Import PHẢI dùng chiến lược `upsert`. Cột conflict phải được thiết lập đúng với cấu trúc DB (VD: `exam_subjects` dùng composite PK `exam_id, subject_id`).
- **FR-006**: Quá trình Import PHẢI tuân thủ thứ tự Foreign Key Constraints (Ví dụ: `subjects` -> `exams` -> `exam_subjects` -> `questions` -> `question_options`).
- **FR-007**: Sau khi import thành công, PHẢI invalidate TanStack Query cache liên quan.

---

## 5. Non-Functional Requirements

- **NFR-001 (Performance)**: Export toàn bộ phải hoàn thành dưới 30 giây với dữ liệu ≤ 10,000 rows/bảng.
- **NFR-002 (UX)**: Không được chặn UI thread khi xử lý file lớn. Dùng async/await kết hợp `setTimeout` yield.
- **NFR-003 (Security)**: Page `/admin/backup` PHẢI được bảo vệ bởi `ProtectedRoute` với `requiredRole="admin"`.

---

## 6. Key Entities & Data Mapping

### Export Column Mapping (ví dụ cho bảng `questions`)

| Cột Excel Header | Cột DB         | Kiểu      | Bắt buộc |
|-----------------|----------------|-----------|-----------|
| id              | id             | uuid      | Auto      |
| exam_id         | exam_id        | uuid      | ✅        |
| content         | content        | text      | ✅        |
| type            | type           | text      | ✅        |
| order_num       | order_num      | number    | ✅        |
| chapter_name    | chapter_name   | text      | ❌        |
| image_url       | image_url      | text      | ❌        |
| created_at      | created_at     | timestamp | Auto      |

---

## 7. Technical Design

### Thư viện
- **`xlsx` (SheetJS)**: đọc/ghi file Excel (.xlsx) — `npm install xlsx`
- **`file-saver`**: trigger download trình duyệt — `npm install file-saver` (hoặc dùng native `URL.createObjectURL`)

### Cấu trúc Component
```
src/
├── pages/admin/
│   └── AdminBackup.tsx          # Trang chính /admin/backup
├── components/backup/
│   ├── BackupExportPanel.tsx    # Panel xuất dữ liệu
│   ├── BackupImportPanel.tsx    # Panel nhập dữ liệu
│   ├── BackupTableSelector.tsx  # Checkbox chọn bảng
│   └── ImportResultDialog.tsx   # Dialog kết quả import
├── lib/
│   └── excelBackup.ts           # Logic core: export, import, template
```

### Routing
- Thêm route `/admin/backup` vào `App.tsx`
- Thêm menu item "💾 Backup / Restore" vào `AdminSidebar.tsx`

---

## 8. Success Criteria

- **SC-001**: Admin có thể export full backup thành công ≥ 95% số lần thực hiện.
- **SC-002**: Admin có thể import file template đã download và thấy dữ liệu xuất hiện trong hệ thống.
- **SC-003**: Lỗi import từng dòng KHÔNG làm crash toàn bộ quá trình import.
- **SC-004**: Trang `/admin/backup` KHÔNG accessible bởi user thường (trả về redirect).
