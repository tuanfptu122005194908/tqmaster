# Tasks: Sửa lỗi hiển thị ảnh đề thi PE / Video cho tài khoản User

**Feature Directory**: `.sdd/specs/19-fix-user-pe-images-access/`  
**Feature Branch**: `fix/user-pe-images-access`  
**Status**: ✅ Completed (100% Verified)  

---

## Danh sách công việc phân rã (Checklist)

### 1. Database & Security RLS
- [x] **Task 1.1**: Tạo file migration `supabase/migrations/20260924200000_fix_pe_extracts_storage_access.sql`.
- [x] **Task 1.2**: Áp dụng migration lên database Supabase `vhljgmtithjeovtrghvy` bằng Supabase CLI.
- [x] **Task 1.3**: Chạy script xác thực quyền tạo signed URL của tài khoản User trên database thực tế (`user_access: true`).

### 2. Frontend Enhancement & Error Handling
- [x] **Task 2.1**: Cập nhật `SubjectDetailPage.tsx` bổ sung xử lý fallback `PeFilmstripThumb` khi ảnh tải chậm hoặc lỗi mạng.
- [x] **Task 2.2**: Cập nhật `ExamImageViewerModal.tsx` với trạng thái loading spinner (`Loader2`) / placeholder lỗi thân thiện kèm nút tải ZIP gốc.

### 3. Testing & Verification
- [x] **Task 3.1**: Chạy kiểm thử tự động `npm test` để đảm bảo không có hồi quy mã nguồn (6/6 test files, 29/29 tests passed).
- [x] **Task 3.2**: Chạy `graphify update .` để đồng bộ đồ thị tri thức kiến trúc dự án.

### 4. Dual-Repo Git Push
- [x] **Task 4.1**: Commit thay đổi với semantic commit message: `fix(storage): allow enrolled users to access extracted pe exam images`.
- [x] **Task 4.2**: Đẩy code đồng bộ lên cả 2 remote:
  - `git push origin main`
  - `git push tqmaster main`
