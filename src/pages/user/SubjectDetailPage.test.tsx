import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SubjectDetailPage from './SubjectDetailPage';
import { downloadDocument } from '@/lib/documentDownload';
import { signStorageUrls } from '@/lib/signedImage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
const mocks = vi.hoisted(() => ({
  from: vi.fn(), userId: 'buyer', revision: 1, canRead: true, failAnnouncements: false,
  requests: [] as { table: string; category?: string; signal?: AbortSignal }[],
}));
vi.mock('@/integrations/supabase/client', () => ({supabase: {from: mocks.from}}));
vi.mock('@/lib/AppContext', () => ({useApp: () => ({
  profile: mocks.userId ? {id: mocks.userId} : null, isAdmin: false, purchasedRevision: mocks.revision,
  isPurchased: () => mocks.canRead, isInCart: () => false,
})}));
vi.mock('@/components/ProductReviews', () => ({ProductReviews: () => null}));
vi.mock('@/lib/documentDownload', () => ({downloadDocument: vi.fn()}));
vi.mock('@/lib/signedImage', () => ({signStorageUrl: vi.fn(), signStorageUrls: vi.fn()}));
const files = [
  {id: 'theory', title: 'Tài liệu lý thuyết', category: 'theory', type: 'file', url: 'canonical.txt', file_name: 'Đề.txt'},
  {id: 'pe', title: 'Đề PE', category: 'pe', type: 'file', url: 'canonical.zip', file_name: 'Đề.zip', description: '<!--PE_META:{"preview_images":["canonical.png"]}-->'},
  {id: 'link', title: 'Link ngoài', category: 'theory', type: 'link', url: 'https://external.example/video'},
  {id: 'gdrive', title: 'Thư mục Drive', category: 'theory', type: 'link', url: 'https://drive.google.com/drive/folders/1abcxyz'},
];
let client: QueryClient;
function page() {
  return <QueryClientProvider client={client}><MemoryRouter initialEntries={['/subjects/subject']}><Routes><Route path="/subjects/:id" element={<SubjectDetailPage />} /></Routes></MemoryRouter></QueryClientProvider>;
}
beforeEach(() => {
  client = new QueryClient({defaultOptions: {queries: {retry: false, staleTime: 5 * 60_000}}});
  mocks.userId = 'buyer'; mocks.revision = 1; mocks.canRead = true; mocks.failAnnouncements = false; mocks.requests = [];
  vi.mocked(downloadDocument).mockResolvedValue();
  vi.mocked(signStorageUrls).mockImplementation(async urls => new Map(urls.map(url => [url!, `display-${url}`])));
  mocks.from.mockImplementation(table => {
    const request: {table: string; category?: string; signal?: AbortSignal} = {table};
    const owner = mocks.userId;
    function response() {
      mocks.requests.push(request);
      const data = table === 'subjects' ? {id: 'subject', name: 'Môn học', semester: 1}
        : table === 'theory_subjects' ? files.filter(row => row.category === request.category).map(theories => ({theories}))
        : table === 'exam_subjects' ? [{exams: {id: `exam-${owner}`, title: `Đề của ${owner}`, exam_type: 'FE', duration_min: 60}}] : [];
      return {data, error: table === 'announcements' && mocks.failAnnouncements ? {message: 'offline'} : null};
    }
    return {
      select() { return this; },
      eq(column: string, value: string) { if (column === 'theories.category') request.category = value; return this; },
      abortSignal(signal: AbortSignal) { request.signal = signal; return this; },
      single() { return Promise.resolve(response()); }, order() { return this; },
      then(resolve: (value: unknown) => void) { return Promise.resolve(response()).then(resolve); },
    };
  });
});
afterEach(() => { cleanup(); client.clear(); vi.resetAllMocks(); });

it('keeps file identity for both user tabs while only signing thumbnail display URLs at load time', async () => {
  render(page());
  await screen.findByRole('heading', {name: 'Môn học'});
  fireEvent.click(document.getElementById('tab-theory')!);
  fireEvent.click(await screen.findByRole('button', {name: 'Tải về'}));
  await waitFor(() => expect(downloadDocument).toHaveBeenCalledWith('canonical.txt', 'Đề.txt', expect.any(AbortSignal)));
  expect(screen.getByRole('link', {name: 'Mở link'})).toHaveAttribute('href', 'https://external.example/video');
  expect(signStorageUrls).not.toHaveBeenCalled();
  fireEvent.click(document.getElementById('tab-pe')!);
  fireEvent.click(await screen.findByRole('button', {name: 'Tải file ZIP gốc'}));
  await waitFor(() => expect(signStorageUrls).toHaveBeenCalledWith(['canonical.png']));
  await waitFor(() => expect(downloadDocument).toHaveBeenCalledWith('canonical.zip', 'Đề.zip', expect.any(AbortSignal)));
});

