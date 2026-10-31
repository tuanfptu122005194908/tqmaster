import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseStorageUrl, safeDownloadName } from '../storageAsset';
import { clearStorageUrlCache, evictMemoryStorageUrlCacheForTest, signStorageUrl, signStorageUrls } from '../signedImage';
import { downloadDocument } from '../documentDownload';

const mocks = vi.hoisted(() => ({batch: vi.fn(), single: vi.fn(), from: vi.fn()}));
vi.mock('@/integrations/supabase/client', () => ({supabase: {storage: {from: mocks.from}}}));
const host = 'https://project.example';
const raw = `${host}/storage/v1/object/public/theory-files/folder/file.zip`;
const signed = (token = 'fresh') => `${host}/storage/v1/object/sign/theory-files/folder/file.zip?token=${token}`;

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', host);
  clearStorageUrlCache();
  mocks.from.mockReturnValue({createSignedUrls: mocks.batch, createSignedUrl: mocks.single});
  mocks.batch.mockImplementation(async (paths: string[]) => ({data: paths.map(path => ({path, signedUrl: signed()})), error: null}));
  mocks.single.mockResolvedValue({data: {signedUrl: signed()}, error: null});
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: true, status: 200}));
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  vi.stubGlobal('crypto', {randomUUID: () => 'test-frame'});
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('canonical storage identity', () => {
  it.each(['public/', 'sign/', 'authenticated/', ''])('understands %s paths without keeping their token', prefix => {
    expect(parseStorageUrl(`${host}/storage/v1/object/${prefix}theory-files/a/%C4%91%E1%BB%81%20100%25.zip?token=expired`))
      .toEqual({bucket: 'theory-files', path: 'a/đề 100%.zip'});
  });
  it('decodes literal percent-encoding once and rejects malformed keys', () => {
    expect(parseStorageUrl(raw.replace('file.zip', 'file%2520.zip'))?.path).toBe('folder/file%20.zip');
    expect(() => parseStorageUrl(raw.replace('file.zip', 'bad%XX.zip'))).toThrow();
    expect(parseStorageUrl(raw.replace(host, 'https://other.example'))).toBeNull();
    expect(parseStorageUrl(raw.replace(host, `${host}.evil.example`))).toBeNull();
  });
  it('uses a safe name or object basename', () => {
    expect(safeDownloadName('C:\\fakepath\\đề.zip\r\n', 'fallback')).toBe('đề.zip');
    expect(safeDownloadName('', 'a/original.txt')).toBe('original.txt');
  });
});

describe('preview cache', () => {
  it('deduplicates aliases and refreshes after the four-hour window', async () => {
    await signStorageUrls([raw, signed('old'), raw]);
    expect(mocks.batch).toHaveBeenCalledTimes(1);
    expect(mocks.batch.mock.calls[0][0]).toEqual(['folder/file.zip']);
    await signStorageUrl(raw);
    expect(mocks.batch).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(4 * 3600_000 + 1);
    await signStorageUrl(raw);
    expect(mocks.batch).toHaveBeenCalledTimes(2);
  });
  it('never returns a stale/raw capability after a failed refresh', async () => {
    await signStorageUrl(raw);
    vi.advanceTimersByTime(4 * 3600_000);
    mocks.batch.mockResolvedValue({data: null, error: {message: 'denied'}});
    await expect(signStorageUrl(raw)).rejects.toThrow();
    await expect(signStorageUrl(signed('expired'))).rejects.toThrow();
  });
  it('rejects per-object errors and requests completing after an identity change', async () => {
    mocks.batch.mockResolvedValueOnce({data: [{path: 'folder/file.zip', error: 'denied'}], error: null});
    await expect(signStorageUrl(raw)).rejects.toThrow();
    mocks.batch.mockImplementationOnce(async () => { clearStorageUrlCache(); return {data: [{path: 'folder/file.zip', signedUrl: signed()}]}; });
    await expect(signStorageUrl(raw)).rejects.toThrow('Phiên đăng nhập');
    await signStorageUrl(raw);
    expect(mocks.batch).toHaveBeenCalledTimes(3);
  });
  it('persists signed URLs in sessionStorage across memory evictions and wipes on clearStorageUrlCache', async () => {
    const first = await signStorageUrl(raw);
    expect(mocks.batch).toHaveBeenCalledTimes(1);
    evictMemoryStorageUrlCacheForTest();
    const afterReload = await signStorageUrl(raw);
    expect(afterReload).toBe(first);
    expect(mocks.batch).toHaveBeenCalledTimes(1);
    clearStorageUrlCache();
    await signStorageUrl(raw);
    expect(mocks.batch).toHaveBeenCalledTimes(2);
  });
  it('deduplicates concurrent in-flight requests for the same storage object', async () => {
    const [u1, u2] = await Promise.all([signStorageUrl(raw), signStorageUrl(raw)]);
    expect(u1).toBe(u2);
    expect(mocks.batch).toHaveBeenCalledTimes(1);
  });
});

