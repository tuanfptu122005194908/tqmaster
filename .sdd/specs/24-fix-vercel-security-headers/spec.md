---
status: "draft"
---

# Feature: Fix Vercel Security Headers

## 1. Overview
The Pentest-Tools Website Vulnerability Scanner reported several missing security headers and informational leaks on the `tqmaster.vercel.app` deployment. This spec defines the necessary fixes to apply to `vercel.json` and `public/robots.txt` to pass the vulnerability scan.

## 2. User Scenarios (Given-When-Then)
- **Given** a user or scanner accesses any route on the application
- **When** the server responds
- **Then** the response should include `X-Content-Type-Options`, `Referrer-Policy`, and `Content-Security-Policy` security headers.

## 3. Functional Requirements
- **FR-01**: Configure Vercel to append `X-Content-Type-Options: nosniff` to all routes.
- **FR-02**: Configure Vercel to append `Referrer-Policy: strict-origin-when-cross-origin` (or `no-referrer`) to all routes.
- **FR-03**: Configure Vercel to append a baseline `Content-Security-Policy` header to all routes.
- **FR-04**: Review and ensure `robots.txt` does not leak sensitive endpoints.

## 4. Key Entities / Data Models
- None. This is a configuration-level change.

## 5. Key Files
- `vercel.json`: Define global headers for Vercel deployment.
- `public/robots.txt`: Search engine crawling rules.

## 6. Success Criteria
- **SC-01**: `vercel.json` successfully includes the required security headers in its `headers` array.
- **SC-02**: The application passes the vulnerability scanner checks for missing security headers.
