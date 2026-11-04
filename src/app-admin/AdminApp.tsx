import { useCallback, useEffect, useState } from 'react';
import { Bell, LayoutDashboard, ListChecks, Settings, X } from 'lucide-react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_ALERT_PREFS, loadAlertPrefs, saveAlertPrefs, type AlertPrefs } from '@/lib/native/alertPrefs';
import { buildOrderAlertText } from '@/lib/native/orderAlert';
import { useAdminGate } from './useAdminGate';
import { useOrderAlerts } from './useOrderAlerts';
import { useSummary } from './data';
import { DeniedScreen, ErrorScreen, LockScreen, LoginScreen, SplashScreen } from './screens/AuthScreens';
import { OrdersScreen, OverviewScreen } from './screens/OrderScreens';
import { SettingsScreen } from './screens/SettingsScreen';
import './admin-app.css';

type Tab = 'overview' | 'orders' | 'settings';

function Shell({ gate }: { gate: ReturnType<typeof useAdminGate> }) {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [prefs, setPrefs] = useState<AlertPrefs>(DEFAULT_ALERT_PREFS);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const summary = useSummary(true);
  const pending = summary.data?.pendingOrders ?? 0;

  useEffect(() => { void loadAlertPrefs().then(setPrefs); }, []);

  const toast = useCallback((m: string) => {
    setToastMsg(m);
    window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  const openOrder = useCallback((id: string) => {
    setHighlight(id);
    setTab('orders');
    void qc.invalidateQueries({ queryKey: ['aa'] });
  }, [qc]);

  const alerts = useOrderAlerts({
    enabled: true,
    prefs,
    onOpenOrder: openOrder,
    onNewOrder: () => void qc.invalidateQueries({ queryKey: ['aa'] }),
  });

  // Keep list fresh when any order changes (approve from web, etc.)
  useEffect(() => {
    const ch = supabase
      .channel(`aa-orders-live-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void qc.invalidateQueries({ queryKey: ['aa'] });
      })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [qc]);

  const changePrefs = (p: AlertPrefs) => { setPrefs(p); void saveAlertPrefs(p); };

  return (
    <div className="aa-shell">
      {tab === 'overview' && (
        <OverviewScreen adminEmail={gate.adminEmail} pending={pending} onGoOrders={() => setTab('orders')} toast={toast} />
      )}
      {tab === 'orders' && (
        <OrdersScreen highlightId={highlight} initialStatus="pending" toast={toast} />
      )}
      {tab === 'settings' && (
        <SettingsScreen prefs={prefs} onChange={changePrefs} onTest={alerts.test} onLock={gate.lock}
          onSignOut={() => void gate.signOut()} adminEmail={gate.adminEmail} />
      )}

      {alerts.banner && (
        <div className="aa-banner" role="alert">
          <div className="aa-banner-ico"><Bell size={22} /></div>
          <div className="aa-banner-txt">
            <small>Đơn hàng mới</small>
            <b>{buildOrderAlertText(alerts.banner)}</b>
          </div>
          {!alerts.banner.orderId.startsWith('test-') && (
            <button onClick={() => { openOrder(alerts.banner!.orderId); alerts.dismiss(); }}>Xem</button>
          )}
          <button className="x" onClick={alerts.dismiss} aria-label="Đóng"><X size={18} /></button>
        </div>
      )}

      {toastMsg && <div className="aa-toast">{toastMsg}</div>}

      <nav className="aa-nav">
        <button className={tab === 'overview' ? 'on' : ''} onClick={() => setTab('overview')}>
          <LayoutDashboard size={22} /> Tổng quan
        </button>
        <button className={tab === 'orders' ? 'on' : ''} onClick={() => { setHighlight(null); setTab('orders'); }}>
          <ListChecks size={22} /> Đơn hàng
          {pending > 0 && <span className="aa-dot">{pending > 99 ? '99+' : pending}</span>}
        </button>
        <button className={tab === 'settings' ? 'on' : ''} onClick={() => setTab('settings')}>
          <Settings size={22} /> Cài đặt
        </button>
      </nav>
    </div>
  );
}

function Gate() {
  const gate = useAdminGate();

  if (gate.phase === 'booting') return <SplashScreen />;
  if (gate.phase === 'signed_out') return <LoginScreen onSubmit={gate.signIn} />;
  if (gate.phase === 'denied' && gate.denial) {
    return <DeniedScreen reason={gate.denial} onBack={() => window.location.reload()} />;
  }
  if (gate.phase === 'error') return <ErrorScreen message={gate.errorMsg ?? ''} onRetry={() => void gate.retry()} />;
  if (gate.phase === 'locked') {
    return <LockScreen onUnlock={() => void gate.unlock()} message={gate.lockMsg} firstTime={gate.firstTime} email={gate.adminEmail} />;
  }
  return <Shell gate={gate} />;
}

export default function AdminApp() {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: true } } }));
  useEffect(() => {
    document.body.classList.add('aa-body');
    return () => document.body.classList.remove('aa-body');
  }, []);
  return (
    <QueryClientProvider client={client}>
      <div className="aa-root"><Gate /></div>
    </QueryClientProvider>
  );
}

