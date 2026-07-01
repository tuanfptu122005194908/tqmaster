import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { Search, Trash2, Shield, ShieldOff, Download, Loader2 } from 'lucide-react';

type Profile  = Tables<'profiles'>;
type UserRole = Tables<'user_roles'>;
type Subject  = Pick<Tables<'subjects'>, 'id' | 'name'>;
type UserSubject = Tables<'user_subjects'>;

interface UserRow extends Profile {
  roles: string[];
  subjectIds: string[];
}

export default function AdminUsers() {
  const [rows,     setRows]     = useState<UserRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  const fetch = async () => {
    const [profilesRes, rolesRes, subjectsRes, userSubjectsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at'),
      supabase.from('user_roles').select('*'),
      supabase.from('subjects').select('id, name'),
      supabase.from('user_subjects').select('user_id, subject_id'),
    ]);
    const roles   = rolesRes.data ?? [];
    const usub    = userSubjectsRes.data ?? [];
    const profiles = (profilesRes.data ?? []).map(p => ({
      ...p,
      roles:      roles.filter(r => r.user_id === p.id).map(r => r.role),
      subjectIds: usub.filter(s => s.user_id === p.id).map(s => s.subject_id),
    }));
    setRows(profiles);
    setSubjects(subjectsRes.data ?? []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const filtered = rows.filter(u => {
    const q = search.toLowerCase();
    return !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.full_name ?? '').toLowerCase().includes(q);
  });

  const toggleRole = async (userId: string, isAdmin: boolean) => {
    if (isAdmin) {
      await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
    }
    fetch();
  };

  const toggleSubject = async (userId: string, subjectId: string, hasIt: boolean) => {
    if (hasIt) {
      await supabase.from('user_subjects').delete().eq('user_id', userId).eq('subject_id', subjectId);
    } else {
      await supabase.from('user_subjects').insert({ user_id: userId, subject_id: subjectId, granted_by: 'admin' });
    }
    fetch();
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này? Toàn bộ dữ liệu của họ có thể bị mất.')) return;
    
    // Gọi RPC để xoá tận gốc từ bảng auth.users (chỉ admin mới có quyền)
    const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
    
    if (error) {
      console.error(error);
      alert('Lỗi: Không thể xoá người dùng. ' + error.message);
    } else {
      fetch();
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: 'hsl(var(--primary))' }} /></div>;

  return (
    <div style={{ padding: 'var(--space-6) var(--space-8)', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Quản lý người dùng</h1>
          <p style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>{rows.length} tài khoản</p>
        </div>
      </div>

      <div style={{ position: 'relative', marginBottom: 'var(--space-5)', maxWidth: 340 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--muted-fg))' }} />
        <input id="users-search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tên, email..."
          style={{ width: '100%', paddingLeft: 36, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: '0.875rem', outline: 'none', background: 'hsl(var(--surface-raised))' }} />
      </div>

      <div style={{ background: 'hsl(var(--surface-raised))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) * 1.5)', overflow: 'hidden' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th>Người dùng</th><th>Vai trò</th><th>Môn đã có quyền</th><th>Ngày tham gia</th><th style={{ textAlign: 'right' }}>Thao tác</th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 'var(--space-10)', color: 'hsl(var(--muted-fg))' }}>Không tìm thấy</td></tr>}
            {filtered.map(user => (
              <UserRowItem 
                key={user.id} 
                user={user} 
                subjects={subjects} 
                toggleSubject={toggleSubject} 
                toggleRole={toggleRole} 
                deleteUser={deleteUser}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserRowItem({ user, subjects, toggleSubject, toggleRole, deleteUser }: { user: UserRow, subjects: Subject[], toggleSubject: any, toggleRole: any, deleteUser: any }) {
  const [showSubjects, setShowSubjects] = useState(false);
  const isAdmin = user.roles.includes('admin');
  
  return (
    <tr>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: isAdmin ? 'hsl(var(--primary))' : 'hsl(var(--muted))', color: isAdmin ? 'white' : 'hsl(var(--muted-fg))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.875rem' }}>
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user.full_name || user.username}</div>
            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-fg))' }}>{user.email}</div>
          </div>
        </div>
      </td>
      <td>
        <span className={isAdmin ? 'badge badge-primary' : 'badge'} style={!isAdmin ? { background: 'hsl(var(--muted))', color: 'hsl(var(--muted-fg))' } : {}}>
          {isAdmin ? 'Admin' : 'User'}
        </span>
      </td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button className="btn-ghost" style={{ alignSelf: 'flex-start', fontSize: '0.8125rem', padding: '2px 8px', color: 'hsl(var(--primary))' }} onClick={() => setShowSubjects(!showSubjects)}>
            {showSubjects ? 'Ẩn bớt' : `Xem quyền môn học (${user.subjectIds.length})`}
          </button>
          {showSubjects && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
              {subjects.map(s => {
                const owned = user.subjectIds.includes(s.id);
                return (
                  <button key={s.id} onClick={() => toggleSubject(user.id, s.id, owned)}
                    title={`${owned ? 'Thu hồi' : 'Cấp'} ${s.name}`}
                    style={{
                      fontSize: '0.75rem', padding: '4px 8px', borderRadius: 'var(--radius)',
                      border: '1px solid', cursor: 'pointer',
                      background: owned ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                      borderColor: owned ? 'hsl(var(--primary) / 0.5)' : 'hsl(var(--border))',
                      color: owned ? 'hsl(var(--primary))' : 'hsl(var(--muted-fg))',
                      fontWeight: owned ? 600 : 400,
                    }}>
                    {s.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </td>
      <td style={{ fontSize: '0.8125rem', color: 'hsl(var(--muted-fg))' }}>{user.created_at.split('T')[0]}</td>
      <td>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <button className="btn-ghost" style={{ padding: 6, color: isAdmin ? 'hsl(var(--primary))' : 'hsl(var(--muted-fg))' }}
            title={isAdmin ? 'Hạ xuống User' : 'Lên Admin'} onClick={() => toggleRole(user.id, isAdmin)}>
            {isAdmin ? <ShieldOff size={14} /> : <Shield size={14} />}
          </button>
          <button className="btn-ghost" style={{ padding: 6, color: 'hsl(var(--danger))' }}
            title="Xóa người dùng" onClick={() => deleteUser(user.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}
