# Implementation Plan: Chuyển Đổi & Di Chuyển Theory Files sang Google Drive (Spec 34)

## 1. Kiến trúc & Thiết kế Luồng Dữ liệu

```
[Supabase Storage: theory-files (473 MB)]
                │
                ▼ (Chạy script scripts/export_theories_to_local.mjs)
[Thư mục máy tính: downloaded_theories/]
    ├── DBI202/
    ├── PRJ301/
    ├── PRO192/
    └── ... (24 thư mục môn học)
                │
                ▼ (Người dùng kéo thả thư mục lên Google Drive & lấy link chia sẻ)
[Google Drive Cá nhân (15 GB Miễn phí, 0 Egress Fee)]
    └── TQMaster - Kho Tài Liệu/
                │
                ▼ (Cập nhật link Folder môn học vào AdminTheory / Database)
[Frontend: SubjectDetailPage.tsx]
    └── Nhận diện drive.google.com -> Hiển thị Card Google Drive Thư Mục Đẹp Mắt
                │
                ▼ (Chạy script scripts/clean_supabase_theory_files.mjs)
[Supabase Storage: Giảm 473 MB -> Còn ~489 MB (Gói Free mãi mãi!)]
```

---

## 2. Các Bước Triển Khai Kỹ Thuật

### Giai đoạn 1: Tải toàn bộ tài liệu về máy theo môn học
1. Viết script `scripts/export_theories_to_local.mjs`:
   - Truy vấn toàn bộ bản ghi `theories` có `type = 'file'` kèm quan hệ với `subjects`.
   - Tạo thư mục `downloaded_theories/<Tên_Môn_Học>/`.
   - Tải từng file từ Supabase Storage thông qua REST API có Authorization.
   - Lưu tên file gốc thân thiện (sử dụng `file_name` hoặc `title`).
   - Ghi file log `downloaded_theories/summary.json` tổng hợp danh sách và đường dẫn.

### Giai đoạn 2: Tối ưu UI hiển thị Link Google Drive trên Web
1. Cập nhật [`src/pages/user/SubjectDetailPage.tsx`](file:///d:/wd%20c%20sang%20d/Downloads/smart-curate-learn-main%20(2)/smart-curate-learn-main/src/pages/user/SubjectDetailPage.tsx):
   - Thêm hàm tiện ích `isGoogleDriveUrl(url: string): boolean`.
   - Nếu `url` là Google Drive:
     - Hiển thị Card phong cách hiện đại: Icon Google Drive, màu xanh thương hiệu, huy hiệu "Thư mục Google Drive".
     - Nút bấm chính: **"Mở Thư Mục Google Drive"** (mở tab mới, an toàn với `noopener noreferrer`).

### Giai đoạn 3: Dọn dẹp Supabase Storage để hạ cấp về Free
1. Viết script `scripts/clean_supabase_theory_files.mjs`:
   - Lấy danh sách toàn bộ object trong bucket `theory-files`.
   - Xóa theo batch (mỗi batch 50 files) thông qua Supabase Storage client.
   - Báo cáo số MB đã giải phóng thành công.

---

## 3. Kiểm thử & Đảm bảo Chất lượng
1. Viết unit test cho logic nhận diện Google Drive trong `SubjectDetailPage.test.tsx` hoặc module tiện ích.
2. Kiểm tra `npm test` và `npm run build` đạt 100% pass.
3. Chạy `graphify update .`.
4. Đẩy code lên cả 2 remote (`origin` và `tqmaster`).

