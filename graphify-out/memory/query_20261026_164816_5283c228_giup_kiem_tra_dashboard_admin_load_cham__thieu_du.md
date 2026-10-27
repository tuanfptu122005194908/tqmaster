---
type: "query"
date: "2026-10-26T16:48:16.061100+00:00"
question: "Giup kiem tra dashboard admin load cham, thieu du lieu va lech doanh thu voi don hang; ra soat tat ca truy xuat admin."
contributor: "graphify"
outcome: "useful"
source_nodes: ["AdminDashboard.tsx", "AdminOrders.tsx", "adminUsers.ts", "backupCore.ts"]
---

# Q: Giup kiem tra dashboard admin load cham, thieu du lieu va lech doanh thu voi don hang; ra soat tat ca truy xuat admin.

## Answer

Expanded from graph vocabulary: admin dashboard revenue orders stats supabase query users exam backup cache. Graph identified the admin routes, shared Supabase client, adminUsers and backupCore. Current source audit of all 14 routes confirmed Dashboard totals use a 400-day and 1000-all-status-order sample; Orders revenue is a separate unpaginated approved-only query. Four controlled reproductions confirmed scope mismatch, cross-year month merge, weekly interval gaps and grouping subjects by name. AdminUsers already uses robust fetchAllById. Full evidence and review-gated implementation specification: .sdd/specs/26-admin-data-integrity-and-performance/audit.md. Live database totals and latency were not measured; source remains unchanged pending explicit SpecKit review. Baseline 33 tests and production build pass.

## Outcome

- Signal: useful

## Source Nodes

- AdminDashboard.tsx
- AdminOrders.tsx
- adminUsers.ts
- backupCore.ts