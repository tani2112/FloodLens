import React from 'react';
import { useParams } from 'react-router-dom';
import { SimulationNav } from '../components/simulations/SimulationNav';
import { FloodMap } from '../components/map/FloodMap';

import { WorkflowSequenceBar } from '../components/common/WorkflowSequenceBar';
import { useNavigate } from 'react-router-dom';

export const MapPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const simId = id || 'NP-2026-08-26-001';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 5-Step Operational Workflow Sequence Header */}
      <WorkflowSequenceBar currentStep={4} activeSimulationId={simId} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Step 4: View Dynamic Inundation Map & Wavefront Timeline
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Simulation Scenario: <strong>{simId}</strong> | Solver: Level 1 2D Diffusive Wave Engine
          </p>
        </div>
        <button
          onClick={() => navigate(`/simulations/${simId}/impact`)}
          className="btn btn-primary"
          style={{ padding: '0.55rem 1.1rem', fontWeight: 700 }}
        >
          Step 5: Analyze Impact & Evacuation →
        </button>
      </div>

      <SimulationNav simulationId={simId} />

      <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 230px)', minHeight: '550px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #BAE6FD', background: '#07111F' }}>
        <FloodMap simulationId={simId} showFullscreenToggle={true} showFloatingControls={true} />
      </div>
    </div>
  );
};
