# Download failure audit

Date: 2026-10-27. Baseline: `051cf12`. Baseline evidence was captured before implementation; the user subsequently approved implementation and deployment.

## Confirmed cause

The reported Storage response is `InvalidJWT` with a failed `exp` timestamp check: the signed download URL has expired.

1. `SubjectDetailPage.tsx:60-79` signs file URLs while loading the catalog and replaces each document's stable URL with a temporary signed URL in state.
2. The Theory and PE download anchors at lines 236-247 and 349-370 open that saved URL directly in a new tab. They do not request a fresh signature at click time.
3. `signedImage.ts:15-27` recognizes public and bare object URLs, but not `/object/sign/...` or `/object/authenticated/...`. A controlled execution of its current parser returns a bucket/path for a public fixture and `null` for both signed and authenticated variants. Calling the helper with an already-signed URL therefore leaves its expired token unchanged.
4. The shared signing cache expires before four hours, but its expiry cannot repair a URL copied into page state and opened without calling the signer. Its final assignment also does not recheck cache expiry after a failed refresh, so an expired cached entry can still be returned.
5. `ExamImageViewerModal.tsx:249-259,403-409` repeats the same direct ZIP anchors. Even its image-error fallback can open the same expired ZIP link.

The browser's cross-origin `download` attribute is not a replacement for fresh authorization or server attachment headers. File actions currently also use `target="_blank"`, which is why the Storage JSON error appears in a new tab.

## Read-only production findings

- The object shown in the screenshot still exists in `theory-files`, has `text/plain` metadata, and has a matching document record. This is not evidence of a deleted file.
- Stored document records contain no signed object URLs in the audited database. The stale signature is introduced in the client view state; a data rewrite is not presently needed.
- All four relevant asset buckets remain private.
- Theory asset access is governed by admin/course-access policies; the current access function already recognizes a query suffix on stored references. No policy relaxation or public-bucket conversion is needed for this failure.
- No file contents, real signing tokens, customer identity, or signed URLs were exported or stored in this report.

## Scope of the approved proposal

Mint fresh attachment links at the point of download, retain canonical object identity, expose failures/retry in the page, cover user Theory/PE and shared ZIP buttons, refresh viewer images with bounded retries, and isolate the signing cache across auth identities. Check the admin original-file action and the ZIP extraction helper because they use the same signer.

Reference: [Supabase createSignedUrl](https://supabase.com/docs/reference/javascript/file-buckets-createsignedurl) documents fixed expiry and the download option; [Storage downloads](https://supabase.com/docs/guides/storage/serving/downloads) documents authenticated/private asset delivery.

Implementation, tests, and deployment must follow [spec.md](spec.md), [plan.md](plan.md), and [tasks.md](tasks.md) after the repository's required user review. Previously copied expired URLs cannot be renewed in place; a new download action must mint a new one.


## Implemented behavior and validation

- The canonical resolver recognizes this project's public, signed, authenticated and bare object routes, discards old tokens and decodes object keys once. It keeps external origins separate.
- File actions sign a new five-minute attachment capability at each click. A HEAD request checks availability without downloading the body; a 400/401 response receives one fresh-sign retry. [Supabase's Storage API](https://supabase.github.io/storage/) explicitly supports HEAD on the signed-object route.
- Native attachment transfers use a hidden browsing context so the current app page remains available. Large ZIPs are not buffered into JavaScript blobs. Errors before transfer remain visible with a retry control. Failures after native transfer begins remain in the browser's download manager.
- User Theory/PE and both viewer ZIP controls, plus the admin original-file action, share this flow. File URLs stay canonical in page state. Preview signing is separate and cannot block the original download controls.
- Opening/selecting/retrying a viewer page signs its image afresh. Automatic image refresh is limited to one attempt; stale responses cannot replace the selected page. Thumbnail requests are separate.
- The preview cache rejects failed/expired results and is cleared on account changes and logout, with generation guards against pending requests crossing identities. The existing exam retry screen now catches signing errors propagated by this stricter helper.
- Full suite: **84 tests across 18 files passed**. TypeScript app check and production build passed. New modules/tests and the shared viewer pass ESLint; baseline comparisons for existing affected files introduce zero new lint findings.
- A read-only live request using only the anonymous client role did not receive a capability for the reported private file (HTTP 400). No Storage policies, bucket visibility, database rows or file contents were changed.
- Account-level successful download interaction has been validated through controlled SDK/network/UI regression tests. A real entitled-user browser download was not performed; no user credentials were requested or impersonated.
- Release verification is recorded in `verification.md` after both repository pushes and the production bundle check.
