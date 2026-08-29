import React from 'react';

export const NepalCaseStudyPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase' }}>
          Retrospective Case Study — Transboundary Himalayan Flood
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Bhotekoshi–Trishuli GLOF & Flash Flood Event
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Analysis of glacial lake outburst flood propagation, steep Himalayan topography, and cross-border early warning challenges.
        </p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>Executive Summary & Hydraulic Characteristics</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
          Glacial Lake Outburst Floods (GLOFs) in northern Nepal and Tibet present extreme risks to downstream hydropower installations and village settlements along the Trishuli and Sun Koshi river corridors. Peak discharge rates exceed thousands of cubic meters per second within minutes of Moraine dam failure.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.85rem' }}>
          <div><strong>Geographic Region:</strong> Central Nepal / Transboundary Tibet</div>
          <div><strong>Primary Trigger:</strong> Moraine Dam Breach / GLOF</div>
          <div><strong>Topographic Gradient:</strong> Extreme Alpine (&gt;15% bed slope)</div>
          <div><strong>Downstream Assets:</strong> Hydropower Plants & Highway Bridges</div>
        </div>
      </div>
    </div>
  );
};
