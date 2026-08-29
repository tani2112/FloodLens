import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SimulationNavProps {
  simulationId: string;
}

export const SimulationNav: React.FC<SimulationNavProps> = ({ simulationId }) => {
  const location = useLocation();

  const tabs = [
    { path: `/simulations/${simulationId}/map`, label: 'Interactive Map Canvas' },
    { path: `/simulations/${simulationId}/results`, label: 'Hydrodynamic Results' },
    { path: `/simulations/${simulationId}/impact`, label: 'Settlement & Road Impact' },
    { path: `/simulations/${simulationId}/warnings`, label: 'Decision Support Alerts' }
  ];

  return (
    <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem', paddingBottom: '0.25rem' }}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <Link
            key={tab.path}
            to={tab.path}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: isActive ? '600' : 'normal',
              background: isActive ? 'var(--bg-surface-card)' : 'transparent',
              color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              border: isActive ? '1px solid var(--border-color)' : '1px solid transparent'
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
};
