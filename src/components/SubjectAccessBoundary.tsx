import type { ReactNode } from 'react';
import { useApp } from '@/lib/AppContext';
import { RetryNotice } from './common/RetryNotice';

export function SubjectAccessBoundary({ children }: { children: ReactNode }) {
  const { purchasedReady, purchasedLoading, purchasedError, refreshPurchased } = useApp();
  if (!purchasedReady) {
    if (purchasedError) {
      return <RetryNotice message="Chưa tải được quyền học của bạn. Vui lòng thử lại." onRetry={refreshPurchased} loading={purchasedLoading} />;
    }
    return <div role="status" style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Đang tải quyền học…</div>;
  }
  return <>
    {purchasedError && <RetryNotice message="Chưa cập nhật được quyền học. Đang hiển thị kết quả tải gần nhất." onRetry={refreshPurchased} loading={purchasedLoading} />}
    {children}
  </>;
}
