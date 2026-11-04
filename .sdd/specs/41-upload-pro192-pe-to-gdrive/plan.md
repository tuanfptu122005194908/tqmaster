# Technical Plan: Đẩy Tài Liệu PE PRO192 Lên Google Drive & Tích Hợp Web (Spec 41)

## 1. Kiến trúc Tổng thể & Dòng Dữ liệu

```
[downloaded_theories/PRO192...]
       │
       ├──> Đóng gói trọn bộ ZIP (.zip)
       │
       ├──> Google Drive API (Multipart Upload)
       │      └──> Tạo thư mục con trong 'Kỳ 2/PRO192' (ID: 169DaNM4A1jxlS4u_3bX0fOg28z2zkFSv)
       │      └──> Set role: reader, type: anyone
       │      └──> Tải toàn bộ files (.webp, .zip) + file nén trọn bộ
       │
       ├──> Supabase Storage (theory-images bucket)
       │      └──> pe-extracts/{theory_id}/{idx}_{timestamp}_{clean_name}
       │
       └──> Supabase Database REST API (PostgREST)
              ├──> INSERT INTO theories (id, title, url=Drive_URL, file_name, category='pe', ...)
              └──> INSERT INTO theory_subjects (theory_id, subject_id)
                     ├──> PRO192 (7af75eb1-b56d-4d46-8647-c9bfd9048d5e)
                     └──> PRO192 (Khoá Học) (e6688086-7449-4d87-89df-9dfc4337582e)
```

## 2. Chi tiết 4 Bộ Đề Cần Xử Lý

1. `PRO192 - SU26 - B1 - PE - Paper 10 [6984]`
   - Title: `Đề_Thi_PE_-_PRO192_-_SU26_-_B1_-_Paper_10`
   - Zip name: `Đề_Thi_PE_-_PRO192_-_SU26_-_B1_-_Paper_10.zip`
   - 5 ảnh câu hỏi (.webp) + 4 file material (.zip)

2. `PRO192 - SU26 - B1 - PE - Paper 9 [7044]`
   - Title: `Đề_Thi_PE_-_PRO192_-_SU26_-_B1_-_Paper_9`
   - Zip name: `Đề_Thi_PE_-_PRO192_-_SU26_-_B1_-_Paper_9.zip`
   - 5 ảnh câu hỏi (.webp) + 4 file material (.zip)

3. `PRO192 - SU26 - B5 - PE - NO2 [FuExam-1215]`
   - Title: `Đề_Thi_PE_-_PRO192_-_SU26_-_B5_-_NO2`
   - Zip name: `Đề_Thi_PE_-_PRO192_-_SU26_-_B5_-_NO2.zip`
   - 6 ảnh câu hỏi (.webp) + 1 file material (.zip)

4. `PRO192 - SU26 - PE - Paper 2 [7011]`
   - Title: `Đề_Thi_PE_-_PRO192_-_SU26_-_Paper_2`
   - Zip name: `Đề_Thi_PE_-_PRO192_-_SU26_-_Paper_2.zip`
   - 10 ảnh câu hỏi (.webp) + 4 file material (.zip)

## 3. Các Bước Triển Khai

1. **Khởi tạo kịch bản xử lý `scripts/upload_pro192_pe.py`**:
   - Tái sử dụng logic xác thực Google Drive qua OAuth Token refresh.
   - Thao tác nén in-memory `io.BytesIO` để không ghi tạm rác vào đĩa.
   - Gọi Supabase Storage API tải ảnh preview lên `theory-images`.
   - Ghi dữ liệu vào `theories` và `theory_subjects`.
2. **Thực thi script và kiểm tra logs**:
   - Theo dõi từng file được upload lên Google Drive.
   - Xác thực permission reader công khai.
   - Xác thực bản ghi trong cơ sở dữ liệu Supabase.
3. **Kiểm tra hiển thị Web**:
   - Chạy query kiểm tra API trả về cho subject `PRO192` và `PRO192 (Khoá Học)`.
   - Chạy kiểm thử tự động `npm test`.
4. **Git Sync & Hoàn Tất**:
   - Chạy `graphify update .`.
   - Commit thay đổi và push lên cả 2 remote `origin` và `tqmaster`.

