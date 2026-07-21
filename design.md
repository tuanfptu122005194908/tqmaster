# 🎨 TQMaster Admin UI & Design System Guidelines (`design.md`)

Tài liệu hướng dẫn chi tiết quy chuẩn giao diện (UI Rules), bảng màu (Color Palette), Typography, và cấu trúc Component cho hệ thống **TQMaster Admin & Learning Platform**.

---

## 🎯 1. Triết Lý Thiết Kế (Design Philosophy)
- **Phong cách**: Modern SaaS Dashboard (Phong cách enterprise như Stripe, Vercel, Linear).
- **Trải nghiệm**: Tối giản, sang trọng, trực quan, phân cấp thông tin rõ ràng với khoảng trắng (Whitespace) hợp lý.
- **Tông màu chủ đạo**: Nền xám nhạt cao cấp (`#f4f7fc`), bề mặt Card trắng tinh khiết (`#ffffff`), và điểm nhấn Xanh Hoàng Gia (`#2563eb`).

---

## 🎨 2. Bảng Màu Chi Tiết (Color Palette)

### 🔵 Màu Điểm Nhấn (Primary Brand Color)
| Tên màu | Giá trị Hex / Gradient | Ứng dụng |
| :--- | :--- | :--- |
| **Primary Blue** | `#2563eb` | Nút chính, đường biểu đồ, Icon active, link chính |
| **Primary Gradient** | `linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)` | Nút Action quan trọng (Tạo mới, Đăng bài) |
| **Primary Light / Pill** | `#eff6ff` | Nền nút phụ active, Badge tin tức, Tag xanh |
| **Primary Border** | `#dbeafe` | Viền badge xanh, viền card xanh nhạt |
| **Primary Text Dark** | `#1d4ed8` | Chữ nhấn mạnh trong các ô màu nhạt |

### 🌈 Bảng Màu Pastel Cho 4 Thẻ Chỉ Số Top (Stat Cards)
| Thẻ Thống Kê | Nền (Background) | Viền (Border) | Nhãn (Label Text) | Icon Color |
| :--- | :--- | :--- | :--- | :--- |
| **1. Doanh Thu (Blue)** | `#edf5ff` | `#dbeafe` | `#3b82f6` | `#10b981` (Tăng trưởng) |
| **2. Đơn Hàng (Purple)** | `#f3eefd` | `#ede9fe` | `#8b5cf6` | `#8b5cf6` (Giỏ hàng) |
| **3. Giá Trị TB (Teal)** | `#eafaf5` | `#d1fae5` | `#059669` | `#10b981` (Thẻ giá) |
| **4. Sinh Viên (Amber)** | `#fff7ed` | `#ffedd5` | `#d97706` | `#f59e0b` (Người dùng) |

### ⚪ Bảng Màu Trung Tính & Văn Bản (Neutrals & Typography)
| Loại | Giá trị Hex | Ứng dụng |
| :--- | :--- | :--- |
| **Canvas Background** | `#f4f7fc` | Nền toàn bộ trang web (Background chính) |
| **Card Surface** | `#ffffff` | Khung nội dung, bảng, đồ thị, modal |
| **Heading Text** | `#0f172a` (Slate 900) | Tiêu đề lớn (`h1`, `h2`), con số thống kê chính |
| **Body Text** | `#475569` (Slate 700) | Nội dung bài viết, mô tả chi tiết, nhãn bảng |
| **Sub Text / Muted** | `#64748b` (Slate 500) | Chú thích, thời gian, tiêu đề phụ |
| **Placeholder / Disabled**| `#94a3b8` (Slate 400) | Gợi ý tìm kiếm, trạng thái vô hiệu hóa |
| **Divider & Border** | `#e2e8f0` / `#f1f5f9` | Đường kẻ ngang, đường viền card |

### 🏷️ Bảng Màu Trạng Thái (Status Badges)
| Trạng thái | Nền (Background) | Chữ (Text) | Viền (Border) |
| :--- | :--- | :--- | :--- |
| **Đã duyệt / Thành công**| `#dcfce7` | `#15803d` | `#bbf7d0` |
| **Chờ duyệt / Cảnh báo** | `#fef3c7` | `#b45309` | `#fde68a` |
| **Hủy / Từ chối / Xóa** | `#ffe4e6` | `#e11d48` | `#fecdd3` |
| **Nổi bật (Featured)** | `#e0e7ff` | `#4f46e5` | `#c7d2fe` |

---

## 🔤 3. Quy Chuẩn Font Chữ (Typography Rules)
- **Font Family**: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Tiêu đề trang (`h1`)**: `fontSize: 28px`, `fontWeight: 900`, `color: '#0f172a'`, `letterSpacing: '-0.03em'`
- **Tiêu đề khối (`h2`)**: `fontSize: 18px`, `fontWeight: 800`, `color: '#0f172a'`
- **Số liệu lớn (Metric Values)**: `fontSize: 26px - 28px`, `fontWeight: 900`, `color: '#0f172a'`
- **Mã đơn / Mã SV**: `fontFamily: 'monospace'`, `fontWeight: 800`, `color: '#2563eb'`
- **Văn bản chung**: `fontSize: 13px - 14px`, `fontWeight: 500 / 600`, `color: '#475569'`

---

## 🧱 4. Quy Chuẩn Cấu Trúc Khung (Component Specifications)

### 1. Khung Card Chuẩn (Standard Card)
```tsx
const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 22,
  padding: '24px 28px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
};
```

### 2. Khung Trống Dạng Nét Đứt (Dashed Empty State Card)
```tsx
const dashedCardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '2px dashed #cbd5e1',
  borderRadius: 24,
  padding: '48px 32px',
  textAlign: 'center',
  boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
};
```

### 3. Nút Nổi Bật (Primary Button Gradient)
```tsx
const primaryBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  padding: '10px 20px',
  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
  color: '#ffffff',
  border: 'none',
  borderRadius: 14,
  fontSize: 14,
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
};
```

### 4. Nút Chuyển Tab / Bộ Lọc (Filter Pill Buttons)
```tsx
const pillActive: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 9, border: 'none',
  fontSize: 12, fontWeight: 700, cursor: 'pointer',
  background: '#2563eb', color: '#ffffff',
  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
};
const pillInactive: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 9, border: 'none',
  fontSize: 12, fontWeight: 700, cursor: 'pointer',
  background: 'transparent', color: '#64748b',
};
```

---

## 📊 5. Biểu Đồ & Thống Kê (Charts & Analytics)
- **Doanh Thu (Area Chart)**:
  - Nét vẽ: `stroke="#2563eb"`, `strokeWidth={3}`
  - Nền Gradient: `stopColor="#3b82f6"`, opacity `0.28` -> `0.01`
  - Chấm dữ liệu: `r: 4`, `fill="#ffffff"`, `stroke="#2563eb"`
- **Phần Tích Môn Bán Chạy (Donut Chart)**:
  - Bảng màu xoay vòng 5 màu: `['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899']`
  - Viền ngăn cách giữa các miếng bánh: `stroke="#ffffff"`, `strokeWidth={2}`
