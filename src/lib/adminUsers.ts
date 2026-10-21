import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { fetchAllById } from './fetchAllById';

export interface AdminUserRow extends Tables<'profiles'> {
  roles: string[];
  subjectIds: string[];
}

export async function loadAdminUsers() {
  const [profiles, roles, subjects, grants] = await Promise.all([
    fetchAllById((afterId) => {
      let query = supabase.from('profiles').select('*').order('id').limit(500);
      if (afterId !== null) query = query.gt('id', afterId);
      return query;
    }),
    fetchAllById((afterId) => {
      let query = supabase.from('user_roles').select('id, user_id, role').order('id').limit(500);
      if (afterId !== null) query = query.gt('id', afterId);
      return query;
    }),
    fetchAllById((afterId) => {
      let query = supabase.from('subjects').select('id, name, semester').order('id').limit(500);
      if (afterId !== null) query = query.gt('id', afterId);
      return query;
    }),
    fetchAllById((afterId) => {
      let query = supabase.from('user_subjects').select('id, user_id, subject_id').order('id').limit(500);
      if (afterId !== null) query = query.gt('id', afterId);
      return query;
    }),
  ]);

  const bySubject = new Map<string, string[]>();
  for (const grant of grants) {
    const ids = bySubject.get(grant.user_id) ?? [];
    ids.push(grant.subject_id);
    bySubject.set(grant.user_id, ids);
  }
  const byRole = new Map<string, string[]>();
  for (const role of roles) {
    const values = byRole.get(role.user_id) ?? [];
    values.push(role.role);
    byRole.set(role.user_id, values);
  }
  const rows: AdminUserRow[] = profiles
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map(profile => ({
      ...profile,
      roles: byRole.get(profile.id) ?? [],
      subjectIds: bySubject.get(profile.id) ?? [],
    }));
  return { rows, subjects: subjects.sort((a, b) => a.semester - b.semester || a.name.localeCompare(b.name)) };
}
