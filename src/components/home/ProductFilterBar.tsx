import React, { useState } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  Grid,
  List,
  RotateCcw,
  Sparkles,
  BookOpen,
  ChevronDown,
  Check,
  Tag,
  DollarSign,
  Layers,
} from 'lucide-react';
import {
  type FilterState,
  type MajorCategory,
  type OwnershipFilter,
  type PriceFilter,
  type SortOption,
  MAJOR_OPTIONS,
  SORT_OPTIONS,
  OWNERSHIP_OPTIONS,
  PRICE_OPTIONS,
  SEMESTER_HIGHLIGHTS,
} from '@/lib/subjectClassification';

interface ProductFilterBarProps {
  filterState: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  semesterCounts: Record<number | 'all', number>;
  isMyCourses?: boolean;
}

export default function ProductFilterBar({
  filterState,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  semesterCounts,
  isMyCourses = false,
}: ProductFilterBarProps) {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Kiểm tra có đang áp dụng bộ lọc nào khác mặc định không
  const hasActiveFilters = Boolean(
    filterState.search.trim() ||
    filterState.semester !== 'all' ||
    filterState.major !== 'all' ||
    filterState.ownership !== 'all' ||
    filterState.price !== 'all' ||
    filterState.sortBy !== 'semester_asc'
  );

  const activeFilterChipsCount = [
    Boolean(filterState.search.trim()),
    filterState.semester !== 'all',
    filterState.major !== 'all',
    filterState.ownership !== 'all',
    filterState.price !== 'all',
  ].filter(Boolean).length;

  const currentMajorLabel = MAJOR_OPTIONS.find((m) => m.id === filterState.major)?.shortLabel || 'Chuyên ngành';
  const currentPriceLabel = PRICE_OPTIONS.find((p) => p.id === filterState.price)?.label || 'Mức giá';
  const currentOwnershipLabel = OWNERSHIP_OPTIONS.find((o) => o.id === filterState.ownership)?.label || 'Trạng thái';

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 22,
        padding: '20px 22px',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.04)',
        marginBottom: 24,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════
          HÀNG 1: Ô TÌM KIẾM TRỰC TIẾP & BỘ LỌC NHANH
          ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 16,
        }}
      >
        {/* Search input with integrated clear [X] */}
        <div
          style={{
            position: 'relative',
            flex: '1 1 280px',
            maxWidth: '100%',
          }}
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94a3b8',
              pointerEvents: 'none',
            }}
          />
          <input
            type="text"
            value={filterState.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Tìm theo mã môn (PRF192, PRN211...) hoặc tên môn học..."
            style={{
              width: '100%',
              padding: '10.5px 38px 10.5px 42px',
              borderRadius: 14,
              border: '1.5px solid #e2e8f0',
              background: '#f8fafc',
              fontSize: 13.5,
              fontWeight: 600,
              color: '#0f172a',
              outline: 'none',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.12)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
          {filterState.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: '' })}
              title="Xóa từ khóa tìm kiếm"
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#cbd5e1',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#ffffff',
                padding: 0,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#94a3b8')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#cbd5e1')}
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Desktop Controls: Major, Ownership, Price, Sort & View Mode */}
        <div
          className="desktop-filter-controls"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          {/* Select Chuyên ngành */}
          <div style={{ position: 'relative' }}>
            <select
              value={filterState.major}
              onChange={(e) => onFilterChange({ major: e.target.value as MajorCategory })}
              style={{
                padding: '9px 32px 9px 14px',
                borderRadius: 12,
                border: filterState.major !== 'all' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                background: filterState.major !== 'all' ? '#eff6ff' : '#ffffff',
                color: filterState.major !== 'all' ? '#1d4ed8' : '#334155',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                appearance: 'none',
                outline: 'none',
                boxShadow: filterState.major !== 'all' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
              }}
            >
              {MAJOR_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: filterState.major !== 'all' ? '#2563eb' : '#64748b',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Select Trạng thái sở hữu (nếu không ở /my-courses) */}
          {!isMyCourses && (
            <div style={{ position: 'relative' }}>
              <select
                value={filterState.ownership}
                onChange={(e) => onFilterChange({ ownership: e.target.value as OwnershipFilter })}
                style={{
                  padding: '9px 32px 9px 14px',
                  borderRadius: 12,
                  border: filterState.ownership !== 'all' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  background: filterState.ownership !== 'all' ? '#eff6ff' : '#ffffff',
                  color: filterState.ownership !== 'all' ? '#1d4ed8' : '#334155',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                  boxShadow: filterState.ownership !== 'all' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
                }}
              >
                {OWNERSHIP_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: filterState.ownership !== 'all' ? '#2563eb' : '#64748b',
                  pointerEvents: 'none',
                }}
              />
            </div>
          )}

          {/* Select Mức giá */}
          {!isMyCourses && (
            <div style={{ position: 'relative' }}>
              <select
                value={filterState.price}
                onChange={(e) => onFilterChange({ price: e.target.value as PriceFilter })}
                style={{
                  padding: '9px 32px 9px 14px',
                  borderRadius: 12,
                  border: filterState.price !== 'all' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                  background: filterState.price !== 'all' ? '#eff6ff' : '#ffffff',
                  color: filterState.price !== 'all' ? '#1d4ed8' : '#334155',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  appearance: 'none',
                  outline: 'none',
                  boxShadow: filterState.price !== 'all' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
                }}
              >
                {PRICE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: filterState.price !== 'all' ? '#2563eb' : '#64748b',
                  pointerEvents: 'none',
                }}
              />
            </div>
          )}

          {/* Select Sắp xếp (Sort By) */}
          <div style={{ position: 'relative' }}>
            <select
              value={filterState.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
              style={{
                padding: '9px 32px 9px 14px',
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#1e293b',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                appearance: 'none',
                outline: 'none',
              }}
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* View Mode Switcher: Grid (Lưới) vs List (Danh sách) */}
          <div
            style={{
              display: 'inline-flex',
              padding: 3,
              borderRadius: 12,
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
            }}
          >
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'grid' })}
              title="Chế độ xem lưới"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 10px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                background: filterState.viewMode === 'grid' ? '#ffffff' : 'transparent',
                color: filterState.viewMode === 'grid' ? '#2563eb' : '#64748b',
                boxShadow: filterState.viewMode === 'grid' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Grid size={16} />
            </button>
            <button
              type="button"
              onClick={() => onFilterChange({ viewMode: 'list' })}
              title="Chế độ xem danh sách gọn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px 10px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                background: filterState.viewMode === 'list' ? '#ffffff' : 'transparent',
                color: filterState.viewMode === 'list' ? '#2563eb' : '#64748b',
                boxShadow: filterState.viewMode === 'list' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Mobile Filter Toggle Button */}
        <div className="mobile-filter-btn" style={{ display: 'none' }}>
          <button
            type="button"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: 12,
              border: activeFilterChipsCount > 0 ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
              background: activeFilterChipsCount > 0 ? '#eff6ff' : '#ffffff',
              color: activeFilterChipsCount > 0 ? '#1d4ed8' : '#334155',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={15} />
            <span>Bộ lọc</span>
            {activeFilterChipsCount > 0 && (
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {activeFilterChipsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          HÀNG 2: DÃY NÚT HỌC KỲ (SEMESTER PILLS 1 - 9) KÈM BỘ ĐẾM MÔN
          ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 6,
          scrollbarWidth: 'none',
        }}
      >
        {/* Nút Tất cả môn */}
        <SemesterPill
          active={filterState.semester === 'all'}
          label="Tất cả môn"
          count={semesterCounts['all'] ?? totalCount}
          onClick={() => onFilterChange({ semester: 'all' })}
        />

        {/* Nút Kỳ 1 -> Kỳ 9 */}
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((sem) => (
          <SemesterPill
            key={sem}
            active={filterState.semester === sem}
            label={`Học kỳ ${sem}`}
            count={semesterCounts[sem] ?? 0}
            onClick={() => onFilterChange({ semester: sem })}
          />
        ))}
      </div>

      {/* Tóm tắt ngữ cảnh kỳ học khi chọn 1 kỳ cụ thể */}
      {filterState.semester !== 'all' && SEMESTER_HIGHLIGHTS[filterState.semester] && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 14,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontSize: 12.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Sparkles size={16} color="#15803d" style={{ flexShrink: 0 }} />
          <span>{SEMESTER_HIGHLIGHTS[filterState.semester]}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          HÀNG 3: THANH THẺ CHIP ĐANG LỌC & NÚT XÓA TOÀN BỘ BỘ LỌC
          ══════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          marginTop: 14,
          paddingTop: 12,
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        {/* Bộ đếm và chips đang bật */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            Hiển thị <span style={{ color: '#2563eb', fontWeight: 900 }}>{filteredCount}</span> /{' '}
            <span style={{ color: '#0f172a', fontWeight: 800 }}>{totalCount}</span> môn học
          </div>

          {/* Chip: Từ khóa tìm kiếm */}
          {filterState.search.trim() && (
            <FilterChip
              label={`Từ khóa: "${filterState.search.trim()}"`}
              onRemove={() => onFilterChange({ search: '' })}
            />
          )}

          {/* Chip: Kỳ học */}
          {filterState.semester !== 'all' && (
            <FilterChip
              label={`Học kỳ ${filterState.semester}`}
              onRemove={() => onFilterChange({ semester: 'all' })}
            />
          )}

          {/* Chip: Chuyên ngành */}
          {filterState.major !== 'all' && (
            <FilterChip
              label={`Ngành: ${currentMajorLabel}`}
              onRemove={() => onFilterChange({ major: 'all' })}
            />
          )}

          {/* Chip: Trạng thái sở hữu */}
          {filterState.ownership !== 'all' && (
            <FilterChip
              label={currentOwnershipLabel}
              onRemove={() => onFilterChange({ ownership: 'all' })}
            />
          )}

          {/* Chip: Mức giá */}
          {filterState.price !== 'all' && (
            <FilterChip
              label={currentPriceLabel}
              onRemove={() => onFilterChange({ price: 'all' })}
            />
          )}
        </div>

        {/* Nút Đặt lại tất cả bộ lọc */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              border: '1px solid #fecaca',
              background: '#fff1f2',
              color: '#e11d48',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ffe4e6';
              e.currentTarget.style.borderColor = '#fda4af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fff1f2';
              e.currentTarget.style.borderColor = '#fecaca';
            }}
          >
            <RotateCcw size={12} strokeWidth={2.5} />
            <span>Đặt lại bộ lọc</span>
          </button>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .desktop-filter-controls {
            display: none !important;
          }
          .mobile-filter-btn {
            display: block !important;
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ─── Semester Pill Component ───────────────────────────────────── */
function SemesterPill({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 15px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 800,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        background: active
          ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
          : hovered
          ? '#f8fafc'
          : '#ffffff',
        color: active ? '#ffffff' : hovered ? '#1d4ed8' : '#475569',
        border: active ? 'none' : '1px solid #cbd5e1',
        boxShadow: active ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
        transform: hovered && !active ? 'translateY(-1px)' : 'none',
        transition: 'all 0.18s ease',
      }}
    >
      <span>{label}</span>
      {count > 0 && (
        <span
          style={{
            padding: '1px 6px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 800,
            background: active ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
            color: active ? '#ffffff' : '#64748b',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ─── Active Filter Chip Component ──────────────────────────────── */
function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 8,
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        color: '#1d4ed8',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        title="Gỡ bộ lọc này"
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: 0,
          color: '#1d4ed8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <X size={12} strokeWidth={2.5} />
      </button>
    </span>
  );
}
