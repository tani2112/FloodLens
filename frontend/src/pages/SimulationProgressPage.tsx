import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { SimulationStatus } from '../types';

export const SimulationProgressPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [status, setStatus] = useState<SimulationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let isSubscribed = true;
    const interval = setInterval(async () => {
      try {
        const data = await apiClient.getSimulationStatus(id);
        if (isSubscribed) {
          setStatus(data);
          if (data.stagePercent >= 100) {
            clearInterval(interval);
          }
        }
      } catch (err: any) {
        if (isSubscribed) {
          setError(err.detail || err.message || 'Failed polling simulation status');
          clearInterval(interval);
        }
      }
    }, 1000);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [id]);

  if (error) {
    return (
      <div style={{ maxWidth: '700px', margin: '2rem auto' }} className="card">
        <h3 style={{ color: '#EF4444', marginBottom: '0.5rem' }}>Simulation Progress Error</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
        <button onClick={() => navigate('/simulations')} className="btn btn-secondary">
          Return to Simulations List
        </button>
      </div>
    );
  }

  const pct = status?.stagePercent || 0;
  const isComplete = pct >= 100;

  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase' }}>
          Simulation Execution Pipeline
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Run Progress: {id}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {isComplete ? 'Simulation completed successfully.' : 'Computing 2D hydrodynamics and generating GIS spatial vector products...'}
        </p>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 600 }}>{status?.stage || 'Initializing...'}</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{pct}%</span>
          </div>
          <div style={{ width: '100%', height: '10px', background: 'var(--bg-canvas)', borderRadius: '5px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0EA5E9, #38BDF8)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Execution Stages
          </span>
          {status?.stages.map((st, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
              <span>{st.name}</span>
              <span className={`badge badge-${st.status === 'done' ? 'completed' : st.status === 'running' ? 'running' : 'pending'}`}>
                {st.status}
              </span>
            </div>
          ))}
        </div>

        {isComplete && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button onClick={() => navigate(`/simulations/${id}/map`)} className="btn btn-primary">
              View Interactive Flood Map &rarr;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
