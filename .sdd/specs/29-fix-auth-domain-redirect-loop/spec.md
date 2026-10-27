# Fix auth callback redirect loop after domain migration

Feature Branch: `feat/fix-auth-domain-redirect-loop` (proposed)
Status: Complete — verified in production
Date: 2026-10-27

## 1. Overview

Google login returns a Supabase session fragment to `https://tuanvaquan.io.vn/`, but the deployed HTML bootstrap redirects every fragment containing `access_token` or `type=signup` to `tqmaster.vercel.app`. The old domain now returns HTTP 308 to the new domain. The fragment survives that redirect, so the same HTML redirect runs repeatedly before the app can consume the session.

Read-only verification found the redirect in both deployed HTML and local `index.html:4-17`. A VM reproduction with a dummy token confirmed that the HTML redirect and the observed Vercel redirect return to the identical starting callback URL. A URL without an auth fragment does not trigger the HTML redirect.

## 2. User Scenarios & Testing

### US-1: Google login on the new domain

Given Google/Supabase returns an auth callback to the configured new domain, when the HTML bootstrap runs, then it stays on that origin and allows the existing Supabase client to consume the callback.

### US-2: Email verification and password recovery

Given an email verification or recovery callback reaches an app origin allowed by Supabase, when the HTML bootstrap runs, then it leaves the fragment available to the existing auth client without redirecting it to the retired hostname.

### US-3: Existing links to the old domain

Given Vercel redirects an old-domain URL to the new domain, when the new-domain HTML loads, then it does not redirect the browser back to the old domain.

## 3. Requirements

- FR-001: Remove the hardcoded auth-fragment redirect from `index.html`.
- FR-002: Let the existing Supabase client handle auth callbacks on the origin where the app loads.
- FR-003: Keep Google OAuth `redirectTo` based on `window.location.origin`, as it already is in `AuthPage.tsx`.
- FR-004: Preserve the rest of the HTML entry point and the existing Vercel domain redirect.
- FR-005: Use dummy callback fragments for automated diagnostics; a real Google login is the final manual production check.

### Key Entities

Supabase auth session and URL fragment. No database entities, schema changes, or credential changes are required.

### Key Files

- Modify: `index.html` — remove the obsolete inline redirect block.
- Verify without planned changes: `src/pages/AuthPage.tsx`, `src/integrations/supabase/client.ts`, `vercel.json`.

## 4. Success Criteria

- SC-001: HTML bootstrap with Google, signup, and recovery dummy callback fragments never navigates to the retired domain.
- SC-002: HTML bootstrap preserves each callback fragment until the auth client starts.
- SC-003: `npm test` and `npm run build` pass, or any existing unrelated failure is explicitly recorded.
- SC-004: After deployment, the new domain serves HTML without the obsolete redirect and an actual Google login stops looping.

