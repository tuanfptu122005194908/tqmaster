import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/lib/AppContext';
import { GraduationCap, Loader2, User } from 'lucide-react';
import { toast } from 'sonner';

export default function CompleteProfilePage() {
  const { profile, refreshAuthUser } = useApp();
  const [studentCode, setStudentCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim()) return;
    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({ student_code: studentCode.trim() })
      .eq('id', profile?.id);

    setLoading(false);

    if (error) {
      toast.error('Lỗi khi cập nhật thông tin: ' + error.message);
    } else {
      toast.success('Cập nhật thông tin thành công!');
      await refreshAuthUser();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'hsl(var(--background))',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: '#ffffff',
        borderRadius: 24,
        padding: '40px 32px',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)',
        border: '1px solid #e2e8f0',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: '#eff6ff', border: '2px solid #dbeafe',
            color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.15)'
          }}>
            <User size={36} />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0', letterSpacing: '-0.03em' }}>Hoàn tất hồ sơ</h2>
          <p style={{ fontSize: 14, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Chào mừng bạn đến với TQMaster. Vui lòng cung cấp mã sinh viên để hoàn tất quá trình đăng ký.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Mã sinh viên
            </label>
            <div style={{ position: 'relative' }}>
              <GraduationCap size={20} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={studentCode}
                onChange={e => setStudentCode(e.target.value)}
                placeholder="VD: 2021XXXXXX"
                required
                style={{
                  width: '100%', height: 52, paddingLeft: 48, paddingRight: 16,
                  borderRadius: 14, border: '1.5px solid #cbd5e1', fontSize: 15,
                  outline: 'none', transition: 'all 0.15s ease', fontFamily: 'monospace'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.boxShadow = '0 0 0 4px rgba(37, 99, 235, 0.14)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !studentCode.trim()}
            style={{
              height: 52, width: '100%',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: '#ffffff', border: 'none', borderRadius: 14,
              fontSize: 16, fontWeight: 800, cursor: (loading || !studentCode.trim()) ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: (loading || !studentCode.trim()) ? 0.7 : 1,
              boxShadow: '0 10px 24px -4px rgba(37, 99, 235, 0.4)',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={(e) => !(loading || !studentCode.trim()) && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /> : 'Xác nhận & Vào học'}
          </button>
        </form>
      </div>
    </div>
  );
}