describe('fresh attachment downloads', () => {
  it('re-signs every click, including expired pre-signed input, independently of preview cache', async () => {
    await signStorageUrl(raw);
    vi.advanceTimersByTime(5 * 3600_000);
    await downloadDocument(signed('expired'), 'Đề & 100%.zip');
    await downloadDocument(raw, 'Đề & 100%.zip');
    expect(mocks.single).toHaveBeenCalledTimes(2);
    expect(mocks.single).toHaveBeenCalledWith('folder/file.zip', 300, {download: true});
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(new URL(String(url)).searchParams.get('download')).toBe('Đề & 100%.zip');
    expect(new URL(String(url)).searchParams.get('token')).toBe('fresh');
    expect(options).toMatchObject({method: 'HEAD', cache: 'no-store', credentials: 'omit'});
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(2);
    expect(document.querySelector('iframe')).not.toBeNull();
  });
  it('retries expired tokens once, and stops without navigating on unavailable/forbidden files', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ok: false, status: 400} as Response);
    await downloadDocument(raw);
    expect(mocks.single).toHaveBeenCalledTimes(2);
    vi.mocked(fetch).mockResolvedValue({ok: false, status: 403} as Response);
    await expect(downloadDocument(raw)).rejects.toThrow();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
    vi.mocked(fetch).mockResolvedValue({ok: false, status: 400} as Response);
    await expect(downloadDocument(raw)).rejects.toThrow();
    expect(mocks.single).toHaveBeenCalledTimes(5);
  });
  it('renews before handoff if a tab was suspended after a successful availability check', async () => {
    vi.mocked(fetch).mockImplementationOnce(async () => {
      vi.advanceTimersByTime(300_000);
      return {ok: true, status: 200} as Response;
    });
    await downloadDocument(raw);
    expect(mocks.single).toHaveBeenCalledTimes(2);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
  });
  it('does not start transfer after signing failure, abort, network failure or identity change', async () => {
    mocks.single.mockResolvedValueOnce({data: null, error: {message: 'denied'}});
    await expect(downloadDocument(raw)).rejects.toThrow();
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
    await expect(downloadDocument(raw)).rejects.toThrow();
    const abort = new AbortController();
    mocks.single.mockImplementationOnce(async () => { abort.abort(); return {data: {signedUrl: signed()}}; });
    await expect(downloadDocument(raw, null, abort.signal)).rejects.toThrow();
    mocks.single.mockImplementationOnce(async () => { clearStorageUrlCache(); return {data: {signedUrl: signed()}}; });
    await expect(downloadDocument(raw)).rejects.toThrow('Phiên đăng nhập');
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });
  it('preserves external HTTP links without sending credentials and blocks executable schemes', async () => {
    await downloadDocument('https://other.example/document.zip');
    expect(mocks.single).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
    await expect(downloadDocument('javascript:alert(1)')).rejects.toThrow();
    await expect(downloadDocument('data:text/html,hello')).rejects.toThrow();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
  });
});
