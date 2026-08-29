import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SimulationNav } from '../components/simulations/SimulationNav';
import { apiClient } from '../services/api/client';
import { Warning } from '../types';

export const WarningsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const simId = id || 'sim-level1-default';

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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Early Warning Decision Support Alerts
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Simulation Run: <code style={{ color: 'var(--accent-cyan)' }}>{simId}</code>
          </p>
        </div>
      </div>

      <SimulationNav simulationId={simId} />

      {loading ? (
        <div className="card" style={{ color: 'var(--text-secondary)' }}>Loading warning decision support alerts...</div>
      ) : error ? (
        <div className="card" style={{ borderColor: '#7F1D1D', background: '#450A0A', color: '#FCA5A5' }}>{error}</div>
      ) : warnings.length === 0 ? (
        <div className="card" style={{ color: 'var(--text-secondary)' }}>
          No critical early warning alerts triggered for this simulation run.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {warnings.map((w, idx) => {
            const badgeClass =
              w.level === 'critical' ? 'badge-critical' :
              w.level === 'warning' ? 'badge-warning' :
              w.level === 'watch' ? 'badge-watch' : 'badge-advisory';

            return (
              <div
                key={idx}
                className="card"
                style={{
                  borderLeft: `4px solid ${
                    w.level === 'critical' ? '#EF4444' :
                    w.level === 'warning' ? '#F97316' :
                    w.level === 'watch' ? '#EAB308' : '#64748B'
                  }`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                    {w.villageName || w.villageId}
                  </h3>
                  <span className={`badge ${badgeClass}`}>
                    {w.level}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                  <div><strong>Peak Inundation Depth:</strong> {w.maxDepthM.toFixed(2)} m</div>
                  <div><strong>Peak Flow Velocity:</strong> {w.maxVelocityMs.toFixed(2)} m/s</div>
                  <div><strong>Arrival Time:</strong> {w.arrivalTimeMin ? `${w.arrivalTimeMin.toFixed(1)} min` : 'N/A'}</div>
                  <div><strong>Triggered By:</strong> {w.triggeredBy}</div>
                </div>

                {/* Mandatory Disclaimer embedded in every card */}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', fontStyle: 'italic' }}>
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
