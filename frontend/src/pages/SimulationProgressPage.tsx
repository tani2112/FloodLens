import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { SimulationStatus, Simulation } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ErrorState } from '../components/common/StateComponents';

import { WorkflowSequenceBar } from '../components/common/WorkflowSequenceBar';

export const SimulationProgressPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<SimulationStatus | null>(null);
  const [simDetails, setSimDetails] = useState<Simulation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [startTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    if (!id) return;

    // Fetch simulation details once
    apiClient.getSimulation(id)
      .then((data) => setSimDetails(data))
      .catch(() => {});

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const data = await apiClient.getSimulationStatus(id);
        if (isSubscribed) {
          setStatus(data);
          if (data.stagePercent >= 100) {
            clearInterval(interval);
            clearInterval(timer);
          }
        }
      } catch (err: any) {
        if (isSubscribed) {
          setError(err.detail || err.message || 'Failed polling simulation execution status from backend service');
          clearInterval(interval);
          clearInterval(timer);
        }
      }
    }, 1000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [id]);

  if (error) {
    return (
      <div style={{ maxWidth: '850px', margin: '1.5rem auto' }}>
        <WorkflowSequenceBar currentStep={3} activeSimulationId={id || 'NP-2026-08-26-001'} />
        <ErrorState
          title="Simulation Execution Error"
          message={error}
          onRetry={() => window.location.reload()}
          onBack={() => navigate('/simulations')}
          backLabel="Back to Simulation Registry"
        />
      </div>
    );
  }

  const pct = status?.stagePercent || 0;
  const isComplete = pct >= 100;
  const isFailed = simDetails?.status === 'failed';

  const detailedStages = [
    { name: 'Preparing study area & canonical bounds', threshold: 15 },
    { name: 'Loading DEM terrain & roughness matrices', threshold: 30 },
    { name: 'Initializing Level 1 hydraulic solver', threshold: 50 },
    { name: 'Running 2D diffusive-wave simulation', threshold: 75 },
    { name: 'Exporting GIS flood extent & vector layers', threshold: 90 },
    { name: 'Calculating settlement exposure & warnings', threshold: 100 }
  ];

  return (
    <div style={{ maxWidth: '950px', margin: '1rem auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 5-Step Operational Workflow Sequence Header */}
      <WorkflowSequenceBar currentStep={3} activeSimulationId={id || 'NP-2026-08-26-001'} />

      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
          Step 3: Nepal Himalayan GLOF Solver Execution Pipeline
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {isComplete
            ? 'Simulation & GIS vector export completed successfully. Proceed to Step 4 to view the Dynamic Inundation Map.'
            : isFailed
            ? 'Simulation execution encountered an error during flow routing.'
            : 'Executing Level 1 2D hydrodynamic finite-volume solver...'}
        </p>
      </div>

      {/* Metadata Card */}
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', background: 'var(--bg-surface-secondary)' }}>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Simulation ID</div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{id}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Scenario ID</div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{simDetails?.scenarioId || 'scen-nepal-glof'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Solver Model</div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{simDetails?.modelLevel || 'Level 1 (2D Diffusive)'}</div>
        </div>
        <div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pipeline Started</div>
          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{startTime}</div>
        </div>
      </div>

      {/* Progress & Stages */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.75rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.92rem', marginBottom: '0.6rem' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{status?.stage || 'Initializing Pipeline...'}</span>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Elapsed: {elapsedSeconds}s</span>
              <span style={{ color: isFailed ? '#dc2626' : 'var(--accent-primary)', fontWeight: 800, fontSize: '1.1rem' }}>{pct}%</span>
            </div>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'var(--bg-surface-secondary)', borderRadius: '5px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: isFailed ? '#dc2626' : 'linear-gradient(90deg, #0284c7, #0f766e)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Workflow Stage Pipeline
          </span>

          {detailedStages.map((stage, idx) => {
            const isStageDone = pct >= stage.threshold;
            const isStageRunning = pct < stage.threshold && (idx === 0 || pct >= detailedStages[idx - 1].threshold);
            const stageStatus = isStageDone ? 'completed' : isStageRunning ? 'running' : 'pending';

            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', padding: '0.4rem 0.6rem', borderRadius: '4px', background: isStageRunning ? 'var(--bg-surface-secondary)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ color: isStageDone ? 'var(--accent-emerald)' : isStageRunning ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 700 }}>
                    {isStageDone ? '✓' : isStageRunning ? '●' : '○'}
                  </span>
                  <span style={{ color: isStageDone || isStageRunning ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isStageRunning ? 600 : 400 }}>
                    {stage.name}
                  </span>
                </div>
                <StatusBadge status={stageStatus} />
              </div>
            );
          })}
        </div>

        {/* Failed Simulation View */}
        {isFailed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <div style={{ color: '#b91c1c', fontWeight: 800, fontSize: '0.95rem' }}>
              ❌ Simulation Execution Failed
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              The cellular finite-volume solver encountered non-recoverable numerical instability or dataset read error.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={() => navigate('/simulations/new/study-area')} className="btn btn-primary">
                🔄 Retry Simulation
              </button>
              <button onClick={() => navigate('/simulations')} className="btn btn-secondary">
                Back to Registry
              </button>
            </div>
          </div>
        )}

        {/* Completed Simulation View */}
        {isComplete && !isFailed && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--status-completed-text)' }}>
              ✓ Step 3 Hydrodynamic Solver Complete!
            </span>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button onClick={() => navigate(`/simulations/${id}/map`)} className="btn btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.88rem', fontWeight: 700 }}>
                Step 4: View Dynamic Inundation Map →
              </button>
              <button onClick={() => navigate(`/simulations/${id}/impact`)} className="btn btn-secondary" style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
                Step 5: Analyze Impact & Evacuation →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
