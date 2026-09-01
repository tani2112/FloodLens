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
        if (res.database === 'ok' || res.status === 'ok') {
          setApiStatus('System Ready');
          setIsLive(true);
        } else if (res.status === 'offline') {
          setApiStatus('Offline');
          setIsLive(false);
        } else {
          setApiStatus('Database Offline');
          setIsLive(false);
        }
      })
      .catch(() => {
        setApiStatus('Offline');
        setIsLive(false);
      });
  }, []);

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/simulations', label: 'Simulations' },
    { path: '/study-areas', label: 'Study Areas' },
    { path: '/comparison', label: 'Comparison' },
    { path: '/validation/NP-2026-08-26-001', label: 'Validation' },
    { path: '/case-studies/bhotekoshi-trishuli', label: 'Case Studies' },
    { path: '/about', label: 'About' }
  ];

  return (
    <header
      className="cc-header"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#0F2D25',
        borderBottom: '1px solid #1A4237',
        padding: '0 1.5rem',
        height: '56px',
        zIndex: 100
      }}
    >
      {/* LEFT: BRAND & NAVIGATION */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '4px',
              background: '#008060',
              border: '1px solid #00A37A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '1.1rem',
              boxShadow: '0 2px 6px rgba(0, 128, 96, 0.35)'
            }}
          >
            ≈
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              FLOODLENS
            </div>
            <div style={{ fontSize: '0.66rem', color: '#96B8AC', fontWeight: 600, letterSpacing: '0.01em' }}>
              Flood Simulation & Analysis Platform
            </div>
          </div>
        </Link>

        {/* NAVIGATION LINKS */}
        <nav style={{ display: 'flex', gap: '0.25rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#FFFFFF' : '#96B8AC',
                  background: isActive ? '#008060' : 'transparent',
                  border: isActive ? '1px solid #00A37A' : '1px solid transparent',
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

      {/* RIGHT: ACTION BUTTON & SYSTEM STATUS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <Link
          to="/simulations/new/study-area"
          style={{
            background: '#008060',
            color: '#FFFFFF',
            padding: '0.4rem 0.9rem',
            borderRadius: '4px',
            fontSize: '0.82rem',
            fontWeight: 700,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            border: '1px solid #00A37A',
            boxShadow: '0 2px 6px rgba(0, 128, 96, 0.3)',
            transition: 'opacity 0.15s ease'
          }}
        >
          + Run Simulation
        </Link>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.78rem',
            background: '#163E33',
            border: '1px solid #205244',
            padding: '0.35rem 0.75rem',
            borderRadius: '4px'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isLive ? '#2ECC71' : '#E74C3C',
              display: 'inline-block'
            }}
          ></span>
          <span style={{ color: isLive ? '#FFFFFF' : '#FCA5A5', fontWeight: 600 }}>{apiStatus}</span>
        </div>
      </div>
    </header>
  );
};

