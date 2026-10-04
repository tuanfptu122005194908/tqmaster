# Technical Implementation Plan: Core Authentication & Profile

## Technical Context
- **Pages**: `AuthPage.tsx`, `VerifyEmailPage.tsx`, `ProfilePage.tsx`.
- **Functions**: Edge functions for OTP.

## Phase 1: Database
- Configure Supabase `profiles` table and trigger on `auth.users` insert.
- Configure `avatars` storage bucket.

## Phase 2: Frontend
- Implement `AppContext.tsx` for global user session state.
- Implement OTP logic in `AuthPage.tsx`.
- Implement Profile edit form in `ProfilePage.tsx` using `react-hook-form`.
