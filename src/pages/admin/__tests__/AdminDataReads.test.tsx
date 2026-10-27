import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import AdminSubjects from '../AdminSubjects';
import AdminExams from '../AdminExams';
import AdminTheory from '../AdminTheory';
import AdminAnnouncements from '../AdminAnnouncements';
import AdminNews from '../AdminNews';
import AdminCoupons from '../AdminCoupons';
import AdminQuestionReports from '../AdminQuestionReports';
import AdminSettings from '../AdminSettings';

const mock = vi.hoisted(() => ({ fail:true, rows:vi.fn(), upsert:vi.fn(), error:vi.fn(), success:vi.fn() }));
vi.mock('@/lib/AppContext', () => ({ useApp: () => ({profile:{id:'admin'}, refreshPendingReportsCount:vi.fn(), refreshSiteSettings:vi.fn()}) }));
vi.mock('@/lib/adminRead', () => ({readAdminRows:mock.rows, readAdminLinks:vi.fn()}));
vi.mock('@/lib/adminAnalytics', () => ({loadSubjectSales:async()=>({rows:[],total:0,gross:0,count:0,unallocated:0})}));
vi.mock('sonner', () => ({toast:{error:mock.error,success:mock.success}}));
vi.mock('@/integrations/supabase/client', () => ({supabase:{
  from:()=>({select:()=>({in:async()=>mock.fail ? {data:null,error:{message:'Database unavailable'}} : {data:[{key:'site_name',value:'Existing site'}],error:null}}),upsert:mock.upsert}),
  channel:()=>{const channel={on:()=>channel,subscribe:()=>channel};return channel;}, removeChannel:vi.fn(),
}}));
beforeEach(() => {
  mock.fail=true; mock.error.mockClear(); mock.success.mockClear(); mock.upsert.mockReset(); mock.rows.mockReset();
  mock.rows.mockImplementation(async()=>{if(mock.fail) throw new Error('Database unavailable'); return [];});
});
afterEach(cleanup);

describe('admin metadata reads', () => {
  it.each([
    ['subjects',AdminSubjects], ['exams',AdminExams], ['theory',AdminTheory],
    ['announcements',AdminAnnouncements], ['news',AdminNews], ['coupons',AdminCoupons],
    ['question reports',AdminQuestionReports],
  ] as const)('%s exposes a failed read and successfully retries instead of claiming an empty dataset', async (_name, Component) => {
    const view=render(<Component />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
    expect(view.container.querySelector('h1,h2,h3')).toBeNull();
    mock.fail=false;
    fireEvent.click(screen.getByRole('button',{name:'Thử lại'}));
    await waitFor(()=>expect(screen.queryByRole('alert')).toBeNull());
    await waitFor(()=>expect(view.container.querySelector('h1,h2,h3')).not.toBeNull());
  });

  it('prevents a failed settings load from becoming a blank save and preserves values on a failed save', async () => {
    render(<AdminSettings />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable');
    expect(screen.queryByRole('button',{name:/Lưu cấu hình/})).toBeNull();
    mock.fail=false;
    fireEvent.click(screen.getByRole('button',{name:'Thử lại'}));
    const name=await screen.findByDisplayValue('Existing site');
    mock.upsert.mockResolvedValue({error:{message:'Write denied'}});
    fireEvent.click(screen.getAllByRole('button',{name:'Lưu cấu hình'})[0]);
    await waitFor(()=>expect(mock.error).toHaveBeenCalledWith(expect.stringContaining('Write denied')));
    expect(mock.success).not.toHaveBeenCalled();
    expect(name).toHaveValue('Existing site');
  });
});
