# Tasks: Optimize Storage Size and Egress Quota

- [x] **Task 1: Persistent Session Cache & In-Flight Deduplication in `signedImage.ts`**
  - [x] Add `sessionStorage` persistence (`tq_signed_url_cache_v1`) with TTL validation and 500-entry bound in `src/lib/signedImage.ts`.
  - [x] Add in-flight request deduplication per `bucket/path` so concurrent `signStorageUrls` calls share a single `createSignedUrls` request.
  - [x] Ensure `clearStorageUrlCache()` clears memory, in-flight map, and `sessionStorage`.
  - [x] Add unit tests in `src/lib/__tests__/storageDownloads.test.ts` verifying `sessionStorage` persistence across cache reloads and in-flight deduplication.

- [x] **Task 2: Fix Forced Re-Signing in `ExamImageViewerModal.tsx`**
  - [x] Update `ExamImageViewerModal.tsx` to pass `{ forceRefresh: false }` on normal slide views and `{ forceRefresh: true }` only when retrying after error.
  - [x] Update `src/components/common/ExamImageViewerModal.test.tsx` to verify cached signed URLs are reused on initial open/navigation and refreshed with `{ forceRefresh: true }` on image error or manual retry.

- [x] **Task 3: WebP Compression & 1-Year Cache-Control in `imageUpload.ts` & `peZipExtractor.ts`**
  - [x] Increase `cacheControl` to `'31536000'` in `src/lib/imageUpload.ts` and `src/lib/peZipExtractor.ts`.
  - [x] Enhance `compressImageFile` and `compressDataUrl` in `src/lib/imageUpload.ts` to encode as `image/webp` (`1600px`, `0.82` quality, `> 100KB` threshold) with automatic `image/jpeg` fallback.
  - [x] Apply client-side image compression in `uploadExtractedZipImages` (`src/lib/peZipExtractor.ts`) before uploading to Supabase Storage.

- [x] **Task 4: Cloud Backup Auto-Pruning in `backup-worker` & `BackgroundBackupPanel.tsx`**
  - [x] Reduce `MAX_BACKUP_RETENTION` from `3` to `1` in `supabase/functions/backup-worker/index.ts`.
  - [x] Update `handleDownload` and backup completion in `src/components/backup/BackgroundBackupPanel.tsx` to automatically delete downloaded/old `.zip` archives from `backup-uploads` bucket and clear `file_path`.

- [x] **Task 5: Verification & Dual-Repo Push**
  - [x] Run `npm test` to verify all unit and integration tests pass.
  - [x] Run `graphify update .` to synchronize the knowledge graph.
  - [x] Commit and push changes to both `origin` and `tqmaster` repositories.
