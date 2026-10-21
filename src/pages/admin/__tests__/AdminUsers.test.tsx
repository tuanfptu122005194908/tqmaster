import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminUsers from '../AdminUsers';

const mocks = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock('@/lib/adminUsers', () => ({ loadAdminUsers: mocks.load }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('AdminUsers loading failure', () => {
  it('shows an error instead of 00 subjects or grant controls, then retries', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.load.mockRejectedValueOnce(new Error('second page failed')).mockResolvedValueOnce({ rows: [], subjects: [] });
    render(<AdminUsers />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Chưa tải đầy đủ');
    expect(screen.queryByText('00 môn')).not.toBeInTheDocument();
    expect(screen.queryByText('Quản lý người dùng')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByText('Quản lý người dùng')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mocks.load).toHaveBeenCalledTimes(2);
  });
});
