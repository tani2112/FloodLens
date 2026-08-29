import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { Simulation } from '../types';

export const SimulationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getSimulations()
      .then((data) => {
        setSimulations(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.detail || err.message || 'Failed loading simulations list');
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Simulation Orchestration History
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            List of past and active hydrodynamic simulation runs registered in backend storage.
          </p>
        </div>
        <button onClick={() => navigate('/simulations/new/study-area')} className="btn btn-primary">
          + Launch New Simulation
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ color: 'var(--text-secondary)' }}>Loading simulation runs...</div>
      ) : error ? (
        <div className="card" style={{ borderColor: '#7F1D1D', background: '#450A0A', color: '#FCA5A5' }}>{error}</div>
      ) : simulations.length === 0 ? (
        <div className="card" style={{ color: 'var(--text-secondary)' }}>
          No simulations found. Click <strong>+ Launch New Simulation</strong> to run a scenario.
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Simulation ID</th>
                <th>Scenario ID</th>
                <th>Model Level</th>
                <th>Execution Status</th>
                <th>Data Source</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {simulations.map((sim) => (
                <tr key={sim.id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{sim.id}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{sim.scenarioId}</td>
                  <td style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{sim.modelLevel}</td>
                  <td>
                    <span className={`badge badge-${sim.status}`}>
                      {sim.status}
                    </span>
                  </td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{sim.dataSource}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{sim.createdAt}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <Link to={`/simulations/${sim.id}/map`} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                        Map
                      </Link>
                      <Link to={`/simulations/${sim.id}/results`} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                        Results
                      </Link>
                      <Link to={`/simulations/${sim.id}/impact`} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                        Impact
                      </Link>
                      <Link to={`/simulations/${sim.id}/warnings`} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                        Warnings
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
