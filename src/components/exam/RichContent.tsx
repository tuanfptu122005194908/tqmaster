/**
 * RichContent.tsx
 * A component that renders text containing LaTeX math formulas and images.
 * - Inline math: $...$ or \(...\)
 * - Block/display math: $$...$$ or \[...\]
 * - Plain text rendered as-is (preserves newlines)
 * - Graceful fallback if KaTeX fails (shows raw text in <code>)
 *
 * KaTeX is lazy-imported to avoid increasing initial bundle size.
 */

import React, { useEffect, useState, useRef } from 'react';

interface RichContentProps {
  content: string;
  className?: string;
  /** If true, block math is centered (default true) */
  displayMode?: boolean;
}

type Segment =
  | { kind: 'text';   value: string }
  | { kind: 'inline'; latex: string }
  | { kind: 'block';  latex: string };

/** Split content string into text / inline-math / block-math segments */
function parseSegments(content: string): Segment[] {
  const segments: Segment[] = [];
  // Matches $$...$$ (block), $...$ (inline), \[...\] (block), \(...\) (inline)
  // Order matters: match $$ before $
  const re = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^$\n]+?\$|\\\([^)]+?\\\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index);
    if (before) segments.push({ kind: 'text', value: before });

    const raw = match[1];
    if (raw.startsWith('$$') || raw.startsWith('\\[')) {
      const latex = raw.startsWith('$$')
        ? raw.slice(2, -2)
        : raw.slice(2, -2); // \[...\]
      segments.push({ kind: 'block', latex: latex.trim() });
    } else {
      const latex = raw.startsWith('$')
        ? raw.slice(1, -1)
        : raw.slice(2, -2); // \(...\)
      segments.push({ kind: 'inline', latex: latex.trim() });
    }
    lastIndex = match.index + raw.length;
  }

  const tail = content.slice(lastIndex);
  if (tail) segments.push({ kind: 'text', value: tail });
  return segments;
}

let katexCache: typeof import('katex') | null = null;

async function getKatex() {
  if (katexCache) return katexCache;
  katexCache = await import('katex');
  return katexCache;
}

function renderLatex(latex: string, displayMode: boolean, katex: typeof import('katex')): string {
  try {
    return katex.default.renderToString(latex, {
      throwOnError: false,
      displayMode,
      output: 'html',
    });
  } catch {
    return `<code>${latex}</code>`;
  }
}

export const RichContent: React.FC<RichContentProps> = ({
  content,
  className,
  displayMode = true,
}) => {
  const [rendered, setRendered] = useState<React.ReactNode[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!content) { setRendered([]); return; }

    const segments = parseSegments(content);
    const hasLatex = segments.some(s => s.kind !== 'text');

    if (!hasLatex) {
      // No math — render plain text with newline support, no KaTeX needed
      setRendered(
        content.split('\n').flatMap((line, i, arr) =>
          i < arr.length - 1
            ? [<React.Fragment key={i}>{line}<br /></React.Fragment>]
            : [<React.Fragment key={i}>{line}</React.Fragment>]
        )
      );
      return;
    }

    // Has math — load KaTeX lazily
    getKatex().then(katex => {
      if (!mountedRef.current) return;
      const nodes: React.ReactNode[] = segments.map((seg, i) => {
        if (seg.kind === 'text') {
          return (
            <React.Fragment key={i}>
              {seg.value.split('\n').flatMap((line, li, arr) =>
                li < arr.length - 1
                  ? [<React.Fragment key={li}>{line}<br /></React.Fragment>]
                  : [<React.Fragment key={li}>{line}</React.Fragment>]
              )}
            </React.Fragment>
          );
        }
        const isBlock = seg.kind === 'block';
        const html = renderLatex(seg.latex, isBlock, katex);
        return (
          <span
            key={i}
            style={isBlock ? { display: 'block', textAlign: 'center', margin: '8px 0' } : undefined}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      });
      setRendered(nodes);
    });
  }, [content]);

  if (!content) return null;

  return (
    <span className={className} style={{ lineHeight: 1.7 }}>
      {rendered.length > 0 ? rendered : content}
    </span>
  );
};

export default RichContent;
