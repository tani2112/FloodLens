import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { Simulation, StudyArea } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      apiClient.getStudyAreas().catch(() => []),
      apiClient.getSimulations().catch(() => [])
    ]).then(([areas, sims]) => {
      setStudyAreas(areas);
      setSimulations(sims);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Dashboard Banner Header */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #111A2E 0%, #182238 100%)', borderColor: '#2563EB', padding: '2rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Smart India Hackathon (SIH26161) — Real-Time Hydrodynamic Platform
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
          FloodLens Command & Control Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '800px', marginTop: '0.5rem' }}>
          Physics-informed 2D hydrodynamic simulation, spatial GIS exposure analysis, and decision-support early warning platform for dam breach and flash flood scenarios.
        </p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
          <button onClick={() => navigate('/simulations/new/study-area')} className="btn btn-primary">
            + Launch New Simulation Wizard
          </button>
          <button onClick={() => navigate('/study-areas')} className="btn btn-secondary">
            View Study Area Registry
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Registered Study Areas
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>
            {studyAreas.length}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Canonical Idukki AOI</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Executable Solver Engine
          </span>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#22C55E', marginTop: '0.4rem' }}>
            Level 1 Diffusive
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>2D Cellular Flow Solver</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Completed Simulations
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#38BDF8', marginTop: '0.25rem' }}>
            {simulations.filter(s => s.status === 'completed').length}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live REST API Runs</span>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Spatial CRS Specification
          </span>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-primary)', marginTop: '0.4rem' }}>
            EPSG:32643 &rarr; EPSG:4326
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>UTM 43N to WGS84 GeoJSON</span>
        </div>
      </div>

      {/* Recent Simulation Runs List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
            Recent Simulation Orchestration Runs
          </h3>
          <Link to="/simulations" style={{ fontSize: '0.85rem' }}>
            View All Runs &rarr;
          </Link>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>Loading simulation history...</div>
        ) : simulations.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', padding: '1rem 0' }}>
            No simulations recorded yet. Click <strong>+ Launch New Simulation Wizard</strong> to start a Level 1 run.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Simulation ID</th>
                  <th>Model Level</th>
                  <th>Status</th>
                  <th>Data Source</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {simulations.slice(0, 5).map((sim) => (
                  <tr key={sim.id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{sim.id}</td>
                    <td style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{sim.modelLevel}</td>
                    <td>
                      <span className={`badge badge-${sim.status}`}>
                        {sim.status}
                      </span>
                    </td>
                    <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{sim.dataSource}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{sim.createdAt}</td>
                    <td>
                      <Link to={`/simulations/${sim.id}/map`} className="btn btn-secondary" style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}>
                        View Map
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