it('retains original-file download controls when thumbnail signing fails', async () => {
  vi.mocked(signStorageUrls).mockRejectedValue(new Error('denied'));
  render(page());
  await screen.findByRole('heading', {name: 'Môn học'});
  fireEvent.click(document.getElementById('tab-pe')!);
  fireEvent.click(await screen.findByRole('button', {name: 'Tải file ZIP gốc'}));
  await waitFor(() => expect(downloadDocument).toHaveBeenCalledWith('canonical.zip', 'Đề.zip', expect.any(AbortSignal)));
});

it('loads only opened datasets and reuses a fresh tab without signing unopened previews', async () => {
  render(page());
  await screen.findByRole('heading', {name: 'Đề của buyer'});
  expect(mocks.requests.map(r => r.table)).toEqual(['subjects', 'exam_subjects']);
  fireEvent.click(document.getElementById('tab-theory')!);
  await screen.findByText('Tài liệu lý thuyết');
  expect(mocks.requests.filter(r => r.table === 'theory_subjects').map(r => r.category)).toEqual(['theory']);
  expect(signStorageUrls).not.toHaveBeenCalled();
  fireEvent.click(document.getElementById('tab-pe')!);
  await screen.findByRole('button', {name: 'Tải file ZIP gốc'});
  await waitFor(() => expect(signStorageUrls).toHaveBeenCalledTimes(1));
  fireEvent.click(document.getElementById('tab-theory')!);
  await screen.findByText('Tài liệu lý thuyết');
  expect(mocks.requests.filter(r => r.table === 'theory_subjects').map(r => r.category)).toEqual(['theory', 'pe']);
  expect(mocks.requests.some(r => r.table === 'announcements')).toBe(false);
  fireEvent.click(document.getElementById('tab-announcements')!);
  await screen.findByText('Chưa có thông báo nào');
  expect(mocks.requests.filter(r => r.table === 'announcements')).toHaveLength(1);
});

it('shows failed tab reads as retryable errors rather than empty data', async () => {
  mocks.failAnnouncements = true;
  render(page());
  await screen.findByRole('heading', {name: 'Môn học'});
  fireEvent.click(document.getElementById('tab-announcements')!);
  await screen.findByRole('alert');
  expect(screen.queryByText('Chưa có thông báo nào')).not.toBeInTheDocument();
  mocks.failAnnouncements = false;
  fireEvent.click(screen.getByRole('button', {name: 'Thử lại'}));
  await screen.findByText('Chưa có thông báo nào');
});

it('isolates account caches and hides confirmed revoked content immediately', async () => {
  const view = render(page());
  await screen.findByRole('heading', {name: 'Đề của buyer'});
  mocks.userId = 'other';
  view.rerender(page());
  expect(screen.queryByRole('heading', {name: 'Đề của buyer'})).not.toBeInTheDocument();
  await screen.findByRole('heading', {name: 'Đề của other'});
  mocks.canRead = false; mocks.revision++;
  view.rerender(page());
  expect(screen.queryByRole('heading', {name: 'Đề của other'})).not.toBeInTheDocument();
  await screen.findByText('Nội dung bị khóa');
  expect(mocks.requests.filter(r => r.table === 'exam_subjects')).toHaveLength(2);
  mocks.canRead = true; mocks.revision++;
  view.rerender(page());
  await screen.findByRole('heading', {name: 'Đề của other'});
  expect(mocks.requests.filter(r => r.table === 'exam_subjects')).toHaveLength(3);
});

it('renders Google Drive open button when theory link is a Google Drive url', async () => {
  render(page());
  await screen.findByRole('heading', {name: 'Môn học'});
  fireEvent.click(document.getElementById('tab-theory')!);
  const gdriveBtn = await screen.findByRole('link', {name: /Mở Google Drive/i});
  expect(gdriveBtn).toBeInTheDocument();
  expect(gdriveBtn).toHaveAttribute('href', 'https://drive.google.com/drive/folders/1abcxyz');
});
