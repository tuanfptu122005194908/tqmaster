# Project Constitution (SDD)

## Core Principles
1. **User-Centric**: Every feature must tie back to a User Story. If it doesn't solve a user problem, we don't build it.
2. **Spec First**: No code is written without a `spec.md` and `plan.md`. 
3. **Independent Testability**: Every User Story must be independently verifiable (Given, When, Then).
4. **Clean Code**: We adhere strictly to TypeScript strict mode, ESLint, and avoid `any`.
5. **UI Consistency**: We use the TQMaster Dashboard theme globally. Shadcn UI + Tailwind CSS is the standard.

## Technical Architecture
- **Frontend**: React + Vite + TypeScript.
- **Backend/DB**: Supabase (PostgreSQL).
- **State**: React Context (global) and React Query (server state).
- **Styling**: Tailwind CSS.

## Git & Workflow
- Use semantic commits (`feat:`, `fix:`, `chore:`, etc.).
- Feature branches should follow `feat/feature-name` convention.
