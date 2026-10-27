import React, { useEffect, useRef, useState } from 'react';
import { downloadDocument } from '@/lib/documentDownload';

type Props = Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  url: string;
  fileName?: string | null;
};

export function StorageDownloadButton({ url, fileName, children, disabled, style, ...props }: Props) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    setPending(false);
    setError('');
    return () => { active.current?.abort(); active.current = null; };
  }, [url, fileName]);

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (active.current || disabled) return;
    const request = new AbortController();
    active.current = request;
    setPending(true);
    setError('');
    try { await downloadDocument(url, fileName, request.signal); }
    catch (err) {
      if (!request.signal.aborted) setError(err instanceof Error ? err.message : 'Không thể tải tài liệu. Vui lòng thử lại.');
    } finally {
      if (active.current === request) {
        active.current = null;
        setPending(false);
      }
    }
  };

  return (
    <span style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, flexShrink: 0, width: style?.width}} onClick={event => event.stopPropagation()}>
      <button {...props} type="button" style={style} disabled={disabled || pending} aria-busy={pending} onClick={handleClick}>
        {pending ? 'Đang chuẩn bị…' : error ? 'Thử lại' : children}
      </button>
      {error && <span role="alert" style={{color: '#ef4444', fontSize: 12, maxWidth: 280}}>{error}</span>}
    </span>
  );
}
