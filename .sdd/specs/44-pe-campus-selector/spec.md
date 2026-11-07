# Spec 44 — PE Campus Selector

**Status**: COMPLETED  
**Created**: 2026-11-07  
**Feature**: Campus selector for PE exam documents (Admin upload + User display)

---

## Overview

Thêm trường **campus** (cơ sở) cho tài liệu PE trong hệ thống. Admin chọn campus khi upload/sửa tài liệu PE. User thấy badge campus rõ ràng bên cạnh mỗi tài liệu PE.

5 campus hỗ trợ: `HaNoi`, `HCM`, `CanTho`, `DaNang`, `QuyNhon`. Mặc định: `HaNoi`.

---

## User Scenarios

### Scenario 1 — Admin chọn campus khi upload tài liệu PE
**Given** Admin đang tạo/sửa một tài liệu có danh mục "Tài liệu PE / Video"  
**When** Admin nhìn vào form upload  
**Then** Hiển thị group radio button gồm 5 lựa chọn campus (HaNoi, HCM, CanTho, DaNang, QuyNhon), mặc định là HaNoi  

### Scenario 2 — Campus được lưu vào database
**Given** Admin đã chọn campus "HCM" và điền đầy đủ thông tin  
**When** Admin nhấn "Tạo tài liệu" hoặc "Lưu thay đổi"  
**Then** Trường `campus` = "HCM" được lưu vào bảng `theories` trong Supabase  

### Scenario 3 — Campus badge hiển thị phía user
**Given** Sinh viên đã mua môn học và đang xem tab "Tài liệu PE"  
**When** Danh sách PE docs được render  
**Then** Mỗi tài liệu PE hiển thị một badge màu sắc tương ứng với campus của nó  
&emsp; - HaNoi → badge xanh dương  
&emsp; - HCM → badge đỏ  
&emsp; - CanTho → badge xanh lá  
&emsp; - DaNang → badge tím  
&emsp; - QuyNhon → badge cam  

### Scenario 4 — Dữ liệu cũ (không có campus) vẫn hiển thị bình thường
**Given** Tài liệu PE cũ trong database chưa có trường `campus`  
**When** User xem tài liệu đó  
**Then** Badge hiển thị "Hà Nội" (fallback về giá trị default)  

### Scenario 5 — Campus chỉ hiển thị cho tài liệu PE, không phải lý thuyết
**Given** Admin đang tạo tài liệu danh mục "Lý thuyết"  
**When** Form được hiển thị  
**Then** Không có radio campus nào xuất hiện (campus chỉ dành cho PE)

---

## Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-01 | Thêm cột `campus TEXT DEFAULT 'HaNoi' CHECK (campus IN ('HaNoi','HCM','CanTho','DaNang','QuyNhon'))` vào bảng `theories` qua migration SQL |
| FR-02 | Form admin: khi `category === 'pe'`, hiển thị group 5 radio button chọn campus, mặc định `HaNoi` |
| FR-03 | Form admin: khi `category === 'theory'`, không hiển thị campus radio |
| FR-04 | Khi save (insert/update), gửi field `campus` lên Supabase |
| FR-05 | Khi edit, pre-fill campus từ dữ liệu tài liệu hiện có |
| FR-06 | User side: mỗi PE doc card hiển thị badge campus với màu sắc riêng |
| FR-07 | Fallback: `campus === null` hoặc không có → hiển thị badge "Hà Nội" |
| FR-08 | Admin card list: hiển thị badge campus nhỏ trên mỗi PE card trong grid |
| FR-09 | TypeScript type `FormState` được cập nhật với `campus: Campus` |
| FR-10 | Supabase generated types (`types.ts`) được cập nhật thủ công để bao gồm `campus` |

---

## Key Entities

### Campus Type
```typescript
type Campus = 'HaNoi' | 'HCM' | 'CanTho' | 'DaNang' | 'QuyNhon';
```

### Campus Color Palette
| Campus | Label | BG | Text | Border |
|--------|-------|----|------|--------|
| HaNoi | Hà Nội | `#dbeafe` | `#1d4ed8` | `#bfdbfe` |
| HCM | Hồ Chí Minh | `#fee2e2` | `#dc2626` | `#fecaca` |
| CanTho | Cần Thơ | `#dcfce7` | `#15803d` | `#bbf7d0` |
| DaNang | Đà Nẵng | `#f5f3ff` | `#7c3aed` | `#ddd6fe` |
| QuyNhon | Quy Nhơn | `#fff7ed` | `#c2410c` | `#fed7aa` |

---

## Key Files

| File | Change |
|------|--------|
| `supabase/migrations/<timestamp>_add_campus_to_theories.sql` | NEW — migration thêm cột `campus` |
| `src/integrations/supabase/types.ts` | UPDATE — thêm `campus` vào Row/Insert/Update của `theories` |
| `src/pages/admin/AdminTheory.tsx` | UPDATE — thêm campus vào FormState, radio UI, save logic, card badge |
| `src/pages/user/SubjectDetailPage.tsx` | UPDATE — hiển thị campus badge trong `renderPeDocs` |

---

## Success Criteria

| ID | Criterion |
|----|-----------|
| SC-01 | Admin thấy 5 radio button campus khi tạo/sửa tài liệu PE |
| SC-02 | Campus được persist vào Supabase, verify bằng cách đọc lại data |
| SC-03 | User thấy badge campus màu sắc trên từng PE card |
| SC-04 | Tài liệu PE cũ (campus null) hiển thị badge "Hà Nội" |
| SC-05 | Tài liệu lý thuyết không có campus radio/badge |
| SC-06 | `npm test -- --run` → tất cả ≥ 117 tests pass |
| SC-07 | `npm run build` thành công, không lỗi TypeScript |
| SC-08 | Dual push lên `origin` và `tqmaster` |

