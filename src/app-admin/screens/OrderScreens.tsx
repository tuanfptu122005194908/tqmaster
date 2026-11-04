import { useEffect, useRef, useState } from 'react';
import { ChevronRight, RefreshCw, Search, ShoppingBag, TrendingUp, Users, Wallet, X } from 'lucide-react';
import Logo from '@/components/Logo';
import { formatVND } from '@/lib/native/orderAlert';
import {
  signBillUrl, useOrders, useRefreshAll, useReviewOrder, useSummary, type AppOrder, type OrderStatus,
} from '../data';
import { OrderCard } from '../OrderCard';

function Skeletons({ n = 3 }: { n?: number }) {
  return <div className="aa-list">{Array.from({ length: n }).map((_, i) => <div className="aa-skel" key={i} />)}</div>;
}

function Empty({ text }: { text: string }) {
  return (
    <div className="aa-empty">
      <Logo alt="" />
      <div>{text}</div>
    </div>
  );
}

function StatCard({ label, value, icon, bg, border, color, iconColor }: {
  label: string; value: string; icon: React.ReactNode; bg: string; border: string; color: string; iconColor: string;
}) {
  return (
    <div className="aa-stat" style={{ background: bg, borderColor: border }}>
      <div className="aa-stat-top">
        <span style={{ color }}>{label}</span>
        <div className="aa-stat-ico" style={{ color: iconColor }}>{icon}</div>
      </div>
      <b>{value}</b>
    </div>
  );
}

/** Shared approve / reject / bill logic for any list of orders. */
function useOrderActions(toast: (m: string) => void) {
  const review = useReviewOrder();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [bill, setBill] = useState<string | null>(null);

  const act = async (o: AppOrder, status: 'approved' | 'rejected') => {
    const verb = status === 'approved' ? 'duyệt' : 'từ chối';
    if (!window.confirm(`Xác nhận ${verb} đơn của ${o.full_name}?`)) return;
    setBusyId(o.id);
    try {
      await review.mutateAsync({ id: o.id, status });
      toast(status === 'approved' ? 'Đã duyệt đơn hàng' : 'Đã từ chối đơn hàng');
    } catch (e) {
      toast('Lỗi: ' + (e instanceof Error ? e.message : 'không xác định'));
    } finally {
      setBusyId(null);
    }
  };

  const openBill = async (o: AppOrder) => {
    if (!o.bill_image_url) return;
    try {
      setBill(await signBillUrl(o.bill_image_url));
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Không tải được ảnh bill');
    }
  };

  return { busyId, bill, closeBill: () => setBill(null), act, openBill };
}

function BillModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="aa-modal" onClick={onClose}>
      <div className="aa-modal-bar">
        <span>Ảnh bill chuyển khoản</span>
        <button onClick={onClose} aria-label="Đóng"><X size={20} /></button>
      </div>
      <img src={url} alt="Bill" />
    </div>
  );
}

export function OverviewScreen({ adminEmail, pending, onGoOrders, toast }: {
  adminEmail: string; pending: number; onGoOrders: () => void; toast: (m: string) => void;
}) {
  const summary = useSummary(true);
  const orders = useOrders(true, 'pending', '');
  const refresh = useRefreshAll();
  const actions = useOrderActions(toast);
  const s = summary.data;
  const avg = s && s.approved ? Math.round(s.revenue / s.approved) : 0;
  const name = adminEmail ? adminEmail.split('@')[0] : 'Admin';

  return (
    <div className="aa-scroll">
      <div className="aa-hero">
        <div className="aa-hero-row">
          <Logo alt="" />
          <div>
            <small>Xin chào,</small>
            <h1>{name} 👋</h1>
          </div>
          <span className="aa-livepill"><i /> Trực tiếp</span>
        </div>
      </div>

      <div className="aa-content">
        {summary.isPending ? (
          <div className="aa-stats">{[0, 1, 2, 3].map(i => <div className="aa-skel" style={{ height: 92 }} key={i} />)}</div>
        ) : (
          <div className="aa-stats">
            <StatCard label="Doanh thu" value={formatVND(s?.revenue ?? 0)} icon={<Wallet size={16} />}
              bg="#edf5ff" border="#dbeafe" color="#3b82f6" iconColor="#10b981" />
            <StatCard label="Đơn hàng" value={(s?.orders ?? 0).toLocaleString('vi-VN')} icon={<ShoppingBag size={16} />}
              bg="#f3eefd" border="#ede9fe" color="#8b5cf6" iconColor="#8b5cf6" />
            <StatCard label="Giá trị TB" value={formatVND(avg)} icon={<TrendingUp size={16} />}
              bg="#eafaf5" border="#d1fae5" color="#059669" iconColor="#10b981" />
            <StatCard label="Học viên" value={(s?.users ?? 0).toLocaleString('vi-VN')} icon={<Users size={16} />}
              bg="#fff7ed" border="#ffedd5" color="#d97706" iconColor="#f59e0b" />
          </div>
        )}

        <div className="aa-sec">
          <h3>Đơn chờ duyệt {pending > 0 && <span className="aa-count">{pending}</span>}</h3>
          <button onClick={() => void refresh()}><RefreshCw size={14} /> Làm mới</button>
        </div>

        {orders.isPending ? <Skeletons /> : orders.error ? (
          <Empty text="Không tải được dữ liệu. Bấm Làm mới để thử lại." />
        ) : (orders.data ?? []).length === 0 ? (
          <div className="aa-empty">
            <Logo alt="" />
            <div>Tuyệt vời! Không còn đơn nào chờ duyệt.</div>
            <button className="aa-btn ghost sm" style={{ marginTop: 12, marginInline: 'auto' }} onClick={onGoOrders}>
              Xem lịch sử {s?.orders ? `${s.orders.toLocaleString('vi-VN')} đơn hàng` : 'đơn hàng'} <ChevronRight size={16} />
            </button>
          </div>
        ) : (
          <div className="aa-list">
            {(orders.data ?? []).slice(0, 5).map(o => (
              <OrderCard key={o.id} order={o} busy={actions.busyId === o.id}
                onApprove={() => void actions.act(o, 'approved')} onReject={() => void actions.act(o, 'rejected')}
                onBill={() => void actions.openBill(o)} />
            ))}
            {(orders.data ?? []).length > 5 && (
              <button className="aa-btn ghost sm" onClick={onGoOrders}>Xem tất cả đơn <ChevronRight size={16} /></button>
            )}
          </div>
        )}
      </div>
      {actions.bill && <BillModal url={actions.bill} onClose={actions.closeBill} />}
    </div>
  );
}

const TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'rejected', label: 'Từ chối' },
  { key: 'all', label: 'Tất cả' },
];

export function OrdersScreen({ highlightId, initialStatus, toast }: {
  highlightId: string | null; initialStatus: OrderStatus | 'all'; toast: (m: string) => void;
}) {
  const [status, setStatus] = useState<OrderStatus | 'all'>(initialStatus);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const summary = useSummary(true);
  const orders = useOrders(true, status, debounced);
  const refresh = useRefreshAll();
  const actions = useOrderActions(toast);
  const scroller = useRef<HTMLDivElement>(null);
  const touchY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);

  const s = summary.data;
  const getTabCount = (key: OrderStatus | 'all'): number | null => {
    if (!s) return null;
    if (key === 'pending') return s.pendingOrders;
    if (key === 'approved') return s.approved;
    if (key === 'rejected') return s.rejected;
    if (key === 'all') return s.orders;
    return null;
  };

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search), 350);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => { if (highlightId) setStatus('all'); }, [highlightId]);

  useEffect(() => {
    if (!highlightId || !orders.data) return;
    window.setTimeout(() => document.getElementById(`order-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
  }, [highlightId, orders.data]);

  // Pull-to-refresh
  const onTouchStart = (e: React.TouchEvent) => { if ((scroller.current?.scrollTop ?? 0) <= 0) touchY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => {
    if (touchY.current === null) return;
    setPull(Math.min(60, Math.max(0, (e.touches[0].clientY - touchY.current) * 0.5)));
  };
  const onTouchEnd = () => {
    if (pull >= 48) void refresh();
    touchY.current = null;
    setPull(0);
  };

  return (
    <div className="aa-scroll" ref={scroller} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="aa-ptr" style={{ height: pull }}>
        <RefreshCw size={14} /> {pull >= 48 ? 'Thả để làm mới' : 'Kéo để làm mới'}
      </div>
      <div className="aa-page-head">
        <h1>Đơn hàng</h1>
        <p>Duyệt nhanh các giao dịch của học viên</p>
      </div>
      <div className="aa-input-wrap aa-search">
        <Search size={18} />
        <input className="aa-input" placeholder="Tìm tên, email, MSSV…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="aa-tabs">
        {TABS.map(t => {
          const count = getTabCount(t.key);
          return (
            <button key={t.key} className={`aa-tab ${status === t.key ? 'on' : ''}`} onClick={() => setStatus(t.key)}>
              {t.label}
              {typeof count === 'number' && (
                <span className={`aa-tab-badge ${t.key === 'pending' && count > 0 ? 'alert' : ''}`}>
                  {count > 999 ? '999+' : count}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="aa-content" style={{ marginTop: 0 }}>
        {orders.isPending ? <Skeletons n={4} /> : orders.error ? (
          <Empty text="Không tải được danh sách đơn. Kéo xuống để thử lại." />
        ) : (orders.data ?? []).length === 0 ? (
          status === 'pending' && !debounced ? (
            <div className="aa-empty">
              <Logo alt="" />
              <div>Không có đơn nào chờ duyệt</div>
              <p style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 12 }}>
                Toàn bộ đơn hàng trước đó đã được xử lý.
              </p>
              <button className="aa-btn ghost sm" style={{ marginInline: 'auto' }} onClick={() => setStatus('approved')}>
                Xem đơn đã duyệt ({s?.approved?.toLocaleString('vi-VN') ?? 0})
              </button>
            </div>
          ) : (
            <Empty text={debounced ? 'Không tìm thấy đơn phù hợp.' : 'Chưa có đơn nào ở mục này.'} />
          )
        ) : (
          <div className="aa-list">
            {(orders.data ?? []).map(o => (
              <OrderCard key={o.id} order={o} highlight={o.id === highlightId} busy={actions.busyId === o.id}
                onApprove={() => void actions.act(o, 'approved')} onReject={() => void actions.act(o, 'rejected')}
                onBill={() => void actions.openBill(o)} />
            ))}
          </div>
        )}
      </div>
      {actions.bill && <BillModal url={actions.bill} onClose={actions.closeBill} />}
    </div>
  );
}
