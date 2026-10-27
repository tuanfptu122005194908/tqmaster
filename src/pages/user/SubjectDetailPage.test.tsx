import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import SubjectDetailPage from './SubjectDetailPage';
import { downloadDocument } from '@/lib/documentDownload';
import { signStorageUrls } from '@/lib/signedImage';
const mocks = vi.hoisted(() => ({from: vi.fn()}));
vi.mock('@/integrations/supabase/client', () => ({supabase: {from: mocks.from}}));
vi.mock('@/lib/AppContext', () => ({useApp: () => ({isPurchased: () => true, isInCart: () => false})}));
vi.mock('@/components/ProductReviews', () => ({ProductReviews: () => null}));
vi.mock('@/lib/documentDownload', () => ({downloadDocument: vi.fn()}));
vi.mock('@/lib/signedImage', () => ({signStorageUrl: vi.fn(), signStorageUrls: vi.fn()}));
const files = [
  {id: 'theory', title: 'Tài liệu lý thuyết', category: 'theory', type: 'file', url: 'canonical.txt', file_name: 'Đề.txt'},
  {id: 'pe', title: 'Đề PE', category: 'pe', type: 'file', url: 'canonical.zip', file_name: 'Đề.zip', description: '<!--PE_META:{"preview_images":["canonical.png"]}-->'},
  {id: 'link', title: 'Link ngoài', category: 'theory', type: 'link', url: 'https://external.example/video'},
];
beforeEach(() => {
  vi.mocked(downloadDocument).mockResolvedValue();
  vi.mocked(signStorageUrls).mockImplementation(async urls => new Map(urls.map(url => [url!, `display-${url}`])));
  mocks.from.mockImplementation(table => {
    const data = table === 'subjects' ? {id: 'subject', name: 'Môn học', semester: 1} : table === 'theory_subjects' ? files.map(theories => ({theories})) : [];
    const response = {data, error: null};
    return {select() { return this; }, eq() { return this; }, single() { return Promise.resolve(response); }, order() { return Promise.resolve(response); }, then(resolve: (value: unknown) => void) { return Promise.resolve(response).then(resolve); }};
  });
});
afterEach(() => { cleanup(); vi.resetAllMocks(); });

it('keeps file identity for both user tabs while only signing thumbnail display URLs at load time', async () => {
  render(<MemoryRouter initialEntries={['/subjects/subject']}><Routes><Route path="/subjects/:id" element={<SubjectDetailPage />} /></Routes></MemoryRouter>);
  await screen.findByRole('heading', {name: 'Môn học'});
  fireEvent.click(document.getElementById('tab-theory')!);
  fireEvent.click(screen.getByRole('button', {name: 'Tải về'}));
  await waitFor(() => expect(downloadDocument).toHaveBeenCalledWith('canonical.txt', 'Đề.txt', expect.any(AbortSignal)));
  expect(screen.getByRole('link', {name: 'Mở link'})).toHaveAttribute('href', 'https://external.example/video');
  expect(signStorageUrls).toHaveBeenCalledWith(['canonical.png']);
  fireEvent.click(document.getElementById('tab-pe')!);
  fireEvent.click(screen.getByRole('button', {name: 'Tải file ZIP gốc'}));
  await waitFor(() => expect(downloadDocument).toHaveBeenCalledWith('canonical.zip', 'Đề.zip', expect.any(AbortSignal)));
});

it('retains original-file download controls when thumbnail signing fails', async () => {
  vi.mocked(signStorageUrls).mockRejectedValue(new Error('denied'));
  render(<MemoryRouter initialEntries={['/subjects/subject']}><Routes><Route path="/subjects/:id" element={<SubjectDetailPage />} /></Routes></MemoryRouter>);
  await screen.findByRole('heading', {name: 'Môn học'});
  fireEvent.click(document.getElementById('tab-pe')!);
  fireEvent.click(screen.getByRole('button', {name: 'Tải file ZIP gốc'}));
  await waitFor(() => expect(downloadDocument).toHaveBeenCalledWith('canonical.zip', 'Đề.zip', expect.any(AbortSignal)));
});
