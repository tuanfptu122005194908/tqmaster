# Feature Specification: Interactive Exam System

**Feature Branch**: `[main]`

**Status**: Active

## User Scenarios & Testing

### User Story 1 - Take Exam (Priority: P1)
As a student, I want to take a multiple-choice exam and get my score instantly.
**Acceptance Scenarios**:
1. **Given** a student on an active exam page, **When** they finish and submit, **Then** score is calculated.

### User Story 2 - Report Question (Priority: P3)
As a student, I want to report a question if it has a wrong answer key.
**Acceptance Scenarios**:
1. **Given** a student on a question, **When** they click "Report", **Then** a report is saved to the database.

## Requirements
### Functional Requirements
- **FR-001**: System MUST render questions interactively (e.g., swipeable cards).
- **FR-002**: System MUST calculate score.
- **FR-003**: System MUST allow users to insert into `question_reports`.

### Key Entities
- **Exams**: `questions` (JSON array).
- **Question Reports**: user_id, exam_id, reason.
