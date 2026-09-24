# Feature Specification: Sửa lỗi hiển thị ảnh đề thi PE / Video cho tài khoản User

**Feature Directory**: `.sdd/specs/19-fix-user-pe-images-access/`  
**Feature Branch**: `fix/user-pe-images-access`  
**Status**: ✅ Implemented (Tested & Verified)  
**Priority**: Critical (P0)  

---

## 1. Overview

Trong mục **Tài liệu PE / Video** (`category: 'pe'`), tài liệu đề thi thực hành (PE) chứa các hình ảnh câu hỏi được trích xuất từ file nén ZIP và lưu trữ tại Supabase Storage trong bucket `theory-images` (đường dẫn `pe-extracts/<theory_id>/...`). Danh sách đường link URL của các ảnh này được lưu trong trường `description` của bản ghi `theories` (dưới dạng block metadata `<!--PE_META:{"preview_images":[...]}-->`).

### Vấn đề hiện tại:
- Khi đăng nhập bằng tài khoản **Admin**, ảnh đề thi PE hiển thị bình thường.
- Khi đăng nhập bằng tài khoản **User thường** (kể cả sinh viên đã mua môn học hoặc môn học miễn phí), toàn bộ ảnh câu hỏi trong tab "Tài liệu PE / Video" bị lỗi không hiển thị được (ảnh bị vỡ / broken image).

### Nguyên nhân cốt lõi:
Hàm phân quyền truy cập tài sản Storage trên Supabase `public.can_access_theory_asset(_object_name text)` (tại migration `20260911121943`) hiện chỉ kiểm tra:
```sql
AND (t.url LIKE '%/' || _object_name OR t.url LIKE '%/' || _object_name || '?%')
```
Trong khi đối với đề thi PE, `t.url` là link file ZIP gốc (`.../de_thi_pe.zip`), còn các ảnh đề thi trích xuất nằm ở thư mục `pe-extracts/<theory_id>/...` và được lưu trong trường `t.description`. Do đó, hàm kiểm tra trả về `FALSE` đối với tài khoản User, khiến hàm tạo link ký `createSignedUrls` bị RLS chặn, trình duyệt không thể tải ảnh từ bucket riêng tư `theory-images` và báo lỗi `404 / 400 NoSuchBucket / Access Denied`.

### Giải pháp:
1. **Nâng cấp hàm phân quyền `can_access_theory_asset` & RLS Policy trên Supabase Storage**:
   - Mở rộng điều kiện kiểm tra quyền đọc tài sản đề thi PE:
     - So khớp `t.description LIKE '%' || _object_name || '%'`
     - So khớp tiền tố thư mục `_object_name LIKE 'pe-extracts/' || t.id::text || '/%'`
     - Đồng bộ cho cả người dùng đăng nhập (`authenticated`) và người dùng vãng lai (`anon`) đối với các môn học miễn phí (`price <= 0`).
2. **Đảm bảo tính ổn định phía Frontend (`SubjectDetailPage.tsx` & `signedImage.ts`)**:
   - Giữ nguyên cơ chế ký URL bảo mật 4 giờ (`signStorageUrls`), tự động fallback ảnh và hiển thị skeleton/placeholder thanh thoát nếu ảnh đang trong quá trình tải.

---

## 2. User Scenarios & Acceptance Criteria (Given - When - Then)

### User Story 1 – Sinh viên đã mua môn học xem được toàn bộ ảnh đề thi PE (Priority: P0)
Là một Sinh viên đã mua môn học (hoặc môn học miễn phí), khi đăng nhập và vào tab "Tài liệu PE / Video", tôi muốn xem được đầy đủ tất cả các ảnh câu hỏi của đề thi PE một cách rõ nét, không bị lỗi ảnh vỡ.

