import { supabase } from '@/integrations/supabase/client';
import { fetchAllById } from './fetchAllById';

export async function loadSubjectIds(userId: string): Promise<string[]> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!user || user.id !== userId) {
    throw new Error('Chưa xác minh được phiên đăng nhập. Vui lòng thử lại.');
  }

  const rows = await fetchAllById((afterId) => {
    let query = supabase.from('user_subjects')
      .select('id, subject_id')
      .eq('user_id', userId)
      .order('id', { ascending: true })
      .limit(500);
    if (afterId !== null) query = query.gt('id', afterId);
    return query;
  });
  return [...new Set(rows.map(row => row.subject_id))];
}
