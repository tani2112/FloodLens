import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { Simulation, StudyArea, FloodResult, ImpactSummary, ExposureResult } from '../types';
import { FloodMap } from '../components/map/FloodMap';
import { DecisionSupportSummary } from '../components/common/DecisionSupportSummary';
import { ScientificDataPanel } from '../components/common/ScientificDataPanel';
import { analyzeScenarioIntelligence } from '../services/analytics/scenarioIntelligence';

import { WorkflowSequenceBar } from '../components/common/WorkflowSequenceBar';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  // Core Backend Data States
  const [studyAreas, setStudyAreas] = useState<StudyArea[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scen-nepal-glof');
  const [selectedSimId, setSelectedSimId] = useState<string>('NP-2026-08-26-001');

  // Simulation Detail States
  const [result, setResult] = useState<FloodResult | null>(null);
  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [exposure, setExposure] = useState<ExposureResult[]>([]);

  // Simulation Playback & Timeline Controls
  const [currentTsIndex, setCurrentTsIndex] = useState<number>(5);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Layer Visibility States
  const [layerExtent, setLayerExtent] = useState<boolean>(true);
  const [layerDepth, setLayerDepth] = useState<boolean>(true);
  const [layerVelocity, setLayerVelocity] = useState<boolean>(true);
  const [layerArrival, setLayerArrival] = useState<boolean>(true);
  const [layerTerrain, setLayerTerrain] = useState<boolean>(true);
  const [layerRiverNetwork, setLayerRiverNetwork] = useState<boolean>(true);
  const [layerRoads, setLayerRoads] = useState<boolean>(true);
  const [layerBridges, setLayerBridges] = useState<boolean>(true);
  const [layerBuildings, setLayerBuildings] = useState<boolean>(true);
  const [layerSettlements, setLayerSettlements] = useState<boolean>(true);
  const [layerInfrastructure, setLayerInfrastructure] = useState<boolean>(true);
  const [activeMapVariable, setActiveMapVariable] = useState<'depth' | 'velocity' | 'arrivalTime'>('depth');
  const [basemap, setBasemap] = useState<'satellite' | 'terrain' | 'osm' | 'dark' | 'light'>('satellite');
  const [activeMapTool, setActiveMapTool] = useState<string>('Select');

  // Active Left Panel Tab & Fullscreen Controls
  const [leftTab, setLeftTab] = useState<'layers' | 'legends'>('layers');
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);

  // Initial Data Fetching
  useEffect(() => {
    Promise.all([
      apiClient.getStudyAreas(),
      apiClient.getSimulations()
    ]).then(([areas, sims]) => {
      setStudyAreas(areas);
      setSimulations(sims);
    }).catch(err => {
      console.warn('Dashboard API fetch error, using local fallback models:', err);
    });
  }, []);

  // Fetch Selected Simulation Results
  useEffect(() => {
    if (!selectedSimId) return;
    Promise.all([
      apiClient.getFloodResults(selectedSimId),
      apiClient.getImpactSummary(selectedSimId),
      apiClient.getExposureResults(selectedSimId)
    ]).then(([resData, impData, expData]) => {
      setResult(resData);
      setImpact(impData);
      setExposure(expData);
    }).catch(() => {
      setResult(null);
      setImpact(null);
      setExposure([]);
    });
  }, [selectedSimId]);

  // 9-Stage Nepal Event Progression Milestones
  const nepalMilestones = [
    { timeLabel: 'T+00:00', name: 'Initial condition', fullTime: 'Time: 00:00:00 / 02:15:00', depth: 0.8, velocity: 1.2, area: 0.0, discharge: 120, arrival: '0 min' },
    { timeLabel: 'T+00:10', name: 'Ice/Rock avalanche', fullTime: 'Time: 00:10:00 / 02:15:00', depth: 3.2, velocity: 7.8, area: 2.4, discharge: 1450, arrival: '0 min' },
    { timeLabel: 'T+00:20', name: 'Temporary barrier formation', fullTime: 'Time: 00:20:00 / 02:15:00', depth: 8.5, velocity: 1.4, area: 6.2, discharge: 380, arrival: '0 min' },
    { timeLabel: 'T+00:30', name: 'Barrier/lake failure', fullTime: 'Time: 00:30:00 / 02:15:00', depth: 9.2, velocity: 8.6, area: 13.5, discharge: 18760, arrival: '2 min' },
    { timeLabel: 'T+00:45', name: 'Major flood/debris wave', fullTime: 'Time: 00:45:00 / 02:15:00', depth: 8.1, velocity: 7.2, area: 22.1, discharge: 14200, arrival: '10 min' },
    { timeLabel: 'T+01:00', name: 'Timure impact', fullTime: 'Time: 01:00:00 / 02:15:00', depth: 7.2, velocity: 5.8, area: 29.4, discharge: 9800, arrival: '18 min' },
    { timeLabel: 'T+01:20', name: 'Rasuwagadhi impact', fullTime: 'Time: 01:20:00 / 02:15:00', depth: 6.4, velocity: 5.2, area: 35.8, discharge: 6500, arrival: '25 min' },
    { timeLabel: 'T+01:40', name: 'Syabrubesi downstream impact', fullTime: 'Time: 01:40:00 / 02:15:00', depth: 4.8, velocity: 4.1, area: 40.2, discharge: 4200, arrival: '45 min' },
    { timeLabel: 'T+02:15', name: 'Maximum downstream extent', fullTime: 'Time: 02:15:00 / 02:15:00', depth: 3.2, velocity: 2.5, area: 42.3, discharge: 2100, arrival: '90 min' }
  ];

  // Live Playback Animation Loop
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = 1300 / playbackSpeed;
    const timer = setInterval(() => {
      setCurrentTsIndex((prev) => {
        if (prev >= 8) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed]);

  const activeMilestone = nepalMilestones[currentTsIndex] || nepalMilestones[8];
  const formattedTime = activeMilestone.fullTime;
  const intel = analyzeScenarioIntelligence(result, impact, null, exposure);

  const handleScenarioChange = (scenId: string) => {
    setSelectedScenarioId(scenId);
    setSelectedSimId('NP-2026-08-26-001');
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F0F9FF', color: '#0F172A', width: '100%', overflowX: 'hidden' }}>

      {/* ==================================================
          MAIN CONTENT WORKSPACE (KPI Strip + 3-Column Grid + Timeline)
         ================================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', padding: '0.65rem 1rem 0' }}>

        {/* 5-Step Operational Workflow Sequence Bar */}
        <WorkflowSequenceBar currentStep={4} activeSimulationId={selectedSimId} />

        {/* TOP KPI CARDS STRIP (5 White & Blue Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '0.65rem' }}>

          {/* KPI 1: Max Water Depth */}
          <div className="cc-kpi-card" onClick={() => navigate('/simulations/NP-2026-08-26-001/map?var=depth')} style={{ cursor: 'pointer' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#E0F2FE', border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#0284C7' }}>
              💧
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Max Water Depth
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                {activeMilestone.depth.toFixed(1)} m
              </div>
            </div>
          </div>

          {/* KPI 2: Max Velocity */}
          <div className="cc-kpi-card" onClick={() => navigate('/simulations/NP-2026-08-26-001/map?var=velocity')} style={{ cursor: 'pointer' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#E0F2FE', border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#0284C7' }}>
              ⏱️
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Max Velocity
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                {activeMilestone.velocity.toFixed(1)} m/s
              </div>
            </div>
          </div>

          {/* KPI 3: Flooded Area */}
          <div className="cc-kpi-card" onClick={() => navigate('/simulations/NP-2026-08-26-001/results')} style={{ cursor: 'pointer' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#E0F2FE', border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#0284C7' }}>
              🗺️
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Flooded Area
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                {activeMilestone.area.toFixed(1)} km²
              </div>
            </div>
          </div>

          {/* KPI 4: Discharge (Peak) */}
          <div className="cc-kpi-card" onClick={() => navigate('/simulations/NP-2026-08-26-001/results')} style={{ cursor: 'pointer' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#E0F2FE', border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#0284C7' }}>
              ⚡
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Discharge (Peak)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                {activeMilestone.discharge.toLocaleString()} m³/s
              </div>
            </div>
          </div>

          {/* KPI 5: Arrival Time (Min) */}
          <div className="cc-kpi-card" onClick={() => navigate('/simulations/NP-2026-08-26-001/map?var=arrival')} style={{ cursor: 'pointer' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#E0F2FE', border: '1px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#0284C7' }}>
              🕒
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Arrival Time (Min)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                {activeMilestone.arrival}
              </div>
            </div>
          </div>

        </div>

        {/* MIDDLE 3-PANEL WORKSPACE GRID */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '230px 1fr 250px', gap: '0.75rem', height: 'calc(100vh - 200px)', overflow: 'hidden' }}>

          {/* --------------------------------------------------
              LEFT SIDEBAR PANEL: SCENARIO & LAYER CONTROLS
             -------------------------------------------------- */}
          <div className="cc-panel cc-scrollbar" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', overflowY: 'auto' }}>

            {/* Scenario Selection Box */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                Scenario
              </div>
              <select
                className="cc-select"
                value={selectedScenarioId}
                onChange={(e) => handleScenarioChange(e.target.value)}
                style={{ width: '100%', fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}
              >
                <option value="scen-nepal-glof">NP-2026-08-26-001 — Nepal GLOF (Lhende Khola → Bhote Koshi)</option>
                <option value="rishiganga-uttarakhand-2021">UK-2021-02-07-001 — Rishi Ganga Chamoli Flash Flood (Feb 2021)</option>
                <option value="phuktal-zanskar-2015">LD-2015-03-15-001 — Phuktal River Landslide Dam Lake (Mar 2015)</option>
                <option value="wapriyang-2021">WP-2021-11-12-001 — Wapriyang River Landslide Outburst (Nov 2021)</option>
                <option value="kosi-2008">KS-2008-08-18-001 — Kosi River Kushaha Embankment Breach (2008)</option>
              </select>

              <div style={{ marginTop: '0.6rem', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '0.5rem 0.65rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16A34A' }}></span>
                  <strong style={{ color: '#16A34A' }}>Running</strong>
                </div>
                <div style={{ color: '#64748B', marginTop: '0.15rem' }}>
                  Started: <strong>10:42 AM, 26 Aug 2026</strong>
                </div>
              </div>
            </div>

            {/* Tabs: Layers / Legends */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.65rem' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', marginBottom: '0.65rem' }}>
                <button
                  onClick={() => setLeftTab('layers')}
                  style={{
                    flex: 1,
                    padding: '0.35rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: leftTab === 'layers' ? '#0284C7' : '#64748B',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: leftTab === 'layers' ? '2px solid #0284C7' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  Layers
                </button>
                <button
                  onClick={() => setLeftTab('legends')}
                  style={{
                    flex: 1,
                    padding: '0.35rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: leftTab === 'legends' ? '#0284C7' : '#64748B',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: leftTab === 'legends' ? '2px solid #0284C7' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  Legends
                </button>
              </div>

              {leftTab === 'layers' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem' }}>
                  {[
                    { label: 'Flood Extent & Debris', checked: layerExtent, toggle: () => setLayerExtent(!layerExtent) },
                    { label: 'Water Depth', checked: layerDepth, toggle: () => { const next = !layerDepth; setLayerDepth(next); if (next) setActiveMapVariable('depth'); } },
                    { label: 'Flow Velocity & Direction', checked: layerVelocity, toggle: () => { const next = !layerVelocity; setLayerVelocity(next); if (next) setActiveMapVariable('velocity'); } },
                    { label: 'Flood Arrival Time', checked: layerArrival, toggle: () => { const next = !layerArrival; setLayerArrival(next); if (next) setActiveMapVariable('arrivalTime'); } },
                    { label: '3D Himalayan Terrain', checked: layerTerrain, toggle: () => setLayerTerrain(!layerTerrain) },
                    { label: 'Lhende / Bhote Koshi Network', checked: layerRiverNetwork, toggle: () => setLayerRiverNetwork(!layerRiverNetwork) },
                    { label: 'Roads & Evacuation Routes', checked: layerRoads, toggle: () => setLayerRoads(!layerRoads) },
                    { label: 'Bridges & Crossings', checked: layerBridges, toggle: () => setLayerBridges(!layerBridges) },
                    { label: 'Buildings / Logistics Hubs', checked: layerBuildings, toggle: () => setLayerBuildings(!layerBuildings) },
                    { label: 'Population / Settlements', checked: layerSettlements, toggle: () => setLayerSettlements(!layerSettlements) },
                    { label: 'Critical Infrastructure', checked: layerInfrastructure, toggle: () => setLayerInfrastructure(!layerInfrastructure) }
                  ].map((item, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: item.checked ? '#0F172A' : '#64748B', fontWeight: item.checked ? 600 : 500, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <input type="checkbox" checked={item.checked} onChange={item.toggle} style={{ accentColor: '#0284C7' }} />
                        <span>{item.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', opacity: 0.5, fontSize: '0.72rem' }}>
                        <span>ⓘ</span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Event Sequence Steps
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.72rem', color: '#0F172A' }}>
                    <div>❄️ 1. Ice/Rock Avalanche</div>
                    <div>🪨 2. Avalanche Debris Path</div>
                    <div>🏞️ 3. Landslide Barrier Lake</div>
                    <div>💥 4. Dam Breach Point</div>
                    <div>🌊 5. Mud, Rock & Debris Flow</div>
                    <div>🏘️ 6. Downstream Impact</div>
                  </div>

                  <div style={{ marginTop: '0.4rem' }}>Water Depth Ramp (shallow to high hazard)</div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'linear-gradient(to right, #075985, #0EA5E9, #22D3EE, #FDE047, #FB923C, #F97316, #DC2626)' }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                    <span>0.0m</span>
                    <span>3.0m</span>
                    <span>&gt;7.5m</span>
                  </div>
                </div>
              )}
            </div>

            {/* Map Tools */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                Map Tools
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.25rem', textAlign: 'center' }}>
                {[
                  { icon: '🎯', label: 'Select' },
                  { icon: '✏️', label: 'Draw' },
                  { icon: '📏', label: 'Measure' },
                  { icon: '🔍', label: 'Query' },
                  { icon: '🧹', label: 'Clear' }
                ].map((t, idx) => (
                  <button key={idx} onClick={() => setActiveMapTool(t.label)} className="cc-btn" style={{ flexDirection: 'column', padding: '0.35rem 0.15rem', fontSize: '0.62rem', gap: '0.15rem', borderRadius: '4px', borderColor: activeMapTool === t.label ? '#0284C7' : undefined, background: activeMapTool === t.label ? '#E0F2FE' : undefined }}>
                    <span style={{ fontSize: '0.85rem' }}>{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: '0.45rem', color: '#0284C7', fontSize: '0.68rem', fontWeight: 700 }}>Active GIS tool: {activeMapTool}</div>
            </div>

            {/* Basemap Selector */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                Basemap
              </div>
              <select className="cc-select" value={basemap} onChange={(e) => setBasemap(e.target.value as typeof basemap)} style={{ width: '100%', fontSize: '0.8rem', fontWeight: 600 }}>
                <option value="satellite">Satellite Hybrid</option>
                <option value="terrain">Terrain</option>
                <option value="light">Light Scientific</option>
                <option value="osm">OpenStreetMap</option>
                <option value="dark">Dark Vector</option>
              </select>
            </div>

          </div>

          {/* --------------------------------------------------
              CENTER MAP WORKSPACE (Controlled Map & Animation)
             -------------------------------------------------- */}
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid #BAE6FD', background: '#FFFFFF' }}>

            <FloodMap
              simulationId={selectedSimId}
              basemap={basemap}
              activeVariable={activeMapVariable}
              activeMapTool={activeMapTool}
              onActiveMapToolChange={(tool) => setActiveMapTool(tool)}
              layersConfig={{
                extent: layerExtent,
                depth: layerDepth,
                velocity: layerVelocity,
                arrivalTime: layerArrival,
                dem: layerTerrain,
                riverNetwork: layerRiverNetwork,
                roads: layerRoads,
                bridges: layerBridges,
                buildings: layerBuildings,
                settlements: layerSettlements,
                infrastructure: layerInfrastructure
              }}
              currentTsIndex={currentTsIndex}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              onPlaybackSpeedChange={(speed) => setPlaybackSpeed(speed)}
              formattedTime={formattedTime}
              isFullscreen={isMapFullscreen}
              onToggleFullscreen={(fs) => setIsMapFullscreen(fs)}
              onTimelineChange={(idx) => setCurrentTsIndex(idx)}
              onPlayPauseChange={(playing) => setIsPlaying(playing)}
              onReset={() => {
                setIsPlaying(false);
                setCurrentTsIndex(0);
              }}
              showFullscreenToggle={true}
              showFloatingControls={true}
            />

          </div>

          {/* --------------------------------------------------
              RIGHT SIDEBAR PANEL: SIMULATION INFO & HYDROGRAPH
             -------------------------------------------------- */}
          <div className="cc-panel cc-scrollbar" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', overflowY: 'auto' }}>

            {/* Simulation Info Table */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.04em' }}>
                Simulation Info
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.3rem 0.75rem', color: '#0F172A', fontSize: '0.76rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>ID:</span> <strong style={{ color: '#0284C7' }}>NP-2026-08-26-001</strong>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Type:</span> <span>Ice/Rock Barrier GLOF</span>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Corridor:</span> <span>Lhende Khola → Bhote Koshi</span>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Key Hubs:</span> <span>Timure, Rasuwagadhi, Syabrubesi</span>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Model:</span> <span>2D Diffusive Wave</span>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Grid Size:</span> <span>12.5 m</span>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Duration:</span> <span>2.25 hrs</span>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Current Time:</span> <span style={{ color: '#0284C7', fontWeight: 700 }}>{activeMilestone.timeLabel}</span>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Peak Discharge:</span> <span style={{ color: '#DC2626', fontWeight: 700 }}>18,760 m³/s</span>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Status:</span> <span style={{ color: '#0284C7', fontWeight: 700 }}>Running (72%)</span>
              </div>
            </div>

            {/* Simulation Progress Stages */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.04em' }}>
                Progress
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem' }}>
                <div style={{ color: '#16A34A', fontWeight: 600 }}>✓ Preparing DEM</div>
                <div style={{ color: '#16A34A', fontWeight: 600 }}>✓ Setting up Model Grid</div>
                <div style={{ color: '#16A34A', fontWeight: 600 }}>✓ Processing Terrain</div>
                <div style={{ color: '#16A34A', fontWeight: 600 }}>✓ Initializing Conditions</div>
                <div style={{ color: '#0284C7', fontWeight: 800 }}>● Running Simulation (72%)</div>
                <div style={{ color: '#94A3B8' }}>○ Post Processing</div>
                <div style={{ color: '#94A3B8' }}>○ Generating Outputs</div>
              </div>
            </div>

            {/* Hydrograph (Outlet Discharge Curve) */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                Hydrograph (Outlet)
              </div>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '4px', padding: '0.6rem' }}>
                <div style={{ fontSize: '0.68rem', color: '#64748B', marginBottom: '0.25rem', fontWeight: 600 }}>Discharge (m³/s)</div>
                <svg width="100%" height="90" viewBox="0 0 170 90" style={{ overflow: 'visible' }}>
                  <line x1="25" y1="75" x2="160" y2="75" stroke="#CBD5E1" strokeWidth="1" />
                  <line x1="25" y1="10" x2="25" y2="75" stroke="#CBD5E1" strokeWidth="1" />

                  {/* Peak Discharge Curve */}
                  <path d="M 25 73 Q 55 70 80 20 T 115 50 T 160 70" fill="none" stroke="#0284C7" strokeWidth="2.5" />

                  {/* Active time indicator dot on hydrograph */}
                  {(() => {
                    const cx = 25 + (currentTsIndex / 8) * 135;
                    const cy = 75 - Math.sin((currentTsIndex / 8) * Math.PI) * 55;
                    return <circle cx={cx} cy={cy} r="4" fill="#0284C7" stroke="#FFFFFF" strokeWidth="1.5" />;
                  })()}

                  <text x="5" y="15" fill="#64748B" fontSize="7" fontWeight="600">20k</text>
                  <text x="5" y="45" fill="#64748B" fontSize="7" fontWeight="600">10k</text>
                  <text x="12" y="75" fill="#64748B" fontSize="7" fontWeight="600">0</text>

                  <text x="25" y="85" fill="#64748B" fontSize="7" fontWeight="600">0</text>
                  <text x="58" y="85" fill="#64748B" fontSize="7" fontWeight="600">0.5</text>
                  <text x="90" y="85" fill="#64748B" fontSize="7" fontWeight="600">1.0</text>
                  <text x="123" y="85" fill="#64748B" fontSize="7" fontWeight="600">1.5</text>
                  <text x="153" y="85" fill="#64748B" fontSize="7" fontWeight="600">2.0</text>
                </svg>
                <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#64748B', marginTop: '0.25rem', fontWeight: 600 }}>Time (hrs)</div>
              </div>
            </div>

          </div>

        </div>

        {/* ==================================================
            BOTTOM TIMELINE PLAYBACK BAR (Fully Interactive)
           ================================================== */}
        <div style={{ background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: '6px', padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.65rem', marginBottom: '0.65rem', boxShadow: '0 1px 4px rgba(2, 132, 199, 0.08)' }}>

          {/* Playback Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn btn-primary"
              style={{ padding: '0.35rem 0.65rem', fontWeight: 800, fontSize: '0.85rem', background: '#0284C7', width: '38px' }}
              title={isPlaying ? 'Pause Simulation' : 'Play Simulation'}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>

            <button
              onClick={() => { setIsPlaying(false); setCurrentTsIndex(0); }}
              className="cc-btn"
              title="Rewind to Start (00:00)"
            >
              │◄
            </button>

            <button
              onClick={() => { setIsPlaying(false); setCurrentTsIndex((prev) => Math.max(prev - 1, 0)); }}
              className="cc-btn"
              title="Step Backward (-1 Stage)"
            >
              │◀
            </button>

            <button
              onClick={() => { setIsPlaying(false); setCurrentTsIndex((prev) => Math.min(prev + 1, 8)); }}
              className="cc-btn"
              title="Step Forward (+1 Stage)"
            >
              ►│
            </button>

            <button
              onClick={() => { setCurrentTsIndex(0); setIsPlaying(true); }}
              className="cc-btn"
              title="Restart Simulation"
            >
              ↺
            </button>

            <select
              className="cc-select"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              style={{ padding: '0.25rem 0.45rem', fontSize: '0.75rem', fontWeight: 700 }}
            >
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="5">5x</option>
            </select>
          </div>

          {/* Interactive Timeline Range Scrubber */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: '#0F172A', fontWeight: 800 }}>
                📍 Timeline Event Stage: <span style={{ color: '#0284C7' }}>{activeMilestone.timeLabel} — {activeMilestone.name}</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>
                Step {currentTsIndex + 1} / 9
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={currentTsIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentTsIndex(Number(e.target.value));
              }}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#0284C7' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B', fontSize: '0.68rem', fontWeight: 700, padding: '0 2px' }}>
              {nepalMilestones.map((m, idx) => (
                <span
                  key={idx}
                  onClick={() => { setIsPlaying(false); setCurrentTsIndex(idx); }}
                  style={{
                    color: currentTsIndex === idx ? '#0284C7' : '#64748B',
                    cursor: 'pointer',
                    fontWeight: currentTsIndex === idx ? 800 : 600,
                    textDecoration: currentTsIndex === idx ? 'underline' : 'none'
                  }}
                  title={`${m.timeLabel} — ${m.name}`}
                >
                  {m.timeLabel}
                </span>
              ))}
            </div>
          </div>

          {/* Action Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="cc-btn" title="Print current command-center view" onClick={() => window.print()}>🖨</button>
            <button className="cc-btn" title="Record Simulation Video" onClick={() => setIsPlaying(true)}>🎥</button>
            <button className="cc-btn" title="Expand Immersive Fullscreen 3D Simulation Map" onClick={() => setIsMapFullscreen(true)} style={{ background: '#0284C7', color: '#FFF', fontWeight: 800, borderColor: '#0284C7' }}>⤢ Fullscreen Map</button>
          </div>
        </div>

        {/* Operational Decision Support & Transparency */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
          <DecisionSupportSummary
            decisionSupport={intel.decisionSupport}
            dataQuality={intel.dataQuality}
          />
          <ScientificDataPanel />
        </div>

      </div>
    </div>
  );
};
