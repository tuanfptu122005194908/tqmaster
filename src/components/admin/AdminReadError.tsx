export function AdminReadError({ errors, retry }: { errors: Record<string, string>; retry: () => unknown }) {
  if (!Object.keys(errors).length) return null;
  return <div role="alert" style={{ padding: 16, margin: 12, borderRadius: 14, color: '#be123c', background: '#fff1f2', border: '1px solid #fecdd3' }}>
    <strong>Không tải được đầy đủ dữ liệu.</strong>{' '}{Object.values(errors).join(' · ')}{' '}
    <button type="button" onClick={() => void retry()}>Thử lại</button>
  </div>;
}
