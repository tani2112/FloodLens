import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const TopNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/simulations', label: 'Simulations' },
    { path: '/study-areas', label: 'Study Areas' },
    { path: '/comparison', label: 'Comparison' },
    { path: '/case-studies/bhotekoshi-trishuli', label: 'Case Studies' },
    { path: '/about', label: 'About' }
  ];

  return (
    <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface-dark)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link to="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
          FloodLens
        </Link>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                color: location.pathname === item.path ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontWeight: location.pathname === item.path ? '600' : 'normal',
                fontSize: '0.9rem'
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
        <span style={{ padding: '0.2rem 0.5rem', background: '#1E293B', borderRadius: '4px', color: '#38BDF8', border: '1px solid #334155' }}>
          Phase 2 — Shell Active
        </span>
      </div>
    </header>
  );
};
