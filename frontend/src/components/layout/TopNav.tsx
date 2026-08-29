import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api/client';

export const TopNav: React.FC = () => {
  const location = useLocation();
  const [apiStatus, setApiStatus] = useState<string>('Connecting...');
  const [isLive, setIsLive] = useState<boolean>(false);

  useEffect(() => {
    apiClient.checkHealth()
      .then(() => {
        setApiStatus('LIVE API connected');
        setIsLive(true);
      })
      .catch(() => {
        setApiStatus('API Disconnected / Offline');
        setIsLive(false);
      });
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/simulations', label: 'Simulations' },
    { path: '/simulations/new/study-area', label: '+ New Simulation' },
    { path: '/study-areas', label: 'Study Areas' },
    { path: '/comparison', label: 'Comparison' },
    { path: '/case-studies/bhotekoshi-trishuli', label: 'Case Studies' },
    { path: '/about', label: 'About' }
  ];

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-dark)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-cyan)', letterSpacing: '-0.02em' }}>
          FloodLens <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>SIH26161</span>
        </Link>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                  fontWeight: isActive ? '600' : 'normal',
                  fontSize: '0.9rem'
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
        <span
          className="badge"
          style={{
            background: isLive ? '#052E16' : '#450A0A',
            color: isLive ? '#4ADE80' : '#FCA5A5',
            border: isLive ? '1px solid #14532D' : '1px solid #7F1D1D'
          }}
        >
          {apiStatus}
        </span>
      </div>
    </header>
  );
};
