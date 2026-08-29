import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { ComparisonResult, Simulation } from '../types';

export const ComparisonPickerPage: React.FC = () => {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [runA, setRunA] = useState<string>('');
  const [runB, setRunB] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    apiClient.getSimulations()
      .then((data) => {
        setSimulations(data);
        if (data.length >= 2) {
          setRunA(data[0].id);
          setRunB(data[1].id);
        } else if (data.length === 1) {
          setRunA(data[0].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleCompare = () => {
    if (runA && runB && runA !== runB) {
      navigate(`/comparison/${encodeURIComponent(runA)}/${encodeURIComponent(runB)}`);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Scenario Hydrodynamic Comparison
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Select two completed simulation runs to perform side-by-side KPI differential analysis.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ color: 'var(--text-secondary)' }}>Loading simulation runs...</div>
      ) : simulations.length < 2 ? (
        <div className="card" style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Insufficient Simulations Available
          </h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
            At least two completed simulation runs are required to compute side-by-side comparison metrics.
          </p>
          <button onClick={() => navigate('/simulations/new/study-area')} className="btn btn-primary">
            + Run First Simulation
          </button>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Baseline Run (Run A)
              </label>
              <select
                value={runA}
                onChange={(e) => setRunA(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
              >
                {simulations.map((s) => (
                  <option key={s.id} value={s.id}>{s.id} ({s.modelLevel})</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--text-secondary)' }}>
                Comparison Run (Run B)
              </label>
              <select
                value={runB}
                onChange={(e) => setRunB(e.target.value)}
                style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-canvas)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
              >
                {simulations.map((s) => (
                  <option key={s.id} value={s.id}>{s.id} ({s.modelLevel})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button onClick={handleCompare} disabled={!runA || !runB || runA === runB} className="btn btn-primary">
              Compare Hydrodynamic Scenarios &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ComparisonPage: React.FC = () => {
  const { idA, idB } = useParams<{ idA: string; idB: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!idA || !idB) return;
    apiClient.compareSimulations(idA, idB)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.detail || err.message || 'Failed loading scenario comparison');
        setLoading(false);
      });
  }, [idA, idB]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            Side-by-Side Scenario Differential Matrix
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Baseline: <code style={{ color: 'var(--accent-cyan)' }}>{idA}</code> vs Scenario B: <code style={{ color: '#38BDF8' }}>{idB}</code>
          </p>
        </div>
        <button onClick={() => navigate('/comparison')} className="btn btn-secondary">
          Change Selected Runs
        </button>
      </div>

      {loading ? (
        <div className="card" style={{ color: 'var(--text-secondary)' }}>Computing hydrodynamic comparison metrics...</div>
      ) : error ? (
        <div className="card" style={{ borderColor: '#7F1D1D', background: '#450A0A', color: '#FCA5A5' }}>{error}</div>
      ) : data ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>KPI Metric</th>
                <th>Baseline Run A ({data.runA.simulationId})</th>
                <th>Scenario Run B ({data.runB.simulationId})</th>
                <th>Differential Delta (&Delta;)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Total Inundated Flood Area</td>
                <td>{data.runA.result.floodAreaKm2.toFixed(3)} km²</td>
                <td>{data.runB.result.floodAreaKm2.toFixed(3)} km²</td>
                <td style={{ color: data.diff.floodAreaDiffKm2 > 0 ? '#FCA5A5' : '#4ADE80', fontWeight: 600 }}>
                  {data.diff.floodAreaDiffKm2 > 0 ? '+' : ''}{data.diff.floodAreaDiffKm2.toFixed(3)} km²
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Maximum Water Depth</td>
                <td>{data.runA.result.maxDepthM.toFixed(2)} m</td>
                <td>{data.runB.result.maxDepthM.toFixed(2)} m</td>
                <td style={{ color: data.diff.maxDepthDiffM > 0 ? '#FCA5A5' : '#4ADE80', fontWeight: 600 }}>
                  {data.diff.maxDepthDiffM > 0 ? '+' : ''}{data.diff.maxDepthDiffM.toFixed(2)} m
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Exposed Population</td>
                <td>{data.runA.result.populationExposed || 0}</td>
                <td>{data.runB.result.populationExposed || 0}</td>
                <td style={{ fontWeight: 600 }}>
                  {data.diff.populationExposedDiff > 0 ? '+' : ''}{data.diff.populationExposedDiff}
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Affected Road Network</td>
                <td>{data.runA.result.roadsAffectedKm.toFixed(2)} km</td>
                <td>{data.runB.result.roadsAffectedKm.toFixed(2)} km</td>
                <td>{(data.runB.result.roadsAffectedKm - data.runA.result.roadsAffectedKm).toFixed(2)} km</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
};
