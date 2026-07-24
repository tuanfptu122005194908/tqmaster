import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import {
  Users, UserPlus, ShieldCheck, BookOpen, Search, Trash2, Shield,
  ShieldOff, Loader2, X, Plus, ChevronLeft, ChevronRight, Check, Sparkles, Filter
} from 'lucide-react';

type Profile  = Tables<'profiles'>;
type Subject  = Pick<Tables<'subjects'>, 'id' | 'name' | 'semester'>;

interface UserRow extends Profile {
  roles: string[];
  subjectIds: string[];
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  border: '1.5px solid #cbd5e1', borderRadius: 12,
  fontSize: '0.875rem', outline: 'none', background: '#ffffff',
  color: '#0f172a',
};

export default function AdminUsers() {
  const [rows,     setRows]     = useState<UserRow[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    fullName: '', username: '', email: '', password: '', studentCode: '', role: 'user'
  });

  const [subjectUserModal, setSubjectUserModal] = useState<UserRow | null>(null);
  const [subjSearch, setSubjSearch] = useState('');

  const fetch = async () => {
    try {
      const [profilesRes, rolesRes, subjectsRes, userSubjectsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
        supabase.from('subjects').select('id, name, semester').order('semester'),
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
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const filteredRows = useMemo(() => {
    return rows.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.full_name ?? '').toLowerCase().includes(q) || (u.student_code ?? '').toLowerCase().includes(q);
      const isAdmin = u.roles.includes('admin');
      const matchRole = roleFilter === 'all' || (roleFilter === 'admin' && isAdmin) || (roleFilter === 'user' && !isAdmin);
      return matchSearch && matchRole;
    });
  }, [rows, search, roleFilter]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Quick stats
  const totalUsers = rows.length;
  const newThisMonth = useMemo(() => {
    const now = new Date();
    return rows.filter(r => {
      const d = new Date(r.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }, [rows]);
  const totalAdmins = useMemo(() => rows.filter(r => r.roles.includes('admin')).length, [rows]);
  const totalGrantedSubjects = useMemo(() => rows.reduce((s, r) => s + r.subjectIds.length, 0), [rows]);

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
    // Update local state for responsiveness
    setRows(prev => prev.map(u => {
      if (u.id === userId) {
        const newSubjs = hasIt ? u.subjectIds.filter(id => id !== subjectId) : [...u.subjectIds, subjectId];
        return { ...u, subjectIds: newSubjs };
      }
      return u;
    }));
    if (subjectUserModal && subjectUserModal.id === userId) {
      setSubjectUserModal(prev => prev ? ({
        ...prev,
        subjectIds: hasIt ? prev.subjectIds.filter(id => id !== subjectId) : [...prev.subjectIds, subjectId]
      }) : null);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này? Toàn bộ dữ liệu sẽ bị xóa vĩnh viễn.')) return;
    const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: userId });
    if (error) {
      alert('Lỗi: Không thể xoá người dùng. ' + error.message);
    } else {
      fetch();
    }
  };

  const handleAddUser = async () => {
    if (!addForm.email.trim() || !addForm.password.trim() || !addForm.username.trim()) {
      alert('Vui lòng điền đầy đủ email, username và mật khẩu!');
      return;
    }
    setSavingAdd(true);
    try {
      // 1. Thử gọi Edge Function signup-with-otp với action 'admin_create' (xác thực sẵn, không cần OTP)
      const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('signup-with-otp', {
        body: {
          action: 'admin_create',
          email: addForm.email.trim(),
          password: addForm.password.trim(),
          username: addForm.username.trim(),
          full_name: addForm.fullName.trim(),
          student_code: addForm.studentCode.trim(),
          role: addForm.role,
        }
      });

      let createdUserId: string | null = (edgeData as any)?.user?.id || null;
      let isSuccess = (edgeData as any)?.success === true;

      // 2. Dự phòng nếu Edge Function không phản hồi hoặc gặp sự cố
      if (!isSuccess) {
        const edgeErrMsg = (edgeData as any)?.error || edgeErr?.message;
        if (edgeErrMsg && edgeErrMsg !== 'Edge Function returned a non-2xx status code' && !edgeErrMsg.includes('FunctionsFetchError')) {
          throw new Error(edgeErrMsg);
        }

        // Tạo tài khoản trực tiếp qua Supabase Auth SDK
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: addForm.email.trim(),
          password: addForm.password.trim(),
          options: {
            data: {
              username: addForm.username.trim(),
              full_name: addForm.fullName.trim(),
              student_code: addForm.studentCode.trim(),
            }
          }
        });

        if (signUpErr) throw signUpErr;

        if (signUpData.user) {
          createdUserId = signUpData.user.id;
          // Kích hoạt xác thực tài khoản tức thì qua RPC
          await supabase.rpc('admin_confirm_user', { target_user_id: createdUserId });

          // Upsert profile
          await supabase.from('profiles').upsert({
            id: createdUserId,
            username: addForm.username.trim(),
            full_name: addForm.fullName.trim() || addForm.username.trim(),
            email: addForm.email.trim(),
            student_code: addForm.studentCode.trim() || null,
          });

          // Phân quyền admin nếu chọn
          if (addForm.role === 'admin') {
            await supabase.from('user_roles').insert({ user_id: createdUserId, role: 'admin' });
          }
        }
      }

      alert('Tạo tài khoản thành công! Tài khoản đã được xác thực và sẵn sàng sử dụng.');
      setShowAddModal(false);
      setAddForm({ fullName: '', username: '', email: '', password: '', studentCode: '', role: 'user' });
      fetch();
    } catch (err: any) {
      alert('Lỗi tạo tài khoản: ' + err.message);
    } finally {
      setSavingAdd(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400, background: '#f4f7fc' }}>
      <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
    </div>
  );

  return (
    <div className="admin-users-container" style={{ padding: '28px 36px', flex: 1, minWidth: 0, background: '#f4f7fc', minHeight: '100vh', color: '#0f172a', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      
      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em', margin: '0 0 6px 0' }}>
            Quản lý người dùng
          </h1>
          <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, fontWeight: 500 }}>
            Quản lý danh sách thành viên, phân quyền và giám sát môn học.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            color: '#ffffff', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 800,
            cursor: 'pointer', boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
            transition: 'transform 0.15s ease'
          }}
        >
          <UserPlus size={18} /> Thêm thành viên
        </button>
      </div>

      {/* ── TOP 4 PASTEL STAT CARDS GRID ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
        gap: 18,
        marginBottom: 24,
      }}>
        {/* Card 1: Tổng người dùng */}
        <div style={{
          background: '#edf5ff',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #dbeafe',
          boxShadow: '0 2px 8px rgba(37, 99, 235, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#2563eb', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.15)'
            }}>
              <Users size={20} />
            </div>
            <span style={{ padding: '3px 8px', borderRadius: 12, background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 800 }}>
              +12%
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
            Tổng người dùng
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
            {totalUsers.toLocaleString()}
          </div>
        </div>

        {/* Card 2: Học viên mới (tháng này) */}
        <div style={{
          background: '#f3eefd',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #ede9fe',
          boxShadow: '0 2px 8px rgba(139, 92, 246, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8b5cf6', boxShadow: '0 4px 10px rgba(139, 92, 246, 0.15)'
            }}>
              <UserPlus size={20} />
            </div>
            <span style={{ padding: '3px 8px', borderRadius: 12, background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 800 }}>
              +8%
            </span>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
            Học viên mới (tháng này)
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
            {newThisMonth.toLocaleString()}
          </div>
        </div>

        {/* Card 3: Admin hệ thống */}
        <div style={{
          background: '#eafaf5',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #d1fae5',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#059669', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.15)'
            }}>
              <ShieldCheck size={20} />
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
            Admin hệ thống
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
            {totalAdmins.toLocaleString()}
          </div>
        </div>

        {/* Card 4: Tổng môn học đã cấp */}
        <div style={{
          background: '#fff7ed',
          borderRadius: 20,
          padding: '20px 22px',
          border: '1px solid #ffedd5',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', background: '#ffffff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#d97706', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.18)'
            }}>
              <BookOpen size={20} />
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
            Tổng môn học đã cấp
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
            {totalGrantedSubjects.toLocaleString()}
          </div>
        </div>
      </div>

      {/* ── SEARCH & ROLE FILTER CONTROLS ── */}
      <div style={{
        background: '#ffffff',
        borderRadius: 20,
        padding: '16px 22px',
        border: '1px solid #e2e8f0',
        marginBottom: 20,
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14,
      }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: 1, minWidth: 260, maxWidth: 400 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Tìm theo tên, email, MSV..."
            style={{
              width: '100%', padding: '9px 14px 9px 40px',
              border: '1.5px solid #cbd5e1', borderRadius: 12,
              fontSize: 13.5, outline: 'none', background: '#f8fafc',
              color: '#0f172a'
            }}
          />
        </div>

        {/* Role Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
          <button
            onClick={() => { setRoleFilter('all'); setCurrentPage(1); }}
            style={{
              padding: '6px 14px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: roleFilter === 'all' ? '#2563eb' : 'transparent',
              color: roleFilter === 'all' ? '#ffffff' : '#64748b',
              boxShadow: roleFilter === 'all' ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
            }}
          >
            Tất cả ({rows.length})
          </button>
          <button
            onClick={() => { setRoleFilter('admin'); setCurrentPage(1); }}
            style={{
              padding: '6px 14px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: roleFilter === 'admin' ? '#2563eb' : 'transparent',
              color: roleFilter === 'admin' ? '#ffffff' : '#64748b',
              boxShadow: roleFilter === 'admin' ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
            }}
          >
            Admin ({totalAdmins})
          </button>
          <button
            onClick={() => { setRoleFilter('user'); setCurrentPage(1); }}
            style={{
              padding: '6px 14px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer',
              background: roleFilter === 'user' ? '#2563eb' : 'transparent',
              color: roleFilter === 'user' ? '#ffffff' : '#64748b',
              boxShadow: roleFilter === 'user' ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
            }}
          >
            User ({totalUsers - totalAdmins})
          </button>
        </div>
      </div>

      {/* ── MAIN USER TABLE ── */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 22, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        {/* Desktop Table View */}
        <div className="hidden-mobile" style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>NGƯỜI DÙNG</th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>EMAIL & USERNAME</th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>NGÀY THAM GIA</th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>VAI TRÒ</th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 11, textTransform: 'uppercase' }}>MÔN HỌC</th>
                <th style={{ padding: '14px 20px', fontWeight: 800, color: '#475569', fontSize: 11, textTransform: 'uppercase', textAlign: 'right' }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: 14 }}>
                    Không tìm thấy thành viên nào phù hợp
                  </td>
                </tr>
              ) : paginatedRows.map(user => {
                const isAdmin = user.roles.includes('admin');
                const idShort = user.id.slice(0, 5).toUpperCase();

                return (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* User */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {/* Circle Avatar */}
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                          background: isAdmin ? 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' : '#e2e8f0',
                          color: isAdmin ? '#ffffff' : '#475569',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 15, boxShadow: isAdmin ? '0 4px 10px rgba(37, 99, 235, 0.2)' : 'none'
                        }}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>
                            {user.full_name || user.username}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#2563eb', fontWeight: 800, fontFamily: 'monospace', marginTop: 1 }}>
                            ID-{idShort}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email & Username */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 700, color: '#334155' }}>{user.email}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>@{user.username}</div>
                    </td>

                    {/* Join Date */}
                    <td style={{ padding: '16px 20px', color: '#64748b', fontWeight: 600 }}>
                      {new Date(user.created_at).toLocaleDateString('vi-VN')}
                    </td>

                    {/* Role Badge */}
                    <td style={{ padding: '16px 20px' }}>
                      {isAdmin ? (
                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 800, background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}>
                          Admin
                        </span>
                      ) : (
                        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1' }}>
                          User
                        </span>
                      )}
                    </td>

                    {/* Subject Count & Assignment Modal Trigger */}
                    <td style={{ padding: '16px 20px' }}>
                      <button
                        onClick={() => setSubjectUserModal(user)}
                        style={{
                          border: 'none', background: '#eff6ff', color: '#2563eb',
                          padding: '4px 10px', borderRadius: 12, fontSize: 13, fontWeight: 800,
                          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6
                        }}
                      >
                        <BookOpen size={14} />
                        {String(user.subjectIds.length).padStart(2, '0')} môn
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
                        {/* Manage Subjects Icon */}
                        <button
                          onClick={() => setSubjectUserModal(user)}
                          title="Cấp quyền môn học"
                          style={{ border: 'none', background: '#f1f5f9', color: '#2563eb', padding: 8, borderRadius: 10, cursor: 'pointer' }}
                        >
                          <BookOpen size={16} />
                        </button>

                        {/* Toggle Role Switch */}
                        <button
                          onClick={() => toggleRole(user.id, isAdmin)}
                          title={isAdmin ? 'Hạ quyền xuống User' : 'Nâng quyền lên Admin'}
                          style={{
                            width: 42, height: 22, borderRadius: 20, border: 'none', cursor: 'pointer',
                            background: isAdmin ? '#2563eb' : '#cbd5e1', position: 'relative',
                            transition: 'background 0.2s ease', padding: 0
                          }}
                        >
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%', background: '#ffffff',
                            position: 'absolute', top: 2, left: isAdmin ? 22 : 2,
                            transition: 'left 0.2s ease', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                          }} />
                        </button>

                        {/* Delete User Icon */}
                        <button
                          onClick={() => deleteUser(user.id)}
                          title="Xóa người dùng"
                          style={{ border: 'none', background: '#ffe4e6', color: '#e11d48', padding: 8, borderRadius: 10, cursor: 'pointer' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile User Cards List */}
        <div className="visible-mobile" style={{ display: 'none', flexDirection: 'column', gap: 12, padding: 16 }}>
          {paginatedRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: 13 }}>
              Không tìm thấy thành viên nào
            </div>
          ) : (
            paginatedRows.map(user => {
              const isAdmin = user.roles.includes('admin');
              return (
                <div key={user.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: '#0f172a' }}>{user.full_name || user.username}</div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, background: isAdmin ? '#eff6ff' : '#f1f5f9', color: isAdmin ? '#2563eb' : '#64748b' }}>
                      {isAdmin ? 'Admin' : 'User'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 4 }}>{user.email}</div>
                  {user.student_code && <div style={{ fontSize: 12, color: '#2563eb', fontWeight: 700, fontFamily: 'monospace', marginBottom: 10 }}>MSV: {user.student_code}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
                    <button style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', fontSize: 12, fontWeight: 700, cursor: 'pointer' }} onClick={() => setSubjectUserModal(user)}>
                      Môn học ({user.subjectIds.length})
                    </button>
                    <button onClick={() => deleteUser(user.id)} style={{ border: 'none', background: '#ffe4e6', color: '#e11d48', padding: 6, borderRadius: 8, cursor: 'pointer' }}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── TABLE FOOTER & PAGINATION ── */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#ffffff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
        }}>
          <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            Hiển thị <strong style={{ color: '#0f172a' }}>{filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredRows.length)}</strong> của <strong style={{ color: '#0f172a' }}>{filteredRows.length.toLocaleString()}</strong> người dùng
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                color: currentPage === 1 ? '#cbd5e1' : '#475569'
              }}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  style={{
                    width: 32, height: 32, borderRadius: 8, border: 'none',
                    background: currentPage === pageNum ? '#2563eb' : 'transparent',
                    color: currentPage === pageNum ? '#ffffff' : '#475569',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              style={{
                width: 32, height: 32, borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                color: currentPage === totalPages ? '#cbd5e1' : '#475569'
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── MODAL 1: THÊM THÀNH VIÊN MỚI ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#ffffff', width: '100%', maxWidth: 480, borderRadius: 24,
            padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={20} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Thêm thành viên mới
                </h2>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Họ và tên</label>
                <input value={addForm.fullName} onChange={e => setAddForm({ ...addForm, fullName: e.target.value })} placeholder="VD: Lê Minh Tuấn" style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Username</label>
                  <input value={addForm.username} onChange={e => setAddForm({ ...addForm, username: e.target.value })} placeholder="VD: tuantuan" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Mã Sinh Viên (MSV)</label>
                  <input value={addForm.studentCode} onChange={e => setAddForm({ ...addForm, studentCode: e.target.value.toUpperCase() })} placeholder="VD: SE170291" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Địa chỉ Email</label>
                <input type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} placeholder="email@tqmaster.vn" style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Mật khẩu đăng nhập</label>
                <input type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} placeholder="Tối thiểu 6 ký tự" style={inputStyle} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>Vai trò hệ thống</label>
                <select value={addForm.role} onChange={e => setAddForm({ ...addForm, role: e.target.value })} style={inputStyle}>
                  <option value="user">User (Học viên)</option>
                  <option value="admin">Admin (Quản trị viên)</option>
                </select>
              </div>

              <button
                onClick={handleAddUser} disabled={savingAdd}
                style={{
                  height: 48, width: '100%', background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 800,
                  cursor: savingAdd ? 'not-allowed' : 'pointer', marginTop: 10, boxShadow: '0 6px 16px rgba(37, 99, 235, 0.35)'
                }}
              >
                {savingAdd ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : 'Tạo tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: CẤP QUYỀN MÔN HỌC DÀNH CHO USER ── */}
      {subjectUserModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }}>
          <div style={{
            background: '#ffffff', width: '100%', maxWidth: 540, borderRadius: 24,
            padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0',
            maxHeight: '90vh', display: 'flex', flexDirection: 'column'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                  Phân quyền môn học
                </h2>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Thành viên: <strong style={{ color: '#2563eb' }}>{subjectUserModal.full_name || subjectUserModal.username}</strong> ({subjectUserModal.email})
                </p>
              </div>
              <button onClick={() => setSubjectUserModal(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Search filter for subjects inside modal */}
            <div style={{ position: 'relative', marginBottom: 16 }}>
              <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                value={subjSearch}
                onChange={e => setSubjSearch(e.target.value)}
                placeholder="Tìm kiếm môn học theo tên hoặc kỳ..."
                style={{
                  width: '100%', padding: '8px 14px 8px 38px',
                  border: '1.5px solid #cbd5e1', borderRadius: 10,
                  fontSize: 13, outline: 'none', background: '#f8fafc'
                }}
              />
            </div>

            {/* Granted count strip */}
            <div style={{ padding: '8px 12px', background: '#eff6ff', borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: '#1d4ed8', marginBottom: 14 }}>
              Đã cấp quyền: {subjectUserModal.subjectIds.length} / {subjects.length} môn học
            </div>

            {/* Subjects List Scrollable */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
              {subjects
                .filter(s => !subjSearch || s.name.toLowerCase().includes(subjSearch.toLowerCase()) || String(s.semester).includes(subjSearch))
                .map(s => {
                  const hasIt = subjectUserModal.subjectIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSubject(subjectUserModal.id, s.id, hasIt)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 12, border: '1px solid',
                        borderColor: hasIt ? '#bbf7d0' : '#e2e8f0',
                        background: hasIt ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer', transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 6,
                          background: hasIt ? '#16a34a' : '#f1f5f9',
                          color: hasIt ? '#ffffff' : '#cbd5e1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Check size={14} strokeWidth={3} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>Kỳ học: Kỳ {s.semester}</div>
                        </div>
                      </div>

                      <span style={{
                        padding: '3px 10px', borderRadius: 12, fontSize: 11.5, fontWeight: 800,
                        background: hasIt ? '#dcfce7' : '#f1f5f9',
                        color: hasIt ? '#15803d' : '#64748b'
                      }}>
                        {hasIt ? 'Đã cấp' : 'Chưa cấp'}
                      </span>
                    </div>
                  );
                })}
            </div>

            {/* Footer Close */}
            <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #f1f5f9', textAlign: 'right' }}>
              <button
                onClick={() => setSubjectUserModal(null)}
                style={{
                  padding: '9px 20px', background: '#2563eb', color: '#ffffff',
                  border: 'none', borderRadius: 12, fontSize: 13.5, fontWeight: 800, cursor: 'pointer'
                }}
              >
                Xác nhận & Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .admin-users-container {
            padding: 16px !important;
          }
          .hidden-mobile { display: none !important; }
          .visible-mobile { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
