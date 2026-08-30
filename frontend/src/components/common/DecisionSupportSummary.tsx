import React from 'react';
import { DecisionSupportSummaryData, DataQualityIndicator } from '../../services/analytics/scenarioIntelligence';
import { ScientificDisclaimer } from './ScientificDisclaimer';

interface DecisionSupportSummaryProps {
  decisionSupport: DecisionSupportSummaryData;
  dataQuality: DataQualityIndicator[];
}

export const DecisionSupportSummary: React.FC<DecisionSupportSummaryProps> = ({
  decisionSupport,
  dataQuality
}) => {
  const getSeverityBadgeClass = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return 'badge-critical';
      case 'WARNING': return 'badge-warning';
      case 'WATCH': return 'badge-watch';
      case 'ADVISORY': return 'badge-advisory';
      default: return 'badge-safe';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <ScientificDisclaimer />

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem' }}>
        {/* Decision Support Operational Summary */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Decision-Support Matrix
            </span>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
              Operational Impact & Exposure Summary
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Flood Extent Severity</span>
              <span className={`badge ${getSeverityBadgeClass(decisionSupport.floodSeverity)}`} style={{ marginTop: '0.3rem', display: 'inline-block' }}>
                {decisionSupport.floodSeverity}
              </span>
            </div>

            <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Settlement Risk</span>
              <span className={`badge ${getSeverityBadgeClass(decisionSupport.settlementSeverity)}`} style={{ marginTop: '0.3rem', display: 'inline-block' }}>
                {decisionSupport.settlementSeverity}
              </span>
            </div>

            <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block' }}>Road Corridor Exposure</span>
              <span className={`badge ${getSeverityBadgeClass(decisionSupport.roadSeverity)}`} style={{ marginTop: '0.3rem', display: 'inline-block' }}>
                {decisionSupport.roadSeverity}
              </span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.85rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              Primary Risk Factors Identified
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {decisionSupport.primaryRiskFactors.map((rf, idx) => (
                <li key={idx}>{rf}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Data Quality & Status Indicators */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              🛡️ Data Quality & Availability Status
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              Dataset completeness indicators for scientific decision backing.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {dataQuality.map((dq, idx) => {
              let badgeColor = '#15803d';
              let badgeBg = '#dcfce7';
              if (dq.status === 'requires_census_dataset') {
                badgeColor = '#b45309';
                badgeBg = '#fef3c7';
              } else if (dq.status === 'unavailable') {
                badgeColor = '#991b1b';
                badgeBg = '#fee2e2';
              }

              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-secondary)', padding: '0.45rem 0.65rem', borderRadius: '5px', border: '1px solid var(--border-color)', fontSize: '0.78rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dq.dataset}</span>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px', background: badgeBg, color: badgeColor }}>
                    {dq.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
