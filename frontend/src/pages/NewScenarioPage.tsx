import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { useSimulationDraftStore } from '../store/useSimulationDraftStore';
import { SimulationStepper } from '../components/common/SimulationStepper';

export const NewScenarioPage: React.FC = () => {
  const navigate = useNavigate();
  const { studyArea, setScenario } = useSimulationDraftStore();

  const [scenarioType, setScenarioType] = useState<'dam_break' | 'natural_blockage' | 'glof' | 'water_release'>('dam_break');
  const [initialWaterLevelM, setInitialWaterLevelM] = useState<number>(50.0);
  const [reservoirVolumeMm3, setReservoirVolumeMm3] = useState<number>(10.0);
  const [breachWidthM, setBreachWidthM] = useState<number>(100.0);
  const [breachFormationTimeMin, setBreachFormationTimeMin] = useState<number>(30.0);
  const [simulationDurationHr, setSimulationDurationHr] = useState<number>(1.0);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const studyAreaId = studyArea?.id || 'idukki-canonical';

    try {
      const created = await apiClient.createScenario({
        studyAreaId,
        type: scenarioType,
        parameters: {
          initialWaterLevelM,
          reservoirVolumeMm3,
          breachWidthM,
          breachFormationTimeMin,
          simulationDurationHr,
          roughnessCoefficient: 0.035
        }
      });

      setScenario(created);
      navigate('/simulations/new/model');
    } catch (err: any) {
      setError(err.detail || err.message || 'Failed to create scenario configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Simulation Wizard — Step 2 of 4
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
          Scenario Hydraulics Configuration
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Define breach hydrograph hydraulics and reservoir storage volumes for canonical AOI.
        </p>
      </div>

      <SimulationStepper currentStep={2} />

      {error && (
        <div className="card" style={{ borderColor: '#fca5a5', background: '#fee2e2', color: '#991b1b' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group">
          <label className="form-label">Hazard Event Type</label>
          <select
            value={scenarioType}
            onChange={(e) => setScenarioType(e.target.value as any)}
            className="form-select"
          >
            <option value="dam_break">Dam Break / Structure Failure</option>
            <option value="natural_blockage">Landslide Dam / Natural Blockage Failure</option>
            <option value="glof">Glacial Lake Outburst Flood (GLOF)</option>
            <option value="water_release">Controlled Heavy Spillway Release</option>
          </select>
          <span className="form-help">Select the primary mechanism initiating rapid water release into the downstream river channel.</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="form-group">
            <label className="form-label">Initial Reservoir Head (m)</label>
            <input
              type="number"
              step="0.1"
              value={initialWaterLevelM}
              onChange={(e) => setInitialWaterLevelM(parseFloat(e.target.value))}
              className="form-input"
            />
            <span className="form-help">The water surface elevation behind the dam relative to the downstream river bed.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Reservoir Storage Volume (Mm³)</label>
            <input
              type="number"
              step="0.1"
              value={reservoirVolumeMm3}
              onChange={(e) => setReservoirVolumeMm3(parseFloat(e.target.value))}
              className="form-input"
            />
            <span className="form-help">The total volume of impounded water in million cubic meters available to drain.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Final Breach Width (m)</label>
            <input
              type="number"
              step="1"
              value={breachWidthM}
              onChange={(e) => setBreachWidthM(parseFloat(e.target.value))}
              className="form-input"
            />
            <span className="form-help">The approximate width of the dam breach opening through which water discharges.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Breach Formation Time (min)</label>
            <input
              type="number"
              step="1"
              value={breachFormationTimeMin}
              onChange={(e) => setBreachFormationTimeMin(parseFloat(e.target.value))}
              className="form-input"
            />
            <span className="form-help">The duration over which the breach gap widens to its maximum dimension.</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Simulation Propagation Duration (hours)</label>
          <input
            type="number"
            step="0.1"
            value={simulationDurationHr}
            onChange={(e) => setSimulationDurationHr(parseFloat(e.target.value))}
            className="form-input"
          />
          <span className="form-help">Total timeframe for tracking the 2D flood wave downstream through the catchment.</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button type="button" onClick={() => navigate('/simulations/new/study-area')} className="btn btn-secondary">
            ← Back to Step 1
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Creating Scenario...' : 'Continue to Step 3: Model Level →'}
          </button>
        </div>
      </form>
    </div>
  );
};
