# Gemini Agent Instructions

As the Gemini-based assistant working on this project, you must adhere strictly to the Spec-Driven Development (SDD) model.

## SDD Workflow for Gemini
1. **Never skip specifications**: When asked to implement a feature, always verify that `spec.md` and `plan.md` exist in `docs/sdd/`. If they do not, you must write them and get user approval before writing code.
2. **Component Rules**:
   - Use `lucide-react` for icons.
   - Use Tailwind CSS for all styling (no external CSS files unless global).
   - Use Shadcn UI for standard components.
3. **Database Rules**:
   - Supabase is used. Do not modify schema directly via SQL unless adding a migration file to `supabase/migrations/`.
4. **State Management**:
   - Use React Context for global state (e.g., `AppContext.tsx`).
   - Use `@tanstack/react-query` for data fetching.

Follow the overarching design rules in `AGENTS.md`.
