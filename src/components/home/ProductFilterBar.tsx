import React from 'react';
import { Grid, List, ArrowUpDown, X, Search } from 'lucide-react';
import {
  type FilterState,
  type SortOption,
  SORT_OPTIONS,
} from '@/lib/subjectClassification';

export interface ProductFilterBarProps {
  filterState: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onResetFilters: () => void;
  totalCount: number;
  filteredCount: number;
  semesterCounts?: Record<number | 'all', number>;
  isMyCourses?: boolean;
}

export default function ProductFilterBar({
  filterState,
  onFilterChange,
  onResetFilters,
  totalCount,
  filteredCount,
  isMyCourses = false,
}: ProductFilterBarProps) {
  const isSearching = Boolean(filterState.search?.trim());

  return (
    <div
      className="product-toolbar-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '12px 20px',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 18,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
        marginBottom: 24,
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Bên trái: Trạng thái tìm kiếm hoặc số lượng môn */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {isSearching ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 12,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <Search size={14} color="#2563eb" />
            <span>
              Kết quả cho: <strong style={{ color: '#0f172a' }}>"{filterState.search}"</strong> ({filteredCount} môn)
            </span>
            <button
              type="button"
              onClick={onResetFilters}
              title="Xóa tìm kiếm để xem tất cả"
              aria-label="Xóa tìm kiếm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#cbd5e1',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: 0,
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#94a3b8')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#cbd5e1')}
            >
              <X size={11} strokeWidth={3} />
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 13.5, color: '#64748b', fontWeight: 600 }}>
            {isMyCourses ? 'Môn học của bạn' : 'Tất cả môn học'}:{' '}
            <span style={{ color: '#2563eb', fontWeight: 800 }}>{filteredCount}</span> môn
          </div>
        )}
      </div>

      {/* Bên phải: Sắp xếp & Chế độ xem Lưới / Danh sách */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Dropdown Sắp xếp gọn */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <select
            value={filterState.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as SortOption })}
            aria-label="Sắp xếp danh sách môn học"
            style={{
              padding: '8px 28px 8px 12px',
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              appearance: 'none',
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#2563eb';
              e.currentTarget.style.background = '#ffffff';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#cbd5e1';
              e.currentTarget.style.background = '#f8fafc';
            }}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <ArrowUpDown
            size={12}
            style={{
              position: 'absolute',
              right: 10,
              color: '#64748b',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Nút chuyển đổi Grid / List View */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            background: '#f1f5f9',
            padding: 3,
            borderRadius: 10,
            border: '1px solid #e2e8f0',
          }}
        >
          <button
            type="button"
            onClick={() => onFilterChange({ viewMode: 'grid' })}
            title="Chế độ xem lưới card"
            aria-label="Xem dạng lưới"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 9px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: filterState.viewMode === 'grid' ? '#ffffff' : 'transparent',
              color: filterState.viewMode === 'grid' ? '#2563eb' : '#64748b',
              boxShadow: filterState.viewMode === 'grid' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Grid size={15} />
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ viewMode: 'list' })}
            title="Chế độ xem danh sách gọn"
            aria-label="Xem dạng danh sách"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6px 9px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background: filterState.viewMode === 'list' ? '#ffffff' : 'transparent',
              color: filterState.viewMode === 'list' ? '#2563eb' : '#64748b',
              boxShadow: filterState.viewMode === 'list' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <List size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
