const HOUR = 3_600_000;
const DAY = 24 * HOUR;
// Vietnam uses UTC+07 year-round. Use UTC accessors so the browser's zone cannot shift a filter.
export function adminDateWindow(filter: 'all' | 'today' | '7days' | '30days' | 'this_month', now = new Date()) {
  if (filter === 'all') return null;
  const local = new Date(now.getTime() + 7 * HOUR);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - 7 * HOUR;
  const start = filter === 'this_month'
    ? Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1) - 7 * HOUR
    : midnight - (filter === '7days' ? 6 : filter === '30days' ? 29 : 0) * DAY;
  const end = filter === 'this_month'
    ? Date.UTC(local.getUTCFullYear(), local.getUTCMonth() + 1, 1) - 7 * HOUR
    : midnight + DAY;
  return { start: new Date(start).toISOString(), end: new Date(end).toISOString() };
}
