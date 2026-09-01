import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { StudyArea } from '../types';
import { useSimulationDraftStore } from '../store/useSimulationDraftStore';

import { LoadingState, ErrorState } from '../components/common/StateComponents';

import { WorkflowSequenceBar } from '../components/common/WorkflowSequenceBar';
import { mockStudyAreas } from '../data/mock';

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
        const combined = [...mockStudyAreas];
        data.forEach((item) => {
          if (!combined.some((a) => a.id === item.id)) {
            combined.push(item);
          }
        });
        setStudyAreas(combined);
        setLoading(false);
      })
      .catch(() => {
        setStudyAreas(mockStudyAreas);
        setError(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchStudyAreas();
  }, []);

  const handleSelectArea = (area: StudyArea) => {
    setStudyArea(area);
    navigate(`/simulations/new/scenario?studyAreaId=${area.id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 5-Step Workflow Sequence Header */}
      <WorkflowSequenceBar currentStep={1} />

      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Step 1: Select River Catchment & Dam Infrastructure
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Select a River Catchment and Origin Structure to initiate breach modeling and downstream flood routing.
        </p>
      </div>

      {loading ? (
        <LoadingState message="Loading study area registry..." />
      ) : error ? (
        <ErrorState title="Study Area Error" message={error} onRetry={fetchStudyAreas} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {studyAreas.map((area) => {
            const isNepal = area.id.includes('nepal') || area.id.includes('bhotekoshi') || area.name.includes('Nepal') || area.name.includes('Himalaya');

            return (
              <div
                key={area.id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1.5rem',
                  border: isNepal ? '2px solid #0284c7' : '1px solid var(--border-color)',
                  background: isNepal ? '#f0f9ff' : 'var(--bg-surface)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{area.name}</h2>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Identifier: {area.id}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isNepal && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '4px', background: '#0284c7', color: '#ffffff' }}>
                        ⭐ PRIMARY DEMONSTRATION SHOWCASE
                      </span>
                    )}
                    <span className="badge badge-completed">Canonical AOI</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem', fontSize: '0.88rem', color: 'var(--text-secondary)', background: isNepal ? '#ffffff' : 'var(--bg-surface-secondary)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <div><strong>River Catchment:</strong> {area.river}</div>
                  <div><strong>Primary Origin Structure:</strong> {area.damOrBlockage}</div>
                  <div><strong>Elevation DEM Dataset:</strong> {area.demDataset}</div>
                  <div><strong>Satellite Calibration:</strong> {area.satelliteDataset || 'Sentinel-1 SAR / Sentinel-2 MSI'}</div>
                  <div><strong>Internal Metric Projection:</strong> EPSG:32645 (UTM 45N)</div>
                  <div><strong>Geographic Output CRS:</strong> EPSG:4326 (WGS84)</div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Step 1 of 5 selected → Proceed to Breach Configuration
                  </span>
                  <button onClick={() => handleSelectArea(area)} className="btn btn-primary" style={{ padding: '0.5rem 1.1rem', fontWeight: 700 }}>
                    Step 2: Configure Breach Scenario →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
