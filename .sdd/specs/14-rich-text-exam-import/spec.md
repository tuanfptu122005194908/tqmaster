# Feature Specification: Rich Text Exam Import — LaTeX, Hình Ảnh Inline & Nhận Biết Câu Hỏi Thông Minh

**Feature Branch**: `feat/rich-text-exam-import`  
**Status**: Draft — Awaiting Approval  
**Version**: 1.0  
**Ngày viết**: 2026-08-09

---

## 1. Bối Cảnh & Vấn Đề

Hiện tại hệ thống import câu hỏi dạng text (`AdminExams.tsx`) có những hạn chế nghiêm trọng:

| Hạn chế | Mô tả |
|---|---|
| Không hỗ trợ LaTeX/KaTeX | Công thức toán học bị hiển thị dạng raw text (ví dụ `$\frac{1}{2}$`) |
| Không hỗ trợ hình ảnh inline | Khi upload `.docx` có ảnh nhúng, ảnh bị bỏ qua hoàn toàn |
| Parser câu hỏi thô | Dùng `mammoth.extractRawText()` — mất hết formatting, mất ảnh |
| Không nhận biết ảnh thuộc câu nào | Không có cơ chế gán ảnh vào đúng câu hỏi tương ứng |
| ExamPage không render LaTeX | Học sinh thấy ký tự thô thay vì công thức đẹp |

---

## 2. Mục Tiêu

1. **Smart Word Parser**: Đọc `.docx` bằng `mammoth` với chế độ HTML (không phải raw text) để giữ lại ảnh inline dưới dạng base64.
2. **Nhận biết câu hỏi thông minh**: Parse cấu trúc `Câu N:` / `A.` / `B.` / `C.` / `D.` kể cả khi có ảnh nằm giữa nội dung.
3. **LaTeX/KaTeX rendering**: Render công thức toán (`$...$`, `$$...$$`, `\(...\)`, `\[...\]`) ở cả admin preview và trang làm bài của học sinh.
4. **Hình ảnh inline trong câu hỏi**: Ảnh nhúng trong file Word (hoặc do admin upload riêng) được gán đúng vào câu hỏi tương ứng, upload lên Supabase Storage và lưu URL.
5. **Hỗ trợ ảnh trong đáp án**: Option A/B/C/D cũng có thể chứa ảnh.

---

## 3. User Stories & Acceptance Scenarios

### US-01: Admin Import Word Có Hình Ảnh (Priority: P0)
> As an admin, I want to upload a `.docx` file that contains both text and embedded images, so that each question is correctly created with its associated image(s).

**Acceptance Scenarios**:
1. **Given** một file `.docx` có cấu trúc:
   ```
   Câu 1: Hình nào sau đây là hình vuông?
   [ảnh nhúng]
   A. Hình tròn
   B. Hình chữ nhật
   C. Hình vuông
   D. Hình thang
   ```
   **When** admin upload file này,  
   **Then** hệ thống tạo 1 câu hỏi với `content = "Hình nào sau đây là hình vuông?"`, `image_url` trỏ đến ảnh đã upload lên Storage, và 4 options A-D đầy đủ.

2. **Given** một file có 40 câu hỏi, mỗi câu có thể có hoặc không có ảnh,  
   **When** admin upload,  
   **Then** hệ thống nhận ra chính xác 40 câu, mỗi câu có đúng 4 options, ảnh được gán đúng câu (không bị gán nhầm sang câu kế tiếp).

3. **Given** một file Word không có ảnh nào,  
   **When** admin upload,  
   **Then** hệ thống hoạt động bình thường như cũ (backward compatible).

### US-02: Admin Thấy Preview LaTeX Trong Admin Panel (Priority: P1)
> As an admin, I want to see rendered LaTeX formulas when reviewing questions, so that I can verify the content looks correct before students see it.

**Acceptance Scenarios**:
1. **Given** câu hỏi có content `"Tính $\\frac{d}{dx}[x^2]$"`,  
   **When** admin mở đề thi trong AdminExams,  
   **Then** công thức được render bằng KaTeX, không hiển thị raw `$\\frac{d}{dx}[x^2]$`.

2. **Given** câu hỏi có LaTeX block `$$\\int_0^1 x\\,dx = \\frac{1}{2}$$`,  
   **Then** block được render dạng display (centered), không phải inline.

### US-03: Học Sinh Thấy LaTeX Và Ảnh Khi Làm Bài (Priority: P0)
> As a student, I want to see properly rendered math formulas and images when taking an exam.

**Acceptance Scenarios**:
1. **Given** câu hỏi có công thức LaTeX,  
   **When** học sinh mở trang làm bài (`ExamPage.tsx`),  
   **Then** công thức được render đẹp bằng KaTeX.

