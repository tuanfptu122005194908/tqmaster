# Feature Specification: Student StudyHub & Course Experience

**Feature Branch**: `[main]`  
**Status**: ✅ Implemented

---

## 1. Overview
Phân hệ Khóa học & Học tập của học viên (bao gồm Trang chủ danh mục `/`, Khóa học của tôi `/my-courses` và Trang chi tiết môn học `/subjects/:id`) cung cấp trải nghiệm khám phá, lựa chọn và tiếp cận lộ trình học tập Đại học FPT theo chuẩn cấu trúc 9 học kỳ.

Hệ thống tích hợp bộ nhớ đệm `sessionStorage` để tải trang tức thời (< 100ms khi quay lại), hiển thị trực quan trạng thái đã mua/chưa mua, liên kết giỏ hàng một chạm và điều hướng vào kho đề thi thực tế theo niên đại.

---

## 2. User Scenarios & Testing

### User Story 1 – Khám phá danh mục môn học theo học kỳ (Priority: P1)
Là một học viên, tôi muốn duyệt các môn học theo từng học kỳ từ Kỳ 1 đến Kỳ 9 để tìm tài liệu đúng với kỳ học hiện tại của mình.

**Acceptance Scenarios**:
1. **Given** học viên đã đăng nhập và đang ở Trang chủ `/`, **When** trang tải, **Then** hệ thống đọc cache session trước để hiển thị ngay môn học, sau đó đối soát ngầm với Supabase để cập nhật dữ liệu mới nhất.
2. **Given** học viên chọn tab "Học kỳ 3", **When** click chọn, **Then** lưới môn học chỉ hiển thị các môn thuộc kỳ 3 (như PRF192, PRO192, MAD101...).
3. **Given** học viên nhập từ khóa vào ô tìm kiếm trên thanh điều hướng (TopNav), **When** gõ từ khóa (ví dụ "CSD"), **Then** danh sách lọc theo tên hoặc mã môn học theo thời gian thực.

### User Story 2 – Quản lý "Khóa học của tôi" (Priority: P1)
Là một học viên đã mua môn học, tôi muốn có khu vực riêng chỉ hiển thị các môn mình đã sở hữu để tiện vào học ngay.

**Acceptance Scenarios**:
1. **Given** học viên truy cập đường dẫn `/my-courses`, **When** trang tải, **Then** hệ thống chỉ hiển thị những môn học mà `user_id` sở hữu trong `user_subjects`.
2. **Given** một môn học đã sở hữu, **When** học viên click "Vào học ngay", **Then** hệ thống điều hướng trực tiếp vào trang chi tiết môn học `/subjects/:id`.

### User Story 3 – Học tập chi tiết & Làm đề thi theo môn (Priority: P1)
Là một học viên, tôi muốn vào xem toàn bộ đề thi và tài liệu lý thuyết của môn học đã mua.

**Acceptance Scenarios**:
1. **Given** học viên tại `/subjects/:id`, **When** môn học đã được thanh toán, **Then** toàn bộ danh sách đề thi (SU, SP, FA) được mở khóa, kèm nút "Bắt đầu làm bài" điều hướng sang `/exams/:id`.
2. **Given** học viên chưa mua môn học (nếu truy cập trực tiếp), **Then** danh sách đề thi hiển thị trạng thái khóa (ổ khóa mờ), kèm thông báo hướng dẫn thêm vào giỏ hàng và thanh toán.
3. **Given** môn học có tài liệu lý thuyết hoặc tài liệu thực hành PE đính kèm, **When** học viên chuyển sang tab "Tài liệu", **Then** các tài liệu PDF/Video/Link xuất hiện để xem hoặc tải về máy.

---

## 3. Requirements

### Functional Requirements
- **FR-001**: Danh mục môn học PHẢI được lưu đệm trong `sessionStorage` với khóa `tqmaster_active_subjects_v1` để tăng tốc độ phản hồi điều hướng.
- **FR-002**: Lọc môn học theo các tiêu chí: Học kỳ (`semester` 1-9 hoặc `all`), Từ khóa tìm kiếm toàn cục (`searchQuery`), và Chế độ Khóa học của tôi (`/my-courses`).
- **FR-003**: Card môn học hiển thị giá bán (`price`), giá gốc gạch ngang (`original_price`), nhãn môn nổi bật (`Star`), số lượng đề thi có trong môn.
- **FR-004**: Trạng thái nút bấm linh hoạt:
  - Nếu đã mua (`isPurchased(id) === true`): Nút "Vào học ngay" màu xanh dương.
  - Nếu đã trong giỏ hàng (`isInCart(id) === true`): Nút "Đã thêm vào giỏ" (icon Check).
  - Nếu chưa mua và chưa trong giỏ: Nút "Thêm vào giỏ" với icon ShoppingCart.
