# 🎨 TQMaster UI & Design System Guidelines (`design.md`)

Tài liệu hướng dẫn chi tiết quy chuẩn giao diện (UI Rules), bảng màu (Color Palette), Typography, và cấu trúc Component cho toàn bộ hệ thống **TQMaster** bao gồm cả phân hệ Quản trị (Admin Dashboard) và Giao diện Học viên (IBACUU End-User Theme).

---

## 🎯 1. Triết Lý Thiết Kế (Design Philosophy)

Hệ thống TQMaster sử dụng 2 bộ giao diện độc lập nhưng đồng nhất về chất lượng:

1. **TQMaster Admin Dashboard Theme (Phân hệ Quản trị / Giảng viên)**:
   - **Phong cách**: Modern SaaS Dashboard (Giống Stripe, Vercel, Linear).
   - **Trải nghiệm**: Tối giản, tập trung vào hiệu năng thao tác dữ liệu khối lượng lớn, phân cấp thông tin rõ ràng với khoảng trắng (Whitespace) hợp lý.
   - **Màu sắc**: Nền xám nhạt (`#f4f7fc`), bề mặt trắng (`#ffffff`), điểm nhấn Xanh Hoàng Gia (`#2563eb`).

2. **IBACUU Digital Premium Theme (Phân hệ Học viên / Khách vãng lai)**:
   - **Phong cách**: Glassmorphism, Vibrant Colors, Modern Layout.
   - **Trải nghiệm**: Tương tác cao, chuyển động mượt mà (WebGL 3D, Framer Motion), kích thích thị giác để tăng tỷ lệ chuyển đổi mua hàng (Conversion Rate).
   - **Màu sắc**: Gradient xanh hiện đại, hiệu ứng kính mờ (backdrop-blur) và các khối đổ bóng (shadow) nổi khối 3D.

---

## 🎨 2. Bảng Màu Chi Tiết (Color Palette)

### 🔵 Màu Điểm Nhấn (Primary Brand Color)
| Tên màu | Giá trị Hex / Gradient | Ứng dụng |
| :--- | :--- | :--- |
| **Primary Blue** | `#2563eb` | Nút chính, đường biểu đồ, Icon active, link chính |
| **Primary Gradient** | `linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)` | Nút Action quan trọng (Tạo mới, Đăng bài, Mua ngay) |
| **Primary Light / Pill** | `#eff6ff` | Nền nút phụ active, Badge tin tức, Tag xanh |
| **Primary Border** | `#dbeafe` | Viền badge xanh, viền card xanh nhạt |

### 🌈 Bảng Màu Pastel Cho Thẻ Chỉ Số (Admin Stat Cards)
| Thẻ Thống Kê | Nền (Background) | Viền (Border) | Nhãn (Label Text) | Icon Color |
| :--- | :--- | :--- | :--- | :--- |
| **Doanh Thu (Blue)** | `#edf5ff` | `#dbeafe` | `#3b82f6` | `#10b981` (Tăng trưởng) |
| **Đơn Hàng (Purple)** | `#f3eefd` | `#ede9fe` | `#8b5cf6` | `#8b5cf6` (Giỏ hàng) |
| **Giá Trị TB (Teal)** | `#eafaf5` | `#d1fae5` | `#059669` | `#10b981` (Thẻ giá) |
| **Sinh Viên (Amber)** | `#fff7ed` | `#ffedd5` | `#d97706` | `#f59e0b` (Người dùng) |

### ⚪ Bảng Màu Trung Tính & Bề Mặt (Neutrals & Surfaces)
| Loại | Giá trị Hex / CSS | Ứng dụng |
| :--- | :--- | :--- |
| **Admin Canvas** | `#f4f7fc` | Nền toàn bộ trang quản trị |
| **Card Surface** | `#ffffff` | Khung nội dung, bảng, đồ thị, modal |
| **Glass Surface** | `rgba(255, 255, 255, 0.7)` | Navbar, Card nổi trên Landing Page (kèm `backdrop-filter: blur`) |
| **Heading Text** | `#0f172a` (Slate 900) | Tiêu đề lớn (`h1`, `h2`), con số thống kê chính |
| **Body Text** | `#475569` (Slate 700) | Nội dung bài viết, mô tả chi tiết, nhãn bảng |
| **Muted Text** | `#64748b` (Slate 500) | Chú thích, thời gian, tiêu đề phụ |

