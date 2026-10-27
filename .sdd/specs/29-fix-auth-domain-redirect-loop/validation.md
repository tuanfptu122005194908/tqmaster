# Validation

## Implemented behavior

- Removed the obsolete inline script in `index.html` that previously redirected URL fragments containing `access_token` or `type=signup` to `tqmaster.vercel.app`.
- With the obsolete redirect removed, auth fragments returned from Supabase / Google OAuth (e.g. `#access_token=...`) on `https://tuanvaquan.io.vn/` are retained in place and directly consumed by the Supabase auth client on the active domain.
- Eliminated the redirect loop caused by `index.html` redirecting to `tqmaster.vercel.app` while `tqmaster.vercel.app` returned HTTP 308 back to `tuanvaquan.io.vn`.
- Preserved standard HTML head metadata, stylesheets, and Google Identity Services script.

## Checks

- Pre-fix reproduction confirmed: executing the inline redirect with a dummy token navigated to `tqmaster.vercel.app`, which responds with HTTP 308 redirecting back to `tuanvaquan.io.vn`.
- Post-fix bootstrap verification: verified `index.html` contains 0 inline redirection scripts. Google token (`#access_token=...`), signup (`#access_token=...&type=signup`), recovery (`#access_token=...&type=recovery`), and normal page loads retain their origin and hash fragment without navigation.
- `npm test`: 18 files / 93 tests passed.
- `npm run build`: built in 14.75s with 0 errors.
- Built artifact inspection: verified `dist/index.html` contains no redirect script or references to `tqmaster.vercel.app`.
- `graphify update .`: successfully updated code graph (2,374 nodes, 4,003 edges, 240 communities).
