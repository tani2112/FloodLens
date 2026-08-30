import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SimulationNav } from '../components/simulations/SimulationNav';
import { apiClient } from '../services/api/client';
import { Warning } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { ScientificDisclaimer } from '../components/common/ScientificDisclaimer';

export const WarningsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const simId = id || 'NP-2026-08-26-001';

  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getWarnings(simId)
      .then((data) => {
        setWarnings(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.detail || err.message || 'Failed loading warning alerts');
        setLoading(false);
      });
  }, [simId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Early Warning & Decision Support Alerts
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Simulation Run ID: <strong>{simId}</strong> | Automated Hazard Threshold Alerts
          </p>
        </div>
      </div>

      <SimulationNav simulationId={simId} />

      <ScientificDisclaimer />

      {loading ? (
        <div className="card" style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>
          Evaluating early warning decision support rules...
        </div>
      ) : error ? (
        <div className="card" style={{ borderColor: '#fca5a5', background: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
      ) : warnings.length === 0 ? (
        <div className="card" style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>
          No critical early warning alerts triggered for this simulation run.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {warnings.map((w, idx) => {
            const isCritical = w.level === 'critical';
            const isWarning = w.level === 'warning';
            const isWatch = w.level === 'watch';

            const borderColor = isCritical ? '#ef4444' : isWarning ? '#f97316' : isWatch ? '#eab308' : '#64748b';
            const bgColor = isCritical ? '#fef2f2' : isWarning ? '#fff7ed' : isWatch ? '#fefce8' : '#ffffff';

            return (
              <div
                key={idx}
                className="card"
                style={{
                  borderLeft: `5px solid ${borderColor}`,
                  background: bgColor
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    🚨 {w.villageName || w.villageId}
                  </h3>
                  <SeverityBadge severity={w.level} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', background: 'rgba(255,255,255,0.7)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div><strong>Peak Water Depth:</strong> {w.maxDepthM.toFixed(2)} m</div>
                  <div><strong>Peak Flow Speed:</strong> {w.maxVelocityMs.toFixed(2)} m/s</div>
                  <div><strong>Arrival Time:</strong> {w.arrivalTimeMin ? `${w.arrivalTimeMin.toFixed(1)} min` : 'N/A'}</div>
                  <div><strong>Rule Trigger:</strong> {w.triggeredBy}</div>
                </div>

                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '0.5rem', fontStyle: 'italic' }}>
                  {w.disclaimer || 'Scenario-based early-warning / decision-support output — not an official disaster warning.'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
