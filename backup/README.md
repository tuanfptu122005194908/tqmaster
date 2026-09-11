# Backup dữ liệu (SQL INSERT)

Thư mục này chứa công cụ xuất **toàn bộ dữ liệu** trong database ra các file `.sql`
gồm các câu lệnh `INSERT`, có thể dán thẳng vào **SQL Editor** của hệ thống mới.

## Chạy xuất dữ liệu

```bash
bash backup/export_data.sh            # ghi ra /mnt/documents/backup
bash backup/export_data.sh <thư_mục>  # hoặc chỉ định thư mục khác
PGURL="postgresql://..." bash backup/export_data.sh   # chỉ định kết nối database
```

File kết quả **không** được lưu trong repo vì dung lượng rất lớn (~100MB).

## Thứ tự file

Mỗi bảng một file, đánh số theo đúng thứ tự phụ thuộc khoá ngoại. Chạy lần lượt từ file `01`.

## Lưu ý quan trọng

- Phải tạo **schema** (bảng, RLS, function, trigger) ở hệ thống mới **trước**.
- Tài khoản đăng nhập phải được chuyển sang trước và **giữ nguyên UUID**,
  nếu không `01_profiles.sql` sẽ lỗi khoá ngoại.
- Mỗi file bọc trong `BEGIN/COMMIT` và tạm tắt trigger (`session_replication_role = replica`).
- Mọi câu lệnh đều có `ON CONFLICT DO NOTHING` nên chạy lại nhiều lần vẫn an toàn.
- Bảng `signup_otps` (mã OTP tạm thời) **không** được xuất vì lý do bảo mật.
- Ảnh/tệp trong Storage **không** nằm trong file SQL — dùng chức năng
  **Quản trị → Sao lưu → Sao lưu toàn bộ + media** để lấy media.

## Kho lưu trữ (Storage) khi chuyển hệ thống

Trước khi khôi phục media, hệ thống mới phải có sẵn các kho lưu trữ cùng tên:

| Kho | Công khai |
| --- | --- |
| thumbnails, qr-codes, announcement-images, avatars, news-images, chat-images | Có |
| theory-files, theory-images, question-images, exam-images, bill-images | Không (chỉ xem qua link tạm thời) |

Nếu thiếu kho nào, trang Khôi phục sẽ báo tên kho đó để tạo trước rồi chạy lại phần media.
