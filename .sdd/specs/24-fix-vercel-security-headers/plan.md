# Plan: Fix Vercel Security Headers

## 1. Context & Objectives
The goal is to resolve missing security headers reported by Pentest-Tools on the Vercel deployment. We will implement these headers by modifying the `vercel.json` configuration file, which natively supports setting response headers.

## 2. Technical Approach
1. **Update `vercel.json`**:
   - Add a `headers` key if not present.
   - For `source: "/(.*)"`, add the following headers:
     - `X-Content-Type-Options`: `nosniff`
     - `Referrer-Policy`: `no-referrer`
     - `Content-Security-Policy`: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-src 'self' https://www.googletagmanager.com;` (or a similar permissive but secure default, adjusting for Supabase/Vite needs).
     - `X-XSS-Protection`: `1; mode=block`
     - `X-Frame-Options`: `DENY`
2. **Review `public/robots.txt`**:
   - Ensure it exists and does not expose sensitive endpoints (e.g. `/admin`).
3. **Commit and Push**:
   - Push to both `origin` and `tqmaster` repositories.

## 3. Deployment / Migration Steps
- Deploying to Vercel will automatically apply these headers based on `vercel.json`.

## 4. Rollback Plan
- Revert changes to `vercel.json` if the CSP breaks existing functionality (e.g., Supabase connections or inline scripts/styles).
