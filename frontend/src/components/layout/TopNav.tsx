import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiClient } from '../../services/api/client';

export const TopNav: React.FC = () => {
  const location = useLocation();
  const [apiStatus, setApiStatus] = useState<string>('Connecting...');
  const [isLive, setIsLive] = useState<boolean>(false);

  useEffect(() => {
    apiClient.checkHealth()
      .then((res: any) => {
        if (res.database === 'ok') {
          setApiStatus('SYSTEM READY • DATABASE CONNECTED');
        } else if (res.status === 'ok') {
          setApiStatus('SYSTEM READY • CONNECTED');
        } else {
          setApiStatus('DATABASE UNAVAILABLE');
        }
        setIsLive(true);
      })
      .catch(() => {
        setApiStatus('API DISCONNECTED');
        setIsLive(false);
      });
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/simulations', label: 'Simulations' },
    { path: '/study-areas', label: 'Study Areas' },
    { path: '/comparison', label: 'Compare' },
    { path: '/validation/sim-canonical', label: 'Validation' },
    { path: '/case-studies/bhotekoshi-trishuli', label: 'Case Studies' },
    { path: '/about', label: 'About' }
  ];

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 2rem', background: '#ffffff', borderBottom: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(23, 43, 58, 0.03)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '7px', background: 'linear-gradient(135deg, var(--accent-primary) 0%, #0284c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.03em' }}>
            FL
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              FloodLens
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              Operational Flood Intelligence
            </div>
          </div>
        </Link>

        <nav style={{ display: 'flex', gap: '0.35rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-surface-muted)' : 'transparent',
                  border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/simulations/new/study-area" className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem' }}>
          + Run Simulation
        </Link>
        <span
          className="badge"
          style={{
            background: isLive ? 'var(--status-completed-bg)' : 'var(--status-failed-bg)',
            color: isLive ? 'var(--status-completed-text)' : 'var(--status-failed-text)',
            border: isLive ? '1px solid var(--status-completed-border)' : '1px solid var(--status-failed-border)',
            fontWeight: 600
          }}
        >
          ● {apiStatus}
        </span>
      </div>
    </header>
  );
};
