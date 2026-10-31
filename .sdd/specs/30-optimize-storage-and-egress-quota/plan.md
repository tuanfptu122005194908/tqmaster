# Implementation Plan: Optimize Storage Size and Egress Quota

Feature Branch: `fix/optimize-storage-and-egress-quota`

## 1. Technical Architecture & Data Flow

### 1.1 Persistent Session Signed URL Cache & In-Flight Deduplication (`src/lib/signedImage.ts`)
- **Problem**:
  - `cache = new Map<string, CacheEntry>()` is wiped on every page reload (F5), causing `createSignedUrls` to generate new `?token=...` query parameters on every reload. Different query parameters prevent the browser from reusing its disk cache, multiplying Supabase Cached Egress (which reached 148.5 GB).
  - Concurrent calls to `signStorageUrls` for the same `bucket/path` before the first request resolves issue duplicate `createSignedUrls` requests and overwrite the cached token.
- **Solution**:
  - Maintain a two-tier cache: L1 in-memory `Map<string, CacheEntry>` + L2 `sessionStorage` under key `tq_signed_url_cache_v1`.
  - Hydrate L1 from `sessionStorage` lazily on read, pruning expired entries (`expiresAt <= Date.now()`).
  - Persist updated entries back to `sessionStorage` (wrapped in `try/catch` for quota/SSR safety, capped at 500 entries).
  - Track in-flight signing promises per `bucket/path` (`inFlight = new Map<string, Promise<CacheEntry>>()`) when `!options.forceRefresh`, so simultaneous callers await the exact same signed URL token.
  - On `clearStorageUrlCache()`, increment `authGeneration`, clear L1 `cache`, clear `inFlight`, and remove `tq_signed_url_cache_v1` from `sessionStorage`.

### 1.2 Eliminate Forced Re-Signing on Slide Change (`src/components/common/ExamImageViewerModal.tsx`)
- **Problem**:
  - Line 75 calls `signStorageUrl(currentImage, { forceRefresh: true })` whenever `isOpen`, `currentImage`, or `retryVersion` changes.
  - Even though line 62 already batch-signs all `images` via `signStorageUrls(images)`, line 75 immediately invalidates `currentImage` and requests a new token on open and on every Next/Prev slide click.
- **Solution**:
  - Change line 75 to `signStorageUrl(currentImage, { forceRefresh: retryVersion > 0 })`.
  - When `retryVersion === 0` (initial open or Next/Prev navigation), `signStorageUrl` reuses the cached URL from `signStorageUrls(images)` (or `sessionStorage`).
  - When an `<img>` triggers `onError` (e.g., expired token) or the user clicks "Thử lại ảnh", `retryImage()` increments `retryVersion` (`retryVersion > 0`), triggering `forceRefresh: true` to mint a fresh signed URL.
  - Update `src/components/common/ExamImageViewerModal.test.tsx` to verify that initial open uses `{ forceRefresh: false }` while error recovery and manual retry use `{ forceRefresh: true }`.

### 1.3 WebP Compression & 1-Year Cache-Control (`src/lib/imageUpload.ts`, `src/lib/peZipExtractor.ts`)
- **Problem**:
  - `uploadFileToExamStorage` sets `cacheControl: '3600'` (1 hour) and encodes images as JPEG (`1920px`, `0.88`).
  - `peZipExtractor.ts` also sets `cacheControl: '3600'` and uploads raw unzipped PNG/JPEG images without client-side compression.
- **Solution**:
  - Set `cacheControl: '31536000'` (1 year) in both `src/lib/imageUpload.ts` and `src/lib/peZipExtractor.ts`.
  - Update `compressImageFile` and `compressDataUrl` in `src/lib/imageUpload.ts` to prefer `image/webp` (`MAX_IMAGE_DIMENSION = 1600`, `QUALITY = 0.82`, threshold `100 * 1024` bytes) with automatic fallback to `image/jpeg` if the browser/test canvas returns a non-WebP blob or null.
  - Compress extracted PE ZIP images in `src/lib/peZipExtractor.ts` via `compressImageFile` before uploading so 20–50 MB PNG ZIP packages shrink by 60–75% in Storage and Egress.

### 1.4 Cloud Backup Auto-Cleanup & Retention (`supabase/functions/backup-worker/index.ts`, `src/components/backup/BackgroundBackupPanel.tsx`)
- **Problem**:
  - `MAX_BACKUP_RETENTION = 3` in `backup-worker/index.ts` keeps 3 full media `.zip` files in `backup-uploads`, exceeding the 1 GB Free Storage limit.
  - `BackgroundBackupPanel.tsx` uploads the locally generated `.zip` to `backup-uploads` and keeps it on cloud storage even after the admin downloads it.
- **Solution**:
  - Set `MAX_BACKUP_RETENTION = 1` in `supabase/functions/backup-worker/index.ts`.
  - In `BackgroundBackupPanel.tsx`:
    - When `handleDownload(job)` completes downloading the `.zip` blob to the admin's computer, automatically delete `job.file_path` from `backup-uploads` and update `backup_jobs` (`file_path: null`, `step: 'Đã tải về máy và tự động xóa file trên đám mây để tiết kiệm dung lượng'`).
    - Prune any older cloud backup files in `backup-uploads` when creating a new backup from the browser panel so at most 1 cloud backup exists at any time.

## 2. Risk Assessment & Compatibility
- **Auth Security**: Persisting signed URLs in `sessionStorage` is tab-local, never shared across browser profiles, and explicitly wiped by `clearStorageUrlCache()` on sign-out or identity change.
- **Test Environment Compatibility**: JSDOM/Vitest `canvas.toBlob` may not support `image/webp` or may be mocked; fallback to `image/jpeg` ensures existing upload tests continue to pass seamlessly.

