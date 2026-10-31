# Tasks: Toàn diện Nén Ảnh WebP, Fallback Ảnh Lỗi & Công cụ Di trú Storage (Spec 32)

- [x] **Task 1**: Nâng cấp `src/components/FileUploader.tsx` để tự động nén ảnh sang WebP (`compressImageFile`) và đặt `cacheControl: '31536000'`.
- [x] **Task 2**: Áp dụng `compressImageFile` + `LONG_CACHE_CONTROL` cho `CartPage.tsx` (`bill-images`) và `AdminNews.tsx` (`news-images`).
- [x] **Task 3**: Thêm xử lý `onError` fallback vào `src/components/SubjectCard.tsx` và `src/components/home/CourseListItem.tsx` để ẩn icon ảnh gãy và hiện Banner FPT University mặc định.
- [x] **Task 4**: Tạo đầy đủ các Storage Buckets trên project mới (`dkujrthjkefusiciyckd`), xuất danh sách 14,176 files sang `backup_sql/storage_objects_inventory.json` và viết script `scripts/migrate_and_compress_storage.mjs` để di trú + nén ảnh từ project cũ sang project mới.
- [x] **Task 5**: Chạy `npm test`, `npm run build`, cập nhật `graphify update .`, và push lên cả 2 repositories (`origin` và `tqmaster`).
