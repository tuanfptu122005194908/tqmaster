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

## Requirements
### Functional Requirements
- **FR-001**: System MUST support JSON array creation for questions.
- **FR-002**: System MUST list question reports and allow marking as resolved.

### Key Entities
- **Exams**: `id`, `subject_id`, `questions` (JSON), `time_limit`.
- **Question Reports**: `id`, `user_id`, `exam_id`, `question_index`, `reason`.
