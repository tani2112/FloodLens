import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { StudyArea } from '../types';
import { useSimulationDraftStore } from '../store/useSimulationDraftStore';

export const StudyAreasPage: React.FC = () => {
  const navigate = useNavigate();
  const { setStudyArea } = useSimulationDraftStore();
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getStudyAreas()
      .then((data) => {
        setStudyAreas(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.detail || err.message || 'Failed loading study areas');
        setLoading(false);
      });
  }, []);

  const handleSelectArea = (area: StudyArea) => {
    setStudyArea(area);
    navigate('/simulations/new/scenario');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Registered Study Area Registry
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Geographic Areas of Interest (AOI) with validated DEM rasters and infrastructure layers.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ color: 'var(--text-secondary)' }}>Loading study areas...</div>
      ) : error ? (
        <div className="card" style={{ borderColor: '#7F1D1D', background: '#450A0A', color: '#FCA5A5' }}>{error}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {studyAreas.map((area) => (
            <div key={area.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: 'var(--accent-cyan)' }}>{area.name}</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {area.id}</span>
                </div>
                <span className="badge badge-completed">Canonical AOI Validated</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <div><strong>River Catchment:</strong> {area.river}</div>
                <div><strong>Primary Infrastructure:</strong> {area.damOrBlockage}</div>
                <div><strong>DEM Source:</strong> {area.demDataset}</div>
                <div><strong>Satellite Datasets:</strong> {area.satelliteDataset || 'Sentinel-1 / Sentinel-2'}</div>
                <div><strong>Metric CRS:</strong> EPSG:32643 (UTM Zone 43N)</div>
                <div><strong>Geographic CRS:</strong> EPSG:4326 (WGS84)</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                <button onClick={() => handleSelectArea(area)} className="btn btn-primary">
                  Configure Simulation for this AOI &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
