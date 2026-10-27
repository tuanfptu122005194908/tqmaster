import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider, useApp } from '../AppContext';
import { getStorageAuthGeneration } from '../signedImage';

type Session = { user: { id: string; email: string; email_confirmed_at: string; user_metadata: Record<string, never> } };
type SessionResult = { data: { session: Session | null }; error: null };
const mocks = vi.hoisted(() => ({
  getSession: vi.fn(), onAuth: vi.fn(), from: vi.fn(), profile: vi.fn(),
  access: vi.fn(), refresh: vi.fn().mockResolvedValue(undefined), unsubscribe: vi.fn(),
  channel: { on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() },
}));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { getSession: mocks.getSession, onAuthStateChange: mocks.onAuth },
  from: mocks.from, channel: () => mocks.channel, removeChannel: vi.fn().mockResolvedValue('ok'),
} }));
vi.mock('@/hooks/useSubjectAccess', () => ({ useSubjectAccess: (userId: string | null) => {
  mocks.access(userId);
  return { ids: userId ? [userId] : [], ready: !!userId, loading: false, error: null, refresh: mocks.refresh };
} }));

let emit: (event: string, session: Session | null) => void;
let resolveBootstrap: (result: SessionResult) => void;
function session(id: string): Session {
  return { user: { id, email: `${id}@example.test`, email_confirmed_at: '2026-10-14', user_metadata: {} } };
}
function Consumer() {
  const { profile, purchasedIds, authLoading } = useApp();
  return <output data-testid="auth">{JSON.stringify({ profile: profile?.id ?? null, ids: purchasedIds, loading: authLoading })}</output>;
}
function current() { return JSON.parse(screen.getByTestId('auth').textContent ?? '{}'); }

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.getSession.mockReturnValue(new Promise<SessionResult>(resolve => { resolveBootstrap = resolve; }));
  mocks.onAuth.mockImplementation(callback => {
    emit = callback;
    return { data: { subscription: { unsubscribe: mocks.unsubscribe } } };
  });
  mocks.profile.mockImplementation(async (id: string) => ({ data: { id }, error: null }));
  mocks.from.mockImplementation((table: string) => {
    let userId: string | null = null;
    return {
      select() { return this; },
      eq(column: string, id: string) { if (column === 'id') userId = id; return this; },
      lte() { return this; },
      upsert() { return this; },
      maybeSingle() { return mocks.profile(userId); },
      then(resolve: (value: { data: never[]; error: null; count: number }) => void) {
        return Promise.resolve({ data: [], error: null, count: 0 }).then(resolve);
      },
    };
  });
});
afterEach(cleanup);

describe('AppProvider auth ownership', () => {
  it('invalidates asset capabilities on account changes but keeps them during a same-user token refresh', async () => {
    render(<AppProvider><Consumer /></AppProvider>);
    const initial = getStorageAuthGeneration();
    act(() => { emit('SIGNED_IN', session('first')); });
    await waitFor(() => expect(current().profile).toBe('first'));
    expect(getStorageAuthGeneration()).toBe(initial + 1);
    act(() => { emit('TOKEN_REFRESHED', session('first')); });
    expect(getStorageAuthGeneration()).toBe(initial + 1);
    act(() => { emit('SIGNED_IN', session('second')); });
    await waitFor(() => expect(current().profile).toBe('second'));
    expect(getStorageAuthGeneration()).toBe(initial + 2);
    act(() => { emit('SIGNED_OUT', null); });
    expect(getStorageAuthGeneration()).toBe(initial + 3);
  });

  it('ignores an initial session response that arrives after a newer sign-in', async () => {
    render(<AppProvider><Consumer /></AppProvider>);
    act(() => { emit('SIGNED_IN', session('new-account')); });
    await waitFor(() => expect(current().profile).toBe('new-account'));
    await act(async () => { resolveBootstrap({ data: { session: session('old-account') }, error: null }); });
    expect(current()).toMatchObject({ profile: 'new-account', ids: ['new-account'], loading: false });
    expect(mocks.access).not.toHaveBeenCalledWith('old-account');
  });

  it('cannot restore profile or grants from a pending request after logout', async () => {
    let resolveProfile: (value: { data: { id: string }; error: null }) => void;
    mocks.profile.mockReturnValueOnce(new Promise(resolve => { resolveProfile = resolve; }));
    render(<AppProvider><Consumer /></AppProvider>);
    act(() => { emit('SIGNED_IN', session('old-account')); });
    await waitFor(() => expect(mocks.profile).toHaveBeenCalledWith('old-account'));
    act(() => { emit('SIGNED_OUT', null); });
    await act(async () => {
      resolveProfile({ data: { id: 'old-account' }, error: null });
      resolveBootstrap({ data: { session: session('old-account') }, error: null });
    });
    await waitFor(() => expect(current()).toMatchObject({ profile: null, ids: [], loading: false }));
  });

  it('waits for the new profile when switching accounts', async () => {
    render(<AppProvider><Consumer /></AppProvider>);
    act(() => { emit('SIGNED_IN', session('first')); });
    await waitFor(() => expect(current().profile).toBe('first'));
    let resolveProfile: (value: { data: { id: string }; error: null }) => void;
    mocks.profile.mockReturnValueOnce(new Promise(resolve => { resolveProfile = resolve; }));
    act(() => { emit('SIGNED_IN', session('second')); });
    expect(current()).toMatchObject({ profile: null, ids: ['second'], loading: true });
    await waitFor(() => expect(mocks.profile).toHaveBeenCalledWith('second'));
    await act(async () => { resolveProfile({ data: { id: 'second' }, error: null }); });
    expect(current()).toMatchObject({ profile: 'second', ids: ['second'], loading: false });
  });
});
