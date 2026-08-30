import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSimulationDraftStore } from '../store/useSimulationDraftStore';
import { ModelLevel } from '../types';
import { SimulationStepper } from '../components/common/SimulationStepper';

export const NewModelPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedModelLevel, setModelLevel } = useSimulationDraftStore();

  const modelOptions = [
    {
      id: 'level1',
      title: 'Level 1 — 2D Diffusive Wave Hydrodynamic Engine',
      isAvailable: true,
      badge: 'Active Solver',
      desc: 'Native Python 2D finite-volume cellular diffusive-wave flow solver over DEM elevation rasters. Computes spatial inundation extent, water depth, flow velocity, and arrival lead times in metric EPSG:32643 projection.'
    },
    {
      id: 'level2',
      title: 'Level 2 — Full 2D Shallow Water Equations (SWE)',
      isAvailable: false,
      badge: 'Not Available',
      desc: 'High-fidelity momentum-conserving 2D SWE numerical solver suite for high-velocity turbulent hydrodynamics. Planned for future scientific release.'
    },
    {
      id: 'sph_adapter',
      title: 'Level 3 — SPH Particle Adapter Interface',
      isAvailable: false,
      badge: 'Not Available',
      desc: 'Smoothed Particle Hydrodynamics (SPH) 3D turbulent flow adapter contract interface stub.'
    },
    {
      id: 'delft3d_adapter',
      title: 'Level 3 — Delft3D Execution Adapter Interface',
      isAvailable: false,
      badge: 'Not Available',
      desc: 'External industrial Delft3D hydrodynamic modeling suite execution wrapper contract interface stub.'
    }
  ];

  const handleSelectModel = (id: string, isAvailable: boolean) => {
    if (isAvailable) {
      setModelLevel(id as ModelLevel);
    }
  };

  const handleNext = () => {
    navigate('/simulations/new/review');
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Simulation Wizard — Step 3 of 4
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem', letterSpacing: '-0.02em' }}>
          Hydrodynamic Model Selection
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Select the physics engine tier for 2D flow propagation, cell-by-cell raster routing, and GIS exposure calculation.
        </p>
      </div>

      <SimulationStepper currentStep={3} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {modelOptions.map((opt) => {
          const isSelected = selectedModelLevel === opt.id && opt.isAvailable;
          return (
            <div
              key={opt.id}
              onClick={() => handleSelectModel(opt.id, opt.isAvailable)}
              className="card"
              style={{
                cursor: opt.isAvailable ? 'pointer' : 'not-allowed',
                opacity: opt.isAvailable ? 1 : 0.65,
                borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-color)',
                background: isSelected ? 'var(--bg-surface-muted)' : 'var(--bg-surface)',
                boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 182, 0.25)' : '0 1px 3px rgba(23, 43, 58, 0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {opt.title}
                </h3>
                <span className={`badge ${opt.isAvailable ? 'badge-completed' : 'badge-pending'}`}>
                  {opt.badge}
                </span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {opt.desc}
              </p>
            </div>
          );
        })}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button onClick={() => navigate('/simulations/new/scenario')} className="btn btn-secondary">
            ← Back to Step 2
          </button>
          <button onClick={handleNext} className="btn btn-primary">
            Continue to Step 4: Final Review →
          </button>
        </div>
      </div>
    </div>
  );
};
