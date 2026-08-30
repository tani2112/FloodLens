import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScientificDisclaimer } from '../components/common/ScientificDisclaimer';
import { ScientificDataPanel } from '../components/common/ScientificDataPanel';

export const NepalCaseStudyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="card" style={{ background: '#ffffff', borderLeft: '4px solid var(--accent-primary)', padding: '1.5rem 1.75rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            RETR0SPECTIVE ANALYTICAL CASE STUDY — NEPAL HIMALAYAN BASIN
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem', letterSpacing: '-0.02em' }}>
            Bhotekoshi–Trishuli Glacial Lake Outburst Flood (GLOF)
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '0.3rem' }}>
            Analysis of Moraine Dam Failure, Extreme Alpine Steep Gradient Inundation Routing, and Transboundary Early Warning Mechanics.
          </p>
        </div>

        {/* Workspace Quick Launch Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            ⚡ Command Center
          </button>
          <button onClick={() => navigate('/simulations/sim-level1-default/map')} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            🗺️ Interactive Map
          </button>
          <button onClick={() => navigate('/simulations/sim-level1-default/results')} className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            📊 Hydro Results
          </button>
          <button onClick={() => navigate('/simulations/sim-level1-default/impact')} className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            🏘️ Impact Analytics
          </button>
          <button onClick={() => navigate('/comparison')} className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            ⚖️ Compare Scenarios
          </button>
        </div>
      </div>

      <ScientificDisclaimer />

      {/* Case Study Overview & Hydraulic Characteristics */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          🏔️ Executive Summary & Hydraulic Characteristics
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
          Glacial Lake Outburst Floods (GLOFs) in northern Nepal and Tibet present extreme disaster risks to downstream hydropower installations, highway bridges, and village settlements along the Trishuli and Sun Koshi river corridors. Sudden breaches of moraine or ice-dams release millions of cubic meters of impounded meltwater in short durations, producing steep-fronted hyper-concentrated flow waves that propagate down alpine river valleys.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: 'var(--bg-surface-secondary)', padding: '1.25rem', borderRadius: '6px', fontSize: '0.86rem' }}>
          <div><strong>Geographic Region:</strong> Central Nepal / Transboundary Tibet</div>
          <div><strong>Primary Trigger:</strong> Moraine Dam Breach / GLOF Outburst</div>
          <div><strong>Topographic Gradient:</strong> Extreme Alpine Bed Slope (&gt;15%)</div>
          <div><strong>Downstream Assets:</strong> Hydropower Infrastructure & Highway Bridges</div>
          <div><strong>Model Level:</strong> Level 1 — 2D Diffusive Wave Cellular Solver</div>
          <div><strong>Target Metric CRS:</strong> EPSG:32643 UTM Projection</div>
        </div>
      </div>

      {/* Hydraulic & Disaster Management Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🌊 Wavefront Routing & Kinetic Characteristics
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Due to steep bed slopes in the upper Bhotekoshi valley, flood waves exhibit rapid propagation speeds exceeding 5.0 m/s in narrow gorges. Diffusive-wave formulations account for pressure and friction slope forces, providing stable numerical routing without artificial oscillations in high-gradient channels.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            🚨 Early Warning Lead Times & Decision Support
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Model output yields estimated initial wavefront contact lead times between 15 to 25 minutes for first downstream infrastructure assets. Early warning automation allows decision makers to categorize downstream sectors into Critical, High, and Moderate evacuation tiers.
          </p>
        </div>
      </div>

      <ScientificDataPanel />
    </div>
  );
};

