import React, { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Loader2, X, FileText } from 'lucide-react';

interface Props {
  bucket: string;
  value?: string;                       // current public URL
  onChange: (url: string) => void;
  onFileNameChange?: (name: string) => void; // original file name from picker
  accept?: string;                      // e.g. "image/*" or ".pdf,.doc"
  preview?: 'image' | 'file' | 'none';  // what to render
  pathPrefix?: string;                  // optional folder inside bucket
  maxSizeMB?: number;
  label?: string;
}

export default function FileUploader({
  bucket, value, onChange, onFileNameChange,
  accept = 'image/*',
  preview = 'image',
  pathPrefix = '',
  maxSizeMB = 10,
  label,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File quá ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop() || 'bin';
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = pathPrefix ? `${pathPrefix.replace(/\/$/, '')}/${safeName}` : safeName;

    const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600', upsert: false, contentType: file.type,
    });

    if (upErr) {
      setError(upErr.message);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(publicUrl);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const clear = () => onChange('');

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, marginBottom: 6 }}>
          {label}
        </label>
      )}

      <input ref={inputRef} type="file" accept={accept} onChange={onPick} style={{ display: 'none' }} />

      {value && preview === 'image' && (
        <div style={{ marginBottom: 8, position: 'relative', display: 'inline-block' }}>
          <img src={value} alt="preview" style={{ maxHeight: 140, maxWidth: '100%', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))' }} />
          <button type="button" onClick={clear}
            style={{ position: 'absolute', top: 4, right: 4, background: 'hsl(var(--danger))', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={12} />
          </button>
        </div>
      )}

      {value && preview === 'file' && (
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, padding: 'var(--space-2) var(--space-3)', background: 'hsl(var(--muted))', borderRadius: 'var(--radius)', fontSize: '0.8125rem' }}>
          <FileText size={14} />
          <a href={value} target="_blank" rel="noreferrer" style={{ color: 'hsl(var(--primary))', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {value.split('/').pop()}
          </a>
          <button type="button" onClick={clear} className="btn-ghost" style={{ padding: 4, color: 'hsl(var(--danger))' }}><X size={12} /></button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-ghost"
          style={{ border: '1px dashed hsl(var(--border))', padding: '8px 14px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {uploading
            ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải...</>
            : <><Upload size={14} /> {value ? 'Thay file' : 'Chọn file'}</>}
        </button>
        <input
          type="text"
          placeholder="hoặc dán URL..."
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          style={{
            flex: 1, minWidth: 180, padding: '8px 12px',
            border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)',
            fontSize: '0.8125rem', outline: 'none', background: 'hsl(var(--surface-raised))',
          }}
        />
      </div>

      {error && <p style={{ marginTop: 6, fontSize: '0.75rem', color: 'hsl(var(--danger))' }}>{error}</p>}
    </div>
  );
}
