# Feature Specification: E-Commerce & Checkout

**Feature Branch**: `[main]`

**Status**: Active

## User Scenarios & Testing

### User Story 1 - Add to Cart (Priority: P2)
As a student, I want to add paid subjects to my cart.
**Acceptance Scenarios**:
1. **Given** a student on a subject page, **When** they click "Add to Cart", **Then** the cart counter increments.

### User Story 2 - Checkout (Priority: P1)
As a student, I want to checkout and pay for my cart.
**Acceptance Scenarios**:
1. **Given** items in cart, **When** the student checks out, **Then** an order is created.

## Requirements
### Functional Requirements
- **FR-001**: System MUST persist Cart items.
- **FR-002**: System MUST invoke `create-order` Edge Function.

### Key Entities
- **Cart**: Local state / Session storage.
- **Orders**: Database table.