- **FR-005**: Trang chi tiết môn học `/subjects/:id` hiển thị danh sách đề thi sắp xếp theo hàm niên đại `sortExams`, phân biệt rõ đề thi thử (Trial/Free) và đề thi chính thức của khóa học.

### Key Entities
- **subjects**: `id`, `name`, `semester`, `price`, `description`, `thumbnail_url`, `is_active`.
- **user_subjects**: `user_id`, `subject_id`, `created_at`.
- **exams**: `id`, `title`, `duration_min`, `is_active`.
- **exam_subjects**: `exam_id`, `subject_id`.
- **theories**: `id`, `title`, `type`, `category`, `url`.

---

## 4. Success Criteria
- **SC-001**: Thời gian render danh mục từ cache dưới 50ms khi chuyển qua lại các trang.
- **SC-002**: Phân định chính xác 100% quyền truy cập môn học giữa học viên đã thanh toán và chưa thanh toán.


---

## Merged from 18-pe-document-zip-preview

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


---

## Merged from 19-fix-user-pe-images-access

# Feature Specification: Sửa lỗi hiển thị ảnh đề thi PE / Video cho tài khoản User

**Feature Directory**: `.sdd/specs/19-fix-user-pe-images-access/`  
**Feature Branch**: `fix/user-pe-images-access`  
**Status**: ✅ Implemented (Tested & Verified)  
**Priority**: Critical (P0)  

---

## 1. Overview

Trong mục **Tài liệu PE / Video** (`category: 'pe'`), tài liệu đề thi thực hành (PE) chứa các hình ảnh câu hỏi được trích xuất từ file nén ZIP và lưu trữ tại Supabase Storage trong bucket `theory-images` (đường dẫn `pe-extracts/<theory_id>/...`). Danh sách đường link URL của các ảnh này được lưu trong trường `description` của bản ghi `theories` (dưới dạng block metadata `<!--PE_META:{"preview_images":[...]}-->`).

### Vấn đề hiện tại:
- Khi đăng nhập bằng tài khoản **Admin**, ảnh đề thi PE hiển thị bình thường.
- Khi đăng nhập bằng tài khoản **User thường** (kể cả sinh viên đã mua môn học hoặc môn học miễn phí), toàn bộ ảnh câu hỏi trong tab "Tài liệu PE / Video" bị lỗi không hiển thị được (ảnh bị vỡ / broken image).

### Nguyên nhân cốt lõi:
Hàm phân quyền truy cập tài sản Storage trên Supabase `public.can_access_theory_asset(_object_name text)` (tại migration `20260911121943`) hiện chỉ kiểm tra:
```sql
AND (t.url LIKE '%/' || _object_name OR t.url LIKE '%/' || _object_name || '?%')
```
Trong khi đối với đề thi PE, `t.url` là link file ZIP gốc (`.../de_thi_pe.zip`), còn các ảnh đề thi trích xuất nằm ở thư mục `pe-extracts/<theory_id>/...` và được lưu trong trường `t.description`. Do đó, hàm kiểm tra trả về `FALSE` đối với tài khoản User, khiến hàm tạo link ký `createSignedUrls` bị RLS chặn, trình duyệt không thể tải ảnh từ bucket riêng tư `theory-images` và báo lỗi `404 / 400 NoSuchBucket / Access Denied`.

### Giải pháp:
1. **Nâng cấp hàm phân quyền `can_access_theory_asset` & RLS Policy trên Supabase Storage**:
   - Mở rộng điều kiện kiểm tra quyền đọc tài sản đề thi PE:
     - So khớp `t.description LIKE '%' || _object_name || '%'`
     - So khớp tiền tố thư mục `_object_name LIKE 'pe-extracts/' || t.id::text || '/%'`
     - Đồng bộ cho cả người dùng đăng nhập (`authenticated`) và người dùng vãng lai (`anon`) đối với các môn học miễn phí (`price <= 0`).
2. **Đảm bảo tính ổn định phía Frontend (`SubjectDetailPage.tsx` & `signedImage.ts`)**:
   - Giữ nguyên cơ chế ký URL bảo mật 4 giờ (`signStorageUrls`), tự động fallback ảnh và hiển thị skeleton/placeholder thanh thoát nếu ảnh đang trong quá trình tải.

---

## 2. User Scenarios & Acceptance Criteria (Given - When - Then)

