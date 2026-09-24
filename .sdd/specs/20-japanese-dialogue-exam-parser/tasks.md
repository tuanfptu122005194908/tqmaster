# Task Breakdown: Japanese Dialogue Exam Parser & Option Disambiguation

**Feature Identifier**: `20-japanese-dialogue-exam-parser`  
**Status**: ✅ Completed  

---

## Danh sách công việc phân rã (Task Checklist)

- [x] **Phase 1: Đặc tả & Phê duyệt (Spec & Review Gate)**
  - [x] Tạo `spec.md` chuẩn SDD tại `.sdd/specs/20-japanese-dialogue-exam-parser/spec.md`.
  - [x] Tạo `plan.md` phân tích kỹ thuật và giải pháp tại `.sdd/specs/20-japanese-dialogue-exam-parser/plan.md`.
  - [x] Tạo `tasks.md` theo dõi tiến độ.
  - [x] Trình bày giải pháp cho người dùng và xin ý kiến phản hồi (Review Gate) -> Người dùng đã phê duyệt "tiến hành đi".

- [x] **Phase 2: Triển khai Code Logic**
  - [x] Nâng cấp `src/lib/markdownExamParser.ts`:
    - [x] Thêm quy tắc không cho phép option bắt đầu bằng B/C/D khi chưa có Option A.
    - [x] Bổ sung cơ chế Self-Healing Full Rollback cho chuỗi options thực sự A-D.
    - [x] Xử lý ghép dòng thoại `B.` đứng riêng dòng vào câu hỏi trong `normalizeExamLines`.
    - [x] Sửa `ansPrefixRegex` để tránh nhận nhầm câu hỏi bắt đầu bằng "Chọn" thành đáp án.
  - [x] Nâng cấp `src/lib/wordParser.ts` để đồng bộ cơ chế rollback.

- [x] **Phase 3: Kiểm thử tự động (Verification & Automated Tests)**
  - [x] Hoàn thiện test suite `src/test/jpd113.test.ts` kiểm thử toàn diện trên cả 2 đề `JPD113_SU26_FE.md` và `JPD113_SU26_RE.md`.
  - [x] Chạy `npm test` kiểm tra toàn bộ 7 test suite (zero regression, 31/31 tests pass).

- [ ] **Phase 4: Cập nhật Tri thức & Đồng bộ Git (Dual-Repo Push)**
  - [ ] Chạy `graphify update .` để đồng bộ Knowledge Graph AST.
  - [ ] Git commit với thông điệp ngữ nghĩa chuẩn SDD.
  - [ ] Git push lên cả 2 remote repositories: `origin` và `tqmaster`.
