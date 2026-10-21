import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SubjectAccessBoundary } from '../SubjectAccessBoundary';

const access = vi.hoisted(() => ({ purchasedReady: false, purchasedLoading: false, purchasedError: null as string | null, refreshPurchased: vi.fn() }));
vi.mock('@/lib/AppContext', () => ({ useApp: () => access }));
beforeEach(() => { access.purchasedReady = false; access.purchasedLoading = false; access.purchasedError = null; vi.clearAllMocks(); });
afterEach(cleanup);

describe('SubjectAccessBoundary', () => {
  it('does not mount purchase decisions while grants are still unknown', () => {
    render(<SubjectAccessBoundary><div>Mua lại khóa học</div></SubjectAccessBoundary>);
    expect(screen.getByRole('status')).toHaveTextContent('Đang tải quyền học');
    expect(screen.queryByText('Mua lại khóa học')).not.toBeInTheDocument();
  });

  it('offers retry after initial failure without showing an unpaid state', () => {
    access.purchasedError = 'offline';
    render(<SubjectAccessBoundary><div>Mua lại khóa học</div></SubjectAccessBoundary>);
    expect(screen.getByRole('alert')).toHaveTextContent('Chưa tải được quyền học');
    expect(screen.queryByText('Mua lại khóa học')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(access.refreshPurchased).toHaveBeenCalledOnce();
  });

  it('keeps the last successful course view visible on refresh error', () => {
    access.purchasedReady = true;
    access.purchasedError = 'offline';
    render(<SubjectAccessBoundary><div>Khóa học đã mua</div></SubjectAccessBoundary>);
    expect(screen.getByText('Khóa học đã mua')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('kết quả tải gần nhất');
  });
});
