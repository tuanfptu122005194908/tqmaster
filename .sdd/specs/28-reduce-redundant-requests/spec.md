# Reduce redundant requests

Feature Branch: `feat/reduce-redundant-requests`
Status: Active — user explicitly approved this scope on 2026-10-27.

## 1. Overview

Reduce repeat network reads through immutable caching of content-hashed build assets, coalesced subject-access refreshes, and loading subject content only for the selected tab. Reuse the existing query cache with explicit public/user boundaries. This is the implementation of the exact request-reduction proposal approved by the user, not the wider performance audit.

## 2. User Scenarios & Testing

- Given the same hashed build asset, when a visitor returns, then it can be reused for one year; HTML and authenticated API responses are not given this policy.
- Given multiple concurrent refresh requests for one account, when a subject-access read is pending, then callers share the read; a later invalidation is not lost.
- Given a subject opened on its FE tab, when the user has not selected theory, PE or announcements, then those datasets and private preview signatures are not requested.
- Given cached user A content and pending reads, when user B signs in or A signs out, then no A data is shown or restored for B.
- Given temporary read failure, when the user retries, then the view recovers without treating an error as an empty successful result.

## 3. Requirements

- FR-001: Cache only hashed `/assets/` files with `public, max-age=31536000, immutable`.
- FR-002: Coalesce same-account concurrent access reads; preserve server identity verification, complete pagination, grant/revocation refresh events and existing refresh cadence.
- FR-003: Remove redundant auth-bootstrap access requests where the access hook already owns initial loading.
- FR-004: Fetch subject metadata and selected-tab content independently. Reuse cached tab data for a short bounded freshness period, not a two-month persistent cache.
- FR-005: User-dependent queries must include account and access scope. Clear/cancel them at identity changes. Retain server RLS. Private signed URLs must not enter a shared public cache.
- FR-006: Public data may share only explicitly safe public queries; no shared cache of permissions, orders or results.
- FR-007: Do not change 3D, Realtime architecture/quotas, submission logic, database schema/data, auth redirects, or introduce infrastructure.

Key Entities: read-only subjects, exam_subjects/exams, theory_subjects/theories, announcements, user_subjects; existing auth identity. No migration.

Key Files: vercel.json; useSubjectAccess; AppContext; queryClient; SubjectDetailPage; focused subject-content hook/helper and relevant tests.

## 4. Success Criteria

- SC-001: Concurrent non-invalidating refreshes issue one subject-access load.
- SC-002: An event during an in-flight load can cause one fresh follow-up read, without cross-account delivery.
- SC-003: Opening FE requests no theories/announcements/signatures; selecting another tab loads only its dataset; revisiting a fresh tab does not reread it.
- SC-004: Logout, account switch, subject switch, and access revocation cannot expose another scope's cached content.
- SC-005: Focused regression tests, full npm test, TypeScript and production build pass, or pre-existing failures are explicitly reported.