### 🏷️ Bảng Màu Trạng Thái (Status Badges)
| Trạng thái | Nền (Background) | Chữ (Text) | Viền (Border) |
| :--- | :--- | :--- | :--- |
| **Thành công (Approved)**| `#dcfce7` | `#15803d` | `#bbf7d0` |
| **Chờ xử lý (Pending)** | `#fef3c7` | `#b45309` | `#fde68a` |
| **Thất bại (Rejected)** | `#ffe4e6` | `#e11d48` | `#fecdd3` |
| **Nổi bật (Featured)** | `#e0e7ff` | `#4f46e5` | `#c7d2fe` |

---

## 🔤 3. Quy Chuẩn Font Chữ (Typography Rules)

Hệ thống sử dụng phân tách 2 loại font chữ để tối ưu đọc hiểu và thẩm mỹ:

1. **Be Vietnam Pro** (Dành riêng cho Landing Page & User Headings):
   - Thay thế hoàn toàn cho font Bebas Neue cũ để khắc phục triệt để lỗi chồng dấu tiếng Việt.
   - Ứng dụng: Các tiêu đề siêu lớn ở Hero Section, tên môn học nổi bật, các Banner quảng cáo.
   - *Lưu ý: Luôn sử dụng kỹ thuật co giãn font `clamp()` cho các tiêu đề lớn.*

2. **Inter** (Dành cho Admin Dashboard & Text nội dung):
   - Font Family: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
   - Tiêu đề trang (`h1`): `fontSize: 28px`, `fontWeight: 900`, `letterSpacing: '-0.03em'`
   - Mã đơn hàng / ID: `fontFamily: 'monospace'`, `fontWeight: 800`, `color: '#2563eb'`
   - Văn bản chung: `fontSize: 13px - 14px`, `fontWeight: 500 / 600`

---

## 🧱 4. Quy Chuẩn Cấu Trúc Khung (Component Specifications)

### 1. Khung Card Chuẩn (Admin Standard Card)
```tsx
const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  borderRadius: 22,
  padding: '24px 28px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
};
```

### 2. Khung Trống (Empty State Card)
Dùng khi bảng dữ liệu không có bản ghi nào, hoặc giỏ hàng trống. Luôn đi kèm một Icon mờ và nút Kêu gọi hành động.
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

### 3. Nút Kêu Gọi Hành Động Nổi Bật (Primary CTA Gradient)
Dùng cho "Lưu Cấu Hình", "Mua Ngay", "Tạo Đơn Hàng".
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
  transition: 'transform 0.15s ease'
};
```

### 4. Thanh Điều Hướng (Pill Navigation / Tabs)
Dành cho việc chuyển Tab hoặc Lọc trạng thái nhanh (VD: Lọc môn học theo Kỳ 1..9).
```tsx
const pillActive: React.CSSProperties = {
  padding: '6px 14px', borderRadius: '9999px', // Pill shape
  fontSize: 12, fontWeight: 700, cursor: 'pointer',
  background: '#2563eb', color: '#ffffff',
  boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
};
```

---

## ⚙️ 5. Nguyên Tắc Trải Nghiệm Người Dùng (UX Principles)

1. **Phản hồi tức thì (Optimistic UI & Feedback)**:
   - Mọi thao tác ghi dữ liệu (Save, Delete, Update) đều phải làm mờ nút (`disabled`), xoay icon tải (Loader2), và hiển thị `toast.success` hoặc `toast.error` (qua thư viện Sonner) sau khi hoàn tất.
2. **Bảo vệ rủi ro (Destructive Actions)**:
   - Xóa dữ liệu (Delete Subject, Reject Order) bắt buộc phải qua 2 bước xác nhận (Hiển thị Popconfirm/Modal màu đỏ).
3. **Hiệu năng hoạt ảnh (Animations)**:
   - Các hiệu ứng cuộn trang, fade-in sử dụng `framer-motion` (`whileInView`).
   - Thành phần 3D (WebGL) phải tối ưu Garbage Collection và tự động giảm cấu hình (`performance.min`) để không gây giật lag hoặc quá nhiệt thiết bị.
4. **Responsive Cấp Độ Mịn**:
   - Bảng dữ liệu Admin (Table) tự động chuyển sang cấu trúc Thẻ (Cards) trên màn hình Mobile.
   - Các form Bộ lọc phức tạp tự động gom vào Bottom Sheet (Drawer) khi ở giao diện hẹp.
