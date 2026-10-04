# Feature Specification: Subject Catalog & Theory Management

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Optimized v2.1)

---

## 1. Overview
Hệ thống quản trị môn học (`/admin/subjects`) và tài liệu lý thuyết/PE (`/admin/theory`) là trung tâm tổ chức nội dung số của TQMaster. Quản trị viên sử dụng hệ thống này để xây dựng lộ trình học tập từ Kỳ 1 đến Kỳ 9, thiết lập giá bán (học phí), và đăng tải tài liệu học tập.

Đặc biệt, module quản trị tài liệu PE được tích hợp công cụ giải nén ZIP trực tiếp trên trình duyệt (Web-based ZIP Extraction), cho phép admin tự động giải nén file đề thi PE (.zip), đọc file ảnh bên trong, tải lên Supabase Storage và lưu trữ mảng URL ảnh dạng JSON metadata vào trường `description` để học viên có thể xem trước.

---

## 2. User Scenarios & Testing

### User Story 1 – Quản trị và Deep-Copy Môn học (Priority: P1)
Là một Quản trị viên, tôi muốn tạo, sửa, ẩn/hiện môn học và đặc biệt là có khả năng sao chép toàn bộ bộ đề thi của một môn học sang một bản sao mới để tái sử dụng.

**Acceptance Scenarios**:
1. **Given** Quản trị viên ở `/admin/subjects`, **When** nhấn "Nhân bản" (Copy) một môn học, **Then** hệ thống thực hiện sao chép sâu (deep-copy): tạo môn học mới (thêm hậu tố "Bản sao"), đồng thời sao chép toàn bộ các Đề thi (Exams), Câu hỏi (Questions), và Đáp án (Options) của môn học đó sang bộ đề mới.
2. **Given** danh sách môn học, **When** Quản trị viên nhấn nút toggle kích hoạt (`is_active`), **Then** môn học lập tức ẩn/hiện trên trang chủ của học viên.
3. **Given** thẻ thống kê tổng quan ở trên cùng, **Then** hiển thị tổng số môn học, số môn đang hoạt động, số môn đã ẩn, và số kỳ học trung bình, cùng với doanh thu tính toán real-time theo mỗi môn.

### User Story 2 – Quản trị Tài liệu & Giải nén ZIP PE (Priority: P1)
Là một Quản trị viên, tôi muốn tải lên các file tài liệu, link video hoặc file ZIP đề thi PE và liên kết chúng với các môn học tương ứng.

**Acceptance Scenarios**:
1. **Given** Quản trị viên ở `/admin/theory`, **When** thêm tài liệu mới phân loại "Tài liệu PE / Video" và dán URL hoặc tải lên file `.zip`, **Then** tài liệu được lưu với mảng `preview_images` rỗng trong `description`.
2. **Given** danh sách tài liệu PE dạng ZIP chưa được giải nén, **When** Quản trị viên nhấn nút "Trích xuất ảnh (1-Click)", **Then** hệ thống tải file ZIP về bộ nhớ trình duyệt, đọc danh sách file, lọc ra các file ảnh (png, jpg, webp), upload chúng lên Supabase, và cập nhật tự động `preview_images` vào metadata của tài liệu đó.
3. **Given** một file ZIP đã giải nén xong, **When** nhấn nút xem trước, **Then** modal `ExamImageViewerModal` hiện lên với danh sách ảnh chất lượng cao để admin kiểm tra.

### User Story 3 – Tìm kiếm và lọc tài liệu (Priority: P2)
Là một Quản trị viên, tôi muốn tìm kiếm tài liệu nhanh chóng bằng cách lọc theo môn học hoặc theo phân loại (Lý thuyết / PE).