### User Story 1 – Sinh viên đã mua môn học xem được toàn bộ ảnh đề thi PE (Priority: P0)
Là một Sinh viên đã mua môn học (hoặc môn học miễn phí), khi đăng nhập và vào tab "Tài liệu PE / Video", tôi muốn xem được đầy đủ tất cả các ảnh câu hỏi của đề thi PE một cách rõ nét, không bị lỗi ảnh vỡ.

**Acceptance Criteria**:
1. **Given** Sinh viên đã đăng nhập và sở hữu môn học (có trong `user_subjects`), **When** vào trang chi tiết môn học tab "Tài liệu PE / Video" (`/subjects/:id`), **Then** tất cả ảnh xem trước đề thi (filmstrip thumbnail) tải thành công, không có bất kỳ ảnh nào bị lỗi 400/403/404.
2. **When** Sinh viên bấm vào một ảnh thumbnail hoặc nút "Xem đề thi (X ảnh)", **Then** Modal xem ảnh toàn màn hình (`ExamImageViewerModal`) mở ra và hiển thị ảnh câu hỏi sắc nét, phóng to thu nhỏ mượt mà, chuyển trang Next/Prev hoạt động bình thường.
3. **When** Sinh viên bấm "Tải file ZIP gốc", **Then** file zip tải về máy bình thường.

---

### User Story 2 – Sinh viên chưa mua môn học bị khóa bảo mật đúng quy định (Priority: P0)
Là chủ sở hữu nền tảng, tôi muốn đảm bảo tài liệu và hình ảnh PE vẫn được bảo vệ nghiêm ngặt bằng Row Level Security (RLS), người chưa mua môn học không thể truy cập trái phép URL ảnh Storage.

**Acceptance Criteria**:
1. **Given** Người dùng chưa mua môn học (hoặc chưa đăng nhập) đối với môn học có phí (`price > 0`), **When** gửi request tải ảnh trong `pe-extracts/` hoặc gọi `createSignedUrls`, **Then** Supabase Storage từ chối truy cập và không cấp signed URL.

---

## 3. Requirements

### Functional Requirements
- **FR-001 (Database RLS Function Update)**: Cập nhật hàm `public.can_access_theory_asset(_object_name text)` trên cơ sở dữ liệu Supabase:
  - Cho phép người dùng truy cập nếu `_object_name` khớp với `t.url`, hoặc xuất hiện trong `t.description`, hoặc nằm trong thư mục `pe-extracts/<theory_id>/...` của tài liệu thuộc môn học mà sinh viên đã mua (`user_subjects`) hoặc môn học miễn phí (`price <= 0`).
- **FR-002 (Anon Access for Free Subjects)**: Cập nhật policy `theory_assets_read_free_anon` trên `storage.objects` để khách vãng lai cũng xem được ảnh đề thi PE của các môn học miễn phí.
- **FR-003 (Frontend Resilience & Error Handling)**: Trong `SubjectDetailPage.tsx` và `ExamImageViewerModal.tsx`, thêm cơ chế xử lý lỗi `onError` cho thẻ ảnh (placeholder icon rõ ràng, tránh hiển thị biểu tượng icon ảnh gãy xấu xí của trình duyệt).
- **FR-004 (Dual-Repo Synchronization)**: Tự động chạy bộ kiểm thử `npm test`, commit và push lên cả 2 remote repositories: `origin` và `tqmaster`.

---

## 4. Key Entities & Files

### Key Entities
- **theories**: Bản ghi tài liệu, `description` chứa `preview_images` dạng `<!--PE_META:...-->`.
- **storage.objects**: Chứa các file ảnh đã trích xuất tại bucket `theory-images` đường dẫn `pe-extracts/<theory_id>/...`.
- **user_subjects**: Bảng phân quyền môn học cho từng sinh viên.

### Key Files
- `supabase/migrations/20260924200000_fix_pe_extracts_storage_access.sql`: Migration cập nhật hàm `can_access_theory_asset` và RLS policies.
- `src/pages/user/SubjectDetailPage.tsx`: Xử lý hiển thị filmstrip ảnh PE và fallback ảnh lỗi.
- `src/components/common/ExamImageViewerModal.tsx`: Xử lý hiển thị modal phóng to và fallback ảnh lỗi.

---

## 5. Success Criteria

- **SC-001**: 100% ảnh trong tab "Tài liệu PE / Video" hiển thị thành công khi đăng nhập tài khoản User thường.
- **SC-002**: Không làm gián đoạn quyền truy cập của tài khoản Admin.
- **SC-003**: Kiểm thử tự động (`npm test`) vượt qua 100%.
- **SC-004**: Đồng bộ git thành công lên cả 2 repositories (`origin` và `tqmaster`).
