import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  loadCommerceSummary,
  loadRevenueSeries,
  loadSubjectSales,
  type CommerceSummary as FullCommerceSummary,
  type RevenuePeriod,
  type RevenuePoint,
  type SubjectSales,
} from '@/lib/adminAnalytics';

export type OrderStatus = 'pending' | 'approved' | 'rejected';
export type { RevenuePeriod, RevenuePoint, SubjectSales };

export interface AppOrder {
  id: string;
  created_at: string;
  final_amount: number;
  status: OrderStatus;
  full_name: string;
  email: string;
  student_code: string;
  note: string | null;
  bill_image_url: string | null;
  order_items: { subjects: { name: string } | null }[];
}

export interface CommerceSummary {
  revenue: number;
  approved: number;
  pendingOrders: number;
  rejected: number;
  orders: number;
  users: number;
}

const ORDER_COLS =
  'id, created_at, final_amount, status, full_name, email, student_code, note, bill_image_url, order_items(subject_id, subjects(name, id))';

export function useSummary(enabled: boolean) {
  return useQuery({
    queryKey: ['aa', 'summary'],
    enabled,
    staleTime: 15_000,
    queryFn: async (): Promise<CommerceSummary> => {
      const d = await loadCommerceSummary();
      return {
        revenue: Number(d.revenue ?? 0),
        approved: Number(d.approved ?? 0),
        pendingOrders: Number(d.pendingOrders ?? 0),
        rejected: Number(d.rejected ?? 0),
        orders: Number(d.orders ?? 0),
        users: Number(d.users ?? 0),
      };
    },
  });
}

export function useRevenueSeries(enabled: boolean, period: RevenuePeriod = 'day') {
  return useQuery({
    queryKey: ['aa', 'revenue-series', period],
    enabled,
    staleTime: 30_000,
    queryFn: () => loadRevenueSeries(period),
  });
}

export function useSubjectSales(enabled: boolean, range: 'all' | 'week' | 'month' | 'year' = 'all', limit = 5) {
  return useQuery({
    queryKey: ['aa', 'subject-sales', range, limit],
    enabled,
    staleTime: 30_000,
    queryFn: () => loadSubjectSales(range, limit),
  });
}

export function useOrders(enabled: boolean, status: OrderStatus | 'all', search: string) {
  return useQuery({
    queryKey: ['aa', 'orders', status, search],
    enabled,
    staleTime: 10_000,
    queryFn: async (): Promise<AppOrder[]> => {
      let q = supabase.from('orders').select(ORDER_COLS).order('created_at', { ascending: false }).limit(60);
      if (status !== 'all') q = q.eq('status', status);
      const clean = search.trim().replace(/^#/, '').replace(/[,()%\\]/g, ' ').trim();
      if (clean) q = q.or(`full_name.ilike.%${clean}%,email.ilike.%${clean}%,student_code.ilike.%${clean}%`);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as AppOrder[];
    },
  });
}

export function useReviewOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('orders')
        .update({ status, reviewed_by: u.user?.id ?? null, reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['aa'] });
    },
  });
}

export function useRefreshAll() {
  const qc = useQueryClient();
  return useCallback(() => qc.invalidateQueries({ queryKey: ['aa'] }), [qc]);
}

export async function signBillUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('bill-images').createSignedUrl(path, 300);
  if (error || !data?.signedUrl) throw new Error(error?.message ?? 'Không tải được ảnh bill');
  return data.signedUrl;
}

export function timeAgo(iso: string, now = Date.now()): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}
