# Feature Specification: Exam & Question Management

**Feature Branch**: `[main]`

**Status**: Active

## User Scenarios & Testing

### User Story 1 - Create Exams (Priority: P1)
As an admin, I want to create an exam with multiple questions.
**Acceptance Scenarios**:
1. **Given** an admin on `/admin/exams`, **When** they add an exam, **Then** it is saved to DB.

### User Story 2 - Review Question Reports (Priority: P2)
As an admin, I want to see reports from students about wrong questions.
**Acceptance Scenarios**:
1. **Given** an admin on `/admin/question-reports`, **When** they load the page, **Then** they see a list of reports.

### User Story 3 - View Exam Stats (Thống kê đáp án) (Priority: P1)
As an admin, I want to see the distribution of correct answers (A, B, C, D) across all questions in an exam.
**Acceptance Scenarios**:
1. **Given** an admin on `/admin/exam-stats`, **When** they view the stats, **Then** they see a breakdown of total questions and counts of A, B, C, D correct answers for each exam, grouped by subject.

### User Story 4 - Chronological Exam Sorting (Priority: P1)
As an admin or user, I want exams to be sorted chronologically by semester name rather than alphabetically.
**Acceptance Scenarios**:
1. **Given** a list of exams (e.g. SU26, SP26, FA25), **When** they are displayed, **Then** they are ordered strictly by timeline: SU (Summer) > SP (Spring) > FA (Fall), and grouped by year (e.g., SU26 > SP26 > FA25 > SU2025).

## Requirements
### Functional Requirements
- **FR-001**: System MUST store questions and options relationally in `questions` and `question_options` tables, not as a JSON array.
- **FR-002**: System MUST list question reports and allow marking as resolved.
- **FR-003**: System MUST calculate exam scores correctly to sort exams chronologically (SU=6, FA=9, SP=1, year multiplier).
- **FR-004**: System MUST aggregate correct option labels (A, B, C, D) for the AdminExamStats feature using efficient flat queries.

### Key Entities
- **Exams**: `id`, `title`, `duration_min`, `is_active`.
- **Exam_Subjects**: Mapping between `exam_id` and `subject_id`.
- **Questions**: `id`, `exam_id`, `content`, `type`, `order_num`, `chapter_name`.
- **Question Options**: `id`, `question_id`, `label` (A,B,C,D...), `content`, `is_correct`.
- **Question Reports**: `id`, `user_id`, `exam_id`, `question_index`, `reason`.
