## Technical Plan

1. **Database / Backend**:
   - Sử dụng tool SQL hoặc báo cho người dùng chạy lệnh SQL thêm cột:
     ```sql
     ALTER TABLE public.exams ADD COLUMN exam_type text DEFAULT 'FE';
     ```
   - Chỉnh sửa thủ công kiểu dữ liệu trong `src/integrations/supabase/types.ts` để TypeScript nhận diện:
     Thêm `exam_type: string | null` hoặc `exam_type: string` vào bảng `exams`.

2. **Thay đổi trong Admin (`AdminExams.tsx`)**:
   - Cập nhật state `form` để có thêm trường `exam_type: 'FE' | 'PT'`.
   - Trong giao diện Modal/Form tạo đề, thêm Radio hoặc Select để Admin chọn "Đề thi FE" hoặc "Đề thi PT".
   - Cập nhật hàm `saveExam` để gửi `exam_type` khi insert/update.
   - Hiển thị badge nhỏ 'FE' hoặc 'PT' ở danh sách đề phía cột trái cho rõ ràng.

3. **Thay đổi trong User (`SubjectDetailPage.tsx`)**:
   - Cập nhật kiểu `Tab` mở rộng: `type Tab = 'exams' | 'exams_pt' | 'theory' | 'pe' | 'announcements' | 'reviews';`
   - Tạo biến `feExams` và `ptExams` từ mảng `exams` state:
     - `ptExams = exams.filter(e => e.exam_type === 'PT');`
     - `feExams = exams.filter(e => e.exam_type !== 'PT');` (Mặc định null/FE đều là FE).
   - Trong định nghĩa `TABS`, đổi tên `exams` thành 'Đề thi FE' và thêm phần tử `exams_pt` là 'Đề thi PT'.
   - Refactor JSX: hiển thị list đề thi tương ứng với tab.
