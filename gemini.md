# Gemini Agent Instructions

As the AI assistant working on this project, you must strictly follow the Spec-Driven Development (SDD) model and development rules.

## 1. SDD Workflow: "Spec First — Có Spec mới được Code"
1. **Never write code before specification**: When asked to implement or modify any feature, you must first create or update `spec.md`, `plan.md`, and `tasks.md` in `.sdd/specs/` using the `speckit` skill/workflow.
2. **Review Gate**: Obtain user approval on the spec before writing any application code.
3. **Spec Standards**: Ensure User Stories with Given-When-Then acceptance scenarios, Functional Requirements (FR-xxx), Key Entities, Key Files, and measurable Success Criteria (SC-xxx).

## 2. Fast Code Exploration via CodeGraph & Graphify
1. **CodeGraph First**: Use `codegraph_explore` (MCP) or `codegraph explore` (CLI) to trace call graphs, explore symbols, and assess blast radius before modifying code.
2. **Graphify Knowledge Graph**: Use `graphify query` for architecture questions, and run `graphify update .` after code modifications.

## 3. Automated Dual-Repo Git Push
- After completing work, running tests (`npm test`), and committing:
- **Always push to both repositories**:
  - `git push origin <branch>` (Repository 1: `https://github.com/thanhtuanfptse05/smart-curate-learn`)
  - `git push tqmaster <branch>` (Repository 2: `https://github.com/tuanfptu122005194908/tqmaster.git`)

## 4. UI & Technology Stack Rules
- Icons: `lucide-react`.
- Styling: Tailwind CSS adhering strictly to the TQMaster Dashboard Theme in `AGENTS.md`.
- Components: Shadcn UI.
- Database: Supabase PostgreSQL. Never modify schema without migration files.
- State: React Context (`AppContext.tsx`) & TanStack React Query.
