# Feature Specification: Order & User Management

**Feature Branch**: `[main]`

**Status**: Active

## User Scenarios & Testing

### User Story 1 - Order Approvals (Priority: P1)
As an admin, I want to approve pending orders.
**Acceptance Scenarios**:
1. **Given** an admin on `/admin/orders`, **When** they click "Approve" on an order, **Then** the order status changes to `approved` and the student gets access.

### User Story 2 - User Management & Creation (Priority: P2)
As an admin, I want to view users, change their roles, and create new users.
**Acceptance Scenarios**:
1. **Given** an admin on `/admin/users`, **When** they change a user's role to admin, **Then** that user gains admin access.
2. **Given** an admin wants to create a new user, **When** they fill in the add user form, **Then** the user is created successfully bypassing the normal Google-only signup restrictions via `created_by_admin: true` metadata.

## Requirements
### Functional Requirements
- **FR-001**: System MUST display a list of all orders.
- **FR-002**: System MUST allow updating `orders.status`.
- **FR-003**: System MUST allow viewing profiles and updating roles in `user_roles` table.
- **FR-004**: System MUST allow Admins to create new users using the Supabase Auth API, injecting `created_by_admin: true` in user metadata to prevent `handle_new_user` triggers from blocking Email/Password signups.

### Key Entities
- **Orders**: `id`, `user_id`, `amount`, `status`, `created_at`.
- **Profiles (Users)**: `id`, `username`, `email`, `full_name`, `student_code`.
- **User Roles**: `id`, `user_id`, `role`.
