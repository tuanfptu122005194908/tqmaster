# Plan 44 — PE Campus Selector

## Technical Architecture

### 1. Database Migration
Thêm cột `campus` vào `theories` với constraint CHECK để đảm bảo chỉ có 5 giá trị hợp lệ. Default là `'HaNoi'` để không ảnh hưởng các bản ghi cũ.

```sql
ALTER TABLE theories 
ADD COLUMN IF NOT EXISTS campus TEXT DEFAULT 'HaNoi'
  CHECK (campus IN ('HaNoi', 'HCM', 'CanTho', 'DaNang', 'QuyNhon'));
```

### 2. TypeScript Types Update (`src/integrations/supabase/types.ts`)
Thêm `campus: string` (hoặc `campus?: string | null`) vào Row, Insert, Update interface của `theories`. Dùng `string` để không breaking change với generated types pattern của project.

### 3. Admin UI (`AdminTheory.tsx`)
**FormState**: Thêm `campus: Campus` với default `'HaNoi'`.

**CAMPUS_OPTS array**:
```typescript
const CAMPUS_OPTS = [
  { value: 'HaNoi',  label: 'Hà Nội',       bg: '#dbeafe', color: '#1d4ed8', border: '#bfdbfe' },
  { value: 'HCM',    label: 'TP. Hồ Chí Minh', bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
  { value: 'CanTho', label: 'Cần Thơ',       bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
  { value: 'DaNang', label: 'Đà Nẵng',       bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  { value: 'QuyNhon',label: 'Quy Nhơn',      bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
];
```

**Form UI** (chỉ hiện khi `form.category === 'pe'`): Radio button grid 5 campus, dùng styled button giống pattern hiện có của form.

**Save function**: Thêm `campus: form.campus` vào cả insert và update payload.

**openEdit**: Pre-fill `campus: t.campus ?? 'HaNoi'`.

**Admin card**: Thêm badge campus nhỏ bên cạnh badge "Tài liệu PE".

### 4. User Display (`SubjectDetailPage.tsx`)
Trong `renderPeDocs`, sau title/badge existing, thêm badge campus:
```tsx
<span style={{ background: campusStyle.bg, color: campusStyle.color, border: `1px solid ${campusStyle.border}`, ... }}>
  {campusLabel}
</span>
```

Dùng helper function `getCampusStyle(campus: string | null)` để lấy màu và label.

## Implementation Steps

1. Tạo migration file SQL
2. Apply migration lên Supabase remote (`npx supabase db push --remote`)
3. Update `types.ts` thêm `campus` field
4. Update `AdminTheory.tsx`:
   - Thêm Campus type và CAMPUS_OPTS
   - Cập nhật FormState, EMPTY_FORM
   - Cập nhật `openEdit` để pre-fill campus
   - Thêm campus radio UI trong form (conditional on `form.category === 'pe'`)
   - Thêm campus vào save payload
   - Thêm campus badge trên admin card (conditional on `isPE`)
5. Update `SubjectDetailPage.tsx`:
   - Thêm helper `getCampusStyle` / `getCampusLabel`
   - Thêm badge campus trong `renderPeDocs`
6. Build check: `npm run build`
7. Test: `npm test -- --run`
8. Commit + dual push

