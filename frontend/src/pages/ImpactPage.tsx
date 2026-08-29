import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SimulationNav } from '../components/simulations/SimulationNav';
import { apiClient } from '../services/api/client';
import { ExposureResult } from '../types';

export const ImpactPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const simId = id || 'sim-level1-default';

  const [exposureList, setExposureList] = useState<ExposureResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getExposureResults(simId)
      .then((data) => {
        setExposureList(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.detail || err.message || 'Failed loading exposure table');
        setLoading(false);
      });
  }, [simId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Settlement & Infrastructure Exposure Analysis
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Simulation Run: <code style={{ color: 'var(--accent-cyan)' }}>{simId}</code>
          </p>
        </div>
      </div>

      <SimulationNav simulationId={simId} />

      {loading ? (
        <div className="card" style={{ color: 'var(--text-secondary)' }}>Loading exposure table...</div>
      ) : error ? (
        <div className="card" style={{ borderColor: '#7F1D1D', background: '#450A0A', color: '#FCA5A5' }}>{error}</div>
      ) : exposureList.length === 0 ? (
        <div className="card" style={{ color: 'var(--text-secondary)' }}>
          No settlement inundation recorded for this simulation run (all evaluated assets remain safe above depth threshold).
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Settlement / Infrastructure</th>
                <th>Asset Type</th>
                <th>Exposure Severity</th>
                <th>Max Depth (m)</th>
                <th>Arrival Time</th>
                <th>Population Status</th>
              </tr>
            </thead>
            <tbody>
              {exposureList.map((item, idx) => {
                const badgeClass =
                  item.warningLevel === 'critical' ? 'badge-critical' :
                  item.warningLevel === 'warning' ? 'badge-warning' :
                  item.warningLevel === 'watch' ? 'badge-watch' : 'badge-advisory';

                return (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</td>
                    <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{item.assetType}</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>
                        {item.exposureTier || item.warningLevel}
                      </span>
                    </td>
                    <td style={{ color: item.maxDepthM >= 0.1 ? '#FCA5A5' : 'var(--text-primary)' }}>
                      {item.maxDepthM.toFixed(2)} m
                    </td>
                    <td>
                      {item.arrivalTimeMin !== undefined && item.arrivalTimeMin !== null
                        ? `${item.arrivalTimeMin.toFixed(1)} min`
                        : 'Unaffected'}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {item.populationDataStatus === 'unavailable'
                        ? 'Population Data Unavailable'
                        : item.populationExposed !== undefined && item.populationExposed !== null
                        ? `${item.populationExposed} exposed`
                        : '0 exposed'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
