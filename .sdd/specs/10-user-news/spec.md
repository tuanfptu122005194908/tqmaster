# Feature Specification: News & Announcements Viewer

**Feature Branch**: `[main]`

**Status**: Active

## User Scenarios & Testing

### User Story 1 - Read News (Priority: P3)
As a student, I want to read news articles published by the school/admin.
**Acceptance Scenarios**:
1. **Given** a student on `/news`, **When** page loads, **Then** articles are listed.

### User Story 2 - View Announcements (Priority: P2)
As a student, I want to see important announcements on the dashboard.
**Acceptance Scenarios**:
1. **Given** an active announcement, **When** student logs in, **Then** a banner is visible.

## Requirements
### Functional Requirements
- **FR-001**: System MUST fetch `news` and `announcements` for non-admin users (read-only).

### Key Entities
- **News**: Read from DB.
- **Announcements**: Read from DB.
