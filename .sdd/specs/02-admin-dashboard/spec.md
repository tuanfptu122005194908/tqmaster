# Feature Specification: Admin Dashboard & Settings

**Feature Branch**: `[main]`

**Status**: Active

## User Scenarios & Testing

### User Story 1 - Dashboard Overview (Priority: P1)
As an admin, I want to see a summary of orders, revenue, and active students.
**Acceptance Scenarios**:
1. **Given** an admin on `/admin`, **When** dashboard loads, **Then** stat cards display aggregates from `orders` and `profiles`.

### User Story 2 - Global Settings (Priority: P2)
As an admin, I want to configure platform settings.
**Acceptance Scenarios**:
1. **Given** an admin on `/admin/settings`, **When** they update config, **Then** settings are saved.

## Requirements
### Functional Requirements
- **FR-001**: Dashboard MUST aggregate data in real-time or near real-time.
- **FR-002**: System MUST subscribe to WebSockets for live order alerts.

### Key Entities
- **Settings**: Configuration keys/values.

## Success Criteria
- **SC-001**: Dashboard renders in under 1 second.
