import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SimulationNav } from '../components/simulations/SimulationNav';
import { apiClient } from '../services/api/client';
import { FloodResult, ExportJob } from '../types';

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const simId = id || 'sim-level1-default';

  const [results, setResults] = useState<FloodResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [exportJob, setExportJob] = useState<ExportJob | null>(null);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getFloodResults(simId)
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.detail || err.message || 'Failed loading simulation results');
        setLoading(false);
      });
  }, [simId]);

  const handleExport = async (format: string) => {
    setExportLoading(true);
    setExportError(null);
    try {
      const job = await apiClient.exportSimulation(simId, format);
      setExportJob(job);
    } catch (err: any) {
      setExportError(err.detail || err.message || 'Export format not implemented');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Hydrodynamic Results & Summary KPIs
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Simulation Run: <code style={{ color: 'var(--accent-cyan)' }}>{simId}</code>
          </p>
        </div>
        <span className="badge badge-completed">Level 1 — Simplified Diffusive Wave</span>
      </div>

      <SimulationNav simulationId={simId} />

      {/* Mandatory Scientific Disclaimer Banner */}
      <div className="card" style={{ borderColor: '#0284C7', background: '#0C4A6E', color: '#E0F2FE', fontSize: '0.85rem' }}>
        <strong>Scientific Disclaimer:</strong> Scenario-based / simplified inundation model for scenario screening, not for engineering design or official disaster warnings.
      </div>

      {loading ? (
        <div className="card" style={{ color: 'var(--text-secondary)' }}>Loading simulation results...</div>
      ) : error ? (
        <div className="card" style={{ borderColor: '#7F1D1D', background: '#450A0A', color: '#FCA5A5' }}>{error}</div>
      ) : results ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary KPI Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="card">
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Inundated Flood Area
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>
                {results.floodAreaKm2.toFixed(3)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>km²</span>
              </div>
            </div>

            <div className="card">
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Maximum Water Depth
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#38BDF8', marginTop: '0.25rem' }}>
                {results.maxDepthM.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>m</span>
              </div>
            </div>

            <div className="card">
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Maximum Flow Velocity
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#F97316', marginTop: '0.25rem' }}>
                {results.maxVelocityMs.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>m/s</span>
              </div>
            </div>

            <div className="card">
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Min Arrival Time
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#EAB308', marginTop: '0.25rem' }}>
                {results.arrivalTimeMin.toFixed(1)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>min</span>
              </div>
            </div>

            <div className="card">
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Affected Road Length
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                {results.roadsAffectedKm.toFixed(2)} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>km</span>
              </div>
            </div>

            <div className="card">
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Mass Balance Error
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#22C55E', marginTop: '0.25rem' }}>
                {(results.massBalanceErrorPercent || 0.0).toFixed(4)}%
              </div>
            </div>
          </div>

          {/* Model Information Table */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Execution Technical Specifications
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <div><strong>Solver Engine:</strong> Level 1 — Native 2D Diffusive Wave</div>
              <div><strong>Execution Duration:</strong> {(results.executionTimeSeconds || 0.0).toFixed(2)} seconds</div>
              <div><strong>Data Source:</strong> {results.dataSource === 'live' ? 'Live Hydrodynamic Output' : 'Mock Sample'}</div>
              <div><strong>CRS Processing:</strong> EPSG:32643 (UTM Zone 43N) &rarr; EPSG:4326 (WGS84)</div>
            </div>
          </div>

          {/* Export GIS Results Section */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              Export GIS Results & Data Products
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button onClick={() => handleExport('geojson')} disabled={exportLoading} className="btn btn-primary">
                Export GeoJSON (Extent)
              </button>
              <button onClick={() => handleExport('shp')} disabled={exportLoading} className="btn btn-secondary">
                Export Shapefile (SHP)
              </button>
              <button onClick={() => handleExport('kml')} disabled={exportLoading} className="btn btn-secondary">
                Export KML
              </button>
              <button onClick={() => handleExport('geotiff')} disabled={exportLoading} className="btn btn-secondary">
                Export GeoTIFF
              </button>
              <button onClick={() => handleExport('report_pdf')} disabled={exportLoading} className="btn btn-secondary">
                Export PDF Summary
              </button>
            </div>

            {exportJob && exportJob.downloadUrl && (
              <div style={{ background: '#052E16', border: '1px solid #14532D', color: '#4ADE80', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>GeoJSON Export Ready: <strong>{exportJob.downloadUrl}</strong></span>
                <a href={apiClient.getResultFileUrl(simId, 'flood_extent.geojson')} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: '0.75rem' }}>
                  Download GeoJSON
                </a>
              </div>
            )}

            {exportError && (
              <div style={{ background: '#450A0A', border: '1px solid #7F1D1D', color: '#FCA5A5', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                <strong>Export Error:</strong> {exportError}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
