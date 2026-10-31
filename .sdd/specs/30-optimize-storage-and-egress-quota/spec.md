# Optimize Storage Size and Egress Quota

Feature Branch: `fix/optimize-storage-and-egress-quota`
Status: Active — user explicitly approved this scope on 2026-10-31.

## 1. Overview

Supabase Free Plan projects face service restriction (HTTP 402) when exceeding three key quotas:
- `exceed_cached_egress_quota` (148.5 GB / 5 GB — 2,970%)
- `exceed_egress_quota` (7.4 GB / 5 GB — 148%)
- `exceed_storage_size_quota` (1.35 GB / 1 GB — 135%)

Root causes identified in the codebase:
1. **Signed URL Cache Busting on Page Reload & Slide Navigation (`src/lib/signedImage.ts`, `src/components/common/ExamImageViewerModal.tsx`)**:
   - `signedImage.ts` stores signed URLs only in an in-memory `Map` and lacks in-flight request deduplication. Every page refresh (F5) or new tab mints a brand-new `?token=...` query string for every private image, bypassing the browser's HTTP disk cache and re-downloading all assets from Supabase CDN.
   - `ExamImageViewerModal.tsx` calls `signStorageUrl(currentImage, { forceRefresh: true })` on every slide navigation (`retryVersion === 0`), immediately invalidating the batch-signed URL from `signStorageUrls(images)` and forcing a fresh token + full image re-download on every Next/Prev click.
2. **Unoptimized Image Encoding & Short Cache-Control (`src/lib/imageUpload.ts`)**:
   - Uploaded exam images use `cacheControl: '3600'` (1 hour) instead of long-lived immutable caching (`31536000` = 1 year) and compress to JPEG (`1920px`, `0.88` quality) instead of WebP with JPEG fallback.
3. **Cloud Backup Retention & Double-Transfer Egress (`supabase/functions/backup-worker/index.ts`, `src/components/backup/BackgroundBackupPanel.tsx`)**:
   - `backup-worker` retains up to `3` full `.zip` snapshots in the `backup-uploads` bucket (`MAX_BACKUP_RETENTION = 3`), multiplying storage usage past the 1 GB quota.
   - `BackgroundBackupPanel` builds the `.zip` in the browser, uploads it to `backup-uploads`, and requires the admin to download it back from `backup-uploads`, leaving the `.zip` on cloud storage even after download.

This specification defines the code optimizations to eliminate redundant Signed URL re-signing, persist session-scoped signed URL caches across reloads, optimize image compression and HTTP cache headers, and auto-prune cloud backup archives.

## 2. User Scenarios & Testing

- **US-1 (Persistent Session Signed URL Cache & In-Flight Deduplication)**:
  - **Given** a logged-in student viewing exam questions or theory/PE preview images,
  - **When** the student refreshes the page (F5), navigates between pages, or multiple components request the same image concurrently within the 4-hour validity window,
  - **Then** `signStorageUrls` reuses the persisted session-scoped signed URL (with identical `?token=...`) without calling Supabase Storage `createSignedUrls` again, allowing the browser to serve the image directly from its HTTP disk cache (`0 bytes` of Supabase Egress).
  - **When** the user logs out or switches accounts (`clearStorageUrlCache()`),
  - **Then** both the in-memory cache and `sessionStorage` cache are immediately cleared so no signed URLs leak across sessions.

- **US-2 (Zero-Re-Sign Slide Navigation in ExamImageViewerModal)**:
  - **Given** a student opening `ExamImageViewerModal` on a PE/Theory image set,
  - **When** the modal opens and the student navigates Next/Prev between pages (`retryVersion === 0`),
  - **Then** the viewer uses the cached signed URL (`forceRefresh: false`) rather than minting a new token on every slide change.
  - **When** an image fails to load (`onError`) or the user clicks "Thử lại ảnh" (`retryVersion > 0`),
  - **Then** `signStorageUrl(currentImage, { forceRefresh: true })` is called once to mint a fresh token and recover automatically.

