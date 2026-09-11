# Tăng tốc sao lưu và khôi phục ZIP

## Mục tiêu
- Vẫn sao lưu đầy đủ dữ liệu và toàn bộ ảnh/tệp.
- Tải xuống và tải lên song song để giảm đáng kể thời gian chờ.
- Giữ giới hạn đồng thời an toàn, retry khi lỗi và báo cáo tiến trình chính xác.

## Thay đổi
- Đọc nhiều bảng dữ liệu song song thay vì lần lượt, nhưng vẫn ghi manifest theo thứ tự ổn định.
- Liệt kê các kho lưu trữ song song và tăng hàng đợi tải media có giới hạn.
- Khi khôi phục, giải nén và tải nhiều media lên song song; retry lỗi tạm thời và gom chi tiết lỗi.
- Ghi dữ liệu theo từng nhóm bảng phụ thuộc; các bảng độc lập trong cùng nhóm được khôi phục song song để không phá khóa ngoại.
- Cập nhật thông báo tiến trình để hiển thị số bảng/tệp đã hoàn thành.

## Kiểm tra
- Kiểm tra kiểu dữ liệu và trạng thái build.
- Kiểm tra các trường hợp ZIP không có media, thiếu bucket, lỗi từng file và dry-run.
