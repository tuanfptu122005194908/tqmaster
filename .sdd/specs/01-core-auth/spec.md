# Feature Specification: Core Authentication & Profile

**Feature Branch**: `[main]`

**Status**: Active

## User Scenarios & Testing

### User Story 1 - Sign Up & Login with OTP (Priority: P1)
As a user, I want to authenticate via an email OTP so that I can access my account securely without a password.
**Acceptance Scenarios**:
1. **Given** an unauthenticated user on `/auth`, **When** they enter email and request OTP, **Then** an OTP is sent.
2. **Given** they received OTP, **When** they submit it, **Then** they are logged in and session is stored.

### User Story 2 - Profile Management (Priority: P2)
As a logged-in user, I want to update my avatar and phone number.
**Acceptance Scenarios**:
1. **Given** a user on `/profile`, **When** they change their info and save, **Then** `profiles` table is updated.

## Requirements
### Functional Requirements
- **FR-001**: System MUST use Supabase Auth for OTP login (`signup-with-otp`).
- **FR-002**: System MUST allow uploading avatars to Supabase Storage.
- **FR-003**: System MUST sync `auth.users` with `public.profiles`.

### Key Entities
- **Profiles**: `id` (uuid), `role` (text), `full_name`, `avatar_url`, `phone_number`.

## Success Criteria
- **SC-001**: Login flow completion under 30s.
