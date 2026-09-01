import React from 'react';

interface ScientificDisclaimerProps {
  compact?: boolean;
}

export const ScientificDisclaimer: React.FC<ScientificDisclaimerProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '1rem' }}>
        <strong>Disclaimer:</strong> FloodLens outputs are scenario-based estimations for decision support and screening. Not an official disaster warning or engineering hydraulic design model.
      </div>
    );
  }

  return (
    <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '0.85rem 1.1rem', fontSize: '0.82rem', color: '#713f12', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '1.1rem' }}>⚠️</span>
      <div>
        <strong style={{ display: 'block', marginBottom: '0.15rem' }}>Scientific & Operational Model Guardrail</strong>
        FloodLens hydrodynamic outputs are simulated scenario estimates designed for rapid screening and spatial risk awareness. They do <strong>not</strong> constitute official emergency management evacuation directives or certified civil engineering hydraulic design models.
      </div>
    </div>
  );
};
