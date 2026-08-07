# Feature Specification: News & Announcements Management

**Feature Branch**: `[main]`

**Status**: Active

## User Scenarios & Testing

### User Story 1 - Publish News (Priority: P2)
As an admin, I want to publish news articles.
**Acceptance Scenarios**:
1. **Given** an admin on `/admin/news`, **When** they publish an article, **Then** it appears on the student news feed.

### User Story 2 - System Announcements (Priority: P3)
As an admin, I want to broadcast announcements.
**Acceptance Scenarios**:
1. **Given** an admin creates an announcement, **When** a student logs in, **Then** they see a banner.

## Requirements
### Functional Requirements
- **FR-001**: System MUST support CRUD for `news` and `announcements`.

### Key Entities
- **News**: `id`, `title`, `content`, `published_at`.
- **Announcements**: `id`, `message`, `active`.
