import { describe, it, expect } from "vitest";

// Test the parseSegments regex logic directly
function parseSegments(content: string) {
  const segments: { kind: string; value?: string; latex?: string }[] = [];
  const re = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$(?!\s)(?:[^\$\n]|\n(?!\s*\n))+?(?<!\s)\$|\\\([\s\S]+?\\\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(content)) !== null) {
    const before = content.slice(lastIndex, match.index);
    if (before) segments.push({ kind: 'text', value: before });

    const raw = match[1];
    if (raw.startsWith('$$')) {
      segments.push({ kind: 'block', latex: raw.slice(2, -2).trim() });
    } else if (raw.startsWith('\\[')) {
      segments.push({ kind: 'block', latex: raw.slice(2, -2).trim() });
    } else if (raw.startsWith('\\(')) {
      segments.push({ kind: 'inline', latex: raw.slice(2, -2).trim() });
    } else if (raw.startsWith('$')) {
      segments.push({ kind: 'inline', latex: raw.slice(1, -1).trim() });
    }
    lastIndex = match.index + raw.length;
  }

  const tail = content.slice(lastIndex);
  if (tail) segments.push({ kind: 'text', value: tail });

  if (segments.length === 1 && segments[0].kind === 'text') {
    const trimmed = content.trim();
    if (/^\\(frac|sqrt|sum|int|lim|vec|prod|pmatrix|matrix|bmatrix|alpha|beta|gamma|delta|theta|pi|partial|infty|leq|geq|neq|approx|times|div|pm)\b/.test(trimmed)) {
      return [{ kind: 'inline', latex: trimmed }];
    }
  }

  return segments;
}

describe("RichContent LaTeX parser", () => {
  it("parses inline fractions like $\\frac{3}{4}$", () => {
    const segs = parseSegments("$\\frac{3}{4}$");
    expect(segs).toHaveLength(1);
    expect(segs[0]).toEqual({ kind: "inline", latex: "\\frac{3}{4}" });
  });

  it("parses inline fractions with text like Option A: $\\frac{1}{4}$", () => {
    const segs = parseSegments("Option A: $\\frac{1}{4}$");
    expect(segs).toHaveLength(2);
    expect(segs[0]).toEqual({ kind: "text", value: "Option A: " });
    expect(segs[1]).toEqual({ kind: "inline", latex: "\\frac{1}{4}" });
  });

  it("parses formulas with inner parentheses like \\(P(X > 1 \\mid Y = 1)\\)", () => {
    const segs = parseSegments("\\(P(X > 1 \\mid Y = 1)\\)");
    expect(segs).toHaveLength(1);
    expect(segs[0]).toEqual({ kind: "inline", latex: "P(X > 1 \\mid Y = 1)" });
  });

  it("parses bare formulas without dollar signs as fallback", () => {
    const segs = parseSegments("\\frac{1}{2}");
    expect(segs).toHaveLength(1);
    expect(segs[0]).toEqual({ kind: "inline", latex: "\\frac{1}{2}" });
  });

  it("preserves plain text without math", () => {
    const segs = parseSegments("Hanoi is the capital of Vietnam");
    expect(segs).toHaveLength(1);
    expect(segs[0]).toEqual({ kind: "text", value: "Hanoi is the capital of Vietnam" });
  });
});
