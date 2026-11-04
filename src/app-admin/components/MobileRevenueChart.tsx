import { useRef, useState } from 'react';
import { LineChart, Sparkles, TrendingUp } from 'lucide-react';
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
  { key: 'month', label: 'Theo Tháng' },
];

/**
 * Builds smooth Catmull-Rom to Cubic Bézier spline paths for both line and filled area.
 */
function buildSmoothSpline(points: { x: number; y: number }[], baselineY: number) {
  if (points.length === 0) return { linePath: '', areaPath: '' };
  if (points.length === 1) {
    const p = points[0];
    const lp = `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y}`;
    const ap = `M ${p.x - 20} ${p.y} L ${p.x + 20} ${p.y} L ${p.x + 20} ${baselineY} L ${p.x - 20} ${baselineY} Z`;
    return { linePath: lp, areaPath: ap };
  }

  let linePath = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    let cp1y = p1.y + (p2.y - p0.y) / 6;

    const cp2x = p2.x - (p3.x - p1.x) / 6;
    let cp2y = p2.y - (p3.y - p1.y) / 6;

    // Dampen overshoot when consecutive values plateau or change direction
    if ((p2.y >= p1.y && cp1y < p1.y) || (p2.y <= p1.y && cp1y > p1.y)) cp1y = p1.y;
    if ((p2.y >= p1.y && cp2y > p2.y) || (p2.y <= p1.y && cp2y < p2.y)) cp2y = p2.y;

    linePath += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  const first = points[0];
  const last = points[points.length - 1];
  const areaPath = `${linePath} L ${last.x.toFixed(1)} ${baselineY.toFixed(1)} L ${first.x.toFixed(1)} ${baselineY.toFixed(1)} Z`;

  return { linePath, areaPath };
}

export function MobileRevenueChart({ data, isPending, period, onChangePeriod }: MobileRevenueChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const points = data ?? [];
  const maxRev = Math.max(...points.map((p) => p.revenue), 100_000);
  const totalRev = points.reduce((acc, p) => acc + p.revenue, 0);

  // SVG dimensions
  const W = 340;
  const H = 160;
  const padLeft = 14;
  const padRight = 14;
  const padTop = 22;
  const padBottom = 26;
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;
  const baselineY = H - padBottom;

  const n = points.length;
  const coords = points.map((p, i) => {
    const x = n > 1 ? padLeft + (i / (n - 1)) * plotW : W / 2;
    const y = baselineY - (p.revenue / maxRev) * plotH;
    return { x, y, point: p, index: i };
  });

  const { linePath, areaPath } = buildSmoothSpline(coords, baselineY);

  const activeCoord = activeIndex !== null && coords[activeIndex] ? coords[activeIndex] : null;
  const displayRev = activeCoord ? activeCoord.point.revenue : totalRev;
  const displaySub = activeCoord ? activeCoord.point.label : 'trong chu kỳ';

  const handlePointer = (clientX: number) => {
    if (!svgRef.current || coords.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * W;

    let closestIdx = 0;
    let minDist = Infinity;
    coords.forEach((c, idx) => {
      const d = Math.abs(c.x - relX);
      if (d < minDist) {
        minDist = d;
        closestIdx = idx;
      }
    });
    setActiveIndex(closestIdx);
  };

  return (
    <div className="aa-dash-card aa-linechart-card">
      {/* Header */}
      <div className="aa-dash-card-header">
        <div>
          <div className="aa-dash-card-title">
            <LineChart size={17} className="aa-dash-title-ico text-blue-600" />
            <span>Phân tích doanh thu</span>
          </div>
          <div className="aa-chart-total">
            <b className="aa-chart-live-val">{formatVND(displayRev)}</b>
            <span className={`aa-chart-sub ${activeCoord ? 'is-scrubbing' : ''}`}>
              {activeCoord ? <Sparkles size={12} /> : <TrendingUp size={12} />} {displaySub}
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
        <div className="aa-linechart-wrap">
          {/* Floating Tooltip Indicator */}
          {activeCoord && (
            <div
              className="aa-line-tooltip"
              style={{
                left: `${Math.min(W - 90, Math.max(10, activeCoord.x - 45))}px`,
                top: `${Math.max(2, activeCoord.y - 36)}px`,
              }}
            >
              <div className="tip-lbl">{activeCoord.point.label}</div>
              <div className="tip-val">{formatVND(activeCoord.point.revenue)}</div>
            </div>
          )}

          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            className="aa-svg-linechart"
            onTouchStart={(e) => handlePointer(e.touches[0].clientX)}
            onTouchMove={(e) => handlePointer(e.touches[0].clientX)}
            onMouseMove={(e) => handlePointer(e.clientX)}
            onClick={(e) => handlePointer(e.clientX)}
          >
            <defs>
              {/* Luminous Area Fill Gradient */}
              <linearGradient id="areaGlowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.38" />
                <stop offset="45%" stopColor="#60a5fa" stopOpacity="0.16" />
                <stop offset="85%" stopColor="#93c5fd" stopOpacity="0.04" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>

              {/* Ultra-crisp Line Gradient */}
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>

              {/* Soft Drop Glow */}
              <filter id="glowEffect" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#2563eb" floodOpacity="0.32" />
              </filter>
            </defs>

            {/* Dotted horizontal micro-grids */}
            <line x1={padLeft} y1={padTop} x2={W - padRight} y2={padTop} stroke="#e2e8f0" strokeDasharray="3 3" />
            <line
              x1={padLeft}
              y1={padTop + plotH / 2}
              x2={W - padRight}
              y2={padTop + plotH / 2}
              stroke="#f1f5f9"
              strokeDasharray="2 2"
            />
            <line x1={padLeft} y1={baselineY} x2={W - padRight} y2={baselineY} stroke="#e2e8f0" strokeWidth="1" />

            {/* Area Fill Under Spline Curve */}
            {areaPath && <path d={areaPath} fill="url(#areaGlowGrad)" />}

            {/* Smooth Spline Stroke */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="url(#lineGrad)"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glowEffect)"
              />
            )}

            {/* Active Vertical Scrubber Crosshair */}
            {activeCoord && (
              <g className="aa-scrubber-group">
                <line
                  x1={activeCoord.x}
                  y1={padTop}
                  x2={activeCoord.x}
                  y2={baselineY}
                  stroke="#3b82f6"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                {/* Outer Glow Halo */}
                <circle
                  cx={activeCoord.x}
                  cy={activeCoord.y}
                  r="9"
                  fill="rgba(37, 99, 235, 0.22)"
                  stroke="rgba(59, 130, 246, 0.45)"
                  strokeWidth="1.5"
                />
                {/* Inner Solid Core */}
                <circle
                  cx={activeCoord.x}
                  cy={activeCoord.y}
                  r="4.5"
                  fill="#1d4ed8"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />
              </g>
            )}

            {/* X-axis Date Markers */}
            {coords.map((c, i) => {
              const show = n <= 8 || i === 0 || i === Math.floor(n / 2) || i === n - 1;
              if (!show) return null;
              return (
                <text
                  key={i}
                  x={c.x}
                  y={H - 8}
                  textAnchor="middle"
                  className={`aa-line-lbl ${activeIndex === i ? 'active' : ''}`}
                >
                  {c.point.label}
                </text>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
}
