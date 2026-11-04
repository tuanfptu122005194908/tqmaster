import { useCallback, useEffect, useState } from 'react';
import { Loader2, Smartphone, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DeviceRow {
  device_name: string;
  linked_at: string;
  last_seen_at: string;
  fcm_token: string | null;
}

/** Spec 38: shows the single phone linked to the private admin app and lets an admin unlink it. */
export function AdminDeviceCard() {
  const [device, setDevice] = useState<DeviceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // The table can hold at most one row (single linked phone).
      const { data, error } = await supabase
        .from('admin_devices')
        .select('device_name, linked_at, last_seen_at, fcm_token')
        .maybeSingle();
      if (error) toast.error('Không tải được thiết bị app: ' + error.message);
      setDevice((data as DeviceRow | null) ?? null);
    } catch {
      setDevice(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const unlink = async () => {
    if (!window.confirm('Gỡ liên kết điện thoại? App trên máy đó sẽ bị đăng xuất và ngừng nhận thông báo.')) return;
    setBusy(true);
    const { error } = await supabase.rpc('unlink_admin_device');
    setBusy(false);
    if (error) { toast.error('Không gỡ được: ' + error.message); return; }
    toast.success('Đã gỡ liên kết thiết bị app');
    setDevice(null);
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString('vi-VN');

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 20, marginTop: 20, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#eff6ff', color: '#2563eb', display: 'grid', placeItems: 'center' }}>
          <Smartphone size={20} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>Thiết bị app</h3>
          <p style={{ margin: 0, fontSize: 12.5, color: '#64748b', fontWeight: 600 }}>
            Ứng dụng Android riêng chỉ liên kết với 1 điện thoại duy nhất.
          </p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, fontWeight: 600 }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang tải…
        </div>
      ) : device ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: 14, borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, fontWeight: 600 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>{device.device_name}</div>
            <div>Liên kết: {fmt(device.linked_at)}</div>
            <div>Hoạt động gần nhất: {fmt(device.last_seen_at)}</div>
            <div>
              Thông báo đẩy:{' '}
              <span style={{ color: device.fcm_token ? '#15803d' : '#b45309', fontWeight: 800 }}>
                {device.fcm_token ? 'Đang bật' : 'Chưa đăng ký / đã đăng xuất'}
              </span>
            </div>
          </div>
          <button
            onClick={unlink}
            disabled={busy}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 12, border: '1.5px solid #fecdd3', background: '#fff1f2', color: '#e11d48', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
          >
            {busy ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Unlink size={15} />} Gỡ liên kết
          </button>
        </div>
      ) : (
        <div style={{ padding: 14, borderRadius: 14, background: '#f8fafc', border: '1px dashed #cbd5e1', fontSize: 13, color: '#64748b', fontWeight: 600 }}>
          Chưa có thiết bị nào được liên kết. Đăng nhập admin trên app Android lần đầu để liên kết điện thoại của bạn.
        </div>
      )}
    </div>
  );
}

