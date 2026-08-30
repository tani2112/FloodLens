import React from 'react';
import { PeakMetricCondition } from '../../services/analytics/scenarioIntelligence';

interface PeakConditionsPanelProps {
  peakConditions: PeakMetricCondition[];
}

export const PeakConditionsPanel: React.FC<PeakConditionsPanelProps> = ({ peakConditions }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          🏔️ Peak Conditions Analytical Panel
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
          Maximum hydrological extremes recorded during simulation. <em>Note: Peak conditions occur at distinct timestamps across the hydrodynamic domain.</em>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        {peakConditions.map((pc, idx) => (
          <div
            key={idx}
            style={{
              background: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.3rem'
            }}
          >
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              {pc.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
              <strong style={{ fontSize: '1.4rem', fontWeight: 800, color: pc.isAvailable ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {pc.value}
              </strong>
              {pc.unit && <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{pc.unit}</span>}
            </div>
            <span style={{ fontSize: '0.75rem', color: pc.timeMin !== null ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 600 }}>
              {pc.subtext}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
