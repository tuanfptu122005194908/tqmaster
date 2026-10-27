import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAdminRead } from '../useAdminRead';

describe('admin read coordination', () => {
  it('ignores a late response for the previous selection', async () => {
    const { result } = renderHook(() => useAdminRead());
    const apply = vi.fn();
    let resolveOld!: (value: string) => void;
    const old = new Promise<string>(resolve => { resolveOld = resolve; });
    let pending!: Promise<boolean>;
    act(() => { pending = result.current.load('questions', () => old, apply); });
    await act(async () => { await result.current.load('questions', async () => 'new exam', apply); });
    await act(async () => { resolveOld('old exam'); await pending; });
    expect(apply.mock.calls).toEqual([['new exam']]);
  });

  it('preserves successful data on failure and clears only the retried error', async () => {
    const { result } = renderHook(() => useAdminRead());
    const apply = vi.fn();
    await act(async () => { await result.current.load('rows', async () => ['valid'], apply); });
    await act(async () => {
      await result.current.load('rows', async () => { throw new Error('timeout'); }, apply);
      await result.current.load('subjects', async () => { throw new Error('denied'); }, apply);
    });
    expect(apply.mock.calls).toEqual([[['valid']]]);
    expect(result.current.errors).toEqual({rows:'timeout',subjects:'denied'});
    await act(async () => { await result.current.load('rows', async () => [], apply); });
    await waitFor(() => expect(result.current.errors).toEqual({subjects:'denied'}));
  });
});
