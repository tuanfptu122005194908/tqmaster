# Tasks: Refresh private document downloads

- [x] Interpret the screenshot's expired-signature error.
- [x] Use CodeGraph and the existing Graphify graph to trace user download/signing paths.
- [x] Identify load-time signing, unrecognized signed URLs, and stale direct ZIP/file anchors.
- [x] Prepare spec, plan, and tasks before source edits.
- [x] Obtain the required review of specification 27.
- [x] Inspect stored URL formats, object metadata, and relevant Storage policies read-only; the screenshot object exists and no stored document URL contains a signing token.
- [x] Implement safe canonical parsing, fresh-sign behavior, cache/error/auth handling.
- [x] Implement a shared native attachment-download action with pending/error/retry states.
- [x] Integrate user Theory/PE, preview ZIP, and admin original-file actions.
- [x] Refresh image previews on open/retry without stale-result races or retry loops.
- [x] Add and pass focused regression tests; run full tests, typecheck, build, relevant lint.
- [x] Update Graphify and document verified behavior/limits.
- [ ] Commit and push both repositories; verify the production frontend is updated.
