# Feature Specification: PE Document ZIP Image Extraction & Inline Exam Viewer

**Feature Directory**: `.sdd/specs/18-pe-document-zip-preview/`  
**Feature Branch**: `[main]`  
**Status**: ✅ Implemented (Tested & Verified)  
**Priority**: High  

---

## 1. Overview

Trong mục **Tài liệu PE / Video** (`category: 'pe'`), hầu hết tài liệu ôn thi thực hành (PE) của sinh viên FPT (như FER202, PRO192, DBI202, CSD203, SWT301...) được lưu trữ dưới dạng file nén `.zip` chứa các ảnh chụp đề thi từng câu (ví dụ: `Question1.png`, `Question2.png`...) cùng với source code template hoặc file hướng dẫn.

Hiện tại:
- Quản trị viên chỉ có thể upload file `.zip` thô lên bucket `theory-files`.
- Sinh viên chỉ có nút bấm "Tải về" để tải toàn bộ file `.zip` về máy, giải nén thủ công thì mới xem được các câu hỏi / ảnh đề thi.

Mục tiêu nâng cấp:
1. **Thêm tính năng Upload ZIP thông minh cho Admin**: Khi upload file `.zip` trong mục PE, hệ thống vẫn lưu trữ file `.zip` gốc trên Storage để sinh viên tải về, đồng thời tự động quét và trích xuất toàn bộ ảnh chụp đề thi bên trong file `.zip`, tải ảnh lên `theory-images` và lưu liên kết ảnh vào tài liệu.
2. **Thêm tính năng Chuyển đổi / Trích xuất trực tiếp trên web cho các tài liệu ZIP đã upload từ trước**: Admin có thể bấm nút trích xuất 1-click hoặc chuyển đổi hàng loạt cho các tài liệu PE hiện có mà không cần tải lại file.
3. **Hiển thị ảnh đề thi trực tiếp trên Web như mục đề thi**: Tại trang chi tiết môn học (`SubjectDetailPage.tsx` tab PE) và trang quản trị (`AdminTheory.tsx`), đề thi PE hiển thị bộ sưu tập ảnh đề thi trực quan, kèm chế độ xem ảnh toàn màn hình (**Exam Image Viewer Modal**) có phóng to/thu nhỏ, chuyển trang (Next/Prev/Phím mũi tên), thanh thumbnail điều hướng nhanh, và nút tải file `.zip` gốc vẫn được giữ nguyên vẹn 100%.

> ⚠️ **Phạm vi nghiêm ngặt**: Chỉ áp dụng cho tài liệu PE / Video (`category: 'pe'`), không can thiệp hoặc thay đổi các phần khác của hệ thống.

---

## 2. User Scenarios & Acceptance Criteria (Given - When - Then)

### User Story 1 – Trích xuất ảnh tự động khi Upload file ZIP mới (Priority: P1)
Là một Quản trị viên, tôi muốn khi upload file `.zip` đề thi PE thì hệ thống vừa giữ nguyên file `.zip` để tải về, vừa tự động giải nén và trích xuất toàn bộ ảnh đề thi để sinh viên xem trực tiếp trên web.

**Acceptance Criteria**:
1. **Given** Admin mở form thêm/sửa tài liệu tại `/admin/theories` và chọn danh mục "Tài liệu PE / Video", **When** Admin chọn tải lên một file `.zip` (ví dụ: `De_Thi_PE_PRO192_FA25.zip`), **Then** hệ thống đọc file `.zip` qua `JSZip`, tìm thấy các file ảnh (.png, .jpg, .jpeg, .webp, .gif), hiển thị số lượng ảnh tìm thấy và khung xem trước các thumbnail ảnh ngay trong modal.
2. **When** Admin bấm "Tạo tài liệu" / "Lưu thay đổi", **Then** hệ thống lưu file `.zip` gốc vào bucket `theory-files`, upload các file ảnh trích xuất vào bucket `theory-images`, và cập nhật thông tin ảnh vào bản ghi tài liệu.
3. **Then** Bản ghi tài liệu vừa có đường link tải file `.zip` gốc, vừa có danh sách ảnh câu hỏi đề thi để hiển thị trực tiếp.

---

