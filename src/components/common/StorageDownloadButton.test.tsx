import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { StorageDownloadButton } from './StorageDownloadButton';
import { downloadDocument } from '@/lib/documentDownload';
vi.mock('@/lib/documentDownload', () => ({downloadDocument: vi.fn()}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('blocks repeated clicks while signing and provides an in-page retry on failure', async () => {
  let reject!: (error: Error) => void;
  vi.mocked(downloadDocument).mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
  render(<StorageDownloadButton url="file" fileName="file.zip">Tải về</StorageDownloadButton>);
  fireEvent.click(screen.getByRole('button'));
  fireEvent.click(screen.getByRole('button'));
  expect(downloadDocument).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('button')).toBeDisabled();
  await act(async () => { reject(new Error('Không thể tải tài liệu')); });
  expect(screen.getByRole('alert')).toHaveTextContent('Không thể tải tài liệu');
  vi.mocked(downloadDocument).mockResolvedValueOnce();
  fireEvent.click(screen.getByRole('button', {name: 'Thử lại'}));
  await waitFor(() => expect(screen.getByRole('button', {name: 'Tải về'})).toBeEnabled());
  expect(downloadDocument).toHaveBeenCalledTimes(2);
});

it('aborts a pending transfer when the action unmounts', () => {
  vi.mocked(downloadDocument).mockImplementation(() => new Promise(() => {}));
  const {unmount} = render(<StorageDownloadButton url="file">Tải về</StorageDownloadButton>);
  fireEvent.click(screen.getByRole('button'));
  const signal = vi.mocked(downloadDocument).mock.calls[0][2];
  unmount();
  expect(signal?.aborted).toBe(true);
});
