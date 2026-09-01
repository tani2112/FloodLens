import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ScientificDisclaimer } from '../components/common/ScientificDisclaimer';
import { ScientificDataPanel } from '../components/common/ScientificDataPanel';

export const NepalCaseStudyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header Banner */}
      <div className="card" style={{ background: '#FFFFFF', borderLeft: '4px solid #0284C7', padding: '1.5rem 1.75rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.25rem', color: '#0F172A' }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#0284C7', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            PRIMARY SHOWCASE SIMULATION — NP-2026-08-26-001
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0F172A', marginTop: '0.2rem', letterSpacing: '-0.02em' }}>
            Nepal Himalayan Flash Flood — Lhende Khola → Bhote Koshi River
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.92rem', marginTop: '0.3rem' }}>
            Large ice/rock avalanche creating a temporary barrier lake, followed by sudden failure and release of water, mud, rocks, and debris through Timure, Rasuwagadhi, and Syabrubesi.
          </p>
        </div>

        {/* Workspace Quick Launch Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            ⚡ Command Center
          </button>
          <button onClick={() => navigate('/simulations/NP-2026-08-26-001/map')} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            🗺️ Interactive Map
          </button>
          <button onClick={() => navigate('/simulations/NP-2026-08-26-001/results')} className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            📊 Hydro Results
          </button>
          <button onClick={() => navigate('/simulations/NP-2026-08-26-001/impact')} className="btn btn-outline" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            🏘️ Impact Analytics
          </button>
        </div>
      </div>

      <ScientificDisclaimer />

      {/* Case Study Overview & Hydraulic Characteristics */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
          🏔️ Event Mechanics & Hydraulic Profile (Scenario ID: NP-2026-08-26-001)
        </h3>
        <p style={{ color: '#334155', fontSize: '0.92rem', lineHeight: 1.6 }}>
          In August 2026, a massive ice and rock avalanche collapsed into the upper Lhende Khola catchment in the High Nepal Himalayas, impounding millions of cubic meters of water into an unstable temporary landslide barrier lake. The subsequent catastrophic failure breached the barrier, releasing a high-velocity debris flood wave downstream into the Bhote Koshi River corridor.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', background: '#F0F9FF', padding: '1.25rem', borderRadius: '6px', fontSize: '0.86rem', border: '1px solid #BAE6FD' }}>
          <div><strong style={{ color: '#0284C7' }}>Scenario ID:</strong> NP-2026-08-26-001</div>
          <div><strong style={{ color: '#0284C7' }}>Geographic Region:</strong> Nepal Himalayas</div>
          <div><strong style={{ color: '#0284C7' }}>River Corridor:</strong> Lhende Khola → Bhote Koshi River</div>
          <div><strong style={{ color: '#0284C7' }}>Key Locations:</strong> Timure, Rasuwagadhi, Syabrubesi</div>
          <div><strong style={{ color: '#0284C7' }}>Event Type:</strong> Ice/Rock Avalanche Barrier Failure & GLOF</div>
          <div><strong style={{ color: '#0284C7' }}>Solver Engine:</strong> Level 1 2D Diffusive Wave / Saint-Venant</div>
        </div>
      </div>

      {/* Hydraulic & Disaster Management Analysis */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
            🌊 Debris Hydrograph & Wave Routing
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
            Water, mud, rocks, and glacial debris rapidly propagated through the Rasuwagadhi border hydro dam, inundating the Timure Customs Freight Compound and downstream valley settlement of Syabrubesi with peak water depths exceeding 7.5 meters.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
            🚨 Early Warning & Impact Analytics
          </h3>
          <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.5 }}>
            Wavefront arrival lead times were calculated at 5 minutes for Rasuwagadhi, 12 minutes for Timure, and 20 minutes for Syabrubesi, enabling rapid exposure analysis for critical infrastructure and road corridors.
          </p>
        </div>
      </div>

      <ScientificDataPanel />
    </div>
  );
};
