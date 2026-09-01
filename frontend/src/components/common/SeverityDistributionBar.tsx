import React from 'react';

interface SeverityDistributionBarProps {
  safeCount: number;
  lowCount: number;
  moderateCount: number;
  highCount: number;
  criticalCount: number;
  totalCount: number;
}

export const SeverityDistributionBar: React.FC<SeverityDistributionBarProps> = ({
  safeCount,
  lowCount,
  moderateCount,
  highCount,
  criticalCount,
  totalCount
}) => {
  const total = totalCount > 0 ? totalCount : 1;

  const tiers = [
    { key: 'CRITICAL', label: 'CRITICAL', count: criticalCount, color: 'var(--severity-critical-bg, #ef4444)', textColor: '#b91c1c' },
    { key: 'HIGH', label: 'HIGH', count: highCount, color: 'var(--severity-high-bg, #f97316)', textColor: '#c2410c' },
    { key: 'MODERATE', label: 'MODERATE', count: moderateCount, color: 'var(--severity-moderate-bg, #f59e0b)', textColor: '#b45309' },
    { key: 'LOW', label: 'LOW', count: lowCount, color: 'var(--severity-low-bg, #eab308)', textColor: '#a16207' },
    { key: 'SAFE', label: 'SAFE', count: safeCount, color: 'var(--severity-safe-bg, #22c55e)', textColor: '#15803d' }
  ];

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          📊 Settlement Exposure Severity Distribution
        </h4>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {totalCount} Total Villages Evaluated
        </span>
      </div>

      {/* Horizontal Stacked Distribution Segment Bar */}
      <div style={{ display: 'flex', height: '14px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-surface-secondary)' }}>
        {tiers.map((t) => {
          const pct = (t.count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={t.key}
              style={{
                width: `${pct}%`,
                background: t.color,
                transition: 'width 0.3s ease'
              }}
              title={`${t.label}: ${t.count} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Severity Breakdown Legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem' }}>
        {tiers.map((t) => {
          const pct = ((t.count / total) * 100).toFixed(1);
          return (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-surface-secondary)', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: t.color }} />
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.label}:</span>
              <span style={{ color: t.textColor, fontWeight: 700 }}>{t.count}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