### User Story 2 – Chuyển đổi / Trích xuất ảnh trực tiếp trên Web cho các file ZIP đã upload sẵn (Priority: P1)
Là một Quản trị viên, vì đã upload nhiều file `.zip` đề thi PE từ trước, tôi muốn có nút bấm trực tiếp trên web để hệ thống tự động tải file zip, giải nén và trích xuất ảnh mà không bắt tôi phải tải về rồi upload lại.

**Acceptance Criteria**:
1. **Given** Danh sách tài liệu PE tại `/admin/theories` chứa các tài liệu có file đính kèm `.zip`, **When** Admin bấm nút "⚡ Trích xuất ảnh từ ZIP" trên một tài liệu, **Then** hệ thống tải file zip từ signed URL trong bộ nhớ trình duyệt, dùng `JSZip` giải nén, sắp xếp các ảnh theo thứ tự tự nhiên (natural alphanumeric order: 1, 2, ... 10), upload lên `theory-images` và cập nhật bản ghi tài liệu.
2. **Given** File zip không chứa bất kỳ ảnh nào, **When** Admin bấm trích xuất, **Then** hệ thống hiển thị thông báo rõ ràng "File zip này không chứa hình ảnh (.png, .jpg...)" và giữ nguyên file zip gốc mà không gây lỗi.
3. **Given** Màn hình quản trị PE, **When** Admin muốn xử lý nhanh tất cả các file zip cũ, **Then** có tính năng "Trích xuất ảnh ZIP hàng loạt" hiển thị tiến trình xử lý từng file (X / Tổng số).

---

### User Story 3 – Xem ảnh đề thi trực tiếp trên Web như mục đề thi cho Sinh viên (Priority: P1)
Là một Sinh viên đã mua môn học, khi vào tab "Tài liệu PE / Video", tôi muốn xem được ngay các câu hỏi / ảnh đề thi trực tiếp trên giao diện web mà không bắt buộc phải download và giải nén file zip về máy tính.

**Acceptance Criteria**:
1. **Given** Sinh viên truy cập trang chi tiết môn học (`/subjects/:id`) tại tab "Tài liệu PE / Video", **When** một đề thi PE có ảnh trích xuất, **Then** giao diện hiển thị thẻ đề thi với tiêu đề, mô tả, nút "Tải về file ZIP gốc", và một dải ảnh xem trước (preview grid / filmstrip) kèm số lượng ảnh (ví dụ: "📸 8 trang đề thi").
2. **When** Sinh viên bấm vào bất kỳ ảnh nào hoặc nút "Xem đề thi", **Then** hệ thống mở **Exam Image Viewer Modal** toàn màn hình:
   - Hiển thị ảnh sắc nét, căn giữa với nền tối tập trung.
   - Nút Next / Prev và hỗ trợ phím mũi tên bàn phím (`ArrowLeft`, `ArrowRight`, `Esc`) để lật qua các trang câu hỏi.
   - Hiển thị bộ đếm trang: `Trang X / Tổng số Y`.
   - Nút phóng to / thu nhỏ (Zoom In, Zoom Out, Fit).
   - Nút "Tải file ZIP gốc" ngay trong viewer modal để tiện tải tài liệu bất cứ lúc nào.