**Acceptance Scenarios**:
1. **Given** thanh công cụ tìm kiếm, **When** chọn môn "Ngoại ngữ" và tab "Tài liệu PE", **Then** danh sách ngay lập tức hiển thị chỉ các tài liệu thuộc môn đó.
2. **When** nhập từ khóa vào ô tìm kiếm, **Then** hệ thống tìm trong cả tiêu đề và nội dung description metadata.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Subject Deep Copy)**: Hàm `copy(subject)` trong `AdminSubjects.tsx` PHẢI thực hiện chuỗi giao dịch: `INSERT subject` -> lấy `exam_subjects` -> `INSERT exams` -> `INSERT exam_subjects` -> `INSERT questions` -> `INSERT question_options`.
- **FR-002 (Web-ZIP Extraction)**: Sử dụng module `peZipExtractor.ts` (dựa trên thư viện `jszip`) để tải, giải nén ZIP in-memory, lọc các file MIME type image, tạo tên UUID an toàn và đưa lên storage bucket.
- **FR-003 (Theory Metadata Structure)**: Vì bảng `theories` không có cột mảng ảnh, ứng dụng PHẢI lưu trữ cấu trúc JSON vào trường `description` thông qua hàm `formatTheoryDescription(desc, preview_images)` và đọc bằng `parseTheoryDescription(desc)`.
- **FR-004 (Real-time Subject Stats)**: Doanh thu của từng môn học (`salesCount` và `revenue`) được tính toán động (client-side) bằng cách ghép nối với bảng `order_items` từ các đơn hàng có trạng thái `approved`.
- **FR-005 (Theory Types)**: Hỗ trợ 3 định dạng hiển thị: `file` (File/Video), `link` (Liên kết ngoài), `image` (Hình ảnh/Sơ đồ). Một tài liệu có thể mapping nhiều môn học qua bảng `theory_subjects`.

### Key Entities

**Table: subjects**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | Tên môn học |
| `semester` | int | Kỳ học (1-9) |
| `price` | numeric | Học phí / Giá gốc |
| `is_active` | bool | Ẩn/Hiện trên ứng dụng |

**Table: theories**
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `title` | text | Tên tài liệu |
| `description` | text | Nội dung mô tả + Chứa Metadata mảng `preview_images` JSON |
| `type` | text | `file`, `link`, `image` |
| `category`| text | `theory`, `pe` |
| `url` | text | Đường dẫn file hoặc liên kết gốc |

**Table: theory_subjects**
| Column | Type | Notes |
|---|---|---|
| `theory_id` | uuid | Tham chiếu `theories.id` |
| `subject_id` | uuid | Tham chiếu `subjects.id` |

### Key Files
- `src/pages/admin/AdminSubjects.tsx`: Chứa logic deep-copy (nhân bản môn học, đề thi) và tính toán doanh thu.
- `src/pages/admin/AdminTheory.tsx`: Quản lý tài liệu, tích hợp luồng xử lý Web-ZIP Extraction bằng `peZipExtractor`.
- `src/lib/peZipExtractor.ts`: Hàm hỗ trợ tải file `.zip` từ URL, giải nén và lọc ảnh.
- `src/components/common/ExamImageViewerModal.tsx`: Xem trước ảnh trích xuất từ đề thi PE.

---

## 4. Success Criteria
- **SC-001**: Tính năng "Nhân bản môn học" hoạt động chính xác, đảm bảo 100% câu hỏi và đáp án của môn cũ được đưa sang môn mới nguyên vẹn.
- **SC-002**: Tính năng trích xuất ảnh từ file ZIP PE trên trình duyệt thành công đối với các file < 50MB mà không làm sập (crash/OOM) trình duyệt.
- **SC-003**: Dữ liệu mảng hình ảnh `preview_images` được chuỗi hóa (serialize) thành công vào trường `description` dưới dạng JSON ẩn và giải mã chính xác khi load lên UI.
- **SC-004**: Tốc độ tải trang quản trị < 1500ms. Mọi hành động ẩn/hiện, sửa, xóa đều có cảnh báo rủi ro xác nhận (confirm).
