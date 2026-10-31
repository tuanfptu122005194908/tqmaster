import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ExamImageViewerModal } from './ExamImageViewerModal';
import { signStorageUrl, signStorageUrls } from '@/lib/signedImage';
import { downloadDocument } from '@/lib/documentDownload';
vi.mock('@/lib/signedImage', () => ({signStorageUrl: vi.fn(), signStorageUrls: vi.fn()}));
vi.mock('@/lib/documentDownload', () => ({downloadDocument: vi.fn()}));
const images = ['canonical-image-1', 'canonical-image-2'];
const props = {isOpen: true, onClose: vi.fn(), images, zipDownloadUrl: 'canonical.zip', zipFileName: 'Đề.zip'};
beforeEach(() => {
  vi.mocked(signStorageUrl).mockImplementation(async url => `fresh-${url}`);
  vi.mocked(signStorageUrls).mockImplementation(async urls => new Map(urls.map(url => [url!, `thumb-${url}`])));
  vi.mocked(downloadDocument).mockResolvedValue();
});
afterEach(() => { cleanup(); vi.resetAllMocks(); });

it('reuses cached URL on open and refreshes with forceRefresh on image failure and manual retry, with fresh downloads in both ZIP actions', async () => {
  render(<ExamImageViewerModal {...props} />);
  const first = await screen.findByRole('img', {name: 'Trang 1'});
  expect(first).toHaveAttribute('src', 'fresh-canonical-image-1');
  expect(signStorageUrl).toHaveBeenCalledWith(images[0], {forceRefresh: false});
  fireEvent.click(screen.getByRole('button', {name: 'Tải file ZIP gốc'}));
  await waitFor(() => expect(downloadDocument).toHaveBeenCalledTimes(1));
  fireEvent.error(first);
  await waitFor(() => expect(signStorageUrl).toHaveBeenCalledTimes(2));
  expect(signStorageUrl).toHaveBeenLastCalledWith(images[0], {forceRefresh: true});
  fireEvent.error(await screen.findByRole('img', {name: 'Trang 1'}));
  expect(await screen.findByRole('button', {name: 'Thử lại ảnh'})).toBeVisible();
  expect(signStorageUrl).toHaveBeenCalledTimes(2);
  const zipButtons = screen.getAllByRole('button', {name: 'Tải file ZIP gốc'});
  fireEvent.click(zipButtons[1]);
  await waitFor(() => expect(downloadDocument).toHaveBeenCalledTimes(2));
  expect(vi.mocked(downloadDocument).mock.calls.every(call => call[0] === 'canonical.zip' && call[1] === 'Đề.zip')).toBe(true);
  fireEvent.click(screen.getByRole('button', {name: 'Thử lại ảnh'}));
  await screen.findByRole('img', {name: 'Trang 1'});
  expect(signStorageUrl).toHaveBeenCalledTimes(3);
  expect(signStorageUrl).toHaveBeenLastCalledWith(images[0], {forceRefresh: true});
});

it('ignores a signing result from the previously selected page', async () => {
  let finish!: (url: string) => void;
  vi.mocked(signStorageUrl).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  render(<ExamImageViewerModal {...props} />);
  fireEvent.click(screen.getByTitle('Ảnh tiếp theo (Mũi tên phải)'));
  expect(await screen.findByRole('img', {name: 'Trang 2'})).toHaveAttribute('src', 'fresh-canonical-image-2');
  await act(async () => { finish('old-page-capability'); });
  expect(screen.getByRole('img', {name: 'Trang 2'})).toHaveAttribute('src', 'fresh-canonical-image-2');
});

it('refreshes when reopened even with the same images', async () => {
  const {rerender} = render(<ExamImageViewerModal {...props} />);
  await screen.findByRole('img', {name: 'Trang 1'});
  rerender(<ExamImageViewerModal {...props} isOpen={false} />);
  rerender(<ExamImageViewerModal {...props} />);
  await waitFor(() => expect(signStorageUrl).toHaveBeenCalledTimes(2));
});
