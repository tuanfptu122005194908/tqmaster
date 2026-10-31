import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchBillStats, cleanBillImages } from '../orderBillCleaner';

const mocks = vi.hoisted(() => ({
  selectOrders: vi.fn(),
  updateOrders: vi.fn(),
  storageRemove: vi.fn(),
}));

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'orders') {
          return {
            select: (...args: any[]) => ({
              not: (...notArgs: any[]) => {
                const chain = {
                  in: (...inArgs: any[]) => mocks.selectOrders({ filter: 'in', inArgs }),
                  then: (resolve: any) => Promise.resolve(mocks.selectOrders({ filter: 'none' })).then(resolve),
                };
                return chain;
              },
            }),
            update: (values: any) => ({
              in: (field: string, ids: string[]) => mocks.updateOrders(values, field, ids),
            }),
          };
        }
        return {};
      },
      storage: {
        from: (bucket: string) => {
          if (bucket === 'bill-images') {
            return {
              remove: (paths: string[]) => mocks.storageRemove(paths),
            };
          }
          return {};
        },
      },
    },
  };
});

describe('orderBillCleaner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchBillStats', () => {
    it('returns accurate counts for total, pending, and processed orders with bill images', async () => {
      mocks.selectOrders.mockResolvedValueOnce({
        data: [
          { id: 'o-1', status: 'pending', bill_image_url: 'user1/bill1.jpg' },
          { id: 'o-2', status: 'approved', bill_image_url: 'user2/bill2.webp' },
          { id: 'o-3', status: 'approved', bill_image_url: 'user3/bill3.png' },
          { id: 'o-4', status: 'rejected', bill_image_url: 'user4/bill4.jpg' },
          { id: 'o-5', status: 'approved', bill_image_url: '   ' }, // empty/whitespace
        ],
        error: null,
      });

      const stats = await fetchBillStats();
      expect(stats).toEqual({
        totalWithBills: 4,
        pendingWithBills: 1,
        processedWithBills: 3,
      });
    });

    it('throws error when database query fails', async () => {
      mocks.selectOrders.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await expect(fetchBillStats()).rejects.toThrow('Database connection failed');
    });
  });

  describe('cleanBillImages', () => {
    it('cleans only approved/rejected orders when scope is processed_only', async () => {
      mocks.selectOrders.mockResolvedValueOnce({
        data: [
          { id: 'o-2', status: 'approved', bill_image_url: 'user2/bill2.webp' },
          { id: 'o-4', status: 'rejected', bill_image_url: 'user4/bill4.jpg' },
        ],
        error: null,
      });
      mocks.storageRemove.mockResolvedValueOnce({
        data: [{ name: 'user2/bill2.webp' }, { name: 'user4/bill4.jpg' }],
        error: null,
      });
      mocks.updateOrders.mockResolvedValueOnce({ error: null });

      const result = await cleanBillImages({ scope: 'processed_only' });

      expect(mocks.selectOrders).toHaveBeenCalledWith({
        filter: 'in',
        inArgs: ['status', ['approved', 'rejected']],
      });
      expect(mocks.storageRemove).toHaveBeenCalledWith([
        'user2/bill2.webp',
        'user4/bill4.jpg',
      ]);
      expect(mocks.updateOrders).toHaveBeenCalledWith(
        { bill_image_url: null },
        'id',
        ['o-2', 'o-4']
      );
      expect(result).toEqual({
        deletedFilesCount: 2,
        updatedOrdersCount: 2,
      });
    });

    it('cleans all orders when scope is all', async () => {
      mocks.selectOrders.mockResolvedValueOnce({
        data: [
          { id: 'o-1', status: 'pending', bill_image_url: 'user1/bill1.jpg' },
          { id: 'o-2', status: 'approved', bill_image_url: 'user2/bill2.webp' },
        ],
        error: null,
      });
      mocks.storageRemove.mockResolvedValueOnce({
        data: [{ name: 'user1/bill1.jpg' }, { name: 'user2/bill2.webp' }],
        error: null,
      });
      mocks.updateOrders.mockResolvedValueOnce({ error: null });

      const result = await cleanBillImages({ scope: 'all' });

      expect(mocks.storageRemove).toHaveBeenCalledWith([
        'user1/bill1.jpg',
        'user2/bill2.webp',
      ]);
      expect(mocks.updateOrders).toHaveBeenCalledWith(
        { bill_image_url: null },
        'id',
        ['o-1', 'o-2']
      );
      expect(result).toEqual({
        deletedFilesCount: 2,
        updatedOrdersCount: 2,
      });
    });

    it('returns zero counts and skips operations when no matching orders have bills', async () => {
      mocks.selectOrders.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await cleanBillImages({ scope: 'processed_only' });

      expect(result).toEqual({
        deletedFilesCount: 0,
        updatedOrdersCount: 0,
      });
      expect(mocks.storageRemove).not.toHaveBeenCalled();
      expect(mocks.updateOrders).not.toHaveBeenCalled();
    });
  });
});

