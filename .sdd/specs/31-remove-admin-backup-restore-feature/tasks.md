# Tasks: Remove Admin Backup & Restore Feature

- [x] **Task 1: Remove Route & Sidebar Navigation**
  - [x] Remove `AdminBackup` lazy import and `/admin/backup` route from `src/App.tsx`.
  - [x] Remove `admin-backup` navigation item and `HardDriveDownload` icon from `src/components/AdminSidebar.tsx`.

- [x] **Task 2: Delete Backup & Restore Components, Libraries & Edge Functions**
  - [x] Delete `src/pages/admin/AdminBackup.tsx`.
  - [x] Delete `src/components/backup/` directory (`BackgroundBackupPanel.tsx`, `BackgroundRestorePanel.tsx`, `SnapshotExportPanel.tsx`, `SnapshotRestorePanel.tsx`, `BackupExportPanel.tsx`, `BackupImportPanel.tsx`, `BackupTableSelector.tsx`).
  - [x] Delete `src/lib/backupCore.ts` and `src/lib/excelBackup.ts`.
  - [x] Delete `supabase/functions/backup-worker/` and `supabase/functions/restore-worker/` (preserving `supabase/functions/_shared/readAllRows.ts`).

- [x] **Task 3: Verification, Graphify Sync & Dual-Repo Push**
  - [x] Run `npm test` and `npm run build` to verify clean compilation and tests.
  - [x] Run `graphify update .` to update the knowledge graph.
  - [x] Commit and push to both `origin` and `tqmaster` repositories.
