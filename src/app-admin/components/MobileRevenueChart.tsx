import { useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { formatVND } from '@/lib/native/orderAlert';
import type { RevenuePeriod, RevenuePoint } from '../data';

interface MobileRevenueChartProps {
  data: RevenuePoint[] | undefined;
  isPending?: boolean;
  period: RevenuePeriod;
  onChangePeriod: (p: RevenuePeriod) => void;
}

const PERIODS: { key: RevenuePeriod; label: string }[] = [
  { key: 'day', label: '14 Ngày' },
  { key: 'week', label: '8 Tuần' },
  { key: 'month', label: 'Tháng' },
];

export function MobileRevenueChart({ data, isPending, period, onChangePeriod }: MobileRevenueChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const points = data ?? [];
  const maxRev = Math.max(...points.map((p) => p.revenue), 100_000);
  const totalRev = points.reduce((acc, p) => acc + p.revenue, 0);

  // SVG layout metrics
  const W = 330;
  const H = 145;
  const padBottom = 24;
  const padTop = 18;
  const plotH = H - padTop - padBottom;
  const n = points.length || 1;
  const barW = Math.max(8, Math.min(22, (W - 20) / n - 4));
  const step = (W - 20) / n;

  const activePoint = activeIndex !== null && points[activeIndex] ? points[activeIndex] : null;

  return (
    <div className="aa-dash-card aa-chart-card">
      <div className="aa-dash-card-header">
        <div>
          <div className="aa-dash-card-title">
            <BarChart3 size={17} className="aa-dash-title-ico text-blue-600" />
            <span>Biểu đồ doanh thu</span>
          </div>
          <div className="aa-chart-total">
            <b>{formatVND(totalRev)}</b>
            <span className="aa-chart-sub">
              <TrendingUp size={12} /> trong chu kỳ
            </span>
          </div>
        </div>

        <div className="aa-pill-switch">
          {PERIODS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`aa-pill-btn ${period === t.key ? 'active' : ''}`}
              onClick={() => {
                setActiveIndex(null);
                onChangePeriod(t.key);
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {isPending ? (
        <div className="aa-chart-skel" />
      ) : points.length === 0 ? (
        <div className="aa-chart-empty">Chưa có dữ liệu doanh thu trong chu kỳ này</div>
      ) : (
        <div className="aa-svg-wrap">
          {activePoint && (
            <div
              className="aa-chart-tooltip"
              style={{
                left: `${Math.min(W - 80, Math.max(10, 10 + (activeIndex ?? 0) * step + step / 2 - 40))}px`,
              }}
            >
              <div className="lbl">{activePoint.label}</div>
              <div className="val">{formatVND(activePoint.revenue)}</div>
            </div>
          )}

          <svg viewBox={`0 0 ${W} ${H}`} className="aa-svg-chart">
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="barGradActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>

            {/* Dotted reference lines */}
            <line x1="8" y1={padTop} x2={W - 8} y2={padTop} stroke="#e2e8f0" strokeDasharray="3 3" />
            <line
              x1="8"
              y1={padTop + plotH / 2}
              x2={W - 8}
              y2={padTop + plotH / 2}
              stroke="#f1f5f9"
              strokeDasharray="2 2"
            />
            <line x1="8" y1={H - padBottom} x2={W - 8} y2={H - padBottom} stroke="#cbd5e1" strokeWidth="1" />

            {/* Bars */}
            {points.map((p, i) => {
              const barH = Math.max(3, (p.revenue / maxRev) * plotH);
              const x = 10 + i * step + (step - barW) / 2;
              const y = H - padBottom - barH;
              const isActive = activeIndex === i;

              // Only label selected sparse points to avoid text collisions on mobile
              const showLabel = n <= 8 || i === 0 || i === Math.floor(n / 2) || i === n - 1 || isActive;

              return (
                <g
                  key={i}
                  className="aa-bar-group"
                  onClick={() => setActiveIndex(isActive ? null : i)}
                  onTouchStart={() => setActiveIndex(i)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Invisible hit-box for comfortable thumb tap */}
                  <rect
                    x={10 + i * step}
                    y={padTop}
                    width={step}
                    height={plotH}
                    fill="transparent"
                  />
                  {/* Visual Bar */}
                  <rect
                    x={x}
                    y={y}
                    width={barW}
                    height={barH}
                    rx="4"
                    ry="4"
                    fill={isActive ? 'url(#barGradActive)' : p.revenue > 0 ? 'url(#barGrad)' : '#e2e8f0'}
                    opacity={isActive ? 1 : p.revenue > 0 ? 0.9 : 0.4}
                  />
                  {/* Date label */}
                  {showLabel && (
                    <text
                      x={x + barW / 2}
                      y={H - 7}
                      textAnchor="middle"
                      className={`aa-bar-lbl ${isActive ? 'active' : ''}`}
                    >
                      {p.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
