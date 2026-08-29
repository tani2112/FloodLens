import React from 'react';

export const AboutPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          About FloodLens Platform Architecture
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Smart India Hackathon (SIH26161) — System Specifications & Authoritative Technical Reference.
        </p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--accent-cyan)' }}>Scientific Methodologies & System Architecture</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
          FloodLens is structured into a modular multi-tier hydrodynamic framework connecting native 2D diffusive flow propagation, spatial GIS exposure calculators, decision-support early warning card generators, and a RESTful FastAPI orchestration service.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', fontSize: '0.85rem' }}>
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Level 1 Engine</h4>
            <p style={{ color: 'var(--text-secondary)' }}>Native Python 2D Diffusive Wave Cellular Solver over DEM rasters.</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Spatial CRS Engine</h4>
            <p style={{ color: 'var(--text-secondary)' }}>EPSG:32643 (UTM Zone 43N) internal calculations, converted to EPSG:4326 GeoJSON.</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Backend Stack</h4>
            <p style={{ color: 'var(--text-secondary)' }}>FastAPI + Pydantic v2 + NumPy + Rasterio/GDAL + MapLibre GL JS.</p>
          </div>
          <div>
            <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Developers</h4>
            <p style={{ color: 'var(--text-secondary)' }}>Saumil & Tanishk (FloodLens Team)</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ borderColor: '#0284C7', background: '#0C4A6E', color: '#E0F2FE', fontSize: '0.85rem' }}>
        <strong>Authoritative Disclaimer:</strong> FloodLens outputs are scenario-based decision-support screening metrics. The system does not replace official meteorological or disaster management authority warnings.
      </div>
    </div>
  );
};
