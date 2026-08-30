import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SimulationNav } from '../components/simulations/SimulationNav';
import { apiClient } from '../services/api/client';
import { ImpactSummary, ExposureResult } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { ScientificDisclaimer } from '../components/common/ScientificDisclaimer';
import { SettlementRiskExplorer } from '../components/simulations/SettlementRiskExplorer';
import { RoadCorridorAnalysis } from '../components/simulations/RoadCorridorAnalysis';
import { InfrastructureAnalysis } from '../components/simulations/InfrastructureAnalysis';
import { FloodMap } from '../components/map/FloodMap';

import { WorkflowSequenceBar } from '../components/common/WorkflowSequenceBar';

export const ImpactPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const simId = id || 'NP-2026-08-26-001';

  const [impactData, setImpactData] = useState<ImpactSummary | null>(null);
  const [exposureList, setExposureList] = useState<ExposureResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settlements' | 'roads' | 'infrastructure' | 'map'>('settlements');
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [imp, exp] = await Promise.all([
          apiClient.getImpactSummary(simId).catch(() => null),
          apiClient.getExposureResults(simId).catch(() => [])
        ]);

        if (isMounted) {
          setImpactData(imp);
          setExposureList(exp);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed loading impact analytics');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [simId]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <WorkflowSequenceBar currentStep={5} activeSimulationId={simId} />
        <SimulationNav simulationId={simId} />
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading flood impact analytics...
        </div>
      </div>
    );
  }

  if (error || !impactData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <WorkflowSequenceBar currentStep={5} activeSimulationId={simId} />
        <SimulationNav simulationId={simId} />
        <div className="card" style={{ borderColor: '#fca5a5', background: '#fee2e2', color: '#991b1b', padding: '1.5rem' }}>
          <strong>Error Loading Impact Analytics:</strong> {error || 'Impact data unavailable for this simulation run.'}
        </div>
      </div>
    );
  }

  const {
    floodMetrics,
    settlementMetrics,
    roadMetrics,
    severitySummary
  } = impactData;

  const combinedSettlements = exposureList.length > 0 ? exposureList : settlementMetrics.settlements;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 5-Step Operational Workflow Sequence Header */}
      <WorkflowSequenceBar currentStep={5} activeSimulationId={simId} />

      {/* Header Context */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Step 5: Bhote Koshi Corridor Impact & Settlement Risk Explorer
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nepal Himalayan GLOF & landslide-dam breach | Simulation: <strong>{simId}</strong> | Event: <strong>{impactData.scenarioType}</strong>
          </p>
        </div>
        <SeverityBadge severity={severitySummary.overallImpactSeverity} />
      </div>

      <SimulationNav simulationId={simId} />

      <ScientificDisclaimer />

      {/* Top Impact KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
        <KpiCard
          label="Inundated Settlements"
          value={`${settlementMetrics.totalAffected} / ${settlementMetrics.totalEvaluated}`}
          unit="villages"
          subtext={`Safe: ${settlementMetrics.safeCount} | Critical: ${settlementMetrics.criticalCount}`}
          badge="Settlements"
          badgeType={settlementMetrics.totalAffected > 0 ? 'warning' : 'safe'}
        />

        <KpiCard
          label="Critical Risk Tier"
          value={settlementMetrics.criticalCount.toString()}
          unit="villages"
          subtext={`Earliest: ${settlementMetrics.earliestAffectedSettlement || 'None'}`}
          badge="Critical Tier"
          badgeType={settlementMetrics.criticalCount > 0 ? 'warning' : 'safe'}
        />

        <KpiCard
          label="Affected Road Corridor"
          value={roadMetrics.affectedRoadsLengthKm.toFixed(2)}
          unit="km"
          subtext={`${roadMetrics.affectedPercent.toFixed(1)}% of total ${roadMetrics.totalNetworkLengthKm.toFixed(2)} km`}
          badge="Corridors"
          badgeType={roadMetrics.affectedRoadsLengthKm > 0 ? 'warning' : 'safe'}
        />

        <KpiCard
          label="Peak Submerged Extent"
          value={floodMetrics.floodAreaKm2.toFixed(3)}
          unit="km²"
          subtext={`Max Water Depth: ${floodMetrics.maxDepthM.toFixed(2)} m`}
          badge="Peak Extent"
        />
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'settlements', label: `🏘️ Villages & Settlements (${combinedSettlements.length})` },
          { id: 'roads', label: `🛣️ Transport Corridors (${roadMetrics.affectedSegmentsCount || 3})` },
          { id: 'infrastructure', label: `🏥 Bridges & Critical Infrastructure (${impactData.infrastructureMetrics?.assets?.length || 6})` },
          { id: 'map', label: `🗺️ Spatial Exposure Map` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.45rem 0.95rem',
              fontSize: '0.84rem',
              fontWeight: activeTab === tab.id ? 700 : 500,
              borderRadius: '6px',
              border: activeTab === tab.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              background: activeTab === tab.id ? '#e0f2fe' : 'var(--bg-surface-secondary)',
              color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Settlement Risk Explorer */}
      {activeTab === 'settlements' && (
        <SettlementRiskExplorer
          settlements={combinedSettlements as any}
          onSelectSettlement={(s) => {
            setSelectedSettlement(s);
            setActiveTab('map');
          }}
        />
      )}

      {/* Tab 2: Road Corridor Analysis */}
      {activeTab === 'roads' && (
        <RoadCorridorAnalysis roadMetrics={roadMetrics} />
      )}

      {/* Tab 3: Infrastructure Analysis */}
      {activeTab === 'infrastructure' && (
        <InfrastructureAnalysis infrastructureData={impactData.infrastructureMetrics} />
      )}

      {/* Tab 4: Spatial Impact Map */}
      {activeTab === 'map' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {selectedSettlement && (
            <div style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1', padding: '0.6rem 0.85rem', borderRadius: '6px', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Focused Settlement Centroid: <strong>{selectedSettlement.name}</strong> (Max Depth: {selectedSettlement.maxDepthM?.toFixed(2)} m)</span>
              <button onClick={() => setSelectedSettlement(null)} style={{ border: 'none', background: 'transparent', color: '#0369a1', cursor: 'pointer', fontWeight: 700 }}>✕ Clear Focus</button>
            </div>
          )}
          <div style={{ height: '540px', borderRadius: '6px', overflow: 'hidden' }}>
            <FloodMap simulationId={simId} />
          </div>
        </div>
      )}
    </div>
  );
};
