import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminUsers from '../AdminUsers';

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  rpc: vi.fn(),
}));

vi.mock('@/lib/adminUsers', () => ({ loadAdminUsers: mocks.load }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: mocks.rpc,
  },
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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

describe('AdminUsers sync subject access', () => {
  it('renders sync button and calls repair RPC on user confirmation', async () => {
    mocks.load.mockResolvedValue({ rows: [], subjects: [] });
    mocks.rpc.mockResolvedValue({
      data: { success: true, restored_grants_count: 3, affected_users_count: 2 },
      error: null,
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<AdminUsers />);
    const syncBtn = await screen.findByRole('button', { name: /Đồng bộ quyền đơn hàng/i });
    expect(syncBtn).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(syncBtn);
    });

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(mocks.rpc).toHaveBeenCalledWith('repair_subject_access_by_admin');
    });
  });
});
