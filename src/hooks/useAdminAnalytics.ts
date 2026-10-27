import { useQuery } from '@tanstack/react-query';
import { useApp } from '@/lib/AppContext';
import { loadCommerceSummary, loadRevenueSeries, loadSubjectSales, loadRecentOrders, loadExamStatistics, type RevenuePeriod, type SalesRange } from '@/lib/adminAnalytics';

// Identity belongs in the key: an account switch must never reuse another admin's data.
function useAdminScope() {
  const { profile, isAdmin } = useApp();
  return { queryKey: ['admin', profile?.id], enabled: !!profile && isAdmin, staleTime: 30_000 };
}
export function useCommerceSummary() {
  const scope = useAdminScope();
  return useQuery({ ...scope, queryKey: [...scope.queryKey, 'commerce'], queryFn: loadCommerceSummary });
}
export function useRevenueSeries(period: RevenuePeriod) {
  const scope = useAdminScope();
  return useQuery({ ...scope, queryKey: [...scope.queryKey, 'series', period], queryFn: () => loadRevenueSeries(period) });
}
export function useSubjectSales(range: SalesRange = 'all', limit?: number) {
  const scope = useAdminScope();
  return useQuery({ ...scope, queryKey: [...scope.queryKey, 'sales', range, limit], queryFn: () => loadSubjectSales(range, limit) });
}
export function useRecentOrders() {
  const scope = useAdminScope();
  return useQuery({ ...scope, queryKey: [...scope.queryKey, 'recent-orders'], queryFn: loadRecentOrders });
}
export function useExamStatistics() {
  const scope = useAdminScope();
  return useQuery({ ...scope, queryKey: [...scope.queryKey, 'exam-statistics'], queryFn: loadExamStatistics });
}
