import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { useSimulationDraftStore } from '../store/useSimulationDraftStore';

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
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase' }}>
          Simulation Wizard — Step 2 of 3
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Scenario Parameters Configuration
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Define breach hydrograph hydraulics and reservoir storage volumes for canonical AOI.
        </p>
      </div>

      {error && (
        <div className="card" style={{ borderColor: '#7F1D1D', background: '#450A0A', color: '#FCA5A5' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
            Hazard Event Type
          </label>
          <select
            value={scenarioType}
            onChange={(e) => setScenarioType(e.target.value as any)}
            style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
          >
            <option value="dam_break">Dam Break / Structure Failure</option>
            <option value="natural_blockage">Landslide Dam / Natural Blockage Failure</option>
            <option value="glof">Glacial Lake Outburst Flood (GLOF)</option>
            <option value="water_release">Controlled Heavy Spillway Release</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
              Initial Reservoir Head (m)
            </label>
            <input
              type="number"
              step="0.1"
              value={initialWaterLevelM}
              onChange={(e) => setInitialWaterLevelM(parseFloat(e.target.value))}
              style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
              Reservoir Storage Volume (Mm³)
            </label>
            <input
              type="number"
              step="0.1"
              value={reservoirVolumeMm3}
              onChange={(e) => setReservoirVolumeMm3(parseFloat(e.target.value))}
              style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
              Final Breach Width (m)
            </label>
            <input
              type="number"
              step="1"
              value={breachWidthM}
              onChange={(e) => setBreachWidthM(parseFloat(e.target.value))}
              style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
              Breach Formation Time (min)
            </label>
            <input
              type="number"
              step="1"
              value={breachFormationTimeMin}
              onChange={(e) => setBreachFormationTimeMin(parseFloat(e.target.value))}
              style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
            Simulation Duration (hours)
          </label>
          <input
            type="number"
            step="0.1"
            value={simulationDurationHr}
            onChange={(e) => setSimulationDurationHr(parseFloat(e.target.value))}
            style={{ width: '100%', padding: '0.5rem', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
          <button type="button" onClick={() => navigate('/simulations/new/study-area')} className="btn btn-secondary">
            &larr; Back to Step 1
          </button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Creating Scenario...' : 'Continue to Step 3: Model Level &rarr;'}
          </button>
        </div>
      </form>
    </div>
  );
};
