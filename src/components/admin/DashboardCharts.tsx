import { formatPrice } from '@/lib/mockData';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';

function RevenueTooltip({ active, payload, label }: {active?:boolean; payload?:{value?:number}[]; label?:string|number}) {
  if (!active || typeof payload?.[0]?.value !== 'number') return null;
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '12px 16px',
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
        {formatPrice(payload[0].value)}
      </div>
      <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700 }}>
        Doanh thu thực tế từ Supabase
      </div>
    </div>
  );
}

export function RevenueChart({data}: {data: {label:string;revenue:number}[]}) { return (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data} margin={{ top: 20, right: 10, bottom: 0, left: -15 }}>
              <defs>
                <linearGradient id="blueRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} dy={8} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} axisLine={false} tickLine={false} tickFormatter={v => v === 0 ? '0' : `${(v/1000000).toFixed(1)}M`} dx={-5} />
              <Tooltip content={<RevenueTooltip />} />
              <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fill="url(#blueRevGrad)" dot={{ r: 4, fill: '#ffffff', stroke: '#2563eb', strokeWidth: 2 }} activeDot={{ r: 7, fill: '#2563eb', stroke: '#ffffff', strokeWidth: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
); }

export function SubjectDonut({data,count}: {data: {name:string;revenue:number;color:string}[]; count:number}) { return (
                <div style={{ width: 170, height: 170, position: 'relative', flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        cx="50%" cy="50%"
                        innerRadius={56} outerRadius={80}
                        paddingAngle={4}
                        dataKey="revenue"
                      >
                        {data.map((d, i) => (
                          <Cell key={i} fill={d.color} stroke="#ffffff" strokeWidth={2} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                      {count}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginTop: 3 }}>
                      Đã bán
                    </div>
                  </div>
                </div>


); }
