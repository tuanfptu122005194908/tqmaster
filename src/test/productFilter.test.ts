import { describe, it, expect } from 'vitest';
import {
  removeVietnameseTones,
  extractSubjectCode,
  getMajorFromSubjectName,
  filterAndSortSubjects,
  INITIAL_FILTER_STATE,
  type FilterState,
  type Subject,
} from '@/lib/subjectClassification';

const mockSubjects: Subject[] = [
  {
    id: 'subj-1',
    name: 'PRF192 - Programming Fundamentals (C)',
    description: 'Nhập môn lập trình C căn bản, con trỏ và mảng.',
    semester: 1,
    price: 79000,
    thumbnail_url: null,
    is_active: true,
    sort_order: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    created_by: null,
  },
  {
    id: 'subj-2',
    name: 'MAE101 - Mathematics for Engineering',
    description: 'Giải tích toán học và ma trận.',
    semester: 1,
    price: 0, // Free
    thumbnail_url: null,
    is_active: true,
    sort_order: 2,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    created_by: null,
  },
  {
    id: 'subj-3',
    name: 'PRO192 - Object-Oriented Programming (Java)',
    description: 'Bốn trụ cột OOP, Java Collections API.',
    semester: 2,
    price: 89000,
    thumbnail_url: null,
    is_active: true,
    sort_order: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    created_by: null,
  },
  {
    id: 'subj-4',
    name: 'CSD201 - Data Structures and Algorithms',
    description: 'Cấu trúc dữ liệu và giải thuật trong Java.',
    semester: 3,
    price: 99000,
    thumbnail_url: null,
    is_active: true,
    sort_order: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    created_by: null,
  },
  {
    id: 'subj-5',
    name: 'JPD113 - Japanese Elementary 1-A',
    description: 'Tiếng Nhật sơ cấp 1-A chuẩn giáo trình Minna no Nihongo.',
    semester: 3,
    price: 79000,
    thumbnail_url: null,
    is_active: true,
    sort_order: 2,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    created_by: null,
  },
  {
    id: 'subj-6',
    name: 'DBI202 - Database Systems',
    description: 'Hệ cơ sở dữ liệu quan hệ SQL Server.',
    semester: 3,
    price: 0, // Free
    thumbnail_url: null,
    is_active: true,
    sort_order: 3,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    created_by: null,
  },
  {
    id: 'subj-7',
    name: 'AIL302m - Artificial Intelligence',
    description: 'Trí tuệ nhân tạo và tìm kiếm heuristics.',
    semester: 5,
    price: 120000,
    thumbnail_url: null,
    is_active: true,
    sort_order: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    created_by: null,
  },
];

