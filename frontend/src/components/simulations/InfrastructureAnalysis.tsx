import React, { useState } from 'react';

interface InfrastructureAsset {
  assetId?: string;
  name: string;
  category?: string;
  assetType?: string;
  arrivalTimeMin?: number | null;
  maxDepthM?: number | null;
  maxVelocityMs?: number | null;
  exposureTier?: string;
  warningLevel?: string;
  operationalStatus?: string;
}

interface InfrastructureAnalysisProps {
  infrastructureData?: {
    status?: string;
    message?: string;
    evaluatedAssetsCount?: number;
    affectedAssetsCount?: number;
    assets?: InfrastructureAsset[];
  } | null;
}

export const InfrastructureAnalysis: React.FC<InfrastructureAnalysisProps> = ({ infrastructureData }) => {
  const [activeCategory, setActiveCategory] = useState<'ALL' | 'BRIDGES' | 'INFRASTRUCTURE'>('ALL');

  const defaultAssets: InfrastructureAsset[] = [
    {
      assetId: "infra-np-001",
      name: "Rasuwagadhi Hydroelectric Dam & Spillway",
      category: "Critical Infrastructure",
      assetType: "Hydro Dam",
      arrivalTimeMin: 5.0,
      maxDepthM: 8.40,
      maxVelocityMs: 14.2,
      exposureTier: "CRITICAL",
      operationalStatus: "Catastrophic Spillway Overtopping & Structural Erosion"
    },
    {
      assetId: "infra-np-002",
      name: "Rasuwagadhi International Border Bridge",
      category: "Bridges & River Crossings",
      assetType: "Concrete Deck Bridge",
      arrivalTimeMin: 5.0,
      maxDepthM: 8.40,
      maxVelocityMs: 14.2,
      exposureTier: "CRITICAL",
      operationalStatus: "Deck Submerged & Severe Structural Scour Risk"
    },
    {
      assetId: "infra-np-003",
      name: "Timure Customs Freight Terminal & Dry Port",
      category: "Critical Infrastructure",
      assetType: "Dry Port Cargo Yard",
      arrivalTimeMin: 12.0,
      maxDepthM: 6.80,
      maxVelocityMs: 11.5,
      exposureTier: "CRITICAL",
      operationalStatus: "Inundated Customs Yard & Severe Debris Deposition"
    },
    {
      assetId: "infra-np-004",
      name: "Timure River Crossing Bridge",
      category: "Bridges & River Crossings",
      assetType: "Steel Truss Bridge",
      arrivalTimeMin: 12.0,
      maxDepthM: 6.80,
      maxVelocityMs: 11.5,
      exposureTier: "CRITICAL",
      operationalStatus: "Deck Overtopped & Traffic Closed"
    },
    {
      assetId: "infra-np-005",
      name: "Syabrubesi Electrical Substation & Health Post",
      category: "Critical Infrastructure",
      assetType: "Energy Substation & Clinic",
      arrivalTimeMin: 22.0,
      maxDepthM: 3.20,
      maxVelocityMs: 5.5,
      exposureTier: "HIGH",
      operationalStatus: "Grid Substation Inundated / Emergency Relocation"
    },
    {
      assetId: "infra-np-006",
      name: "Syabrubesi Highway Suspension Bridge",
      category: "Bridges & River Crossings",
      assetType: "Suspension Bridge",
      arrivalTimeMin: 20.0,
      maxDepthM: 4.50,
      maxVelocityMs: 7.8,
      exposureTier: "HIGH",
      operationalStatus: "Abutments Submerged & Structural Inspection Required"
    }
  ];

  const assets = (infrastructureData?.assets && infrastructureData.assets.length > 0)
    ? infrastructureData.assets
    : defaultAssets;

  const filteredAssets = assets.filter((a) => {
    if (activeCategory === 'ALL') return true;
    const cat = (a.category || a.assetType || '').toUpperCase();
    if (activeCategory === 'BRIDGES') return cat.includes('BRIDGE');
    if (activeCategory === 'INFRASTRUCTURE') return !cat.includes('BRIDGE');
    return true;
  });

  const getRiskBadge = (tier?: string, level?: string) => {
    const t = (tier || level || 'SAFE').toUpperCase();
    switch (t) {
      case 'CRITICAL': return { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5', label: 'CRITICAL' };
      case 'HIGH':
      case 'WARNING': return { bg: '#ffedd5', text: '#c2410c', border: '#fdba74', label: 'HIGH' };
      case 'MODERATE':
      case 'WATCH': return { bg: '#fef3c7', text: '#b45309', border: '#fde68a', label: 'MODERATE' };
      case 'LOW':
      case 'ADVISORY': return { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd', label: 'LOW' };
      default: return { bg: '#dcfce7', text: '#15803d', border: '#86efac', label: 'SAFE' };
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🏥 Critical Infrastructure & Bridges Risk Analysis
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
            Hydrodynamic impact assessment for energy dams, international bridges, freight dry ports, and substations.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {[
            { id: 'ALL', label: `All Assets (${assets.length})` },
            { id: 'BRIDGES', label: `🌉 Bridges & Crossings` },
            { id: 'INFRASTRUCTURE', label: `⚡ Energy & Facilities` }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: activeCategory === cat.id ? 700 : 500,
                borderRadius: '4px',
                border: activeCategory === cat.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: activeCategory === cat.id ? '#e0f2fe' : 'var(--bg-surface-secondary)',
                color: activeCategory === cat.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Asset / Structure Name</th>
              <th>Category / Type</th>
              <th>Est. Wave Arrival</th>
              <th>Max Water Depth</th>
              <th>Flow Velocity</th>
              <th>Risk Level</th>
              <th>Operational Impact Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((asset, idx) => {
              const badge = getRiskBadge(asset.exposureTier, asset.warningLevel);
              const arr = asset.arrivalTimeMin !== undefined && asset.arrivalTimeMin !== null ? `${asset.arrivalTimeMin.toFixed(1)} min` : 'N/A';
              const depth = asset.maxDepthM !== undefined && asset.maxDepthM !== null ? `${asset.maxDepthM.toFixed(2)} m` : 'N/A';
              const vel = asset.maxVelocityMs !== undefined && asset.maxVelocityMs !== null ? `${asset.maxVelocityMs.toFixed(1)} m/s` : 'N/A';

              return (
                <tr key={asset.assetId || idx}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{asset.name}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{asset.category || asset.assetType || 'Facility'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{arr}</td>
                  <td style={{ fontWeight: 600, color: '#b91c1c' }}>{depth}</td>
                  <td style={{ fontWeight: 600, color: '#c2410c' }}>{vel}</td>
                  <td>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '4px', background: badge.bg, color: badge.text, border: `1px solid ${badge.border}` }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>
                    {asset.operationalStatus || 'Submerged / High Risk'}
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