2. **Given** câu hỏi có `image_url` (ảnh đề kèm theo) VÀ `content` text,  
   **When** học sinh xem câu hỏi,  
   **Then** cả text VÀ ảnh đều hiển thị (không phải either/or như hiện tại).

3. **Given** đáp án A/B/C/D có `image_url` trong option,  
   **Then** ảnh hiển thị trong option tương ứng khi học sinh đọc.

### US-04: Admin Nhập Text Có LaTeX Qua Textarea (Priority: P2)
> As an admin, I want to paste text with LaTeX syntax into the textarea and preview rendered math before importing.

**Acceptance Scenarios**:
1. **Given** admin paste text có `$x^2 + y^2 = r^2$` vào textarea,  
   **When** họ click nút "Preview",  
   **Then** hiển thị preview panel với LaTeX đã render đẹp.

---

## 4. Yêu Cầu Chức Năng Chi Tiết

### 4.1 Word Parser Engine (Core)

**Thay đổi từ `mammoth.extractRawText()` sang `mammoth.convertToHtml()`**:

```
Input:  .docx ArrayBuffer
Output: { questions: ParsedQuestion[], imageUploadCount: number }
```

**Quy tắc nhận biết câu hỏi** (parser regex):

| Pattern | Ý nghĩa |
|---|---|
| `Câu N:` hoặc `Cau N:` | Bắt đầu câu hỏi mới (N = số nguyên) |
| `N.` đứng đầu dòng | Alias |
| `A.` / `A)` | Bắt đầu option A |
| `B.` / `B)` | Option B |
| `C.` / `C)` | Option C |
| `D.` / `D)` | Option D |
| `E.` → `H.` | Options bổ sung nếu có |
| `Đáp án:` / `Answer:` | Bảng đáp án cuối file |
| `Chương N` | Nhóm chương (chapter_name) |

**Quy tắc gán ảnh vào câu**:
- Ảnh xuất hiện SAU text câu hỏi VÀ TRƯỚC `A.` đầu tiên → `question.image_url`
- Ảnh xuất hiện SAU `A.` / `B.` ... TRONG một option → `question_option.image_url`
- Câu hỏi có nhiều ảnh trước options → cái đầu tiên là `image_url`, còn lại vào `extra_images[]`

**Xử lý ảnh từ HTML output của mammoth**:
```
<img src="data:image/png;base64,...">
  → decode base64 → Blob
  → compress qua canvas (max 1024px, quality 0.85)
  → upload lên Supabase Storage 'exam-images/{examId}/{order}_{idx}.jpg'
  → lấy publicUrl → gán vào field tương ứng
```

### 4.2 Database Schema Changes

**Migration**: `20260810000000_exam_rich_content.sql`

```sql
-- Thêm cột extra_images cho câu hỏi có nhiều ảnh
ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS extra_images TEXT[] DEFAULT '{}';

-- Thêm cột image_url cho option có ảnh minh họa  
ALTER TABLE public.question_options
  ADD COLUMN IF NOT EXISTS image_url TEXT;
```

> Cả hai thay đổi backward-compatible: nullable / default rỗng.

### 4.3 KaTeX Integration

**Cài đặt packages**:
```bash
npm install katex
npm install --save-dev @types/katex
```

**Component `RichContent`** (`src/components/exam/RichContent.tsx`):
- Input: `content: string`, `className?: string`
- Parse nội dung, tách thành các segment: plain text | inline-math | block-math | image
- Render mỗi segment bằng `katex.renderToString()` với `throwOnError: false`
- Fallback graceful: nếu KaTeX lỗi → hiển thị raw text trong `<code>`, không crash
- Lazy import KaTeX (`import('katex')`) để không block initial load

**Pattern detect LaTeX**:
```
$$...$$   → display/block math
$...$     → inline math
\[...\]   → display math (LaTeX convention)
\(...\)   → inline math (LaTeX convention)
```

### 4.4 Upload Pipeline & Progress

```
File .docx upload
  → mammoth.convertToHtml({ arrayBuffer, options: { convertImage: ... } })
  → parseHtmlToQuestions(html)         // trả về ParsedQuestion[]
  → showPreview(questions)             // Admin confirm trước khi import
  → [Admin nhấn "Nhập N câu"]
  → for each question:
      → uploadInlineImages()           // async, với progress
      → supabase.insert(questions)
      → supabase.insert(question_options)
  → fetchQuestions()                   // refresh UI
```

**UI Progress bar**:
- Phase 1: `Đang phân tích file... ({N} câu nhận dạng được)`
- Phase 2: `Đang upload ảnh {x}/{total}...`
- Phase 3: `Đang lưu câu hỏi {x}/{total}...`

### 4.5 UI Changes — AdminExams.tsx

**Import section** thêm 2 tab:
1. **Tab "📄 File Word"** (active by default):
   - Nút upload `.docx` (giữ nguyên)
   - **Preview card** sau khi parse: Nhận được X câu | Y ảnh sẽ upload
   - Danh sách tóm tắt câu (câu số, có/không ảnh)
   - Nút **"Nhập N câu hỏi"** để confirm

