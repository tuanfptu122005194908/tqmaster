# Feature Specification: Order & User Management

**Feature Branch**: `[main]`

**Status**: Active

## User Scenarios & Testing

### User Story 1 - Order Approvals (Priority: P1)
As an admin, I want to approve pending orders.
**Acceptance Scenarios**:
1. **Given** an admin on `/admin/orders`, **When** they click "Approve" on an order, **Then** the order status changes to `approved` and the student gets access.

### User Story 2 - User Management (Priority: P2)
As an admin, I want to view users and change their roles.
**Acceptance Scenarios**:
1. **Given** an admin on `/admin/users`, **When** they change a user's role to admin, **Then** that user gains admin access.

## Requirements
### Functional Requirements
- **FR-001**: System MUST display a list of all orders.
- **FR-002**: System MUST allow updating `orders.status`.
- **FR-003**: System MUST allow updating `profiles.role`.

### Key Entities
- **Orders**: `id`, `user_id`, `amount`, `status`, `created_at`.
- **Profiles (Users)**: `id`, `role`.
