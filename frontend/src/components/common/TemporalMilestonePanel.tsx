import React from 'react';
import { TemporalMilestoneItem } from '../../services/analytics/scenarioIntelligence';

interface TemporalMilestonePanelProps {
  milestones: TemporalMilestoneItem[];
  onSelectMilestone?: (timeMin: number) => void;
}

export const TemporalMilestonePanel: React.FC<TemporalMilestonePanelProps> = ({
  milestones,
  onSelectMilestone
}) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
      <div>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          ⏱️ Hydrodynamic Temporal Milestones
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
          Chronological simulation events recorded across the 2D diffusive flow propagation window.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', position: 'relative' }}>
        {milestones.map((m, idx) => (
          <div
            key={m.id || idx}
            onClick={() => onSelectMilestone?.(m.timeMin)}
            style={{
              display: 'grid',
              gridTemplateColumns: '90px 1fr auto',
              gap: '1rem',
              alignItems: 'center',
              background: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              padding: '0.75rem 1rem',
              cursor: onSelectMilestone ? 'pointer' : 'default',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIMESTEP</span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--accent-primary)', fontWeight: 800 }}>
                {m.timeMin.toFixed(1)} m
              </strong>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {m.name}
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                {m.description}
              </p>
            </div>

            <div style={{ textAlign: 'right', background: 'var(--bg-surface)', padding: '0.35rem 0.65rem', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>{m.metricLabel}</span>
              <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{m.metricValue}</strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
