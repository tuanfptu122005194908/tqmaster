# Remove Admin Backup & Restore Feature

Feature Branch: `chore/remove-admin-backup-restore-feature`
Status: Active — user explicitly approved this scope on 2026-10-31.

## 1. Overview

The in-app **Backup & Restore** (`AdminBackup`) feature—including Cloud Background Backup/Restore (`backup-worker`, `restore-worker`), Full ZIP Snapshot Export/Restore (`SnapshotExportPanel`, `SnapshotRestorePanel`), and Excel Backup/Import (`BackupExportPanel`, `BackupImportPanel`)—consumes heavy client bundle size (`xlsx`, `jszip`), Edge Function resources, and Supabase Storage/Egress quota (`backup-uploads` bucket). Since database backups and migrations are now handled cleanly via CLI scripts (`backup_sql/`), the user requested completely removing the **Backup & Restore** feature from the application to keep the system lightweight and prevent accidental storage/egress quota spikes.

## 2. User Scenarios & Testing

- **US-1 (Admin Sidebar Navigation)**:
  - **Given** an authenticated Admin viewing the Admin Portal,
  - **When** the Admin inspects the left `AdminSidebar` navigation menu,
  - **Then** the `Backup / Restore` menu item (`/admin/backup`) is no longer displayed.

- **US-2 (Route & Bundle Removal)**:
  - **Given** an authenticated Admin or user navigating to `/admin/backup`,
  - **When** the route is matched in `src/App.tsx`,
  - **Then** `/admin/backup` is no longer registered and falls back to the catch-all redirect (`/`), and none of the `AdminBackup` / `src/components/backup/*` / `backupCore` / `excelBackup` modules are bundled.

## 3. Requirements

- **FR-001**: Remove the `AdminBackup` lazy import and `/admin/backup` route from `src/App.tsx`.
- **FR-002**: Remove the `{ key: 'admin-backup', label: 'Backup / Restore', icon: HardDriveDownload }` entry and unused `HardDriveDownload` icon import from `src/components/AdminSidebar.tsx`.
- **FR-003**: Delete the `AdminBackup` page and all backup components/libraries:
  - `src/pages/admin/AdminBackup.tsx`
  - `src/components/backup/BackgroundBackupPanel.tsx`
  - `src/components/backup/BackgroundRestorePanel.tsx`
  - `src/components/backup/SnapshotExportPanel.tsx`
  - `src/components/backup/SnapshotRestorePanel.tsx`
  - `src/components/backup/BackupExportPanel.tsx`
  - `src/components/backup/BackupImportPanel.tsx`
  - `src/components/backup/BackupTableSelector.tsx`
  - `src/lib/backupCore.ts`
  - `src/lib/excelBackup.ts`
- **FR-004**: Delete the unused Supabase Edge Functions for background backup/restore:
  - `supabase/functions/backup-worker/index.ts`
  - `supabase/functions/restore-worker/index.ts`

### Key Entities
- None (no database schema destructive changes required; application code and Edge Functions removed).

### Key Files
- `src/App.tsx`
- `src/components/AdminSidebar.tsx`
- `src/pages/admin/AdminBackup.tsx` (deleted)
- `src/components/backup/*` (deleted)
- `src/lib/backupCore.ts` (deleted)
- `src/lib/excelBackup.ts` (deleted)
- `supabase/functions/backup-worker/index.ts` (deleted)
- `supabase/functions/restore-worker/index.ts` (deleted)

## 4. Success Criteria

- **SC-001**: `AdminSidebar` no longer renders the `Backup / Restore` link, and `/admin/backup` route is removed from `src/App.tsx`.
- **SC-002**: All files in `src/pages/admin/AdminBackup.tsx`, `src/components/backup/`, `src/lib/backupCore.ts`, `src/lib/excelBackup.ts`, `supabase/functions/backup-worker/`, and `supabase/functions/restore-worker/` are completely removed with zero broken imports.
- **SC-003**: `npm test` and `npm run build` pass with 0 errors.

