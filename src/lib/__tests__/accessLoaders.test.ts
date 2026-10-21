import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSubjectIds } from '../subjectAccess';
import { loadAdminUsers } from '../adminUsers';

const api = vi.hoisted(() => ({ from: vi.fn(), getUser: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: api.from, auth: { getUser: api.getUser } } }));

type Row = { id: string; [key: string]: unknown };
type Result = { data: Row[] | null; error: { message: string } | null };

function mockTables(tables: Record<string, Row[]>, failTable?: string, failLater = false) {
  api.from.mockImplementation((table: string) => {
    let afterId: string | null = null;
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      gt(column: string, value: string) { afterId = value; return this; },
      then(resolve: (value: Result) => void) {
        const failed = table === failTable && (!failLater || afterId !== null);
        const data = (tables[table] ?? []).filter(row => afterId === null || row.id > afterId).slice(0, 200);
        return Promise.resolve(failed ? { data: null, error: { message: 'API unavailable' } } : { data, error: null }).then(resolve);
      },
    };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  api.getUser.mockResolvedValue({ data: { user: { id: 'buyer' } }, error: null });
});

describe('loadSubjectIds', () => {
  it('does not interpret an auth verification failure as zero subjects', async () => {
    api.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'auth offline' } });
    await expect(loadSubjectIds('buyer')).rejects.toThrow('auth offline');
    expect(api.from).not.toHaveBeenCalled();
  });

  it('rejects a missing or different authenticated account', async () => {
    await expect(loadSubjectIds('another-account')).rejects.toThrow('phiên đăng nhập');
    api.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(loadSubjectIds('buyer')).rejects.toThrow('phiên đăng nhập');
  });

  it('rejects grant query errors and accepts a genuinely empty grant list', async () => {
    mockTables({}, 'user_subjects');
    await expect(loadSubjectIds('buyer')).rejects.toThrow('API unavailable');
    mockTables({});
    await expect(loadSubjectIds('buyer')).resolves.toEqual([]);
    const query = api.from.mock.results.at(-1)?.value;
    expect(query.eq).toHaveBeenCalledWith('user_id', 'buyer');
    expect(query.order).toHaveBeenCalledWith('id', { ascending: true });
  });
});

describe('loadAdminUsers', () => {
  function tables() {
    return {
      profiles: [{ id: 'buyer', email: 'buyer@example.test', created_at: '2026-10-14', full_name: 'Buyer' }],
      user_roles: [{ id: 'role', user_id: 'buyer', role: 'user' }],
      subjects: [{ id: 'MAE101', name: 'MAE101', semester: 1 }],
      user_subjects: Array.from({ length: 1104 }, (_, index) => ({
        id: String(index).padStart(5, '0'),
        user_id: index < 1100 ? 'another-user' : 'buyer',
        subject_id: ['MAE101', 'CEA201', 'PFP191', 'CSI106'][index % 4],
      })),
    };
  }

  it('reports all four grants for a buyer beyond the first 1,000 grants', async () => {
    mockTables(tables());
    const result = await loadAdminUsers();
    expect(result.rows[0].subjectIds).toEqual(['MAE101', 'CEA201', 'PFP191', 'CSI106']);
    expect(result.rows[0].roles).toEqual(['user']);
  });

  it.each(['profiles', 'user_roles', 'subjects', 'user_subjects'])('rejects instead of showing zero when %s fails', async table => {
    mockTables(tables(), table);
    await expect(loadAdminUsers()).rejects.toThrow('API unavailable');
  });

  it('does not publish zero grants when a later grant page fails', async () => {
    mockTables(tables(), 'user_subjects', true);
    await expect(loadAdminUsers()).rejects.toThrow('API unavailable');
  });
});
