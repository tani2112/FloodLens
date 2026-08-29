import React from 'react';
import { useParams } from 'react-router-dom';
import { SimulationNav } from '../components/simulations/SimulationNav';
import { FloodMap } from '../components/map/FloodMap';

export const MapPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const simId = id || 'sim-level1-default';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Interactive Flood Map Canvas
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Simulation Run: <code style={{ color: 'var(--accent-cyan)' }}>{simId}</code> | Model: Level 1 2D Diffusive Wave
          </p>
        </div>
        <span className="badge badge-completed">Level 1 2D Engine</span>
      </div>

      <SimulationNav simulationId={simId} />

      <FloodMap simulationId={simId} />
    </div>
  );
};
