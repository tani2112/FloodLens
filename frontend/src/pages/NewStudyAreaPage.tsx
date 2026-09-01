import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { useSimulationDraftStore } from '../store/useSimulationDraftStore';
import { StudyArea } from '../types';
import { SimulationStepper } from '../components/common/SimulationStepper';
import { mockStudyAreas } from '../data/mock';

export const NewStudyAreaPage: React.FC = () => {
  const navigate = useNavigate();
  const { setStudyArea } = useSimulationDraftStore();
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('nepal-lhende-bhotekoshi-aoi');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getStudyAreas()
      .then((data) => {
        const combined = [...mockStudyAreas];
        data.forEach((item) => {
          if (!combined.some((a) => a.id === item.id)) {
            combined.push(item);
          }
        });
        setStudyAreas(combined);
        if (combined.length > 0) {
          setSelectedAreaId(combined[0].id);
        }
        setLoading(false);
      })
      .catch(() => {
        setStudyAreas(mockStudyAreas);
        setSelectedAreaId(mockStudyAreas[0].id);
        setError(null);
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
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Simulation Wizard — Step 1 of 4
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
          Select Study Area AOI
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Select the river catchment and study Area of Interest (AOI) to configure a 2D hydrodynamic flood wave propagation model.
        </p>
      </div>

      <SimulationStepper currentStep={1} />

      {loading ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
          Loading registered study areas...
        </div>
      ) : error ? (
        <div className="card" style={{ borderColor: '#fca5a5', background: '#fee2e2', color: '#991b1b' }}>
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
                  borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                  background: isSelected ? '#f0f9ff' : 'var(--bg-surface)',
                  boxShadow: isSelected ? '0 0 0 2px rgba(2, 132, 199, 0.2)' : '0 1px 3px rgba(0,0,0,0.03)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {area.name}
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {area.description || 'Canonical Area of Interest for Hydrodynamic Simulation'}
                    </p>
                  </div>
                  <span className="badge badge-completed">{area.river.split('→')[0].trim()} Corridor</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-surface-secondary)', padding: '0.75rem 1rem', borderRadius: '6px' }}>
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
              Continue to Step 2: Scenario →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
