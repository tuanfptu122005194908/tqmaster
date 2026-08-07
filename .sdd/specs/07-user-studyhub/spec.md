# Feature Specification: StudyHub & Course Catalog

**Feature Branch**: `[main]`

**Status**: Active

## User Scenarios & Testing

### User Story 1 - Browse Subjects (Priority: P1)
As a student, I want to browse subjects so that I can find courses to study.
**Acceptance Scenarios**:
1. **Given** a user on `/study-hub`, **When** the page loads, **Then** all active subjects are displayed.

### User Story 2 - Subject Details (Priority: P1)
As a student, I want to see details of a subject including its exams.
**Acceptance Scenarios**:
1. **Given** a user on `/subject/:id`, **When** they load the page, **Then** subject info and exam list are shown.

## Requirements
### Functional Requirements
- **FR-001**: System MUST display `subjects` to non-admin users.
- **FR-002**: System MUST hide exam contents for unpaid users (if the subject is paid).

### Key Entities
- **Subjects**: `id`, `title`, `description`, `price`.