2. **Tab "📝 Nhập Text"** (tab cũ):
   - Textarea như cũ
   - Thêm nút **"👁 Preview"** toggle preview panel có KaTeX

**Question card** hiển thị sau khi import:
- Content render qua `<RichContent>` (có KaTeX)
- Ảnh câu hỏi (`image_url`) hiển thị BÊN DƯỚI content (không thay thế)
- `extra_images` hiển thị dưới `image_url`
- Options: content qua `<RichContent>`, ảnh option nếu có

### 4.6 UI Changes — ExamPage.tsx (Học sinh)

**Question display** thay thế logic hiện tại:

```tsx
// Hiện tại (sai):
{!q.image_url ? <TextContent /> : <span>[Câu hình ảnh]</span>}

// Sau feature (đúng):
<RichContent content={q.content} />
{q.image_url && <img src={q.image_url} ... />}
{q.extra_images?.map(url => <img src={url} ... />)}
```

**Options display**:
```tsx
// Sau feature:
<RichContent content={opt.content} />
{opt.image_url && <img src={opt.image_url} ... />}
```

---

## 5. Yêu Cầu Phi Chức Năng

| Yêu cầu | Mục tiêu |
|---|---|
| Performance | Parse 40 câu + upload 20 ảnh < 30 giây |
| Graceful degradation | KaTeX parse fail → raw text, không crash |
| Backward compatibility | Câu hỏi cũ hiển thị bình thường 100% |
| Bundle size | KaTeX lazy-import, không ảnh hưởng initial load |
| Mobile responsive | Ảnh không tràn màn hình, max-width: 100% |
| Error handling | Mỗi ảnh fail → bỏ qua, log, không dừng import |

---

## 6. Files Cần Thay Đổi

| File | Loại thay đổi | Mô tả |
|---|---|---|
| `supabase/migrations/20260810000000_exam_rich_content.sql` | **MỚI** | Thêm `extra_images`, `option.image_url` |
| `src/components/exam/RichContent.tsx` | **MỚI** | Component render LaTeX + text |
| `src/lib/wordParser.ts` | **MỚI** | Smart HTML parser từ mammoth output |
| `src/lib/imageUpload.ts` | **MỚI** | Compress + upload ảnh base64 lên Storage |
| `src/pages/admin/AdminExams.tsx` | **MODIFY** | Dùng parser mới + tabs + preview + RichContent |
| `src/pages/user/ExamPage.tsx` | **MODIFY** | Render RichContent thay thế logic either/or |
| `src/integrations/supabase/types.ts` | **MODIFY** | Thêm type cho cột mới (auto-gen hoặc manual) |
| `package.json` | **MODIFY** | Thêm `katex` dependency |

---

## 7. Out of Scope

- OCR (nhận dạng chữ trong ảnh ảnh scan)
- Import từ PDF
- Equation editor WYSIWYG (chỉ LaTeX text syntax)
- Export câu hỏi ra Word
- Import từ Google Docs

---

## 8. Rủi Ro & Mitigation

| Rủi Ro | Xác suất | Mitigation |
|---|---|---|
| mammoth không extract được ảnh SVG | Cao | Chỉ xử lý PNG/JPEG/GIF, bỏ qua SVG |
| File Word có structure không chuẩn | Cao | Template mẫu, warning khi parse ít hơn expected |
| KaTeX lỗi công thức phức tạp | Trung bình | Try/catch per formula, fallback raw text |
| Base64 ảnh lớn → upload chậm | Thấp | Compress qua canvas trước khi upload |
| Supabase Storage 50MB limit/file | Thấp | Reject file > 5MB per image |

---

## 9. Dependencies

| Package | Đã có? | Action |
|---|---|---|
| `mammoth` ^1.12.0 | ✅ Có | Dùng `convertToHtml()` thay `extractRawText()` |
| `katex` | ❌ Chưa có | `npm install katex @types/katex` |

---

## 10. Acceptance Checklist (Definition of Done)

- [ ] Upload `.docx` có 40 câu + 15 ảnh → đúng 40 câu, ảnh gán đúng câu
- [ ] `$x^2$` render thành x² trong admin và ExamPage
- [ ] `$$\\int$$` render dạng block (centered) 
- [ ] Câu hỏi cũ (type='image', type='text') vẫn hiển thị 100% đúng
- [ ] Progress bar 3 phase hiển thị khi import
- [ ] mammoth lỗi → toast error, không crash UI
- [ ] Mobile: ảnh không tràn màn hình
- [ ] Migration SQL chạy thành công
- [ ] KaTeX lazy-loaded (không làm chậm initial load)
- [ ] Options có ảnh hiển thị ảnh đúng vị trí
