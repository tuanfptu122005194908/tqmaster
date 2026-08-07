# Plan: 11 - Admin Data Backup (Excel Import / Export)

**Status**: Ready for Implementation  
**Spec**: [spec.md](./spec.md)

---

## Phân tích Kỹ thuật

### Thư viện cần cài
```bash
bun add xlsx
```
> `xlsx` (SheetJS community edition) hỗ trợ đầy đủ đọc/ghi `.xlsx`, hỗ trợ Unicode/Tiếng Việt, không cần thư viện thêm.

### Chiến lược Import (Upsert)
- Đọc file Excel → parse từng sheet → map column sang đúng schema DB.
- Chunk mỗi 100 rows, gọi `supabase.from(table).upsert(chunk)` tuần tự.
- Collect kết quả → trả về summary `{ success, failed, errors[] }`.

### Chiến lược Export
- Fetch tất cả dữ liệu từng bảng song song (Promise.all).
- Tạo Workbook với mỗi bảng là 1 Sheet.
- Trigger download via `URL.createObjectURL`.

---

## Implementation Steps

### Phase 1: Setup & Core Logic
1. Cài thư viện `xlsx`
2. Tạo `src/lib/excelBackup.ts` — utilities export/import/template

### Phase 2: Components
3. Tạo `BackupTableSelector.tsx` — danh sách bảng + checkbox
4. Tạo `BackupExportPanel.tsx` — nút Export + trạng thái loading
5. Tạo `BackupImportPanel.tsx` — upload + preview + progress bar
6. Tạo `ImportResultDialog.tsx` — dialog tổng kết sau import

### Phase 3: Page & Routing
7. Tạo `src/pages/admin/AdminBackup.tsx` — gộp tất cả panel
8. Thêm route `/admin/backup` vào `App.tsx`
9. Thêm menu item vào `AdminSidebar.tsx`

---

## File Changes

| File | Action | Mô tả |
|------|--------|-------|
| `src/lib/excelBackup.ts` | **NEW** | Core logic export/import/template |
| `src/components/backup/BackupTableSelector.tsx` | **NEW** | Checkbox chọn bảng |
| `src/components/backup/BackupExportPanel.tsx` | **NEW** | Panel xuất Excel |
| `src/components/backup/BackupImportPanel.tsx` | **NEW** | Panel nhập Excel |
| `src/components/backup/ImportResultDialog.tsx` | **NEW** | Dialog kết quả |
| `src/pages/admin/AdminBackup.tsx` | **NEW** | Trang backup |
| `src/App.tsx` | **MODIFY** | Thêm route `/admin/backup` |
| `src/components/AdminSidebar.tsx` | **MODIFY** | Thêm menu item |
| `package.json` | **MODIFY** | Thêm dep `xlsx` |

---

## Risk & Mitigation

| Risk | Mitigation |
|------|-----------|
| Import file lớn (1000+ rows) làm chậm UI | Dùng chunk 100 rows + async/await + setTimeout yield |
| UUID conflict khi import | Dùng `upsert` (ON CONFLICT DO UPDATE) thay vì `insert` |
| Cột quan hệ (FK) chưa tồn tại khi import | Validate FK trước khi insert, báo lỗi rõ ràng |
| User thường truy cập backup page | `ProtectedRoute` + Supabase RLS |
