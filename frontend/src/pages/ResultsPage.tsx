import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SimulationNav } from '../components/simulations/SimulationNav';
import { apiClient } from '../services/api/client';
import { FloodResult, TimelineSummary, ImpactSummary, ExposureResult } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { ScenarioProfile } from '../components/common/ScenarioProfile';
import { InsightsPanel } from '../components/common/InsightsPanel';
import { EnhancedTemporalChart } from '../components/simulations/EnhancedTemporalChart';
import { analyzeScenarioIntelligence } from '../services/analytics/scenarioIntelligence';
import { LoadingState, ErrorState } from '../components/common/StateComponents';
import { ScientificDisclaimer } from '../components/common/ScientificDisclaimer';

export const ResultsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const simId = id || 'NP-2026-08-26-001';

  const [results, setResults] = useState<FloodResult | null>(null);
  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [timeline, setTimeline] = useState<TimelineSummary | null>(null);
  const [exposure, setExposure] = useState<ExposureResult[]>([]);
  const [activeTsIdx, setActiveTsIdx] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [res, imp, tl, exp] = await Promise.all([
          apiClient.getFloodResults(simId).catch(() => null),
          apiClient.getImpactSummary(simId).catch(() => null),
          apiClient.getSimulationTimeline(simId).catch(() => null),
          apiClient.getExposureResults(simId).catch(() => [])
        ]);

        if (isMounted) {
          setResults(res);
          setImpact(imp);
          setTimeline(tl);
          setExposure(exp);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed loading simulation results');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [simId]);

  const intelligence = analyzeScenarioIntelligence(results, impact, timeline, exposure);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Hydrodynamic Simulation Results Workspace
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nepal Himalayan GLOF | Simulation Run ID: <strong>{simId}</strong> | Level 1 2D Diffusive Wave Engine
          </p>
        </div>
        <span className="badge badge-completed">Level 1 Complete</span>
      </div>

      <SimulationNav simulationId={simId} />

      {loading ? (
        <LoadingState message="Loading hydrodynamic simulation results..." subtext="Querying raster summaries, timeline series, and mass conservation error metrics." />
      ) : error ? (
        <ErrorState title="Failed Loading Results" message={error} onRetry={() => window.location.reload()} />
      ) : results ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Scenario Profile Header */}
          <ScenarioProfile simulationId={simId} />

          {/* How to Read Hydrodynamic Results Guide */}
          <div className="card" style={{ background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              💡 How to Read Hydrodynamic Results
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Peak Inundated Area (km²):</strong> Total surface area covered by floodwater envelope at maximum extent.
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Maximum Water Depth (m):</strong> Peak vertical water head column recorded in river channel or floodplain.
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Peak Flow Velocity (m/s):</strong> Cellular flow speed (speeds &gt;2 m/s present structural risk to buildings &amp; bridges).
              </div>
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Mass Balance Error (%):</strong> Numerical fluid conservation check (error &lt;1% verifies mass conservation).
              </div>
            </div>
          </div>

          {/* Key Result KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <KpiCard
              label="Inundated Flood Area"
              value={results.floodAreaKm2.toFixed(3)}
              unit="km²"
              subtext="Total submerged surface envelope"
              badge="Extent"
            />

            <KpiCard
              label="Maximum Water Depth"
              value={results.maxDepthM.toFixed(2)}
              unit="m"
              subtext="Peak channel head elevation"
              badge="High Depth"
              badgeType="warning"
            />

            <KpiCard
              label="Maximum Flow Velocity"
              value={results.maxVelocityMs.toFixed(2)}
              unit="m/s"
              subtext="Cellular discharge velocity"
              badge="Speed"
            />

            <KpiCard
              label="Min Wave Arrival"
              value={results.arrivalTimeMin.toFixed(1)}
              unit="min"
              subtext="Lead time to first downstream target"
              badge="Arrival"
              badgeType="safe"
            />

            <KpiCard
              label="Mass Balance Error"
              value={(results.massBalanceErrorPercent || 0.0).toFixed(4)}
              unit="%"
              subtext="Numerical conservation check"
              badge="Conservation"
              badgeType="safe"
            />
          </div>

          {/* Scenario Analytical Insights */}
          <InsightsPanel intelligence={intelligence} />

          {/* Enhanced Multi-Variable Temporal Chart */}
          <EnhancedTemporalChart
            timeline={timeline}
            impactTimeline={impact?.temporalMetrics?.impactTimeline}
            activeStepIndex={activeTsIdx}
            onSelectTimestep={(idx) => setActiveTsIdx(idx)}
          />

          {/* Technical Execution Specifications */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.4rem' }}>
              ⚙️ Technical Execution Metadata
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <div><strong>Solver Engine:</strong> Level 1 — Native 2D Diffusive Wave</div>
              <div><strong>Execution Wall Time:</strong> {(results.executionTimeSeconds || 0.0).toFixed(2)} seconds</div>
              <div><strong>Data Source:</strong> {results.dataSource === 'live' ? 'Live Python 2D Engine Output' : 'Cached Pipeline Result'}</div>
              <div><strong>CRS Transformation:</strong> EPSG:32643 (UTM 43N) → EPSG:4326 (WGS84 GeoJSON)</div>
            </div>
          </div>

          <ScientificDisclaimer />
        </div>
      ) : null}
    </div>
  );
};
