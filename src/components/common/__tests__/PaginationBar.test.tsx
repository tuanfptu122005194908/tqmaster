import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PaginationBar } from '../PaginationBar';

describe('PaginationBar', () => {
  it('renders nothing if totalPages <= 1', () => {
    const { container } = render(
      <PaginationBar currentPage={1} totalPages={1} onPageChange={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correct page numbers and info', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationBar
        currentPage={1}
        totalPages={4}
        onPageChange={onPageChange}
        totalItems={45}
        itemsPerPage={12}
      />
    );

    expect(screen.getByText(/Hiển thị/i)).toBeInTheDocument();
    expect(screen.getByText('1 - 12')).toBeInTheDocument();
    expect(screen.getByText('45')).toBeInTheDocument();

    // Check page buttons
    expect(screen.getByRole('button', { name: 'Trang 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang 2' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang 3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trang 4' })).toBeInTheDocument();
  });

  it('triggers onPageChange when clicking a page number or Next', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationBar
        currentPage={1}
        totalPages={4}
        onPageChange={onPageChange}
        totalItems={45}
        itemsPerPage={12}
      />
    );

    // Prev should be disabled on page 1
    const prevBtn = screen.getByRole('button', { name: 'Trang trước' });
    expect(prevBtn).toBeDisabled();

    // Click Next
    const nextBtn = screen.getByRole('button', { name: 'Trang sau' });
    expect(nextBtn).not.toBeDisabled();
    fireEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);

    // Click Page 3
    fireEvent.click(screen.getByRole('button', { name: 'Trang 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});

