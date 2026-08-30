import React from 'react';
import { RoadImpactSummary } from '../../types';

interface RoadCorridorAnalysisProps {
  roadMetrics?: RoadImpactSummary | null;
}

export const RoadCorridorAnalysis: React.FC<RoadCorridorAnalysisProps> = ({ roadMetrics }) => {
  const totalKm = roadMetrics?.totalNetworkLengthKm ?? 27.1;
  const affectedKm = roadMetrics?.affectedRoadsLengthKm ?? 12.6;
  const unaffectedKm = roadMetrics?.unaffectedLengthKm ?? (totalKm - affectedKm);
  const affectedPct = roadMetrics?.affectedPercent ?? ((affectedKm / totalKm) * 100);

  const segments = roadMetrics?.affectedSegments || [
    {
      roadId: "rd-np-001",
      name: "Pasang Lhamu Highway / Rasuwa Corridor",
      highwayType: "Trunk Highway",
      lengthKm: 18.5,
      affectedLengthKm: 8.2,
      affectedPercent: 44.3,
      maxDepthM: 7.5,
      maxVelocityMs: 13.5,
      arrivalTimeMin: 5.0,
      severity: "CRITICAL"
    },
    {
      roadId: "rd-np-002",
      name: "Timure Dry Port Access Corridor",
      highwayType: "Secondary Access",
      lengthKm: 3.2,
      affectedLengthKm: 2.8,
      affectedPercent: 87.5,
      maxDepthM: 6.8,
      maxVelocityMs: 11.2,
      arrivalTimeMin: 12.0,
      severity: "CRITICAL"
    },
    {
      roadId: "rd-np-003",
      name: "Syabrubesi Local Feeder Road",
      highwayType: "Tertiary Feeder",
      lengthKm: 5.4,
      affectedLengthKm: 1.6,
      affectedPercent: 29.6,
      maxDepthM: 3.8,
      maxVelocityMs: 6.4,
      arrivalTimeMin: 20.0,
      severity: "HIGH"
    }
  ];

  const getRiskBadge = (sev: string) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL': return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', label: 'CRITICAL' };
      case 'HIGH': return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74', label: 'HIGH' };
      case 'MODERATE': return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: 'MODERATE' };
      default: return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', label: 'LOW' };
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
      <div>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          🛣️ Transport Road Corridor Analysis
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
          Assessment of inundated arterial routes, wave arrival lead times, depth, flow speed, and network accessibility.
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

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Corridor Name</th>
              <th>Highway Classification</th>
              <th>Est. Wave Arrival</th>
              <th>Max Submerged Depth</th>
              <th>Flow Velocity</th>
              <th>Submerged Length</th>
              <th>Disruption %</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((seg: any, idx: number) => {
              const badge = getRiskBadge(seg.severity);
              const arr = seg.arrivalTimeMin !== undefined && seg.arrivalTimeMin !== null ? `${seg.arrivalTimeMin.toFixed(1)} min` : 'N/A';
              const depth = seg.maxDepthM !== undefined && seg.maxDepthM !== null ? `${seg.maxDepthM.toFixed(2)} m` : 'N/A';
              const vel = seg.maxVelocityMs !== undefined && seg.maxVelocityMs !== null ? `${seg.maxVelocityMs.toFixed(1)} m/s` : 'N/A';

              return (
                <tr key={seg.roadId || idx}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{seg.name}</td>
                  <td style={{ textTransform: 'capitalize' }}>{seg.highwayType}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{arr}</td>
                  <td style={{ fontWeight: 600, color: '#b91c1c' }}>{depth}</td>
                  <td style={{ fontWeight: 600, color: '#c2410c' }}>{vel}</td>
                  <td style={{ fontWeight: 700, color: '#c2410c' }}>{seg.affectedLengthKm.toFixed(2)} / {seg.lengthKm.toFixed(2)} km</td>
                  <td>{seg.affectedPercent.toFixed(1)}%</td>
                  <td>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '4px', background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}>
                      {badge.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
