import React from 'react';
import { ScenarioParameters } from '../../types';

interface ScenarioProfileProps {
  simulationId: string;
  studyAreaId?: string;
  modelLevel?: string;
  createdAt?: string;
  scenarioType?: string;
  parameters?: ScenarioParameters;
}

export const ScenarioProfile: React.FC<ScenarioProfileProps> = ({
  simulationId,
  studyAreaId = 'idukki-canonical',
  modelLevel = 'level1',
  createdAt,
  scenarioType = 'dam_break',
  parameters = {}
}) => {
  const headM = parameters.initialWaterLevelM ?? parameters.damHeightM ?? 70.0;
  const volumeMm3 = parameters.reservoirVolumeMm3 ?? 5.5;
  const breachWidthM = parameters.breachWidthM ?? 45.0;
  const breachTimeMin = parameters.breachFormationTimeMin ?? 15.0;
  const durationHr = parameters.simulationDurationHr ?? 1.0;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.6rem' }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Hydraulic Scenario Profile
          </span>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
            {simulationId}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span className="badge badge-completed" style={{ textTransform: 'uppercase', fontSize: '0.72rem' }}>
            {modelLevel} 2D Engine
          </span>
          <span className="badge" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.72rem', textTransform: 'capitalize' }}>
            {scenarioType.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
        <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Study Area (AOI)</span>
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>Idukki Catchment</strong>
        </div>

        <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Initial Reservoir Head</span>
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{Number(headM).toFixed(1)} m</strong>
        </div>

        <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Reservoir Storage Volume</span>
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{Number(volumeMm3).toFixed(2)} Mm³</strong>
        </div>

        <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Breach Opening Width</span>
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{Number(breachWidthM).toFixed(1)} m</strong>
        </div>

        <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Breach Formation Time</span>
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{Number(breachTimeMin).toFixed(1)} min</strong>
        </div>

        <div style={{ background: 'var(--bg-surface-secondary)', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>Simulation Window</span>
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{Number(durationHr).toFixed(1)} hr ({Number(durationHr * 60).toFixed(0)} min)</strong>
        </div>
      </div>
    </div>
  );
};
