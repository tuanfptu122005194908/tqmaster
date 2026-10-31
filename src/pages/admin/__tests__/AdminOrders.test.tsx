import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AdminOrders from '../AdminOrders';

const mocks = vi.hoisted(() => ({
  fetchBillStats: vi.fn(),
  cleanBillImages: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  invalidateQueries: vi.fn(),
  refreshPendingOrdersCount: vi.fn(),
  selectOrders: vi.fn(),
}));

vi.mock('@/lib/AppContext', () => ({
  useApp: () => ({
    profile: { id: 'admin-1', role: 'admin' },
    refreshPendingOrdersCount: mocks.refreshPendingOrdersCount,
  }),
}));

vi.mock('@/hooks/useAdminAnalytics', () => ({
  useCommerceSummary: () => ({
    data: {
      pendingOrders: 2,
      approved: 10,
      revenue: 5000000,
    },
    isPending: false,
    error: null,
  }),
}));

vi.mock('@/lib/queryClient', () => ({
  queryClient: {
    invalidateQueries: mocks.invalidateQueries,
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

vi.mock('@/lib/orderBillCleaner', () => ({
  fetchBillStats: mocks.fetchBillStats,
  cleanBillImages: mocks.cleanBillImages,
}));

vi.mock('@/lib/adminRead', () => ({
  readAdminRows: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/integrations/supabase/client', () => {
  const dummyChannel = {
    on: () => dummyChannel,
    subscribe: () => dummyChannel,
  };
  return {
    supabase: {
      from: (table: string) => ({
        select: (...args: any[]) => ({
          order: () => ({
            order: () => ({
              range: async () => ({
                data: [
                  {
                    id: 'ord-1',
                    created_at: new Date().toISOString(),
                    final_amount: 150000,
                    original_amount: 150000,
                    discount_amount: 0,
                    status: 'approved',
                    full_name: 'Nguyen Van A',
                    email: 'a@example.com',
                    student_code: 'SV001',
                    bill_image_url: null, // bill cleaned
                    order_items: [],
                  },
                ],
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      }),
      storage: {
        from: () => ({
          createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      },
      channel: () => dummyChannel,
      removeChannel: vi.fn(),
    },
  };
});

describe('AdminOrders - Xoá ảnh bill cũ', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetchBillStats.mockResolvedValue({
      totalWithBills: 15,
      pendingWithBills: 3,
      processedWithBills: 12,
    });
    mocks.cleanBillImages.mockResolvedValue({
      deletedFilesCount: 12,
      updatedOrdersCount: 12,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('renders "Xoá ảnh bill cũ" button and displays "Đã dọn bill" badge for cleaned approved orders', async () => {
    render(<AdminOrders />);

    const cleanButton = await screen.findByRole('button', { name: /Xoá ảnh bill cũ/i });
    expect(cleanButton).toBeInTheDocument();

    // Check that approved order with null bill shows "Đã dọn bill"
    expect(await screen.findByText(/Đã dọn bill/i)).toBeInTheDocument();
  });

  it('opens CleanBillsModal, displays stats, and triggers cleanBillImages on confirmation', async () => {
    render(<AdminOrders />);

    const cleanButton = await screen.findByRole('button', { name: /Xoá ảnh bill cũ/i });
    fireEvent.click(cleanButton);

    // Modal should appear and call fetchBillStats
    expect(mocks.fetchBillStats).toHaveBeenCalled();
    expect(await screen.findByText(/TỔNG QUAN DUNG LƯỢNG BILL/i)).toBeInTheDocument();
    expect(screen.getByText(/Đã xử lý: 12/i)).toBeInTheDocument();
    expect(screen.getByText(/Chờ duyệt: 3/i)).toBeInTheDocument();

    // Confirm button
    const confirmBtn = screen.getByRole('button', { name: /Xác nhận xoá ảnh/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mocks.cleanBillImages).toHaveBeenCalledWith({ scope: 'processed_only' });
      expect(mocks.toastSuccess).toHaveBeenCalledWith(
        expect.stringContaining('Đã dọn dẹp thành công 12 file ảnh bill')
      );
    });
  });

  it('shows educational notice in drawer when inspecting approved order whose bill was cleaned', async () => {
    render(<AdminOrders />);

    // Click row detail or view action
    const detailBtn = await screen.findByRole('button', { name: /Xem/i });
    fireEvent.click(detailBtn);

    expect(await screen.findByText(/Ảnh bill đã được dọn dẹp khỏi bộ nhớ lưu trữ để tối ưu dung lượng hệ thống/i)).toBeInTheDocument();
  });
});

