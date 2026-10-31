# Implementation Plan: Toàn diện Nén Ảnh WebP, Fallback Ảnh Lỗi & Công cụ Di trú Storage (Spec 32)

## 1. Kiến trúc Giải pháp

1. **Nén ảnh tự động tại mọi điểm Upload (`src/components/FileUploader.tsx`, `CartPage.tsx`, `AdminNews.tsx`, `AdminSettings.tsx`)**:
   - Trong `FileUploader.tsx`: Nếu `file.type.startsWith('image/')`, gọi `compressImageFile(file, bucket === 'thumbnails' ? 960 : 1280, 0.82)` từ `src/lib/imageUpload.ts` trước khi đẩy lên Supabase Storage, đồng thời đặt `cacheControl: LONG_CACHE_CONTROL` (`'31536000'`).
   - Trong `CartPage.tsx` (upload `bill-images`), `AdminNews.tsx` (upload `news-images`), `AdminSettings.tsx` (upload `qr-codes`): áp dụng `compressImageFile` và `LONG_CACHE_CONTROL`.

2. **Xử lý Fallback Ảnh Lỗi trên Giao diện (`SubjectCard.tsx` & `CourseListItem.tsx`)**:
   - Thêm state `const [imgError, setImgError] = useState(false)` (reset khi `subject.thumbnail_url` thay đổi).
   - Khi `subject.thumbnail_url && !imgError` mới hiển thị `<img>` kèm `onError={() => setImgError(true)}`.
   - Khi `!subject.thumbnail_url || imgError`, hiển thị giao diện Banner FPT University mặc định + chữ viết tắt `initials`.

3. **Script Di trú & Nén Storage (`scripts/migrate_and_compress_storage.mjs`)**:
   - Khởi tạo đầy đủ các Storage Buckets (`thumbnails`, `question-images`, `exam-images`, `theory-files`, `theory-images`, `announcement-images`, `news-images`, `bill-images`, `qr-codes`, `avatars`) kèm RLS policies trên project mới (`dkujrthjkefusiciyckd`).
   - Xuất danh sách toàn bộ file trong `storage.objects` của project cũ (`vhljgmtithjeovtrghvy`).
   - Hỗ trợ tải, nén ảnh nặng và đẩy sang project mới + cập nhật lại các cột URL trong Database mới.

