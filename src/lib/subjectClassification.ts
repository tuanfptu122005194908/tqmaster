import type { Tables } from '@/integrations/supabase/types';

export type Subject = Tables<'subjects'>;

export type MajorCategory =
  | 'all'
  | 'se'       // Kỹ thuật phần mềm (PRF, PRO, CSD, PRJ, PRN, SWP, SWD, SWE...)
  | 'ai'       // Trí tuệ nhân tạo (AIL, DLP, MLN...)
  | 'ia'       // An toàn thông tin / Mạng (IAL, NWC, SEC...)
  | 'data'     // Dữ liệu & Hệ thống (DBI, CSI, MAS...)
  | 'math_gen' // Toán & Khoa học cơ bản (MAE, MAD, PHY...)
  | 'lang'     // Ngoại ngữ (JPD, ENG...)
  | 'business';// Kinh tế & Kỹ năng (MKT, SSG, ECO...)

export type OwnershipFilter = 'all' | 'unowned' | 'owned' | 'in_cart';

export type PriceFilter = 'all' | 'free' | 'under_80k' | 'over_80k';

export type SortOption =
  | 'semester_asc' // Theo lộ trình học kỳ (1 -> 9)
  | 'featured'     // Nổi bật / Bán chạy (HOT)
  | 'price_asc'    // Giá: Thấp đến cao
  | 'price_desc'   // Giá: Cao đến thấp
  | 'name_asc';    // Tên môn: A -> Z

export type ViewMode = 'grid' | 'list';

export interface FilterState {
  search: string;
  semester: number | 'all';
  major: MajorCategory;
  ownership: OwnershipFilter;
  price: PriceFilter;
  sortBy: SortOption;
  viewMode: ViewMode;
}

export const INITIAL_FILTER_STATE: FilterState = {
  search: '',
  semester: 'all',
  major: 'all',
  ownership: 'all',
  price: 'all',
  sortBy: 'semester_asc',
  viewMode: 'grid',
};

export const MAJOR_OPTIONS: { id: MajorCategory; label: string; shortLabel: string }[] = [
  { id: 'all', label: 'Tất cả chuyên ngành', shortLabel: 'Tất cả ngành' },
  { id: 'se', label: 'Kỹ thuật phần mềm (SE)', shortLabel: 'Phần mềm (SE)' },
  { id: 'ai', label: 'Trí tuệ nhân tạo (AI)', shortLabel: 'Trí tuệ NT (AI)' },
  { id: 'ia', label: 'An toàn thông tin & Mạng (IA)', shortLabel: 'An toàn TT (IA)' },
  { id: 'data', label: 'Dữ liệu & Hệ thống (Data)', shortLabel: 'Dữ liệu (Data)' },
  { id: 'math_gen', label: 'Toán & Khoa học đại cương', shortLabel: 'Toán & Cơ bản' },
  { id: 'lang', label: 'Ngoại ngữ (Tiếng Nhật, Anh)', shortLabel: 'Ngoại ngữ' },
  { id: 'business', label: 'Kinh tế & Kỹ năng (Business)', shortLabel: 'Kinh tế & Kỹ năng' },
];

export const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'semester_asc', label: 'Lộ trình học kỳ (Kỳ 1 → 9)' },
  { id: 'featured', label: 'Nổi bật / Bán chạy nhất (HOT)' },
  { id: 'price_asc', label: 'Giá: Thấp đến cao' },
  { id: 'price_desc', label: 'Giá: Cao đến thấp' },
  { id: 'name_asc', label: 'Tên môn: A → Z' },
];

export const OWNERSHIP_OPTIONS: { id: OwnershipFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả môn' },
  { id: 'unowned', label: 'Chưa sở hữu' },
  { id: 'owned', label: 'Đã sở hữu' },
  { id: 'in_cart', label: 'Trong giỏ hàng' },
];

export const PRICE_OPTIONS: { id: PriceFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả mức giá' },
  { id: 'free', label: 'Miễn phí (0đ)' },
  { id: 'under_80k', label: 'Dưới 80.000đ' },
  { id: 'over_80k', label: 'Từ 80.000đ trở lên' },
];

export const SEMESTER_HIGHLIGHTS: Record<number, string> = {
  1: 'Kỳ 1: Nền tảng lập trình C (PRF192), Giải tích toán học (MAE101) & Nhập môn máy tính (CSI104).',
  2: 'Kỳ 2: Lập trình hướng đối tượng Java (PRO192), Toán rời rạc (MAD101) & Hệ điều hành (OSG209).',
  3: 'Kỳ 3: Cấu trúc dữ liệu & Giải thuật (CSD201), Tiếng Nhật (JPD113) & Cơ sở dữ liệu (DBI202).',
  4: 'Kỳ 4: Kỹ thuật phần mềm (SWE201c), Lập trình .NET C# (PRN211) & Xác suất thống kê (MAS291).',
  5: 'Kỳ 5: Lập trình Java Web (PRJ301), Kiến trúc phần mềm (SWD392) & Tiếng Nhật giao tiếp (JPD123).',
  6: 'Kỳ 6: Dự án phần mềm thực chiến (SWP391), Kiểm thử phần mềm (SWT301) & An toàn bảo mật.',
  7: 'Kỳ 7: Thực tập doanh nghiệp (OJT), Học máy & Xây dựng hệ thống phân tán nâng cao.',
  8: 'Kỳ 8: Chuyên đề chuyên sâu tốt nghiệp, Kiến trúc Microservices & Quản trị dự án công nghệ.',
  9: 'Kỳ 9: Đồ án tốt nghiệp đại học (Capstone Project) & Thuyết trình sản phẩm thực tế.',
};

