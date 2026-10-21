interface Props {
  message: string;
  onRetry: () => void;
  loading?: boolean;
}

export function RetryNotice({ message, onRetry, loading = false }: Props) {
  return (
    <div role="alert" style={{
      margin: '20px auto', padding: 24, maxWidth: 720, borderRadius: 20,
      border: '1px solid #e2e8f0', background: '#ffffff', color: '#334155',
      boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
    }}>
      <span>{message}</span>
      <button type="button" onClick={onRetry} disabled={loading} style={{
        padding: '10px 18px', borderRadius: 12, border: 'none',
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        color: '#ffffff', fontWeight: 800, cursor: loading ? 'wait' : 'pointer',
        boxShadow: '0 6px 18px rgba(37,99,235,0.2)',
      }}>
        {loading ? 'Đang tải lại…' : 'Thử lại'}
      </button>
    </div>
  );
}
