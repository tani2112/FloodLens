import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';
import { ScientificDisclaimer } from '../common/ScientificDisclaimer';

export const AppShell: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  return (
    <div className="command-center-light" style={{ minHeight: '100vh', width: '100vw', overflowX: 'hidden', display: 'flex', flexDirection: 'column', background: '#F0F9FF' }}>
      <TopNav />
      {isDashboard ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Outlet />
        </div>
      ) : (
        <main style={{ flex: 1, padding: '1.5rem 2rem', maxWidth: '1600px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      )}
      <footer style={{ padding: '0.65rem 1.5rem', background: '#FFFFFF', borderTop: '1px solid #BAE6FD', fontSize: '0.78rem', color: '#475569' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong style={{ color: '#0F172A' }}>FloodLens Operational Command Center</strong> — Nepal Himalayan Flash Flood & Geospatial Decision Support Platform
          </div>
          <ScientificDisclaimer compact />
        </div>
      </footer>
    </div>
  );
};