3. **Given** Tài liệu PE không có ảnh (hoặc là video/link), **Then** giao diện hiển thị gọn gàng như hiện tại, không bị vỡ giao diện.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (ZIP Inspection & Image Extraction Utility)**: Tạo module `peZipExtractor.ts` sử dụng `JSZip` để:
  - Phân tích file zip (từ `File` / `Blob` hoặc từ remote URL).
  - Bỏ qua các file rác của hệ điều hành (`__MACOSX`, `.DS_Store`, `Thumbs.db`).
  - Lọc các định dạng ảnh: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.bmp`.
  - Sắp xếp thứ tự ảnh theo chuẩn `localeCompare` tự nhiên (ví dụ: `Question1.png`, `Question2.png` ... `Question10.png`).
- **FR-002 (Non-destructive Metadata Storage)**: Tạo module `theoryMetadata.ts` để:
  - Lưu trữ danh sách `preview_images: string[]` an toàn trong trường `description` dưới dạng block metadata ẩn chuẩn `<!--PE_META:{"preview_images":[...]}-->` hoặc JSON payload.
  - Phân tách trong suốt giữa mô tả văn bản của người dùng (`cleanDescription`) và danh sách URL ảnh.
  - Tương thích 100% với PostgreSQL hiện tại, không đòi hỏi sửa đổi database schema, không ảnh hưởng RLS hay API backend.
- **FR-003 (Admin Single & Batch ZIP Extraction)**:
  - Trong `AdminTheory.tsx`: Bổ sung nút "Trích xuất ảnh từ ZIP" trên từng hàng tài liệu PE có file zip.
  - Bổ sung nút "Trích xuất ảnh ZIP hàng loạt" trên thanh công cụ PE để quét và xử lý tự động cho các tài liệu PE cũ.
  - Hiển thị nhãn trạng thái `📸 {count} ảnh` trên danh sách để admin dễ nhận biết.
- **FR-004 (Admin ZIP Upload Enhancement)**:
  - Khi tạo hoặc sửa tài liệu PE, nếu tải lên file `.zip`, hệ thống hiển thị tùy chọn "Tự động trích xuất ảnh đề thi", hiển thị ảnh preview trước khi lưu và tải cả file zip gốc + ảnh trích xuất.
- **FR-005 (Student Inline Preview & Full-screen Exam Viewer Modal)**:
  - Trong `SubjectDetailPage.tsx` tab PE: Hiển thị bộ sưu tập ảnh thumbnail của từng đề thi.
  - Tích hợp Modal xem ảnh toàn màn hình với giao diện cao cấp: phóng to thu nhỏ, chuyển ảnh bằng chuột và bàn phím, thanh thumbnail filmstrip bên dưới, nút tải file zip gốc.
- **FR-006 (Signed URL Security)**: Mọi ảnh trích xuất lưu tại bucket `theory-images` hoặc `theory-files` đều được ký URL tự động qua `signStorageUrls` trước khi hiển thị cho người dùng, đảm bảo tính bảo mật của tài nguyên khóa học.

---

## 4. Key Entities & Files

### Key Entities
- **theories**:
  - `id`: UUID
  - `title`: Tên đề thi PE
  - `description`: Chứa mô tả văn bản + block metadata `preview_images`
  - `type`: 'file'
  - `url`: Link file `.zip` gốc trên `theory-files` (luôn được bảo toàn)
  - `file_name`: Tên file gốc (ví dụ: `FER202_PE_SP25.zip`)
  - `category`: 'pe'
  - `preview_images` (được giải mã từ metadata): Mảng các URL ảnh trích xuất từ zip

### Key Files
- `src/lib/peZipExtractor.ts` (MỚI): Thư viện xử lý giải nén, lọc ảnh, sắp xếp thứ tự và upload ảnh vào `theory-images`.
- `src/lib/theoryMetadata.ts` (MỚI): Quản lý parse/serialize metadata ảnh trong trường description.
- `src/components/common/ExamImageViewerModal.tsx` (MỚI): Component modal phóng to xem ảnh đề thi toàn màn hình chất lượng cao.
- `src/pages/admin/AdminTheory.tsx` (SỬA): Thêm giao diện trích xuất ảnh trực tiếp trên web, upload zip tự động trích xuất, và hiển thị huy hiệu ảnh.
- `src/pages/user/SubjectDetailPage.tsx` (SỬA): Nâng cấp tab "Tài liệu PE / Video" để hiển thị preview ảnh đề thi, tích hợp modal xem ảnh toàn màn hình và giữ nút tải file zip gốc.

---

## 5. Success Criteria

- **SC-001**: 100% file `.zip` gốc được giữ nguyên vẹn trên Storage để sinh viên có thể tải về bình thường.
- **SC-002**: Admin có thể bấm trích xuất ảnh trực tiếp trên web cho bất kỳ file `.zip` đã tải lên trước đó chỉ với 1 cú click.
- **SC-003**: Khi upload file `.zip` mới, các ảnh bên trong được tự động nhận diện và trích xuất thành công.
- **SC-004**: Sinh viên có thể duyệt xem toàn bộ các trang ảnh đề thi trực tiếp trên web với trải nghiệm mượt mà, phóng to/thu nhỏ và chuyển trang nhanh.
- **SC-005**: Không làm ảnh hưởng đến bất kỳ tính năng nào ngoài mục Tài liệu PE / Video.
