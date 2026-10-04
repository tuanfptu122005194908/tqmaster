# Project AGENTS & Development Rules

## 1. Bắt buộc Tuân thủ Mô hình SDD (Spec-Driven Development) & Skill SpecKit

1. **QUY TẮC BẤT DI BẤT DỊCH: "SPEC FIRST — CÓ SPEC MỚI ĐƯỢC CODE"**:
   - **Tuyệt đối KHÔNG** được viết, sửa hoặc thêm bất kỳ dòng code logic nào trước khi tạo hoặc cập nhật `spec.md`, `plan.md` và `tasks.md` trong `.sdd/specs/`.
   - Mọi tính năng, sửa đổi kiến trúc, refactor hay thêm trang/API mới đều phải bắt đầu bằng việc dùng **skill / workflow `speckit`** để định nghĩa đầy đủ yêu cầu nghiệp vụ.
   - Bắt buộc phải có sự đồng thuận/phê duyệt từ người dùng (Review Gate) đối với `spec.md` trước khi tiến hành bước triển khai code.

2. **Cấu trúc Thư mục & Chuẩn Spec (.sdd/specs/)**:
   - Mỗi tính năng nằm trong một thư mục định danh: `.sdd/specs/<number>-<feature-name>/`.
   - Bộ tài liệu bắt buộc bao gồm:
     - `spec.md`: Đặc tả nghiệp vụ chuẩn SDD (Header Status, Overview, User Scenarios Given-When-Then, Functional Requirements FR-xxx, Key Entities, Key Files, Success Criteria SC-xxx).
     - `plan.md`: Kế hoạch kỹ thuật, kiến trúc dữ liệu và các bước triển khai.
     - `tasks.md`: Danh sách công việc phân rã chi tiết để kiểm tra tiến độ.
   - Tuân thủ nghiêm ngặt **Project Constitution** tại `.sdd/constitution.md`.

---

## 2. Đọc & Định vị Code Siêu tốc bằng CodeGraph & Graphify

1. **Sử dụng CodeGraph trước khi thao tác**:
   - Với câu hỏi về logic, flow, định vị symbol, call graph hoặc blast radius: **Bắt buộc dùng `codegraph_explore` (MCP) hoặc `codegraph explore` (CLI)** trước khi dùng grep/find hoặc đọc raw files.
   - Không thực hiện vòng lặp search/grep tốn token khi CodeGraph có thể trả về verbatim source code và call paths chỉ trong 1 lần gọi.

2. **Sử dụng Graphify để nắm bắt kiến trúc tổng thể**:
   - Sử dụng `graphify query "<câu hỏi>"` hoặc tham khảo `graphify-out/` để hiểu cấu trúc mô-đun, sự phụ thuộc giữa các file và các node kết nối chính.
   - **Tự động đồng bộ**: Sau khi chỉnh sửa hoặc thêm mới các file mã nguồn trong phiên làm việc, bắt buộc chạy `graphify update .` để giữ đồ thị tri thức luôn cập nhật mới nhất.

---

## 3. Tự động Đẩy Code lên 2 Repositories (Dual-Repo Git Push)

Khi hoàn thành công việc (sau khi đã kiểm tra qua kiểm thử tự động `npm test` / `vitest` và commit thay đổi):
1. **Bắt buộc tự động đẩy code lên cả 2 remotes**:
   ```bash
   git push origin <tên-branch>
   git push tqmaster <tên-branch>
   ```
2. **Danh sách 2 kho lưu trữ**:
   - Remote 1: `origin` (`https://github.com/thanhtuanfptse05/smart-curate-learn`)
   - Remote 2: `tqmaster` (`https://github.com/tuanfptu122005194908/tqmaster.git`)
3. Luôn đảm bảo cả 2 repositories được đồng bộ 100% về commit history và nhánh làm việc.

---

## 4. UI & Design Rules (TQMaster Dashboard Theme)

Khi tạo mới hoặc sửa đổi các component frontend, trang hoặc layout trong dự án, phải tuân thủ nghiêm ngặt hệ thống thiết kế:

1. **Canvas & Surfaces**:
   - Page background: `#f4f7fc`
   - Card surface: `#ffffff` với `borderRadius: 20-24`, `border: 1px solid #e2e8f0`, `boxShadow: 0 2px 10px rgba(0,0,0,0.02)`
2. **Primary Actions**:
   - Buttons: `linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)` với `color: #ffffff`, `borderRadius: 12-14`, `fontWeight: 800`, `boxShadow: 0 6px 18px rgba(37, 99, 235, 0.35)`
3. **Stat Cards Palette**:
   - Card 1 (Revenue): `#edf5ff` (bg), `#dbeafe` (border), `#3b82f6` (text), `#10b981` (icon)
   - Card 2 (Orders): `#f3eefd` (bg), `#ede9fe` (border), `#8b5cf6` (text & icon)
   - Card 3 (Avg Value): `#eafaf5` (bg), `#d1fae5` (border), `#059669` (text), `#10b981` (icon)
   - Card 4 (Students): `#fff7ed` (bg), `#ffedd5` (border), `#d97706` (text), `#f59e0b` (icon)
4. **Status Badges**:
   - Approved: `#dcfce7` (bg), `#15803d` (text), `#bbf7d0` (border)
   - Pending: `#fef3c7` (bg), `#b45309` (text), `#fde68a` (border)
   - Rejected: `#ffe4e6` (bg), `#e11d48` (text), `#fecdd3` (border)
   - Featured: `#e0e7ff` (bg), `#4f46e5` (text)
5. **Typography**:
   - Font: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
   - Headings: `fontWeight: 900` hoặc `800`, `color: #0f172a`, `letterSpacing: -0.03em`
