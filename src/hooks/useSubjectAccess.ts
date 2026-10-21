import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { loadSubjectIds } from '@/lib/subjectAccess';

interface AccessState {
  userId: string | null;
  ids: string[];
  ready: boolean;
  loading: boolean;
  error: string | null;
}

function initialState(userId: string | null): AccessState {
  return { userId, ids: [], ready: false, loading: !!userId, error: null };
}

export function useSubjectAccess(userId: string | null) {
  const [state, setState] = useState<AccessState>(() => initialState(userId));
  const owner = useRef(userId);
  const request = useRef(0);
  const invalidateRequest = useCallback(() => { request.current++; }, []);
  // Invalidate at commit, before passive effects or an old response can run.
  useLayoutEffect(() => {
    owner.current = userId;
    invalidateRequest();
    return invalidateRequest;
  }, [userId, invalidateRequest]);

  const refresh = useCallback(async () => {
    const userId = owner.current;
    if (!userId) return;
    const version = ++request.current;
    const isCurrent = () => request.current === version && owner.current === userId;
    setState(previous => ({
      ...(previous.userId === userId ? previous : initialState(userId)),
      loading: true,
      error: null,
    }));
    try {
      const ids = await loadSubjectIds(userId);
      if (isCurrent()) setState({ userId, ids, ready: true, loading: false, error: null });
    } catch (error: unknown) {
      if (isCurrent()) {
        setState(previous => ({
          ...(previous.userId === userId ? previous : initialState(userId)),
          loading: false,
          error: error instanceof Error ? error.message : 'Không thể tải quyền học.',
        }));
      }
    }
  }, []);

  useEffect(() => {
    setState(initialState(userId));
    if (!userId) return;
    void refresh();

    let timer: ReturnType<typeof setTimeout>;
    const scheduleRefresh = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { void refresh(); }, 300);
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
  }, [userId, refresh]);

  const current = state.userId === userId ? state : initialState(userId);
  return { ...current, refresh };
}
