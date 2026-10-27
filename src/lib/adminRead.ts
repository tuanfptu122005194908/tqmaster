import { supabase } from '@/integrations/supabase/client';
import type { Database, Tables } from '@/integrations/supabase/types';
import { fetchAllById } from './fetchAllById';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cursorFilter, readAllRows } from '../../supabase/functions/_shared/readAllRows';

type Table = keyof Database['public']['Tables'];

/** Complete metadata/reference reads and per-parent editors, never financial aggregates. */
export async function readAdminRows<T extends { id: string } = Tables<'subjects'>>(
  table: Table, columns = '*', equal: Record<string, string | number | boolean> = {},
): Promise<T[]> {
  return fetchAllById<T>(async afterId => {
    // The projection is dynamic; validate cursor identity in fetchAllById and let
    // callers type the selected row instead of expanding every table union.
    const reader: SupabaseClient = supabase;
    let query = reader.from(table).select(columns).order('id').limit(500);
    for (const [column, value] of Object.entries(equal)) query = query.eq(column, value);
    if (afterId !== null) query = query.gt('id', afterId);
    const { data, error } = await query;
    return { data: data as unknown as T[] | null, error };
  });
}

export async function readAdminLinks<T>(table: Table, keys: string[], equal: Record<string, string>): Promise<T[]> {
  const reader: SupabaseClient = supabase;
  const rows = await readAllRows(keys, async (cursor, size) => {
    let query = reader.from(table).select(keys.join(',')).limit(size);
    for (const [key, value] of Object.entries(equal)) query = query.eq(key, value);
    for (const key of keys) query = query.order(key);
    if (cursor) query = query.or(cursorFilter(keys, cursor));
    const { data, error } = await query;
    return { data: data as unknown as Record<string, unknown>[] | null, error };
  });
  return rows as T[];
}
