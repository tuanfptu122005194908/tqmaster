# Technical Implementation Plan: Interactive Exam System

## Technical Context
- **Pages**: `ExamPage.tsx`.
- **Components**: Shadcn Carousel.

## Phase 1: Exam Interface
- Fetch exam JSON.
- Maintain `answers` object in local state.
- Render questions using Embla Carousel for a card-like swiping interface.

## Phase 2: Scoring
- On submit, calculate score: `(correct_answers / total_questions) * 10`.
- Display Score Modal.

## Phase 3: Reporting
- Add a "Report Issue" button on each question card.
- Insert into `question_reports` table via Supabase client.
