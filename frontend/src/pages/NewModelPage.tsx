import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { useSimulationDraftStore } from '../store/useSimulationDraftStore';
import { ModelLevel } from '../types';

export const NewModelPage: React.FC = () => {
  const navigate = useNavigate();
  const { scenario, selectedModelLevel, setModelLevel } = useSimulationDraftStore();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const modelOptions = [
    {
      id: 'level1',
      title: 'Level 1 — 2D Diffusive Wave Engine',
      status: 'implemented',
      badge: 'Implemented & Ready',
      desc: 'Native Python 2D cellular diffusive flow solver over SRTM/Copernicus DEM. Computes water depth, arrival time, and velocity grids.'
    },
    {
      id: 'level2',
      title: 'Level 2 — Full 2D Shallow Water Equations (SWE)',
      status: 'planned',
      badge: 'Planned Phase',
      desc: 'High-fidelity inertia & momentum conserving SWE solver. Returns 501 Not Implemented if triggered.'
    },
    {
      id: 'sph_adapter',
      title: 'Level 3 — SPH Particle Adapter Interface',
      status: 'adapter_sample_only',
      badge: 'Adapter Interface Stub',
      desc: 'Smoothed Particle Hydrodynamics (SPH) 3D turbulent flow adapter contract interface.'
    },
    {
      id: 'delft3d_adapter',
      title: 'Level 3 — Delft3D Execution Adapter Interface',
      status: 'adapter_sample_only',
      badge: 'Adapter Interface Stub',
      desc: 'Industrial hydrodynamic modeling suite execution wrapper contract interface.'
    }
  ];

  const handleRunSimulation = async () => {
    if (!scenario?.id) {
      setError('No scenario configured. Please complete Step 2 first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const simulation = await apiClient.createSimulation({
        scenarioId: scenario.id,
        modelLevel: selectedModelLevel
      });

      navigate(`/simulations/${simulation.id}`);
    } catch (err: any) {
      setError(err.detail || err.message || 'Failed to start simulation orchestration pipeline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase' }}>
          Simulation Wizard — Step 3 of 3
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Hydrodynamic Model Selection
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Select scientific fidelity tier for 2D flow propagation and GIS exposure analysis.
        </p>
      </div>

      {error && (
        <div className="card" style={{ borderColor: '#7F1D1D', background: '#450A0A', color: '#FCA5A5' }}>
          <h4 style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Model Execution Warning</h4>
          <p style={{ fontSize: '0.85rem' }}>{error}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {modelOptions.map((opt) => {
          const isSelected = selectedModelLevel === opt.id;
          return (
            <div
              key={opt.id}
              onClick={() => setModelLevel(opt.id as ModelLevel)}
              className="card"
              style={{
                cursor: 'pointer',
                borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-color)',
                background: isSelected ? 'var(--bg-surface-hover)' : 'var(--bg-surface-card)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', color: isSelected ? 'var(--accent-cyan)' : 'var(--text-primary)' }}>
                  {opt.title}
                </h3>
                <span className={`badge ${opt.status === 'implemented' ? 'badge-completed' : 'badge-pending'}`}>
                  {opt.badge}
                </span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {opt.desc}
              </p>
            </div>
          );
        })}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button onClick={() => navigate('/simulations/new/scenario')} className="btn btn-secondary">
            &larr; Back to Step 2
          </button>
          <button onClick={handleRunSimulation} disabled={loading} className="btn btn-primary">
            {loading ? 'Orchestrating Simulation...' : 'Run Hydrodynamic Simulation \u25B6'}
          </button>
        </div>
      </div>
    </div>
  );
};
