import type { ReactNode } from 'react';

type QueryState = { isPending: boolean; isFetching?: boolean; data?: unknown; error: Error | null; refetch: () => unknown };

/** A failed background refresh keeps its children (the last good result) visible. */
export function AdminDataState({ query, children }: { query: QueryState; children?: ReactNode }) {
  return <>
    {query.error && <div role="alert" style={{ padding: 14, marginBottom: 12, borderRadius: 14, background: '#fff1f2', color: '#be123c' }}>
      Không tải được dữ liệu: {query.error.message}{' '}
      <button type="button" onClick={() => void query.refetch()}>Thử lại</button>
    </div>}
    {query.isPending ? <div role="status" style={{ padding: 20, color: '#64748b' }}>Đang tải dữ liệu…</div> : query.error && query.data === undefined ? null : children}
    {!query.isPending && query.isFetching && <div role="status" style={{ fontSize: 12, color: '#64748b' }}>Đang cập nhật…</div>}
  </>;
}
