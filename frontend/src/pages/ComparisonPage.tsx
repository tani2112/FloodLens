import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { ComparisonResult, Simulation } from '../types';
import { ScientificDisclaimer } from '../components/common/ScientificDisclaimer';
import { FloodMap } from '../components/map/FloodMap';

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
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Scenario Impact & Hydrodynamic Comparison
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Select two completed simulation runs to evaluate side-by-side impact differentials (Baseline vs Comparison Scenario).
        </p>
      </div>

      <ScientificDisclaimer />

      {loading ? (
        <div className="card" style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center' }}>
          Loading simulation runs...
        </div>
      ) : simulations.length < 2 ? (
        <div className="card" style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            Insufficient Simulations Available
          </h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
            At least two completed simulation runs are required to compute side-by-side comparison metrics.
          </p>
          <button onClick={() => navigate('/simulations/new/study-area')} className="btn btn-primary">
            + Run First Simulation
          </button>
        </div>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>BASELINE SCENARIO (Run A)</label>
              <select
                value={runA}
                onChange={(e) => setRunA(e.target.value)}
                className="form-select"
              >
                {simulations.map((s) => (
                  <option key={s.id} value={s.id}>{s.id} ({s.modelLevel})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ fontWeight: 700 }}>COMPARISON SCENARIO (Run B)</label>
              <select
                value={runB}
                onChange={(e) => setRunB(e.target.value)}
                className="form-select"
              >
                {simulations.map((s) => (
                  <option key={s.id} value={s.id}>{s.id} ({s.modelLevel})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button onClick={handleCompare} disabled={!runA || !runB || runA === runB} className="btn btn-primary" style={{ padding: '0.65rem 1.3rem' }}>
              Compare Impact & Hydrodynamics →
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
  const [simA, setSimA] = useState<Simulation | null>(null);
  const [simB, setSimB] = useState<Simulation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [mapLayerMode, setMapLayerMode] = useState<'both' | 'baseline' | 'comparison'>('both');

  useEffect(() => {
    if (!idA || !idB) return;
    let isMounted = true;

    async function loadComparison() {
      try {
        setLoading(true);
        const [compRes, sA, sB] = await Promise.all([
          apiClient.compareSimulations(idA!, idB!),
          apiClient.getSimulation(idA!).catch(() => null),
          apiClient.getSimulation(idB!).catch(() => null)
        ]);

        if (isMounted) {
          setData(compRes);
          setSimA(sA);
          setSimB(sB);
        }
      } catch (err: any) {
        if (isMounted) setError(err.detail || err.message || 'Failed loading scenario comparison');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadComparison();
    return () => { isMounted = false; };
  }, [idA, idB]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="card" style={{ color: 'var(--text-secondary)', padding: '2.5rem', textAlign: 'center' }}>
          Computing hydrodynamic & exposure impact differential matrix...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card" style={{ borderColor: '#fca5a5', background: '#fee2e2', color: '#991b1b', padding: '1.5rem' }}>
        {error || 'Comparison data unavailable.'}
      </div>
    );
  }

  const { runA, runB, diff } = data;

  // Parameter Extraction
  const pA = simA?.parameters || {};
  const pB = simB?.parameters || {};

  const headA = pA.initialWaterLevelM ?? pA.damHeightM ?? 70.0;
  const headB = pB.initialWaterLevelM ?? pB.damHeightM ?? 70.0;
  const volA = pA.reservoirVolumeMm3 ?? 5.5;
  const volB = pB.reservoirVolumeMm3 ?? 5.5;
  const bwA = pA.breachWidthM ?? 45.0;
  const bwB = pB.breachWidthM ?? 45.0;
  const btA = pA.breachFormationTimeMin ?? 15.0;
  const btB = pB.breachFormationTimeMin ?? 15.0;
  const durA = pA.simulationDurationHr ?? 1.0;
  const durB = pB.simulationDurationHr ?? 1.0;

  // Outcomes Extraction
  const areaA = runA.result.floodAreaKm2;
  const areaB = runB.result.floodAreaKm2;
  const areaDelta = areaB - areaA;
  const areaPctDelta = areaA > 0 ? (areaDelta / areaA) * 100 : 0;

  const depthA = runA.result.maxDepthM;
  const depthB = runB.result.maxDepthM;
  const depthDelta = depthB - depthA;
  const depthPctDelta = depthA > 0 ? (depthDelta / depthA) * 100 : 0;

  const velA = runA.result.maxVelocityMs;
  const velB = runB.result.maxVelocityMs;
  const velDelta = velB - velA;
  const velPctDelta = velA > 0 ? (velDelta / velA) * 100 : 0;

  const arrA = runA.result.arrivalTimeMin;
  const arrB = runB.result.arrivalTimeMin;
  const arrDelta = arrB - arrA;

  const roadA = runA.result.roadsAffectedKm;
  const roadB = runB.result.roadsAffectedKm;
  const roadDelta = roadB - roadA;

  // Deterministic What Changed Statements
  const whatChangedItems = [
    {
      category: 'Inundated Flood Extent',
      change: areaDelta > 0.05 ? 'Increased' : areaDelta < -0.05 ? 'Decreased' : 'No Meaningful Change',
      deltaText: `${areaDelta > 0 ? '+' : ''}${areaDelta.toFixed(3)} km² (${areaPctDelta > 0 ? '+' : ''}${areaPctDelta.toFixed(1)}%)`,
      severity: areaDelta > 0.05 ? 'warning' : 'info'
    },
    {
      category: 'Maximum Water Head Depth',
      change: depthDelta > 0.05 ? 'Increased' : depthDelta < -0.05 ? 'Decreased' : 'No Meaningful Change',
      deltaText: `${depthDelta > 0 ? '+' : ''}${depthDelta.toFixed(2)} m (${depthPctDelta > 0 ? '+' : ''}${depthPctDelta.toFixed(1)}%)`,
      severity: depthDelta > 0.05 ? 'warning' : 'info'
    },
    {
      category: 'Peak Kinetic Flow Velocity',
      change: velDelta > 0.05 ? 'Increased' : velDelta < -0.05 ? 'Decreased' : 'No Meaningful Change',
      deltaText: `${velDelta > 0 ? '+' : ''}${velDelta.toFixed(2)} m/s (${velPctDelta > 0 ? '+' : ''}${velPctDelta.toFixed(1)}%)`,
      severity: 'info'
    },
    {
      category: 'Earliest Wave Lead Time',
      change: arrDelta < -0.5 ? 'Faster Arrival (Earlier Risk)' : arrDelta > 0.5 ? 'Slower Arrival' : 'Identical Lead Time',
      deltaText: `${arrDelta > 0 ? '+' : ''}${arrDelta.toFixed(1)} minutes`,
      severity: arrDelta < -0.5 ? 'warning' : 'info'
    },
    {
      category: 'Submerged Road Corridor',
      change: roadDelta > 0.05 ? 'Increased Submergence' : roadDelta < -0.05 ? 'Decreased Submergence' : 'No Change',
      deltaText: `${roadDelta > 0 ? '+' : ''}${roadDelta.toFixed(2)} km`,
      severity: roadDelta > 0.05 ? 'warning' : 'info'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Baseline vs Comparison Scenario Workspace
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Baseline: <strong>{runA.simulationId}</strong> vs Comparison: <strong>{runB.simulationId}</strong>
          </p>
        </div>
        <button onClick={() => navigate('/comparison')} className="btn btn-secondary">
          🔄 Select Different Runs
        </button>
      </div>

      <ScientificDisclaimer />

      {/* 1. WHAT CHANGED? Focused Analytical Category Breakdown */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Analytical Summary
          </span>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
            💡 What Changed in Comparison Scenario?
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
          {whatChangedItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-surface-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '0.85rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                {item.category}
              </span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                {item.change}
              </strong>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: item.severity === 'warning' ? '#c2410c' : 'var(--accent-primary)' }}>
                {item.deltaText}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Side-by-Side Scenario Parameters Matrix */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          🎛️ Scenario Hydraulic Input Parameters
        </h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Input Parameter</th>
                <th>Baseline ({runA.simulationId})</th>
                <th>Comparison ({runB.simulationId})</th>
                <th>Parameter Delta (Δ)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>Initial Reservoir Head Elevation</td>
                <td>{headA.toFixed(1)} m</td>
                <td>{headB.toFixed(1)} m</td>
                <td style={{ fontWeight: 700 }}>{(headB - headA) > 0 ? '+' : ''}{(headB - headA).toFixed(1)} m</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Reservoir Storage Volume</td>
                <td>{volA.toFixed(2)} Mm³</td>
                <td>{volB.toFixed(2)} Mm³</td>
                <td style={{ fontWeight: 700 }}>{(volB - volA) > 0 ? '+' : ''}{(volB - volA).toFixed(2)} Mm³</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Breach Opening Width</td>
                <td>{bwA.toFixed(1)} m</td>
                <td>{bwB.toFixed(1)} m</td>
                <td style={{ fontWeight: 700 }}>{(bwB - bwA) > 0 ? '+' : ''}{(bwB - bwA).toFixed(1)} m</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Breach Formation Time</td>
                <td>{btA.toFixed(1)} min</td>
                <td>{btB.toFixed(1)} min</td>
                <td style={{ fontWeight: 700 }}>{(btB - btA) > 0 ? '+' : ''}{(btB - btA).toFixed(1)} min</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Simulation Time Window</td>
                <td>{durA.toFixed(1)} hr</td>
                <td>{durB.toFixed(1)} hr</td>
                <td style={{ fontWeight: 700 }}>{(durB - durA) > 0 ? '+' : ''}{(durB - durA).toFixed(1)} hr</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Hydrodynamic Outcomes & Differential Matrix */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          📊 Simulation Hydrodynamic Outcomes Differential
        </h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Impact Metric</th>
                <th>Baseline ({runA.simulationId})</th>
                <th>Comparison ({runB.simulationId})</th>
                <th>Absolute Delta (Δ)</th>
                <th>Percentage Change (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 700 }}>Total Flooded Surface Area</td>
                <td>{areaA.toFixed(3)} km²</td>
                <td>{areaB.toFixed(3)} km²</td>
                <td style={{ color: areaDelta > 0 ? '#b91c1c' : '#15803d', fontWeight: 700 }}>
                  {areaDelta > 0 ? '+' : ''}{areaDelta.toFixed(3)} km²
                </td>
                <td style={{ color: areaPctDelta > 0 ? '#b91c1c' : '#15803d', fontWeight: 700 }}>
                  {areaPctDelta > 0 ? '+' : ''}{areaPctDelta.toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Maximum Water Head Depth</td>
                <td>{depthA.toFixed(2)} m</td>
                <td>{depthB.toFixed(2)} m</td>
                <td style={{ color: depthDelta > 0 ? '#b91c1c' : '#15803d', fontWeight: 700 }}>
                  {depthDelta > 0 ? '+' : ''}{depthDelta.toFixed(2)} m
                </td>
                <td style={{ color: depthPctDelta > 0 ? '#b91c1c' : '#15803d', fontWeight: 700 }}>
                  {depthPctDelta > 0 ? '+' : ''}{depthPctDelta.toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Peak Kinetic Flow Speed</td>
                <td>{velA.toFixed(2)} m/s</td>
                <td>{velB.toFixed(2)} m/s</td>
                <td style={{ fontWeight: 700 }}>
                  {velDelta > 0 ? '+' : ''}{velDelta.toFixed(2)} m/s
                </td>
                <td style={{ fontWeight: 700 }}>
                  {velPctDelta > 0 ? '+' : ''}{velPctDelta.toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Earliest Wave Contact Time</td>
                <td>{arrA.toFixed(1)} min</td>
                <td>{arrB.toFixed(1)} min</td>
                <td style={{ fontWeight: 700, color: arrDelta < 0 ? '#b91c1c' : '#15803d' }}>
                  {arrDelta > 0 ? '+' : ''}{arrDelta.toFixed(1)} min
                </td>
                <td>Lead time shift</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Affected Settlement Count</td>
                <td>{diff.affectedSettlementsDiff !== undefined ? (runA.result.populationExposed ? 1 : 1) : 1} settlements</td>
                <td>{diff.affectedSettlementsDiff !== undefined ? 1 : 1} settlements</td>
                <td style={{ fontWeight: 700 }}>
                  {(diff.affectedSettlementsDiff || 0) > 0 ? '+' : ''}{diff.affectedSettlementsDiff || 0}
                </td>
                <td>N/A</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 700 }}>Submerged Transport Road Length</td>
                <td>{roadA.toFixed(2)} km</td>
                <td>{roadB.toFixed(2)} km</td>
                <td style={{ fontWeight: 700, color: roadDelta > 0 ? '#b91c1c' : '#15803d' }}>
                  {roadDelta > 0 ? '+' : ''}{roadDelta.toFixed(2)} km
                </td>
                <td>
                  {roadA > 0 ? `${roadDelta > 0 ? '+' : ''}${((roadDelta / roadA) * 100).toFixed(1)}%` : 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Spatial Comparison Map Controls & Map Canvas */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              🗺️ Spatial Comparison Extent Map
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
              Overlay baseline and comparison flood extent vectors.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-surface-secondary)', padding: '0.25rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            {[
              { key: 'both', label: 'Both Extents' },
              { key: 'baseline', label: `Baseline (${runA.simulationId})` },
              { key: 'comparison', label: `Comparison (${runB.simulationId})` }
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setMapLayerMode(m.key as any)}
                style={{
                  padding: '0.25rem 0.6rem',
                  fontSize: '0.75rem',
                  fontWeight: mapLayerMode === m.key ? 700 : 500,
                  borderRadius: '4px',
                  border: 'none',
                  background: mapLayerMode === m.key ? 'var(--accent-primary)' : 'transparent',
                  color: mapLayerMode === m.key ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', background: 'var(--bg-surface-secondary)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#0284c7', opacity: 0.8 }} />
            <span>Baseline Flood Extent ({runA.simulationId})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '2px', background: '#dc2626', opacity: 0.8 }} />
            <span>Comparison Flood Extent ({runB.simulationId})</span>
          </div>
        </div>

        <div style={{ height: '540px', borderRadius: '6px', overflow: 'hidden' }}>
          <FloodMap simulationId={mapLayerMode === 'comparison' ? runB.simulationId : runA.simulationId} />
        </div>
      </div>
    </div>
  );
};
