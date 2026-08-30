import React from 'react';
import { ScientificDisclaimer } from './ScientificDisclaimer';

export interface ScientificDataPanelProps {
  className?: string;
}

export const ScientificDataPanel: React.FC<ScientificDataPanelProps> = ({ className = '' }) => {
  return (
    <div className={`card ${className}`} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Scientific Integrity & Transparency
        </span>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
          🔬 Scientific Data Pipeline & Model Specifications
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
          Detailed model level characteristics, underlying GIS input datasets, data availability status, and scientific boundary conditions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Model Characteristics */}
        <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>⚡</span> Hydrodynamic Solver Engine
          </h4>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div><strong>Model Level:</strong> Level 1 — 2D Diffusive Wave</div>
            <div><strong>Formulation:</strong> Cellular finite-volume shallow water approximation</div>
            <div><strong>Spatial Resolution:</strong> 30m × 30m elevation grid (EPSG:32643 UTM)</div>
            <div><strong>Temporal Routing:</strong> Adaptive time-step explicit flux discretization</div>
          </div>
        </div>

        {/* Spatial Datasets */}
        <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>🗺️</span> Ingested GIS Input Layers
          </h4>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div><strong>Digital Elevation Model:</strong> Copernicus / SRTM 30m Grid</div>
            <div><strong>Catchment Hydrography:</strong> Periyar River vector network</div>
            <div><strong>Settlement Locations:</strong> Idukki District canonical village centroids</div>
            <div><strong>Transport Infrastructure:</strong> Regional road corridor vectors</div>
          </div>
        </div>

        {/* Dataset Availability Status */}
        <div style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>📊</span> Asset Dataset Availability
          </h4>
          <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Settlement Bounds:</span>
              <span className="badge badge-safe" style={{ fontSize: '0.7rem' }}>Available</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Population Census:</span>
              <span className="badge badge-advisory" style={{ fontSize: '0.7rem' }}>Requires Census Data</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Critical Infrastructure:</span>
              <span className="badge badge-advisory" style={{ fontSize: '0.7rem' }}>Dataset Unavailable</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Satellite Validation:</span>
              <span className="badge badge-safe" style={{ fontSize: '0.7rem' }}>Copernicus Sentinel-1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Distinction Guide */}
      <div style={{ background: 'var(--bg-surface-muted)', border: '1px solid var(--border-strong)', borderRadius: '6px', padding: '0.85rem 1rem', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <strong style={{ color: 'var(--text-primary)' }}>ℹ️ Understanding Data Provenance:</strong>
        <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
          <li><strong>Model Outputs:</strong> Inundation extent, depth head, and flow velocity computed by 2D diffusive wave simulation solver.</li>
          <li><strong>Observed Data:</strong> Satellite-derived synthetic aperture radar (SAR) flood polygons used exclusively for validation metrics (IoU / F1).</li>
          <li><strong>Unavailable Datasets:</strong> Metrics dependent on census or infrastructure layers are explicitly identified rather than estimated.</li>
        </ul>
      </div>

      <ScientificDisclaimer />
    </div>
  );
};
