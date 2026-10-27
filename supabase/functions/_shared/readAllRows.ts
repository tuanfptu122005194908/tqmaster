type KeyValue = string | number;
type Row = Record<string, unknown>;
type PageResult = { data: Row[] | null; error: { message: string } | null };

/** Quoted PostgREST values also cover text primary keys containing punctuation. */
function literal(value: KeyValue): string {
  return typeof value === 'number' ? String(value) : '"' + value.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}
export function cursorFilter(keys: string[], cursor: Row): string {
  return keys.map((key, index) => {
    const parts = keys.slice(0, index).map(k => `${k}.eq.${literal(cursor[k] as KeyValue)}`);
    parts.push(`${key}.gt.${literal(cursor[key] as KeyValue)}`);
    return parts.length === 1 ? parts[0] : `and(${parts.join(',')})`;
  }).join(',');
}

/** Stop only on an empty page: a short response can be the server's row cap. */
export async function readAllRows(
  keys: string[], loadPage: (cursor: Row | null, size: number) => PromiseLike<PageResult>,
  onPage?: (loaded: number) => void,
): Promise<Row[]> {
  if (!keys.length || keys.some(k => !/^[a-z_][a-z_0-9]*$/i.test(k))) throw new Error('Invalid cursor columns');
  const rows: Row[] = [];
  let cursor: Row | null = null;
  let size = 500;
  const seen = new Set<string>();
  for (;;) {
    const { data, error } = await loadPage(cursor, size);
    if (error) {
      if (size > 100 && /timeout|57014|canceling statement/i.test(error.message)) {
        size = Math.max(100, Math.floor(size / 2));
        continue;
      }
      throw new Error(error.message);
    }
    if (!data) throw new Error('Không nhận được dữ liệu từ máy chủ.');
    if (!data.length) return rows;
    for (const row of data) {
      if (keys.some(k => typeof row[k] !== 'string' && typeof row[k] !== 'number')) throw new Error('Missing cursor key');
      const identity = JSON.stringify(keys.map(k => row[k]));
      if (seen.has(identity)) throw new Error('Dữ liệu phân trang bị trùng. Vui lòng thử lại.');
      seen.add(identity);
      rows.push(row);
    }
    cursor = data[data.length - 1];
    onPage?.(rows.length);
  }
}
