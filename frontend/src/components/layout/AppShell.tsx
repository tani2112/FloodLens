import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';

export const AppShell: React.FC = () => {
  const location = useLocation();
  const isDashboard = location.pathname === '/';

  return (
    <div className="command-center-light" style={{ minHeight: '100vh', width: '100vw', overflowX: 'hidden', display: 'flex', flexDirection: 'column', background: '#DFB096' }}>
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
      <footer style={{ padding: '0.75rem 1.5rem', background: '#0F2D25', borderTop: '1px solid #1A4237', fontSize: '0.8rem', color: '#96B8AC' }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong style={{ color: '#FFFFFF' }}>FloodLens</strong> — Flash Flood Simulation & Geospatial Decision Support Platform
          </div>
          <div style={{ fontSize: '0.75rem', color: '#7AA394' }}>
            Operational Geospatial Intelligence System
          </div>
        </div>
      </footer>
    </div>
  );
};

