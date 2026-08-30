import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { ScientificDisclaimer } from '../common/ScientificDisclaimer';

export const AppShell: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
      <TopNav />
      <main style={{ flex: 1, padding: '1.75rem 2rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>
      <footer style={{ padding: '1rem 2rem', background: '#ffffff', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>FloodLens SIH26161</strong> — Operational Flood Intelligence & Geospatial Decision Support Platform
          </div>
          <ScientificDisclaimer compact />
        </div>
      </footer>
    </div>
  );
};
