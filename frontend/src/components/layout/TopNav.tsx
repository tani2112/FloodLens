import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../../services/api/client';

export const TopNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [apiStatus, setApiStatus] = useState<string>('Connecting...');
  const [isLive, setIsLive] = useState<boolean>(false);
  const [selectedSim, setSelectedSim] = useState<string>('NP-2026-08-26-001');
  const [utilityMessage, setUtilityMessage] = useState<string | null>(null);

  useEffect(() => {
    apiClient.checkHealth()
      .then((res: any) => {
        if (res.database === 'ok' || res.status === 'ok') {
          setApiStatus('System Ready');
          setIsLive(true);
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
    <header className="cc-header" style={{ position: 'relative', background: '#0B192C', borderBottom: '1px solid #1E293B', padding: '0.55rem 1.25rem', height: '56px', zIndex: 100 }}>
      {/* LEFT: LOGO & BRANDING */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: '#0284C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 800, fontSize: '1.1rem' }}>
            ≈
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              FLOODLENS
            </div>
            <div style={{ fontSize: '0.66rem', color: '#94A3B8', fontWeight: 600, letterSpacing: '0.01em' }}>
              Flood Simulation & Analysis Platform
            </div>
          </div>
        </Link>

        {/* NAVIGATION PILLS */}
        <nav style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '5px',
                  fontSize: '0.82rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  background: isActive ? '#0284C7' : 'transparent',
                  border: isActive ? '1px solid #38BDF8' : '1px solid transparent',
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

      {/* CENTER-RIGHT: ACTIVE SIMULATION SELECTOR & STATUS */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#1E293B', border: '1px solid #334155', borderRadius: '6px', padding: '0.25rem 0.6rem', gap: '0.5rem', fontSize: '0.8rem' }}>
          <span style={{ color: '#94A3B8', fontWeight: 600 }}>Simulation</span>
          <select
            className="cc-select"
            value={selectedSim}
            onChange={(e) => {
              setSelectedSim(e.target.value);
              if (e.target.value.startsWith('NP-')) {
                navigate('/');
              }
            }}
            style={{ border: 'none', background: 'transparent', padding: '0 0.2rem', fontWeight: 700, color: '#38BDF8', cursor: 'pointer' }}
          >
            <option value="NP-2026-08-26-001">NP-2026-08-26-001 (Himalayan GLOF & barrier breach)</option>
          </select>
        </div>

        {/* STATUS INDICATOR */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.78rem', background: '#0284C7', border: '1px solid #38BDF8', padding: '0.25rem 0.65rem', borderRadius: '20px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }}></span>
          <span style={{ fontWeight: 800, color: '#FFFFFF' }}>Running</span>
          <span style={{ color: '#E0F2FE', fontWeight: 600 }}>72% Complete</span>
        </div>

        {/* USER ACTION CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginLeft: '0.25rem' }}>
          <button onClick={() => setUtilityMessage('Three Nepal corridor alerts are available in the Warnings workspace.')} className="cc-btn" style={{ position: 'relative', width: '32px', height: '32px', padding: 0, justifyContent: 'center', background: '#1E293B', borderColor: '#334155', color: '#FFF' }} title="Show Nepal corridor alerts">
            🔔
            <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#EF4444', color: '#FFF', borderRadius: '50%', width: '14px', height: '14px', fontSize: '0.62rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>3</span>
          </button>

          <button onClick={() => navigate('/about')} className="cc-btn" style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center', background: '#1E293B', borderColor: '#334155', color: '#FFF' }} title="Open modelling documentation">
            ❓
          </button>

          <button onClick={() => setUtilityMessage(`Map tiles: ${isLive ? 'connected' : 'offline fallback'} · Nepal terrain profile is active.`)} className="cc-btn" style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center', background: '#1E293B', borderColor: '#334155', color: '#FFF' }} title="Show workspace status">
            ⚙
          </button>

          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0284C7', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', marginLeft: '0.2rem' }} title="User Profile">
            NT
          </div>
        </div>
      </div>
      {utilityMessage && (
        <button onClick={() => setUtilityMessage(null)} title="Dismiss message" style={{ position: 'absolute', right: '1.25rem', top: '60px', zIndex: 110, background: '#ffffff', color: '#0f172a', border: '1px solid #38bdf8', borderRadius: '6px', padding: '0.5rem 0.7rem', boxShadow: '0 8px 20px rgba(15, 23, 42, 0.25)', fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer' }}>
          {utilityMessage}
        </button>
      )}
    </header>
  );
};
