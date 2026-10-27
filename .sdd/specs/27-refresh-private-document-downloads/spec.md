# Fix: Private document downloads reuse expired signed URLs

**Feature Branch**: `fix/private-document-downloads`
**Status**: Active — approved by the user; implementation in progress
**Date**: 2026-10-27

## 1. Overview

The supplied screenshot shows Storage `InvalidJWT` / `"exp" claim timestamp check failed` for a document in `theory-files`. The user page signs document URLs when loading the list, stores those temporary URLs in component state, then opens them directly in a new tab. The shared parser does not recognize `/object/sign/...`, so it cannot renew an already-signed URL. The preview modal also keeps signed ZIP links and uses the same failing fallback when an image fails.

Fix downloads at the point of user action, preserving private storage and existing course access. Do not extend URL expiry as a substitute for renewal or change buckets to public.

## 2. User Scenarios & Testing

- **US1 (P1)**: Given a purchased course page left open beyond the old link expiry, when the user clicks Download, then the app signs the canonical object path again using the current session and starts an attachment download without opening an expired JSON error tab.
- **US2 (P1)**: Given an already-signed legacy URL in state or stored metadata, when downloading, then its old token is discarded and a new URL is requested for the same object.
- **US3 (P1)**: Given missing/deleted files, network failure, or denied access, when clicking Download, then the app shows a visible retryable error and does not open the stale URL or falsely claim success.
- **US4 (P1)**: Given a PE preview modal kept open for a long time, when downloading its original ZIP, then all ZIP buttons use the same fresh-download path. When opening or retrying an expired image preview, then it can obtain a new signed URL.
- **US5 (P1)**: Given a user without access, when attempting to sign an object, then existing Storage RLS still denies access. Account changes must not reuse another account's cached signing result.
- **US6 (P2)**: Given an external resource intentionally stored as a link, when opening it, then existing external-link behavior is preserved. URLs from unrelated origins are not misclassified as this project's storage.

## 3. Requirements

- **FR-001**: Parse current-project public, signed, authenticated, and supported legacy Storage object URLs into a stable bucket/path. Preserve nested paths, Unicode names and literal percent characters with exactly one URI decoding step. Reject invalid encodings and unsupported URL schemes safely.
- **FR-002**: At each file/ZIP download click, request a fresh short-lived signed attachment URL from the canonical object identity, independent of preview cache or page age. Use the SDK download option and a filename fallback so TXT/PDF/ZIP files are delivered as attachments.
- **FR-003**: Replace stale direct download anchors on user Theory and PE screens and both ZIP buttons in the shared preview modal. Use the same mechanism for AdminTheory's original-file action.
- **FR-004**: Signing failures must never return an expired cached URL or fall back to a private public URL as a successful result. Expose a useful error, keep the current page, and allow retry. Duplicate clicks while signing must not start duplicate work.
- **FR-005**: Keep canonical document URLs separate from transient display URLs. Do not write signed tokens into database records, localStorage, graph artifacts, logs, or reports.
- **FR-006**: Renew preview links when opening/retrying the viewer; cap automatic image retries to avoid loops. Reset request state on document/index changes and prevent late results from replacing the selected image/document.
- **FR-007**: Scope/invalidate cached signing results when auth identity changes; per-click downloads must still check current Storage access. Keep private buckets, existing RLS, and course access checks intact.
- **FR-008**: Stream document downloads through the browser's attachment handling rather than buffering every large ZIP in JavaScript memory. External intentional links retain their behavior and receive no private authentication headers.
- **FR-009**: Audit stored URL forms and confirm whether the screenshot's object exists using read-only aggregate/metadata queries; do not export file contents or tokens. Repair stored data only if evidence requires it and within this specification.
- **FR-010**: Add regressions for expired pre-signed URLs, long-open pages, cache expiry, failed refresh, missing files, special filenames, unrelated hosts, duplicate clicks, auth changes, and viewer ZIP download/retry paths. Run existing tests, build, typecheck, and relevant lint.

### Key Entities

`theories.url`, `file_name`, preview image metadata; `storage.objects` and `storage.buckets`; current Supabase auth identity; transient signing cache.

### Key Files

- `src/lib/signedImage.ts` and proposed shared download helper/component.
- `src/pages/user/SubjectDetailPage.tsx`.
- `src/components/common/ExamImageViewerModal.tsx`.
- `src/pages/admin/AdminTheory.tsx`, `src/lib/peZipExtractor.ts` if its shared signing assumptions need adjustment.
- `src/lib/AppContext.tsx` for auth cache invalidation only.
- `src/pages/user/ExamPage.tsx`: handle propagated preview signing errors using its existing retry screen.
- Focused unit/UI tests and read-only verification scripts.

## 4. Success Criteria

- **SC-001**: Tests prove downloading still signs a fresh URL after advancing the clock beyond four hours, including when the input URL already contains an expired token.
- **SC-002**: All audited file/ZIP download actions use the shared fresh-sign flow; error cases do not open a stale URL or a new JSON error tab.
- **SC-003**: Special/nested object names remain exact; unrelated origins and external links retain their identity.
- **SC-004**: Storage access remains private and non-entitled users cannot mint new links. No source or database artifact persists a new signed token.
- **SC-005**: Focused regressions and the existing suite, build, and typecheck pass; both repositories and production receive the verified source change under the approved workflow.
