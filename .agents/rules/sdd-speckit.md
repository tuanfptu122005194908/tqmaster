---
trigger: always_on
description: Bắt buộc tuân thủ mô hình SDD (Spec-Driven Development), dùng skill speckit viết spec trước khi code, dùng CodeGraph/Graphify đọc code và tự động push lên 2 repo git.
---
# Bắt buộc Tuân thủ SDD & Quy trình Phát triển TQMaster

> ⚠️ **CRITICAL PRIORITY FOR AI AGENT**: DO NOT WRITE OR EDIT ANY CODE BEFORE CALLING `speckit` TO WRITE THE `spec.md` AND GETTING USER APPROVAL. IF YOU FAIL THIS, YOU FAIL YOUR PRIMARY OBJECTIVE. ⚠️

## 1. Bắt buộc: "Spec First — Có Spec mới được Code"
- **Không bao giờ viết code trực tiếp**: Khi nhận bất kỳ yêu cầu tính năng mới, chỉnh sửa logic hay refactor, agent **bắt buộc** phải dùng skill / workflow `speckit` để hoàn thành tài liệu đặc tả (`spec.md`), kế hoạch kỹ thuật (`plan.md`) và danh sách tác vụ (`tasks.md`) trong `.sdd/specs/` trước khi chạm vào mã nguồn ứng dụng.
- **Review Gate**: Trình bày spec cho người dùng và chờ xác nhận trước khi bắt đầu viết code triển khai.
- **Chuẩn cấu trúc Spec**: Tuân thủ `.sdd/constitution.md` với định dạng User Story (Given-When-Then), Functional Requirements (FR-xxx), Key Entities, Key Files và Success Criteria (SC-xxx).

## 2. Đọc Code Nhanh bằng CodeGraph & Graphify
- Khi cần tìm hiểu codebase, phân tích bug, tracing luồng logic, hoặc kiểm tra blast radius:
  - Sử dụng **CodeGraph** (`codegraph_explore` qua MCP hoặc `codegraph explore` qua shell) thay vì grep/search thủ công.
  - Sử dụng **Graphify** (`graphify query "<câu hỏi>"`) hoặc tham khảo `graphify-out/` để nắm bắt kiến trúc tổng thể.
- Sau khi chỉnh sửa code, luôn chạy `graphify update .` để đồng bộ lại Knowledge Graph (AST-only, không tốn API token).

## 3. Tự động Đẩy Code lên 2 Repositories
- Sau khi hoàn thành code, chạy kiểm thử tự động (`npm test`) và commit thay đổi:
- **Bắt buộc tự động đẩy code lên cả 2 remote repositories**:
  1. Remote 1: `git push origin <branch>` (Repo: `https://github.com/thanhtuanfptse05/smart-curate-learn`)
  2. Remote 2: `git push tqmaster <branch>` (Repo: `https://github.com/tuanfptu122005194908/tqmaster.git`)
- Đảm bảo cả hai kho lưu trữ luôn ở trạng thái đồng bộ tuyệt đối.
