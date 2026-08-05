# Tool Viết Lại Đề - Groq Vision Edition

## Cách dùng

1. Bỏ toàn bộ ảnh đề thi (`.png/.jpg/.jpeg/.webp`) vào thư mục `input_images/`
   - Có thể bỏ thẳng vào `input_images/` (flat mode) hoặc
   - Tạo subfolder bên trong để mỗi subfolder xuất 1 file DOCX riêng

2. Chạy file `chay_extract.bat`

3. Kết quả trong thư mục `output/`:
   - `TenFolder.docx` — file đề thi đã format
   - `TenFolder_raw.json` — dữ liệu JSON thô để debug (kiểm tra nếu có lỗi)

## Yêu cầu cài đặt

```
pip install -r requirements.txt
```

Chỉ cần 3 thư viện nhẹ: `groq`, `python-docx`, `json-repair`

**Không cần** EasyOCR, không cần GPU, không cần tải model.

## Pipeline

```
[Ảnh] ──(base64)──> [Groq Vision API] ──(JSON)──> [DOCX + JSON]
                     6 ảnh song song
```

- Dùng Groq Vision model `llama-4-scout` đọc trực tiếp từ ảnh → chính xác hơn EasyOCR
- Chạy **6 ảnh song song** → nhanh hơn nhiều lần so với EasyOCR tuần tự
- Tự động retry khi rate limit
- Gom toàn bộ JSON vào 1 file raw để debug dễ dàng

## Cấu hình

Mở `extract.py` để chỉnh:

| Biến | Mặc định | Ý nghĩa |
|------|----------|---------|
| `GROQ_API_KEYS` | 2 keys | Thêm key để tăng tốc |
| `MAX_WORKERS` | 6 | Số ảnh xử lý song song |
| `MAX_JSON_RETRIES` | 3 | Số lần thử lại nếu lỗi JSON |

## Khi gặp lỗi thiếu đáp án

1. Mở file `output/TenFolder_raw.json`
2. Tìm câu bị lỗi theo `_source_file`
3. Kiểm tra field `uncertain_parts` — Groq sẽ ghi rõ phần nào bị watermark che
