import React from 'react';
import { useParams } from 'react-router-dom';
import { SimulationNav } from '../components/simulations/SimulationNav';
import { FloodMap } from '../components/map/FloodMap';

export const MapPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const simId = id || 'sim-level1-default';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Interactive Flood Map Canvas
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Simulation Run ID: <strong>{simId}</strong> | Solver: Level 1 2D Diffusive Wave Engine
          </p>
        </div>
        <span className="badge badge-completed">Level 1 2D Active</span>
      </div>

      <SimulationNav simulationId={simId} />

      <FloodMap simulationId={simId} />
    </div>
  );
};
