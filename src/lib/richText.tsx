import React from 'react';

// Cú pháp hỗ trợ:
// **in đậm**, __gạch chân__, URL tự động thành link bấm được, xuống dòng giữ nguyên.
const URL_RE = /(https?:\/\/[^\s<>"']+)/g;
const TOKEN_RE = /(\*\*[^*]+\*\*|__[^_]+__|https?:\/\/[^\s<>"']+)/;

export function renderRichText(text: string, linkStyle?: React.CSSProperties): React.ReactNode[] {
  return text.split('\n').flatMap((line, li) => {
    const parts: React.ReactNode[] = line
      .split(new RegExp(`(${TOKEN_RE.source})`))
      .filter(Boolean)
      .map((part, i) => {
        if (/^\*\*[^*]+\*\*$/.test(part)) {
          return <strong key={`${li}-${i}`} style={{ fontWeight: 800, color: 'inherit' }}>{part.slice(2, -2)}</strong>;
        }
        if (/^__[^_]+__$/.test(part)) {
          return <u key={`${li}-${i}`}>{part.slice(2, -2)}</u>;
        }
        if (/^https?:\/\//.test(part)) {
          return (
            <a
              key={`${li}-${i}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'hsl(var(--primary))',
                fontWeight: 700,
                textDecoration: 'underline',
                textUnderlineOffset: 3,
                wordBreak: 'break-all',
                ...linkStyle,
              }}
            >
              {part.replace(/^https?:\/\//, '').length > 42
                ? part.replace(/^https?:\/\//, '').slice(0, 39) + '…'
                : part.replace(/^https?:\/\//, '')}
            </a>
          );
        }
        return <React.Fragment key={`${li}-${i}`}>{part}</React.Fragment>;
      });
    return li === 0 ? parts : [<br key={`br-${li}`} />, ...parts];
  });
}
