# Technical plan

Status: Approved — in progress

## Implementation

Delete only the inline script at the start of `index.html` that sends auth fragments to `tqmaster.vercel.app`. Do not replace it with another hostname rule. `AuthPage.tsx` already asks Supabase to return to the current origin, and the Supabase browser client already persists and processes auth sessions.

## Intended flow

Google -> Supabase auth callback -> allowed app URL on `tuanvaquan.io.vn` -> HTML loads React -> Supabase consumes the session fragment -> app renders the authenticated account.

Old-domain requests continue to follow the existing Vercel HTTP 308 to the new domain, without an HTML redirect in the opposite direction.

## API / backend

No API, Edge Function, migration, or Google credential changes. Verify that Supabase Site URL and allowed redirect URLs include the intended production destination if a separate configuration issue persists after this loop is removed.

## Validation

1. Keep the confirmed pre-fix reproduction: executing the current inline block sends a dummy new-domain callback to the old domain, whose observed HTTP 308 returns to the initial callback URL.
2. Execute inline HTML bootstrap scripts with mocked locations covering a normal page, Google token, signup, and recovery callbacks. Confirm no forced hostname navigation and no fragment mutation.
3. Run the repository tests and production build.
4. Inspect built HTML for the removed redirect. Do not add permanent tests solely mirroring a deleted block.
5. After approval and release, inspect public production HTML and ask the user to perform the real Google login; do not claim real account verification from a dummy callback.

## Risks and release

The removed redirect was intended for historical email callbacks, so old links depend on the existing Vercel redirect and correct Supabase URL configuration. Read-only production checks already verified that the old root redirects to the new root.

Keep unrelated existing graph metadata and performance audit files out of the fix commit. Follow the repository's semantic commit and dual-remote push workflow after implementation approval. A production login check remains dependent on the user's Google account session.

