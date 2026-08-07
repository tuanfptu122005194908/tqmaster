# Project AGENTS & UI Rules

## General AI Rules
1. **Spec-Driven Development (SDD)**: All feature development MUST follow the SDD process. You must not write code before having a clear specification.
2. **Review Spec First**: Always read the `docs/sdd/spec.md` and `docs/sdd/plan.md` before making architectural or feature changes.
3. **Keep `tasks.md` Updated**: After finishing a task, cross it off in `docs/sdd/tasks.md`.
4. **Never Guess Requirements**: If something is ambiguous in the specs, ask the user. Do not assume.

## UI & Design Rules (TQMaster Dashboard Theme)
Whenever creating or modifying frontend components, pages, or layouts in this repository, strictly adhere to the following design system:

1. **Canvas & Surfaces**:
   - Page background: `#f4f7fc`
   - Card surface: `#ffffff` with `borderRadius: 20-24`, `border: 1px solid #e2e8f0`, `boxShadow: 0 2px 10px rgba(0,0,0,0.02)`
2. **Primary Actions**:
   - Buttons: `linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)` with `color: #ffffff`, `borderRadius: 12-14`, `fontWeight: 800`, `boxShadow: 0 6px 18px rgba(37, 99, 235, 0.35)`
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
   - Headings: `fontWeight: 900` or `800`, `color: #0f172a`, `letterSpacing: -0.03em`
