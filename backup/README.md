# Backup dữ liệu (SQL INSERT)

Thư mục này chứa công cụ xuất **toàn bộ dữ liệu** trong database ra các file `.sql`
gồm các câu lệnh `INSERT`, có thể dán thẳng vào **Supabase SQL Editor** của project mới.

## Chạy xuất dữ liệu

```bash
bash backup/export_data.sh            # ghi ra /mnt/documents/backup
bash backup/export_data.sh <thư_mục>  # hoặc chỉ định thư mục khác
```

File kết quả **không** được lưu trong repo vì dung lượng rất lớn (~100MB).

## Thứ tự file

Mỗi bảng một file, đánh số `01` → `25` theo đúng thứ tự phụ thuộc khoá ngoại.
Chạy lần lượt từ `01` đến `25`.

## Lưu ý quan trọng

- Phải tạo **schema** (bảng, RLS, function, trigger) ở project mới **trước**.
- Tài khoản trong `auth.users` phải được chuyển sang trước và **giữ nguyên UUID**,
  nếu không `01_profiles.sql` sẽ lỗi khoá ngoại.
- Mỗi file bọc trong `BEGIN/COMMIT` và tạm tắt trigger (`session_replication_role = replica`).
- Mọi câu lệnh đều có `ON CONFLICT DO NOTHING` nên chạy lại nhiều lần vẫn an toàn.
- Ảnh/tệp trong Storage **không** nằm trong file SQL — dùng chức năng "Sao lưu toàn bộ + media"
  trong trang Quản trị → Sao lưu để lấy media.
