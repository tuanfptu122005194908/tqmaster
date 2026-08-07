<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/graduation-cap.svg" width="100" height="100" alt="TQMaster Logo" />
  
  # TQMaster - Hệ thống Học tập & Ôn thi Toàn diện

  **Nền tảng quản lý học tập, làm bài thi trắc nghiệm và ôn luyện trực tuyến chuyên nghiệp.**

  <p align="center">
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  </p>
</div>

---

## 🌟 Giới thiệu chung

**TQMaster** là một nền tảng học tập trực tuyến (E-Learning) hiện đại, tập trung vào trải nghiệm người dùng với tốc độ cao, giao diện tối giản, sang trọng và hệ thống bài thi trắc nghiệm tương tác thời gian thực. Hệ thống được phát triển tuân thủ nghiêm ngặt theo mô hình **Spec-Driven Development (SDD)**.

---

## 🚀 Tính năng nổi bật (10 Core Features)

Hệ thống được thiết kế theo kiến trúc Module hóa với 10 phân hệ tính năng độc lập, đáp ứng trọn vẹn nhu cầu của học viên và quản trị viên.

### 🎓 Dành cho Học viên (Student Portal)
- 🛒 **StudyHub & Giỏ hàng**: Khám phá khóa học, xem chi tiết môn học, thêm vào giỏ hàng và thanh toán trực tuyến.
- 📝 **Hệ thống Thi Tương tác**: Trải nghiệm làm bài trắc nghiệm mượt mà với hiệu ứng Swipe (Carousel), đồng hồ bấm giờ và hệ thống chấm điểm tự động tức thì.
- 📰 **Bảng tin & Thông báo**: Cập nhật tin tức học thuật và nhận thông báo (Banner) trực tiếp từ ban quản trị.
- 🔐 **Bảo mật & Cá nhân hóa**: Đăng ký/Đăng nhập an toàn qua Email OTP (Không cần nhớ mật khẩu). Tùy chỉnh hồ sơ cá nhân và ảnh đại diện.
- 🚩 **Góp ý học thuật**: Tính năng "Report" trực tiếp các câu hỏi có lỗi để giáo viên khắc phục.

### 🛡️ Dành cho Quản trị viên (Admin Dashboard)
- 📊 **Dashboard Thống kê Live**: Báo cáo doanh thu, số lượng đơn hàng và người dùng. Tích hợp WebSockets nhận thông báo nổ đơn hàng *Real-time*.
- 📚 **Quản lý Nội dung (CMS)**: Toàn quyền thao tác (CRUD) đối với Môn học, Đề thi, Ngân hàng câu hỏi và Tài liệu lý thuyết.
- 👥 **Quản lý Đơn hàng & User**: Xét duyệt đơn mua khóa học, phân quyền tài khoản (User/Admin).
- 📢 **Quản lý Tin tức**: Trực tiếp biên tập, xuất bản tin tức và thông báo nổi bật tới toàn bộ học viên.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

### Frontend
- **Core Framework**: React 18, Vite, TypeScript
- **Styling & UI**: Tailwind CSS, Shadcn UI, Radix UI, Lucide Icons
- **State & Data Fetching**: React Context, TanStack Query (React Query)
- **Routing**: React Router DOM v6
- **Forms & Validation**: React Hook Form, Zod

### Backend (BaaS)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, OTP Auth)
- **Real-time**: Supabase Channels (WebSockets)
- **Functions**: Deno-based Supabase Edge Functions (`create-order`, v.v.)
- **Storage**: Supabase Storage Buckets (Avatars, Tài liệu)

---

## 🏗️ Phương pháp Phát triển: SDD (Spec-Driven Development)

Dự án này là minh chứng thực tế cho việc áp dụng phương pháp **Spec-Driven & Agent-Driven Development**.
Toàn bộ tài liệu thiết kế (Architecture, Specs, Plans, Tasks) được tổ chức và chuẩn hóa thành 10 thư mục cụ thể tại:

```bash
📂 .sdd/specs/
 ├── 01-core-auth/
 ├── 02-admin-dashboard/
 ├── 03-admin-subject-theory/
 ├── 04-admin-exam-questions/
 ├── 05-admin-order-users/
 ├── 06-admin-news/
 ├── 07-user-studyhub/
 ├── 08-user-exam-system/
 ├── 09-user-ecommerce/
 └── 10-user-news/
```
*Việc chuẩn hóa spec giúp hệ thống dễ dàng được maintain và mở rộng tự động bởi các AI Agents trong tương lai.*

---

## 💻 Hướng dẫn Cài đặt (Getting Started)

### Yêu cầu môi trường
- Node.js (v18+)
- Bun hoặc npm
- Supabase Project (url & anon key)

### Cài đặt
1. **Clone dự án**
   ```bash
   git clone https://github.com/thanhtuanfptse05/smart-curate-learn.git
   cd smart-curate-learn
   ```

2. **Cài đặt thư viện**
   ```bash
   bun install
   ```

3. **Cấu hình môi trường**
   Tạo file `.env` ở thư mục gốc và thêm các thông số:
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Chạy server phát triển**
   ```bash
   bun run dev
   ```
   *Ứng dụng sẽ chạy tại địa chỉ http://localhost:8080*

---
<div align="center">
  <i>Được thiết kế và phát triển với ❤️ cho nền giáo dục tương lai.</i>
</div>
