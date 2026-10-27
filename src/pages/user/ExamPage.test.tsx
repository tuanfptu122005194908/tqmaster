import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import ExamPage from './ExamPage';
import { signQuestionImages } from '@/lib/signedImage';
vi.mock('@/lib/AppContext', () => ({useApp: () => ({profile: null})}));
vi.mock('@/lib/signedImage', () => ({signQuestionImages: vi.fn()}));
vi.mock('@/components/exam/RichContent', () => ({RichContent: () => null}));
vi.mock('@/integrations/supabase/client', () => ({supabase: {from: (table: string) => {
  const data = table === 'exams' ? {id: 'exam', duration_min: 60, title: 'Đề thi'} : [{id: 'q', order_num: 1, question_options: []}];
  return {select() { return this; }, eq() { return this; }, single: async () => ({data, error: null}), order: async () => ({data, error: null})};
}}}));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

it('shows the existing retry screen when the shared image signer rejects instead of leaving the exam loading', async () => {
  vi.mocked(signQuestionImages).mockRejectedValue(new Error('denied'));
  render(<MemoryRouter future={{v7_startTransition: true, v7_relativeSplatPath: true}} initialEntries={['/exams/exam?mode=practice']}>
    <Routes><Route path="/exams/:id" element={<ExamPage />} /></Routes>
  </MemoryRouter>);
  expect(await screen.findByText('Không thể tải ảnh đề thi. Vui lòng thử lại.')).toBeVisible();
  fireEvent.click(screen.getByRole('button', {name: 'Thử lại'}));
  await screen.findByText('Không thể tải ảnh đề thi. Vui lòng thử lại.');
  expect(signQuestionImages).toHaveBeenCalledTimes(2);
});
