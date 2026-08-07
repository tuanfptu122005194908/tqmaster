# Technical Implementation Plan: StudyHub & Course Catalog

## Technical Context
- **Pages**: `StudyHubPage.tsx`, `SubjectDetailPage.tsx`.

## Phase 1: StudyHub Page
- Fetch all subjects using React Query.
- Render as grid of cards.

## Phase 2: Subject Detail Page
- Fetch subject by ID.
- Check if user has purchased it (check `orders` table or rely on RLS).
- Display list of related exams.
- If paid and unpurchased, show "Add to Cart" button instead of "Take Exam" button.
