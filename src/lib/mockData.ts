// =========================================
// CONSTANTS & HELPERS (no mock data)
// =========================================

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

// Subject thumbnail colors: single cool hue family (blue-violet),
// varied by lightness and slight hue shift. Never warm reds or greens.
export const SUBJECT_COLORS = [
  '#4F46E5',   // primary blue-violet
  '#3B82F6',   // sky blue
  '#6366F1',   // indigo
  '#0EA5E9',   // cyan-blue
  '#7C3AED',   // violet
  '#2563EB',   // royal blue
  '#8B5CF6',   // purple
  '#0284C7',   // deep sky
  '#4338CA',   // dark indigo
  '#06B6D4',   // teal-cyan (cool anchor)
];

/** Pick a deterministic color from a subject's name */
export function subjectColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = ch.charCodeAt(0) + ((hash << 5) - hash);
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

/** Return 1–2 uppercase initials from a subject name */
export function subjectInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
    .format(amount)
    .replace('₫', 'đ');
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

/** Generate a short order ID */
export function generateOrderId(): string {
  return 'ORD-' + Math.floor(Math.random() * 90000 + 10000);
}