**Acceptance Criteria**:
1. **Given** Sinh viên đã đăng nhập và sở hữu môn học (có trong `user_subjects`), **When** vào trang chi tiết môn học tab "Tài liệu PE / Video" (`/subjects/:id`), **Then** tất cả ảnh xem trước đề thi (filmstrip thumbnail) tải thành công, không có bất kỳ ảnh nào bị lỗi 400/403/404.
2. **When** Sinh viên bấm vào một ảnh thumbnail hoặc nút "Xem đề thi (X ảnh)", **Then** Modal xem ảnh toàn màn hình (`ExamImageViewerModal`) mở ra và hiển thị ảnh câu hỏi sắc nét, phóng to thu nhỏ mượt mà, chuyển trang Next/Prev hoạt động bình thường.
3. **When** Sinh viên bấm "Tải file ZIP gốc", **Then** file zip tải về máy bình thường.

---

### User Story 2 – Sinh viên chưa mua môn học bị khóa bảo mật đúng quy định (Priority: P0)
Là chủ sở hữu nền tảng, tôi muốn đảm bảo tài liệu và hình ảnh PE vẫn được bảo vệ nghiêm ngặt bằng Row Level Security (RLS), người chưa mua môn học không thể truy cập trái phép URL ảnh Storage.

**Acceptance Criteria**:
1. **Given** Người dùng chưa mua môn học (hoặc chưa đăng nhập) đối với môn học có phí (`price > 0`), **When** gửi request tải ảnh trong `pe-extracts/` hoặc gọi `createSignedUrls`, **Then** Supabase Storage từ chối truy cập và không cấp signed URL.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Database RLS Function Update)**: Cập nhật hàm `public.can_access_theory_asset(_object_name text)` trên cơ sở dữ liệu Supabase:
  - Cho phép người dùng truy cập nếu `_object_name` khớp với `t.url`, hoặc xuất hiện trong `t.description`, hoặc nằm trong thư mục `pe-extracts/<theory_id>/...` của tài liệu thuộc môn học mà sinh viên đã mua (`user_subjects`) hoặc môn học miễn phí (`price <= 0`).
- **FR-002 (Anon Access for Free Subjects)**: Cập nhật policy `theory_assets_read_free_anon` trên `storage.objects` để khách vãng lai cũng xem được ảnh đề thi PE của các môn học miễn phí.
- **FR-003 (Frontend Resilience & Error Handling)**: Trong `SubjectDetailPage.tsx` và `ExamImageViewerModal.tsx`, thêm cơ chế xử lý lỗi `onError` cho thẻ ảnh (placeholder icon rõ ràng, tránh hiển thị biểu tượng icon ảnh gãy xấu xí của trình duyệt).
- **FR-004 (Dual-Repo Synchronization)**: Tự động chạy bộ kiểm thử `npm test`, commit và push lên cả 2 remote repositories: `origin` và `tqmaster`.

---

## 4. Key Entities & Files

### Key Entities
- **theories**: Bản ghi tài liệu, `description` chứa `preview_images` dạng `<!--PE_META:...-->`.
- **storage.objects**: Chứa các file ảnh đã trích xuất tại bucket `theory-images` đường dẫn `pe-extracts/<theory_id>/...`.
- **user_subjects**: Bảng phân quyền môn học cho từng sinh viên.

### Key Files
- `supabase/migrations/20260924200000_fix_pe_extracts_storage_access.sql`: Migration cập nhật hàm `can_access_theory_asset` và RLS policies.
- `src/pages/user/SubjectDetailPage.tsx`: Xử lý hiển thị filmstrip ảnh PE và fallback ảnh lỗi.
- `src/components/common/ExamImageViewerModal.tsx`: Xử lý hiển thị modal phóng to và fallback ảnh lỗi.

---

## 5. Success Criteria

- **SC-001**: 100% ảnh trong tab "Tài liệu PE / Video" hiển thị thành công khi đăng nhập tài khoản User thường.
- **SC-002**: Không làm gián đoạn quyền truy cập của tài khoản Admin.
- **SC-003**: Kiểm thử tự động (`npm test`) vượt qua 100%.
- **SC-004**: Đồng bộ git thành công lên cả 2 repositories (`origin` và `tqmaster`).
