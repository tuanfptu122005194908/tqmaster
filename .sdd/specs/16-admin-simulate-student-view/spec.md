---
Feature Branch: 16-admin-simulate-student-view
Status: Draft
---

# 1. Overview
Hiện tại, khi admin truy cập vào trang chi tiết khóa học/môn học (student view), hệ thống mặc định coi admin đã mua khóa học đó. Do vậy, admin luôn thấy trạng thái "ĐÃ SỞ HỮU", có thể xem tất cả tài liệu, nhưng lại không thể nhìn thấy nút "Thêm vào giỏ hàng" hay "Mua ngay". Điều này gây khó khăn khi admin muốn tự test quy trình mua hàng hoặc muốn trải nghiệm giao diện dưới góc nhìn của một sinh viên thực tế (để kiểm tra xem khi chưa mua thì giao diện hiển thị ra sao).
Mục tiêu: Gỡ bỏ việc bypass quyền mua khóa học bằng `isAdmin` tại các trang hiển thị dưới góc nhìn người dùng, giúp admin trải nghiệm giống hệt 100% sinh viên.

# 2. User Scenarios & Testing

**Scenario 1: Admin xem trang chi tiết môn học khi tài khoản admin chưa từng mua môn này**
- **Given** admin đang đăng nhập và mở trang SubjectDetailPage.
- **When** admin chưa thực hiện "Mua" môn học này.
- **Then** admin sẽ thấy cảnh báo "Nội dung bị khóa", không thấy được các đề thi, và thấy nút "Thêm vào giỏ", "Mua ngay" với giá tiền tương ứng.

**Scenario 2: Admin có thể trải nghiệm mua môn học**
- **Given** admin đang ở trang SubjectDetailPage.
- **When** admin click "Thêm vào giỏ".
- **Then** môn học được đưa vào giỏ hàng thành công, nút chuyển thành "Đã thêm vào giỏ". Admin có thể tiến hành thanh toán như bình thường.

# 3. Requirements

- **FR-1**: Xóa bỏ điều kiện `isAdmin` khi xác định biến `purchased` trong `SubjectDetailPage.tsx`. `purchased` sẽ chỉ hoàn toàn dựa vào việc tài khoản đó đã mua khóa học (thông qua bảng orders hoặc logic kiểm tra `isPurchased(subject.id)`).
- **FR-2**: (Tùy chọn tương tự) Ở các trang như `StudyHubPage`, nếu có logic bypass khóa học dựa vào `isAdmin`, cũng loại bỏ để admin trải nghiệm quyền truy cập như sinh viên thật.

**Key Entities**:
- Không thay đổi database.

**Key Files**:
- `src/pages/user/SubjectDetailPage.tsx`
- `src/pages/user/StudyHubPage.tsx`

# 4. Success Criteria
- **SC-1**: Admin có thể thấy nút "Mua ngay" và "Thêm vào giỏ" ở trang sinh viên nếu tài khoản admin đó chưa sở hữu môn học.
- **SC-2**: Admin bị ẩn nội dung đề thi, lý thuyết nếu chưa mua (giống hệt sinh viên).
- **SC-3**: Admin thêm vào giỏ hàng và thanh toán không bị lỗi.
