import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';

export const AppShell: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopNav />
      <main style={{ flex: 1, padding: '1.5rem', background: 'var(--bg-canvas)' }}>
        <Outlet />
      </main>
      <footer style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
        FloodLens SIH26161 — Hydrodynamic Flood Simulation Platform (Phase 2 Development Shell)
      </footer>
    </div>
  );
};
