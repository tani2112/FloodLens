import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { useSimulationDraftStore } from '../store/useSimulationDraftStore';
import { StudyArea } from '../types';

export const NewStudyAreaPage: React.FC = () => {
  const navigate = useNavigate();
  const { setStudyArea } = useSimulationDraftStore();
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('idukki-canonical');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getStudyAreas()
      .then((data) => {
        setStudyAreas(data);
        if (data.length > 0) {
          setSelectedAreaId(data[0].id);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(`Failed to load study areas: ${err.message}`);
        setLoading(false);
      });
  }, []);

  const handleNext = () => {
    const selected = studyAreas.find((a) => a.id === selectedAreaId) || studyAreas[0];
    if (selected) {
      setStudyArea(selected);
      navigate('/simulations/new/scenario');
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase' }}>
          Simulation Wizard — Step 1 of 3
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Select Canonical Study Area
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Choose a geographic AOI containing elevation DEM rasters and infrastructure vectors.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading registered study areas...
        </div>
      ) : error ? (
        <div className="card" style={{ borderColor: '#7F1D1D', background: '#450A0A', color: '#FCA5A5' }}>
          {error}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {studyAreas.map((area) => {
            const isSelected = selectedAreaId === area.id;
            return (
              <div
                key={area.id}
                onClick={() => setSelectedAreaId(area.id)}
                className="card"
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-color)',
                  background: isSelected ? 'var(--bg-surface-hover)' : 'var(--bg-surface-card)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                    {area.name}
                  </h3>
                  <span className="badge badge-completed">Canonical AOI</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div><strong>River Catchment:</strong> {area.river}</div>
                  <div><strong>Origin Structure:</strong> {area.damOrBlockage}</div>
                  <div><strong>Elevation Source:</strong> {area.demDataset}</div>
                  <div><strong>Coordinates (WGS84):</strong> [{area.bbox.join(', ')}]</div>
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={handleNext} className="btn btn-primary">
              Continue to Step 2: Scenario &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
