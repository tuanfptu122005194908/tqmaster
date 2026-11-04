import { Award, Flame } from 'lucide-react';
import { formatVND } from '@/lib/native/orderAlert';
import type { SubjectSales } from '../data';

interface TopSubjectsCardProps {
  data: SubjectSales | undefined;
  isPending?: boolean;
}

const RANK_COLORS = [
  { text: '#d97706', bg: '#fef3c7', bar: 'linear-gradient(90deg, #f59e0b, #d97706)' }, // #1 Gold
  { text: '#7c3aed', bg: '#ede9fe', bar: 'linear-gradient(90deg, #8b5cf6, #6d28d9)' }, // #2 Violet
  { text: '#2563eb', bg: '#dbeafe', bar: 'linear-gradient(90deg, #3b82f6, #1d4ed8)' }, // #3 Blue
  { text: '#059669', bg: '#d1fae5', bar: 'linear-gradient(90deg, #10b981, #059669)' }, // #4 Emerald
  { text: '#475569', bg: '#f1f5f9', bar: 'linear-gradient(90deg, #64748b, #475569)' }, // #5 Slate
];

export function TopSubjectsCard({ data, isPending }: TopSubjectsCardProps) {
  const rows = (data?.rows ?? []).slice(0, 5);
  const maxGross = Math.max(...rows.map((r) => r.gross || r.revenue), 1);

  return (
    <div className="aa-dash-card aa-top-subjects-card">
      <div className="aa-dash-card-header">
        <div className="aa-dash-card-title">
          <Flame size={17} className="aa-dash-title-ico text-amber-500" />
          <span>Top môn bán chạy nhất</span>
        </div>
        <span className="aa-badge-tag">
          <Award size={12} /> Bán chạy
        </span>
      </div>

      {isPending ? (
        <div className="aa-top-skel-list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aa-top-skel-item" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="aa-chart-empty">Chưa có giao dịch môn học nào</div>
      ) : (
        <div className="aa-top-list">
          {rows.map((sub, index) => {
            const style = RANK_COLORS[index] || RANK_COLORS[4];
            const rev = sub.gross || sub.revenue;
            const pct = Math.max(8, Math.min(100, Math.round((rev / maxGross) * 100)));

            return (
              <div key={sub.id || index} className="aa-top-item">
                <div className="aa-top-row">
                  <div className="aa-top-meta">
                    <span className="aa-rank-num" style={{ color: style.text, background: style.bg }}>
                      #{index + 1}
                    </span>
                    <b className="aa-top-name">{sub.name}</b>
                  </div>
                  <div className="aa-top-vals">
                    <span className="aa-top-count">{sub.count} đơn</span>
                    <b className="aa-top-price">{formatVND(rev)}</b>
                  </div>
                </div>

                <div className="aa-progress-track">
                  <div
                    className="aa-progress-bar"
                    style={{
                      width: `${pct}%`,
                      background: style.bar,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
