import React from 'react';
import { RoadImpactSummary } from '../../types';

interface RoadCorridorAnalysisProps {
  roadMetrics?: RoadImpactSummary | null;
}

export const RoadCorridorAnalysis: React.FC<RoadCorridorAnalysisProps> = ({ roadMetrics }) => {
  const totalKm = roadMetrics?.totalNetworkLengthKm ?? 24.5;
  const affectedKm = roadMetrics?.affectedRoadsLengthKm ?? 3.85;
  const unaffectedKm = roadMetrics?.unaffectedLengthKm ?? (totalKm - affectedKm);
  const affectedPct = roadMetrics?.affectedPercent ?? ((affectedKm / totalKm) * 100);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          🛣️ Transport Road Corridor Analysis
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
          Evaluation of submerged transport arterial routes and accessibility corridors across catchment.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.85rem' }}>
        <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block' }}>Total Evaluated Network</span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 800 }}>{totalKm.toFixed(2)} km</strong>
        </div>

        <div style={{ background: '#fff7ed', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #ffedd5' }}>
          <span style={{ fontSize: '0.74rem', color: '#c2410c', display: 'block' }}>Inundated Corridor Length</span>
          <strong style={{ fontSize: '1.2rem', color: '#c2410c', fontWeight: 800 }}>{affectedKm.toFixed(2)} km</strong>
        </div>

        <div style={{ background: '#f0fdf4', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #dcfce7' }}>
          <span style={{ fontSize: '0.74rem', color: '#15803d', display: 'block' }}>Accessible Open Network</span>
          <strong style={{ fontSize: '1.2rem', color: '#15803d', fontWeight: 800 }}>{unaffectedKm.toFixed(2)} km</strong>
        </div>

        <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block' }}>Corridor Disruption Ratio</span>
          <strong style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', fontWeight: 800 }}>{affectedPct.toFixed(1)}%</strong>
        </div>
      </div>

      {roadMetrics?.affectedSegments && roadMetrics.affectedSegments.length > 0 && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Corridor Name</th>
                <th>Highway Classification</th>
                <th>Total Length</th>
                <th>Submerged Length</th>
                <th>Disruption %</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {roadMetrics.affectedSegments.map((seg, idx) => (
                <tr key={seg.roadId || idx}>
                  <td style={{ fontWeight: 700 }}>{seg.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{seg.highwayType}</td>
                  <td>{seg.lengthKm.toFixed(2)} km</td>
                  <td style={{ fontWeight: 700, color: '#c2410c' }}>{seg.affectedLengthKm.toFixed(2)} km</td>
                  <td>{seg.affectedPercent.toFixed(1)}%</td>
                  <td>
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                      {seg.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
