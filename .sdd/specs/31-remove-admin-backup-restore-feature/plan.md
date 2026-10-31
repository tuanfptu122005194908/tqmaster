# Implementation Plan: Remove Admin Backup & Restore Feature

Feature Branch: `chore/remove-admin-backup-restore-feature`

## 1. Technical Architecture & Blast Radius

Using CodeGraph analysis:
- `AdminBackup` (`src/pages/admin/AdminBackup.tsx`) is only referenced in `src/App.tsx` (lines 36 & 237).
- `src/components/backup/*` (`BackgroundBackupPanel`, `BackgroundRestorePanel`, `SnapshotExportPanel`, `SnapshotRestorePanel`, `BackupExportPanel`, `BackupImportPanel`, `BackupTableSelector`) are only referenced by `AdminBackup.tsx` and each other.
- `src/lib/backupCore.ts` and `src/lib/excelBackup.ts` are only referenced by `src/components/backup/*`.
- `AdminSidebar.tsx` contains the single navigation item `{ key: 'admin-backup', label: 'Backup / Restore', icon: HardDriveDownload }`.
- `supabase/functions/_shared/readAllRows.ts` is still used by `src/lib/adminRead.ts`, so `_shared/readAllRows.ts` MUST be preserved while `supabase/functions/backup-worker` and `supabase/functions/restore-worker` are removed.

## 2. Implementation Steps

1. Edit `src/App.tsx` to remove `const AdminBackup = lazy(...)` and `<Route path="/admin/backup" ... />`.
2. Edit `src/components/AdminSidebar.tsx` to remove the `admin-backup` nav item and `HardDriveDownload` icon import.
3. Delete `src/pages/admin/AdminBackup.tsx`, `src/components/backup/`, `src/lib/backupCore.ts`, `src/lib/excelBackup.ts`, `supabase/functions/backup-worker/`, and `supabase/functions/restore-worker/`.
4. Run `npm test` and `npm run build` to verify no broken imports or regressions.
5. Run `graphify update .` and push to both `origin` and `tqmaster` remotes.

