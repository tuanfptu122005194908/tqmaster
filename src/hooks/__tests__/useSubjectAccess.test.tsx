import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSubjectAccess } from '../useSubjectAccess';

const mocks = vi.hoisted(() => {
  const channel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() };
  return { load: vi.fn(), channel, createChannel: vi.fn(() => channel), removeChannel: vi.fn().mockResolvedValue('ok') };
});
vi.mock('@/lib/subjectAccess', () => ({ loadSubjectIds: mocks.load }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { channel: mocks.createChannel, removeChannel: mocks.removeChannel } }));

function deferred() {
  let resolve: (ids: string[]) => void;
  const promise = new Promise<string[]>(done => { resolve = done; });
  return { promise, resolve: (ids: string[]) => resolve(ids) };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.load.mockReset().mockResolvedValue([]);
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('useSubjectAccess', () => {
  it('keeps four known grants on refresh failure, then accepts confirmed revocation', async () => {
    const four = ['MAE101', 'CEA201', 'PFP191', 'CSI106'];
    mocks.load.mockResolvedValueOnce(four);
    const { result } = renderHook(() => useSubjectAccess('buyer'));
    await waitFor(() => expect(result.current.ready).toBe(true));
    mocks.load.mockRejectedValueOnce(new Error('offline'));
    await act(async () => { await result.current.refresh(); });
    expect(result.current.ids).toEqual(four);
    expect(result.current.error).toBe('offline');
    expect(result.current.ready).toBe(true);
    await act(async () => { await result.current.refresh(); });
    expect(result.current.ids).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.ready).toBe(true);
  });

  it('keeps initial read failure unknown and recovers on retry', async () => {
    mocks.load.mockRejectedValueOnce(new Error('API error'));
    const { result } = renderHook(() => useSubjectAccess('buyer'));
    await waitFor(() => expect(result.current.error).toBe('API error'));
    expect(result.current.ready).toBe(false);
    await act(async () => { await result.current.refresh(); });
    expect(result.current.ready).toBe(true);
    expect(result.current.ids).toEqual([]);
  });

  it('shares the pending read across overlapping refresh calls', async () => {
    const pending = deferred();
    mocks.load.mockReturnValueOnce(pending.promise);
    const { result } = renderHook(() => useSubjectAccess('buyer'));
    let first: Promise<void>, second: Promise<void>;
    act(() => { first = result.current.refresh(); second = result.current.refresh(); });
    expect(first).toBe(second);
    expect(mocks.load).toHaveBeenCalledTimes(1);
    await act(async () => { pending.resolve(['confirmed']); await first; });
    expect(result.current.ids).toEqual(['confirmed']);
  });

  it('does one follow-up read for an order change while a read is pending', async () => {
    vi.useFakeTimers();
    const pending = deferred();
    mocks.load.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(['new-grant']);
    const { result } = renderHook(() => useSubjectAccess('buyer'));
    const onOrder = mocks.channel.on.mock.calls[0][2] as () => void;
    act(() => { onOrder(); onOrder(); });
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(mocks.load).toHaveBeenCalledTimes(1);
    await act(async () => { pending.resolve([]); });
    expect(mocks.load).toHaveBeenCalledTimes(2);
    expect(result.current.ids).toEqual(['new-grant']);
  });

  it('changes the cache revision only when confirmed grants change', async () => {
    mocks.load.mockResolvedValueOnce(['a', 'b']).mockResolvedValueOnce(['b', 'a']).mockResolvedValueOnce(['b']);
    const { result } = renderHook(() => useSubjectAccess('buyer'));
    await waitFor(() => expect(result.current.ready).toBe(true));
    const revision = result.current.revision;
    await act(async () => { await result.current.refresh(); });
    expect(result.current.revision).toBe(revision);
    await act(async () => { await result.current.refresh(); });
    expect(result.current.revision).toBe(revision + 1);
  });

  it('never exposes grants from the previous account and ignores its pending response', async () => {
    const pending = deferred();
    mocks.load.mockResolvedValueOnce(['account-a']).mockReturnValueOnce(pending.promise).mockResolvedValueOnce(['account-b']);
    const { result, rerender } = renderHook(({ userId }) => useSubjectAccess(userId), { initialProps: { userId: 'a' as string | null } });
    await waitFor(() => expect(result.current.ids).toEqual(['account-a']));
    act(() => { void result.current.refresh(); });
    rerender({ userId: 'b' });
    expect(result.current.ids).toEqual([]);
    expect(result.current.ready).toBe(false);
    await waitFor(() => expect(result.current.ids).toEqual(['account-b']));
    await act(async () => { pending.resolve(['account-a-late']); });
    expect(result.current.ids).toEqual(['account-b']);
    rerender({ userId: null });
    expect(result.current.ids).toEqual([]);
    expect(result.current.ready).toBe(false);
  });

  it('invalidates a pending request on logout', async () => {
    const pending = deferred();
    mocks.load.mockReturnValueOnce(pending.promise);
    const { result, rerender } = renderHook(({ userId }) => useSubjectAccess(userId), { initialProps: { userId: 'a' as string | null } });
    rerender({ userId: null });
    await act(async () => { pending.resolve(['late-access']); });
    expect(result.current.ids).toEqual([]);
    expect(result.current.ready).toBe(false);
  });

  it('refreshes after order events, reconnecting, and periodic checks; cleans up on unmount', async () => {
    vi.useFakeTimers();
    const { unmount } = renderHook(() => useSubjectAccess('buyer'));
    await act(async () => {});
    expect(mocks.channel.on).toHaveBeenCalledWith('postgres_changes', expect.objectContaining({ table: 'orders', filter: 'user_id=eq.buyer' }), expect.any(Function));
    const onOrder = mocks.channel.on.mock.calls[0][2] as () => void;
    act(() => { onOrder(); window.dispatchEvent(new Event('online')); });
    await act(async () => { vi.advanceTimersByTime(300); });
    expect(mocks.load).toHaveBeenCalledTimes(2);
    await act(async () => { vi.advanceTimersByTime(60_000); });
    expect(mocks.load).toHaveBeenCalledTimes(3);
    unmount();
    expect(mocks.removeChannel).toHaveBeenCalledWith(mocks.channel);
    await act(async () => { vi.advanceTimersByTime(120_000); });
    expect(mocks.load).toHaveBeenCalledTimes(3);
  });
});
