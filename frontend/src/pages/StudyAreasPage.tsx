import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { StudyArea } from '../types';
import { useSimulationDraftStore } from '../store/useSimulationDraftStore';

import { LoadingState, ErrorState } from '../components/common/StateComponents';

export const StudyAreasPage: React.FC = () => {
  const navigate = useNavigate();
  const { setStudyArea } = useSimulationDraftStore();
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudyAreas = () => {
    setLoading(true);
    setError(null);
    apiClient.getStudyAreas()
      .then((data) => {
        setStudyAreas(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.detail || err.message || 'Failed loading study areas');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStudyAreas();
  }, []);

  const handleSelectArea = (area: StudyArea) => {
    setStudyArea(area);
    navigate('/simulations/new/scenario');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Registered Study Area Registry
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Geographic Areas of Interest (AOI) with validated elevation DEM rasters and infrastructure vectors.
        </p>
      </div>

      {loading ? (
        <LoadingState message="Loading study area registry..." />
      ) : error ? (
        <ErrorState title="Study Area Error" message={error} onRetry={fetchStudyAreas} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {studyAreas.map((area) => (
            <div key={area.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{area.name}</h2>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Identifier: {area.id}</span>
                </div>
                <span className="badge badge-completed">Canonical AOI</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', fontSize: '0.88rem', color: 'var(--text-secondary)', background: 'var(--bg-surface-secondary)', padding: '1rem', borderRadius: '6px' }}>
                <div><strong>River Catchment:</strong> {area.river}</div>
                <div><strong>Primary Origin Structure:</strong> {area.damOrBlockage}</div>
                <div><strong>Elevation DEM Dataset:</strong> {area.demDataset}</div>
                <div><strong>Satellite Calibration:</strong> {area.satelliteDataset || 'Sentinel-1 SAR / Sentinel-2 MSI'}</div>
                <div><strong>Internal Metric Projection:</strong> EPSG:32643 (UTM 43N)</div>
                <div><strong>Geographic Output CRS:</strong> EPSG:4326 (WGS84)</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                <button onClick={() => handleSelectArea(area)} className="btn btn-primary">
                  Configure Scenario for this AOI →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
