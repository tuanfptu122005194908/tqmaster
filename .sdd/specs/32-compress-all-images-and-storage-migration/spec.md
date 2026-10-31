# Feature Specification: Toàn diện Nén Ảnh WebP, Fallback Ảnh Lỗi & Công cụ Di trú Storage (Spec 32)

**Status**: Approved
**Created**: 2026-10-31
**Feature Directory**: `.sdd/specs/32-compress-all-images-and-storage-migration/`

## 1. Overview & Problem Statement

Sau khi kiểm tra bảng `storage.objects` trên project cũ (`vhljgmtithjeovtrghvy`), tổng dung lượng Storage là **1,353.11 MB (14,762 files)**, trong đó nguyên nhân chính làm nổ **148.476 GB Cached Egress** và **1.35 GB Storage** là:
1. **`thumbnails` (Ảnh bìa môn học)**: Chỉ có **70 file nhưng nặng tới `230.58 MB`** (trung bình **3.3 MB – 8 MB / 1 ảnh PNG** chưa nén). Mỗi lần học sinh vào trang chủ (`HomePage`), trình duyệt phải tải hàng chục ảnh PNG nặng hàng trăm MB.
2. **`bill-images` (Ảnh chụp màn hình chuyển khoản)**: **523 file = `147.35 MB`** (ảnh chụp màn hình điện thoại nguyên gốc 1–4 MB/ảnh).
3. **`announcement-images` & `news-images`**: **13 file = `35.21 MB`** (~2.8 MB/ảnh).
4. **Hiện tượng mất ảnh trên DB mới (`dkujrthjkefusiciyckd`)**:
   - Các cột `thumbnail_url`, `image_url`, `file_url` trong DB mới vẫn đang trỏ về URL của project cũ (`https://vhljgmtithjeovtrghvy.supabase.co/storage/v1/...`), vốn đang bị Supabase khóa cổng Storage với mã lỗi `HTTP 402`.
   - Component [`SubjectCard.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/components/SubjectCard.tsx) và [`CourseListItem.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/components/home/CourseListItem.tsx) render thẻ `<img>` trực tiếp mà không có `onError` fallback, khiến trang chủ hiển thị icon ảnh gãy thay vì hiển thị giao diện Banner FPT University mặc định.

## 2. User Scenarios & Acceptance Criteria (Given-When-Then)

### Scenario 1: Tự động nén mọi ảnh upload qua Admin & Giỏ hàng sang WebP siêu nhẹ
- **Given**: Admin tải ảnh bìa môn học (`thumbnails`), ảnh thông báo (`announcement-images`), ảnh tin tức (`news-images`), mã QR (`qr-codes`) hoặc học sinh tải ảnh bill chuyển khoản (`bill-images`).
- **When**: Chọn một file ảnh PNG/JPEG nặng 3–8 MB để tải lên.
- **Then**: Hệ thống tự động nén ảnh qua `compressImageFile` sang định dạng `image/webp` (giới hạn kích thước hợp lý: `800px` cho thumbnail/QR, `1200px` cho bill/thông báo/tin tức) giúp dung lượng giảm **90–98%** (chỉ còn ~20–60 KB/ảnh) và đặt `cacheControl: '31536000'` (1 năm).

### Scenario 2: Tự động hiển thị Banner đẹp khi URL ảnh bị lỗi (Fallback Graceful Degradation)
- **Given**: Môn học có `thumbnail_url` trỏ tới link cũ đang bị lỗi 402/404 hoặc không tải được.
- **When**: Học sinh mở Trang chủ (`HomePage`) ở chế độ Lưới (`SubjectCard`) hoặc Danh sách (`CourseListItem`).
- **Then**: Thẻ `<img>` bắt sự kiện `onError`, tự động ẩn icon ảnh lỗi và chuyển sang hiển thị Banner thiết kế sẵn (*FPT University - Tài liệu & Đề thi chuẩn* kèm mã môn học viết tắt) đẹp mắt, không còn bất kỳ icon ảnh rách nào.

### Scenario 3: Công cụ Di trú & Nén toàn bộ ảnh từ Project cũ sang Project mới
- **Given**: Danh sách 14,762 đối tượng trong `storage.objects` của project cũ (`vhljgmtithjeovtrghvy`).
- **When**: Thực thi script `scripts/migrate_and_compress_storage.mjs` (khi cổng Storage cũ truy cập được hoặc từ thư mục ảnh cục bộ) và dọn dẹp các file rác (`bill-images`, `chat-images`) trên DB cũ.
- **Then**:
  - Script tự động tải từng file từ project cũ, dùng `sharp` (hoặc thuật toán nén) chuyển các ảnh nặng sang WebP nhẹ hơn 85–95%, đẩy lên các bucket tương ứng ở project mới (`dkujrthjkefusiciyckd`), và cập nhật toàn bộ URL trong Database mới sang `https://dkujrthjkefusiciyckd.supabase.co/storage/v1/...`.

## 3. Functional Requirements

- **FR-001**: Cập nhật [`FileUploader.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/components/FileUploader.tsx) để tự động nén mọi file `image/*` bằng `compressImageFile` (WebP, `maxDim = 960` cho `thumbnails`, `1280` cho các bucket ảnh khác) và đặt `cacheControl: LONG_CACHE_CONTROL` (`31536000`).
- **FR-002**: Cập nhật [`CartPage.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/user/CartPage.tsx), [`AdminNews.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/admin/AdminNews.tsx), và [`AdminSettings.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/admin/AdminSettings.tsx) để nén ảnh (`bill-images`, `news-images`, `qr-codes`) qua `compressImageFile` trước khi upload.
- **FR-003**: Bổ sung state `imgError` + `onError={() => setImgError(true)}` vào [`SubjectCard.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/components/SubjectCard.tsx) và [`CourseListItem.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/components/home/CourseListItem.tsx) để hiển thị giao diện fallback ngay lập tức khi ảnh không tải được.
- **FR-004**: Xây dựng script `scripts/migrate_and_compress_storage.mjs` hỗ trợ:
  1. Dọn dẹp metadata các bucket không cần thiết trên DB cũ (`bill-images`, `chat-images`, `backup-uploads`) để giảm Storage size của project cũ xuống dưới ngưỡng 1 GB.
  2. Tải, nén ảnh nặng và đồng bộ toàn bộ Storage + rewrite URL từ `vhljgmtithjeovtrghvy` sang `dkujrthjkefusiciyckd`.

## 4. Key Entities & Key Files

- [`src/components/FileUploader.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/components/FileUploader.tsx)
- [`src/components/SubjectCard.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/components/SubjectCard.tsx)
- [`src/components/home/CourseListItem.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/components/home/CourseListItem.tsx)
- [`src/pages/user/CartPage.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/user/CartPage.tsx)
- [`src/pages/admin/AdminNews.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/admin/AdminNews.tsx)
- [`src/pages/admin/AdminSettings.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/admin/AdminSettings.tsx)
- `scripts/migrate_and_compress_storage.mjs`

## 5. Success Criteria

- **SC-001**: Ảnh bìa môn học (`thumbnails`) hoặc ảnh bill/thông báo khi tải lên giảm 90–98% dung lượng (từ 3–8 MB PNG xuống 25–60 KB WebP) với `cacheControl = 31536000`.
- **SC-002**: Trang chủ (`HomePage`) không còn hiển thị bất kỳ icon ảnh gãy nào khi URL ảnh bị lỗi 402/404.
- **SC-003**: Toàn bộ unit tests (`npm test`) và build (`npm run build`) pass 100%.

