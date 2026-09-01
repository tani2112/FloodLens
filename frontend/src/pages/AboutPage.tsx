import React from 'react';
import { ScientificDisclaimer } from '../components/common/ScientificDisclaimer';

export const AboutPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          About FloodLens Architecture
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Nepal Himalayan GLOF decision-support workspace — scientific system architecture and operating context.
        </p>
      </div>

      <ScientificDisclaimer />

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.75rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Scientific Methodologies & System Architecture
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
          FloodLens is structured into a modular multi-tier hydrodynamic framework connecting native 2D diffusive flow propagation, spatial GIS exposure calculators, decision-support early warning card generators, and a RESTful FastAPI orchestration service.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', fontSize: '0.88rem' }}>
          <div style={{ background: 'var(--bg-surface-secondary)', padding: '1rem', borderRadius: '6px' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem', fontWeight: 700 }}>Level 1 Engine</h4>
            <p style={{ color: 'var(--text-secondary)' }}>Native Python 2D Diffusive Wave Cellular Solver over DEM rasters.</p>
          </div>
          <div style={{ background: 'var(--bg-surface-secondary)', padding: '1rem', borderRadius: '6px' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem', fontWeight: 700 }}>Spatial CRS Engine</h4>
            <p style={{ color: 'var(--text-secondary)' }}>EPSG:32645 (UTM Zone 45N) Himalayan corridor calculations, converted to EPSG:4326 GeoJSON for response mapping.</p>
          </div>
          <div style={{ background: 'var(--bg-surface-secondary)', padding: '1rem', borderRadius: '6px' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem', fontWeight: 700 }}>Backend Stack</h4>
            <p style={{ color: 'var(--text-secondary)' }}>FastAPI + Pydantic v2 + NumPy + Rasterio/GDAL + MapLibre GL JS.</p>
          </div>
          <div style={{ background: 'var(--bg-surface-secondary)', padding: '1rem', borderRadius: '6px' }}>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem', fontWeight: 700 }}>Scenario Focus</h4>
            <p style={{ color: 'var(--text-secondary)' }}>Lhende Khola avalanche, temporary landslide dam failure, and Bhote Koshi downstream impact analysis.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
