import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: { queries: {
    staleTime: 5 * 60 * 1000, gcTime: 15 * 60 * 1000,
    retry: 1, refetchOnWindowFocus: false,
  } },
});

/** Discard account-owned data and cancel its reads before another identity can render. */
export function clearUserQueries() {
  const filters = { queryKey: ['user'] };
  void queryClient.cancelQueries(filters);
  queryClient.removeQueries(filters);
}
