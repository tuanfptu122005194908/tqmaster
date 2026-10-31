---
type: "query"
date: "2026-10-27T09:04:25.959915+00:00"
question: "Audit first-load performance and 1000 concurrent users on Supabase Free"
contributor: "graphify"
outcome: "useful"
source_nodes: ["LandingPage.tsx", "AppContext.tsx", "useSubjectAccess.ts", "ExamPage.tsx"]
---

# Q: Audit first-load performance and 1000 concurrent users on Supabase Free

## Answer

Expanded via graph vocabulary: auth loading query cache refresh realtime subject exam performance database request landing. Verified current source: LandingPage statically imports 3D scenes; live main JS plus landing and 3D dependencies transfer 461638 bytes compressed, CSS 32591; asset headers max-age=0 must-revalidate despite CDN HIT. useSubjectAccess refreshes visible tabs every minute; loadSubjectIds calls getUser and fetchAllById continues to an empty page, implying 2-3 HTTP requests per refresh for 0-500 grants. ExamPage handleSubmit clears draft before three unchecked writes, risking incomplete saved submissions. User reports Supabase Free; official Realtime limit is 200 concurrent sockets, so current per-user subscriptions cannot support 1000 logged-in browser connections. No production data mutations or load test; see artifacts/performance-audit-2026-10-27.md. Metrics do not establish LCP, actual DB latency or full capacity.

## Outcome

- Signal: useful

## Source Nodes

- LandingPage.tsx
- AppContext.tsx
- useSubjectAccess.ts
- ExamPage.tsx