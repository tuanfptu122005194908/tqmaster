import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Image as ImageIcon, Loader2, X } from 'lucide-react';
import { formatVND } from '@/lib/native/orderAlert';
import { timeAgo, type AppOrder } from './data';

const STATUS_LABEL = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Đã từ chối' } as const;

export function OrderCard({ order, highlight, busy, onApprove, onReject, onBill }: {
  order: AppOrder;
  highlight?: boolean;
  busy?: boolean;
  onApprove: () => void;
  onReject: () => void;
  onBill: () => void;
}) {
  const [open, setOpen] = useState(false);
  const subjects = (order.order_items || []).map(i => i.subjects?.name).filter(Boolean) as string[];
  const initial = (order.full_name || '?').trim().charAt(0).toUpperCase();

  return (
    <div id={`order-${order.id}`} className={`aa-order ${order.status} ${highlight ? 'hl' : ''}`}>
      <div className="aa-order-top">
        <div className="aa-avatar">{initial}</div>
        <div className="aa-order-main">
          <div className="aa-order-name">{order.full_name}</div>
          <div className="aa-order-sub">{order.student_code || order.email} · {timeAgo(order.created_at)}</div>
        </div>
        <div>
          <div className="aa-amount">{formatVND(order.final_amount)}</div>
          <div style={{ textAlign: 'right' }}>
            <span className={`aa-badge ${order.status}`}>{STATUS_LABEL[order.status]}</span>
          </div>
        </div>
      </div>

      {subjects.length > 0 && (
        <div className="aa-chips">
          {subjects.map((s, i) => <span className="aa-chip" key={i}>{s}</span>)}
        </div>
      )}

      {open && (
        <div className="aa-detail">
          <div><span>Mã đơn</span><b>#{order.id.slice(0, 8)}</b></div>
          <div><span>Email</span><b>{order.email}</b></div>
          {order.student_code && <div><span>MSSV</span><b>{order.student_code}</b></div>}
          <div><span>Thời gian</span><b>{new Date(order.created_at).toLocaleString('vi-VN')}</b></div>
          {order.note && <div><span>Ghi chú</span><b>{order.note}</b></div>}
          {order.bill_image_url && (
            <button className="aa-btn ghost sm" onClick={onBill}><ImageIcon size={16} /> Xem ảnh bill</button>
          )}
        </div>
      )}

      {order.status === 'pending' && (
        <div className="aa-actions">
          <button className="aa-btn danger sm" disabled={busy} onClick={onReject}><X size={16} /> Từ chối</button>
          <button className="aa-btn green sm" disabled={busy} onClick={onApprove}>
            {busy ? <Loader2 size={16} className="aa-spin" /> : <Check size={16} />} Duyệt đơn
          </button>
        </div>
      )}

      <button className="aa-more" onClick={() => setOpen(o => !o)}>
        {open ? <>Thu gọn <ChevronUp size={14} /></> : <>Chi tiết <ChevronDown size={14} /></>}
      </button>
    </div>
  );
}

