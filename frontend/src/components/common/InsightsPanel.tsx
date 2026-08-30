import React from 'react';
import { ScenarioIntelligencePackage } from '../../services/analytics/scenarioIntelligence';
import { KpiCard } from './KpiCard';

interface InsightsPanelProps {
  intelligence: ScenarioIntelligencePackage;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ intelligence }) => {
  const {
    peakInundationAreaKm2,
    timeToPeakInundationMin,
    maxWaterDepthM,
    maxFlowVelocityMs,
    earliestSettlementArrivalMin,
    earliestSettlementName,
    affectedRoadLengthKm,
    analyticalStatements
  } = intelligence;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          🔍 Analytical Summary & Key Findings
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
          Deterministic intelligence derived directly from 2D diffusive wave simulation output rasters and spatial exposure vectors.
        </p>
      </div>

      {/* Primary Analytical Key Findings Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KpiCard
          label="Peak Flood Extent"
          value={peakInundationAreaKm2 !== null ? peakInundationAreaKm2.toFixed(2) : 'Data unavailable'}
          unit={peakInundationAreaKm2 !== null ? 'km²' : ''}
          subtext={timeToPeakInundationMin !== null ? `Peak reached at T + ${timeToPeakInundationMin.toFixed(1)} min` : 'Peak timestep unavailable'}
          badge="Extent"
        />

        <KpiCard
          label="Maximum Water Depth"
          value={maxWaterDepthM !== null ? maxWaterDepthM.toFixed(2) : 'Data unavailable'}
          unit={maxWaterDepthM !== null ? 'm' : ''}
          subtext="Peak river channel head"
          badge="Depth"
          badgeType="warning"
        />

        <KpiCard
          label="Peak Flow Velocity"
          value={maxFlowVelocityMs !== null ? maxFlowVelocityMs.toFixed(2) : 'Data unavailable'}
          unit={maxFlowVelocityMs !== null ? 'm/s' : ''}
          subtext="Kinetic flow discharge"
          badge="Speed"
        />

        <KpiCard
          label="Earliest Wave Contact"
          value={earliestSettlementArrivalMin !== null ? earliestSettlementArrivalMin.toFixed(1) : 'Data unavailable'}
          unit={earliestSettlementArrivalMin !== null ? 'min' : ''}
          subtext={earliestSettlementName ? `First hit: ${earliestSettlementName}` : 'Inundation onset'}
          badge="Lead Time"
          badgeType="safe"
        />

        <KpiCard
          label="Road Inundation Length"
          value={affectedRoadLengthKm !== null ? affectedRoadLengthKm.toFixed(2) : 'Data unavailable'}
          unit={affectedRoadLengthKm !== null ? 'km' : ''}
          subtext="Submerged local network"
          badge="Corridor"
        />
      </div>

      {/* Concise Automated Analytical Statements */}
      <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          📋 Important Analytical Observations
        </h4>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
          {analyticalStatements.map((stmt, idx) => (
            <li key={idx} style={{ lineHeight: '1.5' }}>
              {stmt.statement}
            </li>
          ))}
          {analyticalStatements.length === 0 && (
            <li style={{ color: 'var(--text-muted)' }}>Simulation outputs recorded without analytical exceptions.</li>
          )}
        </ul>
      </div>
    </div>
  );
};
