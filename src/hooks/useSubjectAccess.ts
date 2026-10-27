import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadSubjectIds } from '@/lib/subjectAccess';

interface AccessState {
  userId: string | null;
  ids: string[];
  ready: boolean;
  loading: boolean;
  error: string | null;
  revision: number;
}

function initialState(userId: string | null): AccessState {
  return { userId, ids: [], ready: false, loading: !!userId, error: null, revision: 0 };
}

interface AccessRequest {
  userId: string;
  version: number;
  invalidated: boolean;
  promise: Promise<void>;
}

export function useSubjectAccess(userId: string | null) {
  const [state, setState] = useState<AccessState>(() => initialState(userId));
  const owner = useRef(userId);
  const request = useRef(0);
  const inFlight = useRef<AccessRequest | null>(null);
  const invalidateRequest = useCallback(() => {
    request.current++;
    inFlight.current = null;
  }, []);
  // Invalidate at commit, before passive effects or an old response can run.
  useLayoutEffect(() => {
    owner.current = userId;
    invalidateRequest();
    return invalidateRequest;
  }, [userId, invalidateRequest]);

  const refresh = useCallback((): Promise<void> => {
    const userId = owner.current;
    if (!userId) return Promise.resolve();
    const existing = inFlight.current;
    if (existing?.userId === userId && existing.version === request.current) return existing.promise;
    const version = ++request.current;
    const isCurrent = () => request.current === version && owner.current === userId;
    const pending: AccessRequest = { userId, version, invalidated: false, promise: Promise.resolve() };
    inFlight.current = pending;
    setState(previous => ({
      ...(previous.userId === userId ? previous : initialState(userId)),
      loading: true,
      error: null,
    }));
    pending.promise = (async () => {
      try {
        do {
          pending.invalidated = false;
          try {
            const ids = await loadSubjectIds(userId);
            if (isCurrent()) setState(previous => ({
              userId, ids, ready: true, loading: pending.invalidated, error: null,
              revision: previous.revision + (ids.length !== previous.ids.length || ids.some(id => !previous.ids.includes(id)) ? 1 : 0),
            }));
          } catch (error: unknown) {
            if (isCurrent()) setState(previous => ({
              ...(previous.userId === userId ? previous : initialState(userId)),
              loading: false,
              error: error instanceof Error ? error.message : 'Không thể tải quyền học.',
            }));
          }
        } while (pending.invalidated && isCurrent());
      } finally {
        if (inFlight.current === pending) inFlight.current = null;
      }
    })();
    return pending.promise;
  }, []);

  const refreshAfterChange = useCallback(() => {
    const pending = inFlight.current;
    if (pending?.userId === owner.current && pending.version === request.current) {
      pending.invalidated = true;
      return pending.promise;
    }
    return refresh();
  }, [refresh]);

  useEffect(() => {
    setState(initialState(userId));
    if (!userId) return;
    void refresh();

    let timer: ReturnType<typeof setTimeout>;
    const scheduleRefresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { void refreshAfterChange(); }, 300);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') scheduleRefresh();
    };
    // orders is already published to Realtime; refresh also covers new approvals.
    const channel = supabase.channel(`subject-access-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` }, scheduleRefresh)
      .subscribe();
    // Also pick up manual grants/revocations if no order event was delivered.
    const interval = setInterval(onVisible, 60_000);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', scheduleRefresh);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', scheduleRefresh);
      void supabase.removeChannel(channel);
    };
  }, [userId, refresh, refreshAfterChange]);

  const current = state.userId === userId ? state : initialState(userId);
  return { ...current, refresh };
}
