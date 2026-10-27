# Tasks

- [x] Trace Google OAuth return handling and Supabase client initialization.
- [x] Read public HTTP headers and deployed HTML on the new domain.
- [x] Confirm the old domain returns HTTP 308 to the new domain.
- [x] Reproduce the redirect cycle using a dummy token and the existing HTML script.
- [x] Prepare spec, plan, and tasks before source changes.
- [x] Obtain user approval required by the Speckit review gate.
- [x] Remove the obsolete auth redirect from `index.html`.
- [x] Check Google, signup, recovery, and normal-page bootstrap behavior with dummy fragments.
- [x] Run `npm test` and `npm run build`; inspect the built entry point.
- [x] Update Graphify and record verification results.
- [x] Commit only the authorized fix and its spec documents; push to both repository remotes.
- [ ] Verify deployed HTML and have the user confirm an actual Google login succeeds.
