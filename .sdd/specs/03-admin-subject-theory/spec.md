# Feature Specification: Subject & Theory Management

**Feature Branch**: `[main]`

**Status**: Active

## User Scenarios & Testing

### User Story 1 - Subject CRUD (Priority: P1)
As an admin, I want to manage Subjects so that I can organize content.
**Acceptance Scenarios**:
1. **Given** an admin on `/admin/subjects`, **When** they add a subject, **Then** it reflects in the catalog.

### User Story 2 - Theory Management (Priority: P1)
As an admin, I want to upload theory materials linked to subjects.
**Acceptance Scenarios**:
1. **Given** an admin on `/admin/theory`, **When** they associate content to a subject, **Then** students can read it.

## Requirements
### Functional Requirements
- **FR-001**: System MUST allow full CRUD on `subjects` and `theory` tables.

### Key Entities
- **Subjects**: `id`, `title`, `description`, `price`.
- **Theory**: `id`, `subject_id`, `content`.
