import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api/client';
import { Simulation } from '../../types';
import { ExportModal } from '../common/ExportModal';

interface SimulationNavProps {
  simulationId: string;
}

export const SimulationNav: React.FC<SimulationNavProps> = ({ simulationId }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [sim, setSim] = useState<Simulation | null>(null);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    apiClient.getSimulation(simulationId)
      .then((data) => {
        if (isMounted) setSim(data);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [simulationId]);

  const tabs = [
    { path: `/simulations/${simulationId}`, label: '📋 Analytical Overview' },
    { path: `/simulations/${simulationId}/map`, label: '🗺️ Interactive Map' },
    { path: `/simulations/${simulationId}/results`, label: '📊 Hydrodynamic Results' },
    { path: `/simulations/${simulationId}/impact`, label: '🏘️ Exposure & Impact' },
    { path: `/simulations/${simulationId}/warnings`, label: '🚨 Decision Support' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
      {/* Workspace Header Bar */}
      <div
        className="card"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              FloodLens Workspace ID
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {simulationId}
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-color)' }} />

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge badge-completed">
              {sim?.modelLevel || 'Level 1 2D Solver'}
            </span>
            <span className={`badge badge-${sim?.status === 'failed' ? 'critical' : sim?.status === 'running' ? 'running' : 'completed'}`}>
              {(sim?.status || 'completed').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Contextual Quick Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsExportOpen(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            📥 Export Datasets
          </button>
          <button
            onClick={() => navigate('/comparison')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            📊 Compare Scenarios
          </button>
          <button
            onClick={() => navigate('/simulations/new/study-area')}
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            + New Simulation
          </button>
          <button
            onClick={() => navigate('/simulations')}
            className="btn btn-outline"
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            ← Registry
          </button>
        </div>
      </div>

      {/* Primary Workspace Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path === `/simulations/${simulationId}` && location.pathname === `/simulations/${simulationId}`);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              style={{
                padding: '0.6rem 1.1rem',
                fontSize: '0.88rem',
                fontWeight: isActive ? 700 : 500,
                background: isActive ? 'var(--bg-surface)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Centralized Export Modal */}
      <ExportModal
        simulationId={simulationId}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
};