- **US-3 (WebP Compression & 1-Year Immutable Cache-Control on Uploads)**:
  - **Given** an admin uploading exam question images or Word/ZIP extracted images via `imageUpload.ts` or `peZipExtractor.ts`,
  - **When** the image is compressed and uploaded to Supabase Storage,
  - **Then** it is encoded as `image/webp` (with automatic fallback to `image/jpeg` if WebP encoding is unsupported by the environment) and uploaded with `cacheControl: '31536000, immutable'`.

- **US-4 (Zero-Waste Backup Storage & Auto-Cleanup After Download)**:
  - **Given** an admin creating or downloading a full snapshot in `BackgroundBackupPanel.tsx` or `backup-worker/index.ts`,
  - **When** a backup job finishes or is downloaded to the admin's machine,
  - **Then** `MAX_BACKUP_RETENTION` is capped at `1` on the server, and downloading a cloud backup (`handleDownload`) automatically deletes the `.zip` archive from the `backup-uploads` bucket and clears `file_path` so cloud storage is freed immediately.

## 3. Requirements

- **FR-001**: Persist valid signed URL entries in `sessionStorage` (under a versioned key cleared on `clearStorageUrlCache()`) in addition to the in-memory `Map` in `src/lib/signedImage.ts`, and deduplicate concurrent in-flight `createSignedUrls` calls for the same `bucket/path`.
- **FR-002**: In `src/components/common/ExamImageViewerModal.tsx`, call `signStorageUrl(currentImage, { forceRefresh: retryVersion > 0 })` so initial open and slide navigation reuse the cached signed URL, while automatic error retry and manual retry (`retryVersion > 0`) force a fresh signature.
- **FR-003**: In `src/lib/imageUpload.ts` and `src/lib/peZipExtractor.ts`, increase Supabase Storage `cacheControl` from `'3600'` to `'31536000'` (1 year) and compress raster images > 100 KB using `image/webp` (quality `0.82`, max dimension `1600px`) with automatic fallback to `image/jpeg` when `canvas.toBlob` does not produce `image/webp`.
- **FR-004**: In `supabase/functions/backup-worker/index.ts`, reduce `MAX_BACKUP_RETENTION` from `3` to `1`.
- **FR-005**: In `src/components/backup/BackgroundBackupPanel.tsx`, automatically trigger local download when browser-packaged backup finishes and automatically remove the archive file from `backup-uploads` storage after a successful `handleDownload`, updating `backup_jobs.file_path = null`.

### Key Entities
- `backup_jobs` (existing table: `id`, `file_path`, `status`, `step`)
- Supabase Storage buckets: `question-images`, `exam-images`, `theory-files`, `theory-images`, `backup-uploads`

### Key Files
- `src/lib/signedImage.ts`
- `src/components/common/ExamImageViewerModal.tsx`
- `src/components/common/ExamImageViewerModal.test.tsx`
- `src/lib/__tests__/storageDownloads.test.ts`
- `src/lib/imageUpload.ts`
- `src/lib/peZipExtractor.ts`
- `supabase/functions/backup-worker/index.ts`
- `src/components/backup/BackgroundBackupPanel.tsx`

## 4. Success Criteria

- **SC-001**: Navigating across slides in `ExamImageViewerModal` with cached URLs issues `0` additional `createSignedUrls` calls unless an image load error occurs (`retryVersion > 0`).
- **SC-002**: Reloading a tab within the 4-hour TTL restores signed URLs from `sessionStorage` without invoking `supabase.storage.from(bucket).createSignedUrls`, while `clearStorageUrlCache()` wipes both memory and `sessionStorage`.
- **SC-003**: Newly uploaded exam and PE ZIP images use `cacheControl: '31536000'` and WebP compression (with JPEG fallback in non-WebP test environments).
- **SC-004**: Downloading a completed backup from `BackgroundBackupPanel` deletes the remote object from `backup-uploads` and sets `file_path: null`, and `backup-worker` retains at most `1` cloud archive.
- **SC-005**: All unit and integration tests (`npm test`) pass with 0 regressions.

