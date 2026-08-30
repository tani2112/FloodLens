import React, { useState } from 'react';
import { ExposureResult, SettlementImpactItem } from '../../types';

interface SettlementRiskExplorerProps {
  settlements: ExposureResult[] | SettlementImpactItem[];
  onSelectSettlement?: (settlement: ExposureResult | SettlementImpactItem) => void;
}

export const SettlementRiskExplorer: React.FC<SettlementRiskExplorerProps> = ({
  settlements = [],
  onSelectSettlement
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' | 'SAFE'>('ALL');
  const [sortBy, setSortBy] = useState<'severity' | 'depth' | 'arrival' | 'name'>('severity');

  const getTier = (item: any): string => {
    const tier = item.exposureTier || item.warningLevel || 'SAFE';
    return String(tier).toUpperCase();
  };

  const getSeverityRank = (tier: string): number => {
    switch (tier) {
      case 'CRITICAL': return 5;
      case 'HIGH': return 4;
      case 'WARNING': return 4;
      case 'MODERATE': return 3;
      case 'WATCH': return 3;
      case 'LOW': return 2;
      case 'ADVISORY': return 2;
      default: return 1;
    }
  };

  const getBadgeStyle = (tier: string) => {
    switch (tier) {
      case 'CRITICAL': return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' };
      case 'HIGH':
      case 'WARNING': return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' };
      case 'MODERATE':
      case 'WATCH': return { bg: '#fef3c7', text: '#b45309', border: '#fde68a' };
      case 'LOW':
      case 'ADVISORY': return { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };
      default: return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
    }
  };

  // 1. Filtering
  const filtered = settlements.filter((s) => {
    if (filter === 'ALL') return true;
    const tier = getTier(s);
    if (filter === 'CRITICAL') return tier === 'CRITICAL';
    if (filter === 'HIGH') return tier === 'HIGH' || tier === 'WARNING';
    if (filter === 'MODERATE') return tier === 'MODERATE' || tier === 'WATCH';
    if (filter === 'LOW') return tier === 'LOW' || tier === 'ADVISORY';
    if (filter === 'SAFE') return tier === 'SAFE';
    return true;
  });

  // 2. Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'severity') {
      return getSeverityRank(getTier(b)) - getSeverityRank(getTier(a));
    }
    if (sortBy === 'depth') {
      return b.maxDepthM - a.maxDepthM;
    }
    if (sortBy === 'arrival') {
      const arrA = a.arrivalTimeMin ?? 9999;
      const arrB = b.arrivalTimeMin ?? 9999;
      return arrA - arrB;
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🏘️ Catchment Settlement Exposure Explorer
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
            Cellular inundation exposure metrics and arrival lead times for downstream settlements.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW', 'SAFE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              style={{
                padding: '0.2rem 0.55rem',
                fontSize: '0.74rem',
                fontWeight: filter === t ? 700 : 500,
                borderRadius: '4px',
                border: filter === t ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: filter === t ? '#e0f2fe' : 'var(--bg-surface-secondary)',
                color: filter === t ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Sorting Control Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-secondary)', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
        <span style={{ color: 'var(--text-secondary)' }}>Showing <strong>{sorted.length}</strong> evaluated settlement(s)</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Sort By:</span>
          {(['severity', 'depth', 'arrival', 'name'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              style={{
                padding: '0.18rem 0.45rem',
                fontSize: '0.72rem',
                fontWeight: sortBy === s ? 700 : 500,
                borderRadius: '4px',
                border: sortBy === s ? '1px solid #0284c7' : '1px solid var(--border-color)',
                background: sortBy === s ? '#0284c7' : '#ffffff',
                color: sortBy === s ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Settlement Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Settlement Name</th>
              <th>Exposure Tier</th>
              <th>Max Water Depth</th>
              <th>Wave Arrival Lead Time</th>
              <th>Demographic Population</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((s, idx) => {
              const tier = getTier(s);
              const badge = getBadgeStyle(tier);
              return (
                <tr key={s.assetId || idx} style={{ cursor: onSelectSettlement ? 'pointer' : 'default' }}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.name}</td>
                  <td>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '4px', background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}>
                      {tier}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: s.maxDepthM > 2.0 ? '#b91c1c' : 'var(--text-primary)' }}>
                    {s.maxDepthM > 0 ? `${s.maxDepthM.toFixed(2)} m` : '0.00 m (Unflooded)'}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                    {s.arrivalTimeMin ? `${s.arrivalTimeMin.toFixed(1)} min` : 'No arrival'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {s.population ? (
                      `${s.population.toLocaleString()} residents`
                    ) : (
                      <span style={{ fontStyle: 'italic', color: '#b45309' }}>
                        requires_census_dataset
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => onSelectSettlement?.(s)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem 0.55rem', fontSize: '0.74rem' }}
                    >
                      Focus Map 🎯
                    </button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                  No settlements found matching exposure tier filter <strong>{filter}</strong>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
