import { describe, expect, it } from 'vitest';
import { fetchAllById } from '../fetchAllById';

describe('fetchAllById', () => {
  it('reads beyond 1,000 rows even when the server returns short pages', async () => {
    const rows = Array.from({ length: 1234 }, (_, id) => ({ id: String(id).padStart(5, '0') }));
    const loaded = await fetchAllById(async afterId => ({
      data: rows.filter(row => afterId === null || row.id > afterId).slice(0, 37),
      error: null,
    }));
    expect(loaded).toEqual(rows);
  });

  it('rejects a failed later page instead of returning partial success', async () => {
    await expect(fetchAllById(async afterId => afterId === null
      ? { data: [{ id: 'a' }], error: null }
      : { data: null, error: { message: 'timeout' } },
    )).rejects.toThrow('timeout');
  });

  it('accepts a confirmed empty result', async () => {
    expect(await fetchAllById(async () => ({ data: [], error: null }))).toEqual([]);
  });

  it('rejects a missing response and non-progressing pages', async () => {
    await expect(fetchAllById(async () => ({ data: null, error: null }))).rejects.toThrow();
    await expect(fetchAllById(async () => ({ data: [{ id: 'a' }], error: null }))).rejects.toThrow('phân trang');
  });
});
