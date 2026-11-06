import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export function PaginationBar({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 12,
}: PaginationBarProps) {
  if (totalPages <= 1) return null;

  // Tính toán khoảng hiển thị (ví dụ: 1 - 12 trên 45)
  const startItem = totalItems ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = totalItems ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

  // Tạo danh sách các số trang hiển thị thông minh (có dấu ...)
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className="pagination-bar-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        padding: '20px 24px',
        marginTop: 28,
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}
    >
      {/* Thông tin số lượng */}
      <div style={{ fontSize: 13.5, color: '#64748b', fontWeight: 600 }}>
        {totalItems ? (
          <>
            Hiển thị <span style={{ color: '#0f172a', fontWeight: 800 }}>{startItem} - {endItem}</span> trên tổng số{' '}
            <span style={{ color: '#2563eb', fontWeight: 800 }}>{totalItems}</span> môn học
          </>
        ) : (
          <>
            Trang <span style={{ color: '#0f172a', fontWeight: 800 }}>{currentPage}</span> / {totalPages}
          </>
        )}
      </div>

      {/* Dãy nút chuyển trang */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        {/* Nút Trước */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Trang trước"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 14px',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            background: currentPage <= 1 ? '#f8fafc' : '#ffffff',
            color: currentPage <= 1 ? '#94a3b8' : '#334155',
            fontSize: 13,
            fontWeight: 700,
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            opacity: currentPage <= 1 ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (currentPage > 1) {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage > 1) {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }
          }}
        >
          <ChevronLeft size={16} />
          <span className="hide-on-mobile-xs">Trước</span>
        </button>

        {/* Các số trang */}
        {pages.map((p, idx) => {
          if (p === '...') {
            return (
              <span
                key={`ellipsis-${idx}`}
                style={{
                  padding: '8px 6px',
                  color: '#94a3b8',
                  fontSize: 14,
                  fontWeight: 700,
                  userSelect: 'none',
                }}
              >
                ...
              </span>
            );
          }

          const pageNum = p as number;
          const isActive = pageNum === currentPage;

          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              aria-label={`Trang ${pageNum}`}
              aria-current={isActive ? 'page' : undefined}
              style={{
                minWidth: 38,
                height: 38,
                padding: '0 8px',
                borderRadius: 11,
                border: isActive ? 'none' : '1px solid #e2e8f0',
                background: isActive
                  ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                  : '#ffffff',
                color: isActive ? '#ffffff' : '#334155',
                fontSize: 13.5,
                fontWeight: isActive ? 800 : 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: isActive ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }
              }}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Nút Sau */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Trang sau"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 14px',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            background: currentPage >= totalPages ? '#f8fafc' : '#ffffff',
            color: currentPage >= totalPages ? '#94a3b8' : '#334155',
            fontSize: 13,
            fontWeight: 700,
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
            opacity: currentPage >= totalPages ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (currentPage < totalPages) {
              e.currentTarget.style.background = '#f1f5f9';
              e.currentTarget.style.borderColor = '#cbd5e1';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage < totalPages) {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }
          }}
        >
          <span className="hide-on-mobile-xs">Sau</span>
          <ChevronRight size={16} />
        </button>
      </div>

      <style>{`
        @media (max-width: 540px) {
          .pagination-bar-container {
            justify-content: center !important;
            padding: 14px !important;
          }
          .hide-on-mobile-xs {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
export default PaginationBar;
