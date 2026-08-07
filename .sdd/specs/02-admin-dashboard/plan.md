# Technical Implementation Plan: Admin Dashboard & Settings

## Technical Context
- **Pages**: `AdminDashboard.tsx`, `AdminSettings.tsx`.
- **State**: React Query for fetching aggregates.

## Phase 1: Dashboard
- Fetch data from `orders` to calculate total revenue.
- Display in Shadcn UI Cards (following `AGENTS.md` palette guidelines).

## Phase 2: Real-time Notifications
- Listen to `orders` inserts in `AppContext.tsx`.
- Trigger Toast UI.

## Phase 3: Settings
- Implement `AdminSettings.tsx` form.
