import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { Simulation } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingState, ErrorState, EmptyState } from '../components/common/StateComponents';

export const SimulationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modelFilter, setModelFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    apiClient.getSimulations()
      .then((data) => {
        setSimulations(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.detail || err.message || 'Failed loading simulations list from local backend');
        setLoading(false);
      });
  }, []);

  const filteredSimulations = useMemo(() => {
    return simulations
      .filter((sim) => {
        const matchesQuery = sim.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sim.scenarioId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || sim.status.toLowerCase() === statusFilter.toLowerCase();
        const matchesModel = modelFilter === 'ALL' || sim.modelLevel.toLowerCase() === modelFilter.toLowerCase();
        return matchesQuery && matchesStatus && matchesModel;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '');
        if (sortBy === 'oldest') return (a.createdAt || '').localeCompare(b.createdAt || '');
        if (sortBy === 'id') return a.id.localeCompare(b.id);
        return 0;
      });
  }, [simulations, searchQuery, statusFilter, modelFilter, sortBy]);

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'ALL' || modelFilter !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setModelFilter('ALL');
    setSortBy('newest');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Launch Action */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Hydrodynamic Simulation Runs Registry
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Registered Level 1 diffusive wave solver executions and spatial impact analysis histories.
          </p>
        </div>
        <button onClick={() => navigate('/simulations/new/study-area')} className="btn btn-primary">
          + Launch New Simulation
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="card" style={{ padding: '1rem 1.25rem', background: '#ffffff', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            placeholder="🔍 Search by Simulation ID or Scenario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ maxWidth: '340px' }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Showing <strong>{filteredSimulations.length}</strong> of {simulations.length} runs
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
            <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '0.4rem 0.65rem', fontSize: '0.85rem', width: 'auto' }}>
              <option value="ALL">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="running">Running</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Model:</span>
            <select className="form-select" value={modelFilter} onChange={(e) => setModelFilter(e.target.value)} style={{ padding: '0.4rem 0.65rem', fontSize: '0.85rem', width: 'auto' }}>
              <option value="ALL">All Models</option>
              <option value="level1">Level 1 (Diffusive)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Sort:</span>
            <select className="form-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '0.4rem 0.65rem', fontSize: '0.85rem', width: 'auto' }}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="id">Simulation ID</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button onClick={resetFilters} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem 0.65rem' }}>
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table or State Representation */}
      {loading ? (
        <LoadingState message="Loading simulation registry..." subtext="Querying SQLite persistence database records." />
      ) : error ? (
        <ErrorState title="Registry Query Failed" message={error} onRetry={() => window.location.reload()} />
      ) : filteredSimulations.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? 'No Matching Simulations Found' : 'No Simulation Runs Executed'}
          description={hasActiveFilters ? 'No simulation records matched your filter criteria.' : 'Click below to launch your first 2D hydrodynamic flood simulation.'}
          actionLabel={hasActiveFilters ? 'Reset Active Filters' : '+ Launch New Simulation'}
          onAction={hasActiveFilters ? resetFilters : () => navigate('/simulations/new/study-area')}
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Simulation ID</th>
                <th>Scenario ID</th>
                <th>Model Engine</th>
                <th>Status</th>
                <th>Data Source</th>
                <th>Created Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSimulations.map((sim) => (
                <tr key={sim.id}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '0.88rem' }}>
                    <Link to={`/simulations/${sim.id}`}>{sim.id}</Link>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{sim.scenarioId}</td>
                  <td style={{ textTransform: 'uppercase', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{sim.modelLevel}</td>
                  <td>
                    <StatusBadge status={sim.status} />
                  </td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{sim.dataSource}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {sim.createdAt ? sim.createdAt.split('T')[0] : 'Today'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                      <Link to={`/simulations/${sim.id}`} className="btn btn-primary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.76rem' }}>
                        📋 Overview
                      </Link>
                      <Link to={`/simulations/${sim.id}/map`} className="btn btn-secondary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.76rem' }}>
                        🗺️ Map
                      </Link>
                      <Link to={`/simulations/${sim.id}/results`} className="btn btn-secondary" style={{ padding: '0.3rem 0.55rem', fontSize: '0.76rem' }}>
                        📊 Results
                      </Link>
                      <Link to={`/simulations/${sim.id}/impact`} className="btn btn-outline" style={{ padding: '0.3rem 0.55rem', fontSize: '0.76rem' }}>
                        🏘️ Impact
                      </Link>
                      <Link to={`/comparison?runA=${sim.id}&runB=${sim.id}`} className="btn btn-outline" style={{ padding: '0.3rem 0.55rem', fontSize: '0.76rem' }}>
                        ⚖️ Compare
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
