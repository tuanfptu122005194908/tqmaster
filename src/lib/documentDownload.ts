import { supabase } from '@/integrations/supabase/client';
import { assertStorageSession, getStorageAuthGeneration } from './signedImage';
import { parseStorageUrl, safeDownloadName } from './storageAsset';

const DOWNLOAD_TTL_SECONDS = 300;
const failed = () => new Error('Không thể tải tài liệu. Vui lòng kiểm tra kết nối hoặc quyền truy cập rồi thử lại.');

function checkRequest(generation: number, signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException('Đã hủy tải tài liệu.', 'AbortError');
  assertStorageSession(generation);
}

/** Native browser streaming: ZIP files never have to fit in JavaScript memory. */
export function startNativeDownload(url: string, fileName: string, external = false) {
  const anchor = document.createElement('a');
  let frame: HTMLIFrameElement | undefined;
  if (!external) {
    frame = document.createElement('iframe');
    frame.hidden = true;
    frame.title = 'Tải tài liệu';
    frame.name = `document-download-${crypto.randomUUID()}`;
    document.body.append(frame);
    anchor.target = frame.name;
  } else {
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
  }
  anchor.href = url;
  anchor.download = fileName;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Keep the browsing context alive while the browser starts the transfer.
  if (frame) window.setTimeout(() => frame.remove(), 120_000);
}

/** Mint at click time, independently of any image cache or previously signed token. */
export async function downloadDocument(raw: string, name?: string | null, signal?: AbortSignal): Promise<void> {
  const generation = getStorageAuthGeneration();
  checkRequest(generation, signal);
  const asset = parseStorageUrl(raw);
  if (!asset) {
    let external: URL;
    try { external = new URL(raw); } catch { throw failed(); }
    if (!['https:', 'http:'].includes(external.protocol) || external.username || external.password) throw failed();
    startNativeDownload(external.href, safeDownloadName(name, external.pathname), true);
    return;
  }
  const fileName = safeDownloadName(name, asset.path);
  // One bounded retry covers a token expiring while a suspended tab resumes.
  for (let attempt = 0; attempt < 2; attempt++) {
    checkRequest(generation, signal);
    const startedAt = Date.now();
    const {data, error} = await supabase.storage.from(asset.bucket).createSignedUrl(
      asset.path, DOWNLOAD_TTL_SECONDS, { download: true },
    );
    checkRequest(generation, signal);
    if (error || !data?.signedUrl) throw failed();
    if (Date.now() - startedAt >= (DOWNLOAD_TTL_SECONDS - 30) * 1000) continue;
    const url = new URL(data.signedUrl);
    // The SDK encodes its query a second time for Unicode names; set it once here.
    url.searchParams.set('download', fileName);
    let response: Response;
    try {
      response = await fetch(url.href, {method: 'HEAD', cache: 'no-store', credentials: 'omit', signal});
    } catch {
      checkRequest(generation, signal);
      throw failed();
    }
    checkRequest(generation, signal);
    if (Date.now() - startedAt >= (DOWNLOAD_TTL_SECONDS - 30) * 1000) continue;
    if (!response.ok) {
      if (attempt === 0 && [400, 401].includes(response.status)) continue;
      throw failed();
    }
    startNativeDownload(url.href, fileName);
    return;
  }
  throw failed();
}
