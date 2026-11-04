import { BellRing, LogOut, Lock, Smartphone, Vibrate, Volume2, Mic, ShieldCheck, Send } from 'lucide-react';
import Logo from '@/components/Logo';
import type { AlertPrefs } from '@/lib/native/alertPrefs';
import { playChime } from '@/lib/native/alertPlayer';

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button className={`aa-switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />;
}

export function SettingsScreen({ prefs, onChange, onTest, onLock, onSignOut, adminEmail }: {
  prefs: AlertPrefs;
  onChange: (p: AlertPrefs) => void;
  onTest: () => void;
  onLock: () => void;
  onSignOut: () => void;
  adminEmail: string;
}) {
  return (
    <div className="aa-scroll">
      <div className="aa-page-head">
        <h1>Cài đặt</h1>
        <p>Âm thanh thông báo & bảo mật thiết bị</p>
      </div>
      <div className="aa-content" style={{ marginTop: 0 }}>
        <div className="aa-sec" style={{ marginTop: 4 }}><h3><BellRing size={18} color="#3b82f6" /> Thông báo đơn mới</h3></div>
        <div className="aa-card">
          <div className="aa-row">
            <div className="aa-row-ico" style={{ background: '#eff6ff', color: '#2563eb' }}><Volume2 size={19} /></div>
            <div className="aa-row-txt">
              <b>Âm thông báo</b>
              <small>Chuông đơn hàng khi app đang mở</small>
            </div>
            <div className="aa-seg">
              <button className={prefs.sound === 'chime' ? 'on' : ''} onClick={() => { onChange({ ...prefs, sound: 'chime' }); void playChime(); }}>Chuông</button>
              <button className={prefs.sound === 'off' ? 'on' : ''} onClick={() => onChange({ ...prefs, sound: 'off' })}>Tắt</button>
            </div>
          </div>
          <div className="aa-row">
            <div className="aa-row-ico" style={{ background: '#f3eefd', color: '#7c3aed' }}><Mic size={19} /></div>
            <div className="aa-row-txt">
              <b>Đọc tên người mua</b>
              <small>“Bạn có đơn hàng từ …” bằng giọng nói tiếng Việt</small>
            </div>
            <Switch on={prefs.speak} onChange={v => onChange({ ...prefs, speak: v })} label="Đọc tên người mua" />
          </div>
          <div className="aa-row">
            <div className="aa-row-ico" style={{ background: '#eafaf5', color: '#059669' }}><Vibrate size={19} /></div>
            <div className="aa-row-txt">
              <b>Rung</b>
              <small>Rung nhẹ khi có đơn mới</small>
            </div>
            <Switch on={prefs.vibrate} onChange={v => onChange({ ...prefs, vibrate: v })} label="Rung" />
          </div>
          <div className="aa-row" style={{ paddingBottom: 16 }}>
            <button className="aa-btn sm" onClick={onTest}><Send size={16} /> Gửi thông báo thử</button>
          </div>
        </div>

        <div className="aa-sec"><h3><ShieldCheck size={18} color="#10b981" /> Bảo mật thiết bị</h3></div>
        <div className="aa-card">
          <div className="aa-row">
            <div className="aa-row-ico" style={{ background: '#fff7ed', color: '#d97706' }}><Smartphone size={19} /></div>
            <div className="aa-row-txt">
              <b>Thiết bị đã liên kết</b>
              <small>Chỉ điện thoại này dùng được tài khoản admin{adminEmail ? ` (${adminEmail})` : ''}. Đổi máy: gỡ liên kết ở web admin.</small>
            </div>
          </div>
          <div className="aa-row">
            <div className="aa-row-ico" style={{ background: '#eff6ff', color: '#2563eb' }}><Lock size={19} /></div>
            <div className="aa-row-txt">
              <b>Khoá ngay</b>
              <small>App cũng tự khoá sau 1 phút ở nền</small>
            </div>
            <button className="aa-btn ghost sm" style={{ width: 'auto', padding: '0 16px' }} onClick={onLock}>Khoá</button>
          </div>
          <div className="aa-row">
            <div className="aa-row-ico" style={{ background: '#ffe4e6', color: '#e11d48' }}><LogOut size={19} /></div>
            <div className="aa-row-txt">
              <b>Đăng xuất</b>
              <small>Ngừng nhận thông báo trên máy này</small>
            </div>
            <button className="aa-btn danger sm" style={{ width: 'auto', padding: '0 16px' }} onClick={onSignOut}>Đăng xuất</button>
          </div>
        </div>

        <div className="aa-foot" style={{ marginTop: 26 }}>
          <Logo alt="" style={{ width: 22, height: 22 }} /> TQMaster Admin · bản dùng riêng
        </div>
        <div style={{ height: 8 }} />
      </div>
    </div>
  );
}