/**
 * Loại bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Trích xuất mã môn (ví dụ: PRN211 từ "PRN211 - Basic Cross-Platform Application")
 */
export function extractSubjectCode(name: string): string {
  if (!name) return '';
  const match = name.match(/^[A-Za-z]{2,5}\d{2,4}[a-zA-Z]?/);
  return match ? match[0].toUpperCase() : '';
}

/**
 * Phân loại chuyên ngành dựa vào mã môn và tên môn
 */
export function getMajorFromSubjectName(name: string): MajorCategory {
  if (!name) return 'se';
  const upper = name.toUpperCase().trim();
  const code = extractSubjectCode(upper);

  // 1. Ngoại ngữ
  if (code.startsWith('JPD') || upper.includes('JAPANESE') || upper.includes('TIẾNG NHẬT') || code.startsWith('ENG') || upper.includes('ENGLISH')) {
    return 'lang';
  }

  // 2. Trí tuệ nhân tạo
  if (code.startsWith('AIL') || code.startsWith('DLP') || code.startsWith('MLN') || upper.includes('AI') || upper.includes('MACHINE LEARNING') || upper.includes('DEEP LEARNING')) {
    return 'ai';
  }

  // 3. An toàn thông tin & Mạng
  if (code.startsWith('IAL') || code.startsWith('NWC') || code.startsWith('SEC') || upper.includes('SECURITY') || upper.includes('AN TOÀN') || upper.includes('NETWORK')) {
    return 'ia';
  }

  // 4. Dữ liệu & Hệ thống
  if (code.startsWith('DBI') || code.startsWith('CSI') || upper.includes('DATABASE') || upper.includes('DỮ LIỆU')) {
    return 'data';
  }

  // 5. Toán & Khoa học đại cương
  if (code.startsWith('MAE') || code.startsWith('MAD') || code.startsWith('MAS') || code.startsWith('PHY') || code.startsWith('CHE') || upper.includes('TOÁN') || upper.includes('MATHEMATICS') || upper.includes('VẬT LÝ')) {
    return 'math_gen';
  }

  // 6. Kinh tế & Kỹ năng
  if (code.startsWith('MKT') || code.startsWith('SSG') || code.startsWith('ECO') || code.startsWith('ACC') || upper.includes('MARKETING') || upper.includes('KỸ NĂNG')) {
    return 'business';
  }

  // 7. Mặc định là Kỹ thuật phần mềm (SE) cho PRF, PRO, CSD, PRJ, PRN, SWP, SWD, SWE...
  return 'se';
}

/**
 * Hàm lọc và sắp xếp toàn diện danh sách môn học theo FilterState
 */
export function filterAndSortSubjects(
  subjects: Subject[],
  filterState: FilterState,
  isPurchased: (subjectId: string) => boolean,
  isInCart: (subjectId: string) => boolean,
  isMyCoursesMode = false
): Subject[] {
  const { search, semester, major, ownership, price, sortBy } = filterState;
  const cleanSearch = removeVietnameseTones(search);

  // 1. Lọc điều kiện
  const filtered = subjects.filter((s) => {
    // Chế độ trang /my-courses: chỉ hiện các môn đã sở hữu
    if (isMyCoursesMode && !isPurchased(s.id)) {
      return false;
    }

    // Lọc theo Học kỳ
    if (semester !== 'all' && s.semester !== semester) {
      return false;
    }

    // Lọc theo Chuyên ngành
    if (major !== 'all') {
      const subjectMajor = getMajorFromSubjectName(s.name);
      if (subjectMajor !== major) return false;
    }

    // Lọc theo Trạng thái sở hữu
    if (ownership === 'owned' && !isPurchased(s.id)) return false;
    if (ownership === 'unowned' && isPurchased(s.id)) return false;
    if (ownership === 'in_cart' && !isInCart(s.id)) return false;

    // Lọc theo Mức giá
    const p = Number(s.price || 0);
    if (price === 'free' && p > 0) return false;
    if (price === 'under_80k' && (p <= 0 || p >= 80000)) return false;
    if (price === 'over_80k' && p < 80000) return false;

    // Lọc theo Từ khóa tìm kiếm
    if (cleanSearch) {
      const rawName = s.name.toLowerCase();
      const rawDesc = (s.description || '').toLowerCase();
      const normName = removeVietnameseTones(s.name);
      const normDesc = removeVietnameseTones(s.description || '');

      const match =
        rawName.includes(cleanSearch) ||
        rawDesc.includes(cleanSearch) ||
        normName.includes(cleanSearch) ||
        normDesc.includes(cleanSearch);

      if (!match) return false;
    }

    return true;
  });

  // 2. Sắp xếp kết quả
  const sorted = [...filtered].sort((a, b) => {
    const priceA = Number(a.price || 0);
    const priceB = Number(b.price || 0);

    switch (sortBy) {
      case 'price_asc':
        return priceA - priceB;
      case 'price_desc':
        return priceB - priceA;
      case 'name_asc':
        return a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' });
      case 'featured':
        // Ưu tiên các môn có sort_order nhỏ hơn hoặc giá trị phổ biến
        return (a.sort_order ?? 999) - (b.sort_order ?? 999);
      case 'semester_asc':
      default:
        if (a.semester !== b.semester) {
          return a.semester - b.semester;
        }
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    }
  });

  return sorted;
}
