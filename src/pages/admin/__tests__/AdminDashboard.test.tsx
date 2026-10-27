import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminDashboard from '../AdminDashboard';
import AdminOrders from '../AdminOrders';

const mock = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn(), slow: false, fail: false }));
vi.mock('@/lib/AppContext', () => ({ useApp: () => ({
  profile: { id: 'admin' }, isAdmin: true, refreshPendingOrdersCount: vi.fn(),
}) }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  rpc: mock.rpc, from: mock.from,
  channel: () => { const channel = { on: () => channel, subscribe: () => channel }; return channel; },
  removeChannel: vi.fn(),
} }));
vi.mock('recharts', () => {
  const Container = ({ children }: {children?: React.ReactNode}) => <div>{children}</div>;
  const Empty = () => null;
  const Svg = ({ children }: {children?: React.ReactNode}) => <svg>{children}</svg>;
  return { AreaChart: Svg, Area: Empty, XAxis: Empty, YAxis: Empty, CartesianGrid: Empty,
    Tooltip: Empty, ResponsiveContainer: Container, Cell: Empty, PieChart: Container, Pie: Container };
});

const summary = { revenue: 105200000, approved: 1051, pendingOrders: 200, rejected: 0, orders: 1251, users: 20, subjects: 4, exams: 5, questions: 100 };
const revenueText = /105\.200\.000\s*đ/;
let client: QueryClient;
function mount(component: React.ReactNode) {
  return render(<QueryClientProvider client={client}><MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}>{component}</MemoryRouter></QueryClientProvider>);
}
beforeEach(() => {
  mock.slow = false; mock.fail = false; mock.rpc.mockReset(); mock.from.mockReset();
  client = new QueryClient({ defaultOptions: {queries: {retry: false, gcTime: 0}} });
  mock.rpc.mockImplementation(async (name: string) => {
    if (name === 'admin_commerce_summary') return mock.fail ? {data:null,error:{message:'Database unavailable'}} : {data:summary,error:null};
    if (mock.slow) return new Promise(() => {});
    return {data:name === 'admin_revenue_series' ? [] : {rows:[],total:0,gross:0,count:0,unallocated:0},error:null};
  });
  mock.from.mockImplementation(() => {
    const query = {select:()=>query,order:()=>query,limit:()=>query,range:()=>query,
      then:(resolve:(v:unknown)=>unknown)=>Promise.resolve({data:[],count:0,error:null}).then(resolve)};
    return query;
  });
});
afterEach(() => { cleanup(); client.clear(); });

describe('admin revenue screens', () => {
  it('renders the full revenue before slow chart/ranking requests finish and does not fetch order items', async () => {
    mock.slow = true;
    mount(<AdminDashboard />);
    expect(await screen.findAllByText(revenueText)).not.toHaveLength(0);
    expect(mock.from.mock.calls.map(args=>args[0])).toEqual(['orders']);
    expect(mock.rpc).toHaveBeenCalledTimes(3); // summary, series, subject aggregate; no waterfall.
    expect(screen.queryByText('Chưa có đơn hàng trong khoảng thời gian này')).toBeNull();
  });
  it('uses the same cached global summary on Dashboard and Orders', async () => {
    const view = mount(<AdminDashboard />);
    await screen.findAllByText(revenueText);
    view.rerender(<QueryClientProvider client={client}><MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><AdminOrders /></MemoryRouter></QueryClientProvider>);
    await screen.findAllByText(revenueText);
    expect(mock.rpc.mock.calls.filter(args=>args[0] === 'admin_commerce_summary')).toHaveLength(1);
  });
  it('shows a failed initial summary as an error instead of a valid zero', async () => {
    mock.fail = true; mount(<AdminDashboard />);
    expect(await screen.findByText(/Database unavailable/)).toBeTruthy();
    expect(screen.queryByText(revenueText)).toBeNull();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
  it('retains the last successful revenue when refresh fails', async () => {
    mount(<AdminDashboard />);
    await screen.findAllByText(revenueText);
    mock.fail = true;
    await client.invalidateQueries({queryKey:['admin','admin','commerce']});
    await waitFor(()=>expect(screen.getByText(/Database unavailable/)).toBeTruthy());
    expect(screen.getAllByText(revenueText)).not.toHaveLength(0);
  });
});
