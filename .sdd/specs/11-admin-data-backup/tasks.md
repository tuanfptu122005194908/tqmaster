# Tasks: 11 - Admin Data Backup (Excel Import / Export)

## Phase 1: Setup & Core Logic
- [ ] 1.1 Cài thư viện `xlsx` (`bun add xlsx`)
- [ ] 1.2 Tạo `src/lib/excelBackup.ts`
  - [ ] 1.2.1 Định nghĩa `TABLE_SCHEMAS` — mapping tên bảng, cột, FK
  - [ ] 1.2.2 Hàm `exportToExcel(tableNames[])` — fetch + tạo workbook
  - [ ] 1.2.3 Hàm `importFromExcel(file, tableNames[])` — parse + upsert + report
  - [ ] 1.2.4 Hàm `downloadTemplate(tableName)` — tạo file mẫu

## Phase 2: Components
- [ ] 2.1 Tạo `src/components/backup/BackupTableSelector.tsx`
  - [ ] Hiển thị danh sách 12 bảng + checkbox
  - [ ] Phân nhóm: "Nội dung học" / "Giao dịch (chỉ xem)" / "Khác"
  - [ ] Nút "Chọn tất cả" / "Bỏ chọn tất cả"
- [ ] 2.2 Tạo `src/components/backup/BackupExportPanel.tsx`
  - [ ] Tích hợp `BackupTableSelector`
  - [ ] Nút "Xuất đã chọn" + "Xuất tất cả (Full Backup)"
  - [ ] Loading state, toast thông báo khi hoàn thành
- [ ] 2.3 Tạo `src/components/backup/BackupImportPanel.tsx`
  - [ ] Drag & drop file upload (`.xlsx` only)
  - [ ] Preview tên file + số sheet detect
  - [ ] Progress bar khi import
  - [ ] Nút "Tải template"
- [ ] 2.4 Tạo `src/components/backup/ImportResultDialog.tsx`
  - [ ] Bảng kết quả: Sheet | Rows Success | Rows Failed
  - [ ] Accordion chi tiết lỗi theo dòng

## Phase 3: Page & Routing
- [ ] 3.1 Tạo `src/pages/admin/AdminBackup.tsx`
  - [ ] Layout 2 panel: Export (trái) + Import (phải)
  - [ ] Cảnh báo đỏ nổi bật: "⚠️ Tính năng nhạy cảm — chỉ dành cho Admin"
- [ ] 3.2 Thêm route `/admin/backup` vào `src/App.tsx`
- [ ] 3.3 Thêm menu item "💾 Backup / Restore" vào `AdminSidebar.tsx`

## Phase 4: Verification
- [ ] 4.1 Test Export: export full, download file, mở kiểm tra đủ 12 sheet
- [ ] 4.2 Test Import: download template subjects → thêm 2 dòng mới → import lại → kiểm tra DB
- [ ] 4.3 Test Import lỗi: import file có dòng thiếu trường bắt buộc → xác nhận lỗi được ghi lại đúng
- [ ] 4.4 Test bảo mật: đăng nhập user thường → vào `/admin/backup` → phải bị redirect
