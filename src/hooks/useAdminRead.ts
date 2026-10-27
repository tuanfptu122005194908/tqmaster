import { queryClient } from '@/lib/queryClient';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useAdminRead() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const versions = useRef<Record<string, number>>({});
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      // Metadata edits can affect analytics even on tables without Realtime enabled.
      void queryClient.invalidateQueries({queryKey:['admin'],refetchType:'none'});
    };
  }, []);
  const load = useCallback(async <T,>(key: string, get: () => Promise<T>, apply: (data: T) => void) => {
    const version = (versions.current[key] ?? 0) + 1;
    versions.current[key] = version;
    try {
      const data = await get();
      if (mounted.current && versions.current[key] === version) {
        apply(data);
        setErrors(previous => { const next = { ...previous }; delete next[key]; return next; });
      }
      return true;
    } catch (error) {
      if (mounted.current && versions.current[key] === version) {
        setErrors(previous => ({ ...previous, [key]: error instanceof Error ? error.message : String(error) }));
      }
      return false;
    }
  }, []);
  return { errors, load, failed: Object.keys(errors).length > 0 };
}
