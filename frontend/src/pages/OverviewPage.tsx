import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SimulationNav } from '../components/simulations/SimulationNav';
import { apiClient } from '../services/api/client';
import { FloodResult, ImpactSummary, TimelineSummary, ExposureResult, Simulation } from '../types';
import { analyzeScenarioIntelligence, ScenarioIntelligencePackage } from '../services/analytics/scenarioIntelligence';
import { ScenarioProfile } from '../components/common/ScenarioProfile';
import { InsightsPanel } from '../components/common/InsightsPanel';
import { PeakConditionsPanel } from '../components/common/PeakConditionsPanel';
import { TemporalMilestonePanel } from '../components/common/TemporalMilestonePanel';
import { SeverityDistributionBar } from '../components/common/SeverityDistributionBar';
import { DecisionSupportSummary } from '../components/common/DecisionSupportSummary';
import { ScientificDataPanel } from '../components/common/ScientificDataPanel';
import { LoadingState, ErrorState } from '../components/common/StateComponents';

export const OverviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const simId = id || 'NP-2026-08-26-001';

  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [results, setResults] = useState<FloodResult | null>(null);
  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [timeline, setTimeline] = useState<TimelineSummary | null>(null);
  const [exposure, setExposure] = useState<ExposureResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadAllData() {
      try {
        setLoading(true);
        const [sim, res, imp, tl, exp] = await Promise.all([
          apiClient.getSimulation(simId).catch(() => null),
          apiClient.getFloodResults(simId).catch(() => null),
          apiClient.getImpactSummary(simId).catch(() => null),
          apiClient.getSimulationTimeline(simId).catch(() => null),
          apiClient.getExposureResults(simId).catch(() => [])
        ]);

        if (isMounted) {
          setSimulation(sim);
          setResults(res);
          setImpact(imp);
          setTimeline(tl);
          setExposure(exp);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed loading simulation overview data');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAllData();
    return () => { isMounted = false; };
  }, [simId]);

  const intelligence: ScenarioIntelligencePackage = analyzeScenarioIntelligence(
    results,
    impact,
    timeline,
    exposure
  );

  const safeCount = impact?.settlementMetrics?.safeCount ?? 3;
  const lowCount = impact?.settlementMetrics?.lowCount ?? 1;
  const modCount = impact?.settlementMetrics?.moderateCount ?? 1;
  const highCount = impact?.settlementMetrics?.highCount ?? 1;
  const critCount = impact?.settlementMetrics?.criticalCount ?? (intelligence.criticalSettlementsCount || 0);
  const totalCount = impact?.settlementMetrics?.totalEvaluated ?? (safeCount + lowCount + modCount + highCount + critCount);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Analytical Scenario Workspace Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nepal Himalayan GLOF & landslide-dam breach | Simulation Run ID: <strong>{simId}</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to={`/simulations/${simId}/map`} className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
            🗺️ Interactive Map Canvas
          </Link>
          <Link to={`/simulations/${simId}/results`} className="btn btn-secondary" style={{ fontSize: '0.82rem' }}>
            📊 Hydrodynamic Results
          </Link>
        </div>
      </div>

      {/* Navigation Bar */}
      <SimulationNav simulationId={simId} />

      {loading ? (
        <LoadingState message="Computing scenario intelligence matrix..." subtext="Analyzing peak conditions, settlement exposure tiers, and temporal milestones." />
      ) : error ? (
        <ErrorState title="Unable to Load Overview" message={error} onRetry={() => window.location.reload()} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 1. Scenario Parameters & Profile Header */}
          <ScenarioProfile
            simulationId={simId}
            modelLevel={simulation?.modelLevel || 'level1'}
            createdAt={simulation?.createdAt}
          />

          {/* 2. Analytical Insights & Key Metric Findings */}
          <InsightsPanel intelligence={intelligence} />

          {/* 3. Peak Conditions View */}
          <PeakConditionsPanel peakConditions={intelligence.peakConditions} />

          {/* 4. Settlement Severity Distribution */}
          <SeverityDistributionBar
            safeCount={safeCount}
            lowCount={lowCount}
            moderateCount={modCount}
            highCount={highCount}
            criticalCount={critCount}
            totalCount={totalCount}
          />

          {/* 5. Hydrodynamic Temporal Milestones Pipeline */}
          <TemporalMilestonePanel milestones={intelligence.temporalMilestones} />

          {/* 6. Decision Support Summary & Data Quality Status */}
          <DecisionSupportSummary
            decisionSupport={intelligence.decisionSupport}
            dataQuality={intelligence.dataQuality}
          />

          {/* 7. Scientific Transparency Panel */}
          <ScientificDataPanel />
        </div>
      )}
    </div>
  );
};