describe('Subject Classification & Filter Logic', () => {
  it('removeVietnameseTones should normalize accented characters', () => {
    expect(removeVietnameseTones('Tiếng Nhật sơ cấp')).toBe('tieng nhat so cap');
    expect(removeVietnameseTones('Cấu Trúc Dữ Liệu')).toBe('cau truc du lieu');
    expect(removeVietnameseTones('Đại số tuyến tính')).toBe('dai so tuyen tinh');
  });

  it('extractSubjectCode should extract course codes properly', () => {
    expect(extractSubjectCode('PRF192 - Programming Fundamentals')).toBe('PRF192');
    expect(extractSubjectCode('JPD113 - Japanese Elementary')).toBe('JPD113');
    expect(extractSubjectCode('AIL302m - Artificial Intelligence')).toBe('AIL302M');
    expect(extractSubjectCode('SWE201c - Software Engineering')).toBe('SWE201C');
  });

  it('getMajorFromSubjectName should classify subjects into correct categories', () => {
    expect(getMajorFromSubjectName('PRF192 - Programming Fundamentals')).toBe('se');
    expect(getMajorFromSubjectName('PRO192 - OOP Java')).toBe('se');
    expect(getMajorFromSubjectName('CSD201 - Data Structures')).toBe('se');
    expect(getMajorFromSubjectName('JPD113 - Japanese Elementary')).toBe('lang');
    expect(getMajorFromSubjectName('AIL302m - Artificial Intelligence')).toBe('ai');
    expect(getMajorFromSubjectName('DBI202 - Database Systems')).toBe('data');
    expect(getMajorFromSubjectName('MAE101 - Mathematics for Engineering')).toBe('math_gen');
  });

  it('filterAndSortSubjects should filter by semester', () => {
    const filter: FilterState = { ...INITIAL_FILTER_STATE, semester: 3 };
    const res = filterAndSortSubjects(mockSubjects, filter, () => false, () => false);
    expect(res).toHaveLength(3);
    expect(res.map(s => s.id)).toEqual(['subj-4', 'subj-5', 'subj-6']);
  });

  it('filterAndSortSubjects should filter by search keyword (accent-tolerant)', () => {
    const filter: FilterState = { ...INITIAL_FILTER_STATE, search: 'tieng nhat' };
    const res = filterAndSortSubjects(mockSubjects, filter, () => false, () => false);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('subj-5');
  });

  it('filterAndSortSubjects should filter by course code in search', () => {
    const filter: FilterState = { ...INITIAL_FILTER_STATE, search: 'csd201' };
    const res = filterAndSortSubjects(mockSubjects, filter, () => false, () => false);
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('subj-4');
  });

  it('filterAndSortSubjects should filter by major', () => {
    const filter: FilterState = { ...INITIAL_FILTER_STATE, major: 'lang' };
    const res = filterAndSortSubjects(mockSubjects, filter, () => false, () => false);
    expect(res).toHaveLength(1);
    expect(res[0].name).toContain('JPD113');
  });

  it('filterAndSortSubjects should filter by price (free, under_80k, over_80k)', () => {
    const freeFilter: FilterState = { ...INITIAL_FILTER_STATE, price: 'free' };
    const freeRes = filterAndSortSubjects(mockSubjects, freeFilter, () => false, () => false);
    expect(freeRes).toHaveLength(2); // MAE101 (0đ), DBI202 (0đ)

    const over80kFilter: FilterState = { ...INITIAL_FILTER_STATE, price: 'over_80k' };
    const over80kRes = filterAndSortSubjects(mockSubjects, over80kFilter, () => false, () => false);
    expect(over80kRes).toHaveLength(3); // PRO192 (89k), CSD201 (99k), AIL302m (120k)
  });

  it('filterAndSortSubjects should filter by ownership status', () => {
    const purchasedIds = new Set(['subj-1', 'subj-5']);
    const isPurchased = (id: string) => purchasedIds.has(id);
    const inCartIds = new Set(['subj-4']);
    const isInCart = (id: string) => inCartIds.has(id);

    // Filter owned
    const ownedFilter: FilterState = { ...INITIAL_FILTER_STATE, ownership: 'owned' };
    const ownedRes = filterAndSortSubjects(mockSubjects, ownedFilter, isPurchased, isInCart);
    expect(ownedRes.map(s => s.id)).toEqual(['subj-1', 'subj-5']);

    // Filter unowned
    const unownedFilter: FilterState = { ...INITIAL_FILTER_STATE, ownership: 'unowned' };
    const unownedRes = filterAndSortSubjects(mockSubjects, unownedFilter, isPurchased, isInCart);
    expect(unownedRes).toHaveLength(5);
    expect(unownedRes.some(s => s.id === 'subj-1')).toBe(false);

    // Filter in_cart
    const cartFilter: FilterState = { ...INITIAL_FILTER_STATE, ownership: 'in_cart' };
    const cartRes = filterAndSortSubjects(mockSubjects, cartFilter, isPurchased, isInCart);
    expect(cartRes.map(s => s.id)).toEqual(['subj-4']);
  });

  it('filterAndSortSubjects should sort properly', () => {
    // Price ascending
    const ascFilter: FilterState = { ...INITIAL_FILTER_STATE, sortBy: 'price_asc' };
    const ascRes = filterAndSortSubjects(mockSubjects, ascFilter, () => false, () => false);
    expect(Number(ascRes[0].price)).toBe(0);
    expect(Number(ascRes[ascRes.length - 1].price)).toBe(120000);

    // Price descending
    const descFilter: FilterState = { ...INITIAL_FILTER_STATE, sortBy: 'price_desc' };
    const descRes = filterAndSortSubjects(mockSubjects, descFilter, () => false, () => false);
    expect(Number(descRes[0].price)).toBe(120000);
    expect(Number(descRes[descRes.length - 1].price)).toBe(0);

    // Name ascending
    const nameFilter: FilterState = { ...INITIAL_FILTER_STATE, sortBy: 'name_asc' };
    const nameRes = filterAndSortSubjects(mockSubjects, nameFilter, () => false, () => false);
    expect(nameRes[0].name.startsWith('AIL302m')).toBe(true);
  });

  it('filterAndSortSubjects should handle composite multiple filters (Semester 3 + Unowned + Major SE)', () => {
    const purchasedIds = new Set(['subj-4']); // User owns CSD201
    const isPurchased = (id: string) => purchasedIds.has(id);

    const compositeFilter: FilterState = {
      ...INITIAL_FILTER_STATE,
      semester: 3,
      ownership: 'unowned',
    };

    const res = filterAndSortSubjects(mockSubjects, compositeFilter, isPurchased, () => false);
    // Semester 3 has subj-4 (owned), subj-5 (JPD113), subj-6 (DBI202)
    // Unowned should return subj-5 and subj-6
    expect(res.map(s => s.id)).toEqual(['subj-5', 'subj-6']);
  });
});
