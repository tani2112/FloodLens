import React from 'react';

export const InfrastructureAnalysis: React.FC = () => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          🏥 Critical Infrastructure Assets Analytics
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
          Assessment of hospitals, electrical substations, schools, and bridges.
        </p>
      </div>

      <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
            INFRASTRUCTURE DATASET: <span style={{ color: '#991b1b' }}>Unavailable</span>
          </strong>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#fee2e2', color: '#991b1b' }}>
            dataset_unavailable
          </span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
          <strong>Reason:</strong> Required spatial infrastructure dataset (hospitals, schools, bridges, energy substations) is not currently available for this study area.
        </p>
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
          Scientific integrity rule: Synthetic or fabricated infrastructure assets are strictly prohibited.
        </p>
      </div>
    </div>
  );
};
