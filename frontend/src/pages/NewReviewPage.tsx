import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { useSimulationDraftStore } from '../store/useSimulationDraftStore';
import { SimulationStepper } from '../components/common/SimulationStepper';
import { ScientificDisclaimer } from '../components/common/ScientificDisclaimer';
import { ConfirmationDialog, ErrorState } from '../components/common/StateComponents';

import { WorkflowSequenceBar } from '../components/common/WorkflowSequenceBar';

export const NewReviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { studyArea, scenario, selectedModelLevel } = useSimulationDraftStore();

  const [loading, setLoading] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunSimulation = async () => {
    const scenId = scenario?.id || 'scen-nepal-glof';

    setLoading(true);
    setError(null);
    setShowConfirmModal(false);

    try {
      const simulation = await apiClient.createSimulation({
        scenarioId: scenId,
        modelLevel: selectedModelLevel
      });

      navigate(`/simulations/${simulation.id}/progress`);
    } catch (err: any) {
      setError(err.detail || err.message || 'Failed to trigger simulation engine execution');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 5-Step Operational Workflow Sequence Header */}
      <WorkflowSequenceBar currentStep={3} />

      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
          Step 3: Review Scenario & Execute Hydrodynamic Solver
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Review configured hydraulic parameters and spatial boundaries prior to starting the Level 1 2D solver.
        </p>
      </div>

      <SimulationStepper currentStep={4} />

      {error && (
        <ErrorState
          title="Simulation Execution Rejected"
          message={error}
          onRetry={() => setShowConfirmModal(true)}
          onBack={() => navigate('/simulations')}
          backLabel="Back to Registry"
        />
      )}

      {/* Review Summary Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
            📍 Geographic AOI
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
            <div><span style={{ color: 'var(--text-secondary)' }}>Study Area:</span> <strong>{studyArea?.name || 'Lhende Khola & Bhote Koshi / Trishuli River Catchment'}</strong></div>
            <div><span style={{ color: 'var(--text-secondary)' }}>River System:</span> {studyArea?.river || 'Lhende Khola → Bhote Koshi River'}</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>Origin Structure:</span> {studyArea?.damOrBlockage || 'Ice/Rock Avalanche Temporary Landslide Dam'}</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>DEM Source:</span> {studyArea?.demDataset || 'ALOS PALSAR 12.5m / Copernicus DEM'}</div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
            ⚙️ Hydraulic Scenario
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.88rem' }}>
            <div><span style={{ color: 'var(--text-secondary)' }}>Event Type:</span> <strong style={{ textTransform: 'uppercase' }}>{scenario?.type || 'glof_spillway'}</strong></div>
            <div><span style={{ color: 'var(--text-secondary)' }}>Reservoir Head:</span> {scenario?.parameters?.initialWaterLevelM || 50.0} m</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>Storage Volume:</span> {scenario?.parameters?.reservoirVolumeMm3 || 10.0} Mm³</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>Breach Width:</span> {scenario?.parameters?.breachWidthM || 100.0} m</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>Formation Time:</span> {scenario?.parameters?.breachFormationTimeMin || 30.0} min</div>
            <div><span style={{ color: 'var(--text-secondary)' }}>Duration:</span> {scenario?.parameters?.simulationDurationHr || 2.25} hr</div>
          </div>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
            🧮 Hydrodynamic Solver & Output Artifacts
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.88rem' }}>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Level 1 2D Diffusive Wave Engine</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Native Python cellular finite-volume flow routing with Manning roughness coefficient n = 0.035.
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Expected GIS Outputs</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Inundation Extent GeoJSON, Depth & Velocity Rasters, Settlement Exposure Table, Early Warning Alerts.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ScientificDisclaimer />

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
        <button type="button" onClick={() => navigate('/simulations/new/model')} className="btn btn-secondary">
          ← Back to Step 3: Model
        </button>
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={loading}
          className="btn btn-primary"
          style={{ padding: '0.65rem 1.4rem', fontSize: '0.95rem' }}
        >
          {loading ? 'Orchestrating Pipeline...' : '▶ Launch Level 1 Hydrodynamic Simulation'}
        </button>
      </div>

      <ConfirmationDialog
        isOpen={showConfirmModal}
        title="Confirm Simulation Engine Execution"
        message="Are you sure you want to initialize the Level 1 2D diffusive wave solver with the configured parameters? Output GeoJSON vector layers will be written to SQLite database persistence."
        confirmLabel="Confirm & Launch Solver"
        cancelLabel="Review Parameters"
        onConfirm={handleRunSimulation}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};
