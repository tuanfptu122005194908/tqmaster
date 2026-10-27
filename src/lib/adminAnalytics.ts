import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

const amount = z.number().int().nonnegative().safe();
const count = amount.int();
export const summarySchema = z.object({
  revenue: amount, approved: count, pendingOrders: count, rejected: count,
  orders: count, users: count, subjects: count, exams: count, questions: count,
});
export const seriesSchema = z.array(z.object({ label: z.string(), start: z.string(), revenue: amount }));
export const salesSchema = z.object({
  rows: z.array(z.object({ id: z.string(), name: z.string(), count, gross: amount, revenue: amount })),
  total: amount, gross: amount, count, unallocated: amount,
});
const examSchema = z.object({
  exam: z.object({ id: z.string(), title: z.string() }), totalQ: count, noAnswer: count,
  counts: z.record(count),
});
export const examStatisticsSchema = z.object({
  groups: z.array(z.object({
    subject: z.object({ id: z.string(), name: z.string(), semester: z.number() }),
    exams: z.array(examSchema),
  })),
  exams: z.array(examSchema),
});
export type CommerceSummary = Required<z.infer<typeof summarySchema>>;
export type RevenuePoint = { label: string; start: string; revenue: number };
export type SubjectSales = {
  rows: { id: string; name: string; count: number; gross: number; revenue: number }[];
  total: number; gross: number; count: number; unallocated: number;
};
export type RevenuePeriod = 'day' | 'week' | 'month' | 'year';
export type SalesRange = 'all' | 'week' | 'month' | 'year';
export type ExamStatistics = {
  groups: { subject: { id: string; name: string; semester: number }; exams: ExamStatistic[] }[];
  exams: ExamStatistic[];
};
type ExamStatistic = { exam: { id: string; title: string }; totalQ: number; noAnswer: number; counts: Record<string, number> };

export function readAnalytics<T>(schema: z.ZodType<T>, data: unknown, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  const result = schema.safeParse(data);
  if (!result.success) throw new Error('Dữ liệu thống kê không hợp lệ. Vui lòng thử tải lại.');
  return result.data;
}

export async function loadCommerceSummary() {
  const { data, error } = await supabase.rpc('admin_commerce_summary');
  return readAnalytics(summarySchema, data, error) as CommerceSummary;
}
export async function loadRevenueSeries(period: RevenuePeriod) {
  const { data, error } = await supabase.rpc('admin_revenue_series', { p_period: period });
  return readAnalytics(seriesSchema, data, error) as RevenuePoint[];
}
export async function loadSubjectSales(range: SalesRange = 'all', limit?: number) {
  const { data, error } = await supabase.rpc('admin_subject_sales', { p_range: range, p_limit: limit });
  return readAnalytics(salesSchema, data, error) as SubjectSales;
}
export async function loadExamStatistics() {
  const { data, error } = await supabase.rpc('admin_exam_statistics');
  return readAnalytics(examStatisticsSchema, data, error) as ExamStatistics;
}
export async function loadRecentOrders() {
  const { data, error } = await supabase.from('orders')
    .select('id, created_at, final_amount, status, full_name, email, student_code')
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(10);
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Không nhận được danh sách đơn hàng.');
  return data;
}
