# Technical Plan: Sửa lỗi hiển thị ảnh đề thi PE / Video cho tài khoản User

**Feature Directory**: `.sdd/specs/19-fix-user-pe-images-access/`  
**Feature Branch**: `fix/user-pe-images-access`  
**Status**: ✅ Implemented  

---

## 1. Technical Architecture & Root Cause Analysis

### Hiện trạng:
1. Bucket `theory-images` và `theory-files` là **private** (`public: false`), được bảo vệ bởi Row Level Security (RLS) trên `storage.objects`.
2. Khi client tải ảnh đề thi PE:
   - Client gọi `signStorageUrls(urls)` để sinh temporary signed URL (hạn dùng 4h) qua Supabase Storage API `createSignedUrls`.
   - Supabase Storage chạy câu truy vấn SQL kiểm tra quyền đọc trên `storage.objects`.
   - Policy `theory_assets_read` áp dụng:
     ```sql
     USING (
       bucket_id IN ('theory-files','theory-images')
       AND (
         public.has_role(auth.uid(), 'admin')
         OR public.can_access_theory_asset(name)
       )
     )
     ```
   - Hàm `can_access_theory_asset(_object_name text)` hiện tại:
     ```sql
     AND (t.url LIKE '%/' || _object_name OR t.url LIKE '%/' || _object_name || '?%')
     ```
3. Đối với đề thi PE trích xuất từ file ZIP:
   - `t.url` là file ZIP (`.../theory-files/1778174687530-1atoau.zip`).
   - `_object_name` là đường dẫn ảnh câu hỏi (`pe-extracts/6110e9b9-e594-4c26-9013-b07e9a55e983/01_1790135094502_q1.jpg`).
   - `_object_name` nằm trong `t.description` (dưới dạng URL trong JSON metadata) hoặc có định dạng thư mục `pe-extracts/<theory_id>/...`.
   - Do đó, điều kiện `t.url LIKE ...` trả về `false`.
   - Vì user thường không có role `admin`, `theory_assets_read` từ chối quyền truy cập của user đối với các object ảnh câu hỏi này!
   - Hàm `createSignedUrls` thất bại -> trả về link public cũ -> trình duyệt load link public của private bucket -> HTTP 400 `Bucket not found` -> Ảnh bị vỡ.

---

## 2. Implementation Steps

### Bước 1: Tạo Migration SQL cập nhật Hàm Phân Quyền & RLS Policies
Tạo file migration `supabase/migrations/20260924200000_fix_pe_extracts_storage_access.sql`:
```sql
CREATE OR REPLACE FUNCTION public.can_access_theory_asset(_object_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.theories t
    JOIN public.theory_subjects ts ON ts.theory_id = t.id
    JOIN public.subjects s ON s.id = ts.subject_id
    WHERE s.is_active = true
      AND (
        t.url LIKE '%/' || _object_name 
        OR t.url LIKE '%/' || _object_name || '?%'
        OR t.description LIKE '%' || _object_name || '%'
        OR (_object_name LIKE 'pe-extracts/' || t.id::text || '/%')
      )
      AND (
        s.price <= 0
        OR EXISTS (
          SELECT 1 FROM public.user_subjects us
          WHERE us.subject_id = s.id AND us.user_id = auth.uid()
        )
      )
  );
$$;

DROP POLICY IF EXISTS "theory_assets_read_free_anon" ON storage.objects;
CREATE POLICY "theory_assets_read_free_anon"
ON storage.objects FOR SELECT
TO anon
USING (
  bucket_id IN ('theory-files','theory-images')
  AND EXISTS (
    SELECT 1
    FROM public.theories t
    JOIN public.theory_subjects ts ON ts.theory_id = t.id
    JOIN public.subjects s ON s.id = ts.subject_id
    WHERE s.is_active = true
      AND s.price <= 0
      AND (
        t.url LIKE '%/' || storage.objects.name 
        OR t.url LIKE '%/' || storage.objects.name || '?%'
        OR t.description LIKE '%' || storage.objects.name || '%'
        OR (storage.objects.name LIKE 'pe-extracts/' || t.id::text || '/%')
      )
  )
);
```

### Bước 2: Thực thi Migration lên Database Supabase Đang Hoạt Động
Sử dụng Supabase CLI:
```bash
npx supabase db query --linked --project-ref vhljgmtithjeovtrghvy --file supabase/migrations/20260924200000_fix_pe_extracts_storage_access.sql
```

### Bước 3: Cập nhật Frontend UI Error Boundaries & Image Fallback
Trong `SubjectDetailPage.tsx` và `ExamImageViewerModal.tsx`:
- Bổ sung `onError` cho các thẻ ảnh:
  - Nếu ảnh bị lỗi kết nối hoặc chưa tải được, hiển thị giao diện fallback lịch sự (icon ảnh kèm số câu) thay vì icon ảnh hỏng.
- Đảm bảo animation và loading state mượt mà chuẩn TQMaster Dashboard Theme.

### Bước 4: Kiểm thử Tự động & Xác minh End-to-End
1. Chạy test case so khớp quyền truy cập của User trên database thực tế.
2. Chạy toàn bộ test suite:
   ```bash
   npm test
   ```
3. Cập nhật Knowledge Graph:
   ```bash
   graphify update .
   ```

### Bước 5: Dual Push lên 2 Repositories
```bash
git push origin <branch>
git push tqmaster <branch>
```
