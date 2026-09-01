import React, { useState } from 'react';
import { apiClient } from '../../services/api/client';
import { ExportJob } from '../../types';

export interface ExportModalProps {
  simulationId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  simulationId,
  isOpen,
  onClose
}) => {
  const [activeJob, setActiveJob] = useState<ExportJob | null>(null);
  const [loadingFormat, setLoadingFormat] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportRequest = async (format: string) => {
    setLoadingFormat(format);
    setErrorMsg(null);
    try {
      const job = await apiClient.exportSimulation(simulationId, format);
      setActiveJob(job);
    } catch (err: any) {
      setErrorMsg(err.detail || err.message || `Format '${format.toUpperCase()}' is unavailable in the current build.`);
    } finally {
      setLoadingFormat(null);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '580px', width: '100%', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Centralized GIS Export
            </span>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
              📥 Export GIS Spatial Datasets & Reports
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              Simulation ID: <strong>{simulationId}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
            ×
          </button>
        </div>

        {/* Available Formats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Available Formats
          </span>

          <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-secondary)' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>GeoJSON Flood Extent Vector</strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>Polygon boundary vector layer (EPSG:4326 WGS84)</p>
            </div>
            <a
              href={apiClient.getResultFileUrl(simulationId, 'flood_extent.geojson')}
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
            >
              Download GeoJSON
            </a>
          </div>

          <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-secondary)' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Hydrodynamic Timeline JSON</strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>Timestep-by-timestep inundation area, depth, and velocity series</p>
            </div>
            <a
              href={apiClient.getResultFileUrl(simulationId, 'timeline.json')}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
            >
              View Timeline JSON
            </a>
          </div>

          <div style={{ border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface-secondary)' }}>
            <div>
              <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Impact Summary JSON</strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>Settlement exposure and transport corridor disruption metrics</p>
            </div>
            <a
              href={apiClient.getResultFileUrl(simulationId, 'impact_summary.json')}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem' }}
            >
              View Impact JSON
            </a>
          </div>
        </div>

        {/* Unavailable Formats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Unavailable Formats (Planned for Future Releases)
          </span>

          {[
            { key: 'shp', name: 'ESRI Shapefile (.shp)', desc: 'Multi-file ESRI vector archive (.shp, .shx, .dbf)' },
            { key: 'geotiff', name: 'GeoTIFF Raster (.tif)', desc: 'High-resolution GeoTIFF water depth raster' },
            { key: 'kml', name: 'Keyhole Markup Language (.kml)', desc: 'Google Earth geospatial vector layer' },
            { key: 'report_pdf', name: 'PDF Project Summary Report', desc: 'Formatted multi-page scientific investigation report' }
          ].map((f) => (
            <div key={f.key} style={{ border: '1px dashed var(--border-color)', borderRadius: '6px', padding: '0.6rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.7 }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{f.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.desc}</div>
              </div>
              <button
                onClick={() => handleExportRequest(f.key)}
                disabled={loadingFormat === f.key}
                className="btn btn-outline"
                style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
              >
                {loadingFormat === f.key ? 'Checking...' : 'Unavailable'}
              </button>
            </div>
          ))}
        </div>

        {/* Status / Error Toast */}
        {activeJob && (
          <div style={{ background: '#dcfce7', border: '1px solid #86efac', color: '#15803d', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.82rem' }}>
            ✅ Export format request active: status = <strong>{activeJob.status}</strong>
          </div>
        )}

        {errorMsg && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.82rem' }}>
            ℹ️ {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
          <button onClick={onClose} className="btn btn-secondary">
            Close Export Window
          </button>
        </div>
      </div>
    </div>
  );
};
