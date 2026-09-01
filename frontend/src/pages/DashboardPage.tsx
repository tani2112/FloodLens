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

interface ScenarioDefinition {
  id: string;
  simId: string;
  name: string;
  shortName: string;
  corridor: string;
  region: string;
  type: string;
  keyHubs: string;
  model: string;
  gridSize: string;
  duration: string;
  peakDischarge: number;
  startedTime: string;
  milestones: Array<{
    timeLabel: string;
    name: string;
    fullTime: string;
    depth: number;
    velocity: number;
    area: number;
    discharge: number;
    arrival: string;
  }>;
  eventSequence: string[];
}

const SCENARIO_MAP: Record<string, ScenarioDefinition> = {
  'scen-nepal-glof': {
    id: 'scen-nepal-glof',
    simId: 'NP-2026-08-26-001',
    name: 'NP-2026-08-26-001 — Nepal GLOF (Lhende Khola → Bhote Koshi)',
    shortName: 'Nepal GLOF & Landslide Dam',
    corridor: 'Lhende Khola → Bhote Koshi',
    region: 'Rasuwa District, Bagmati Province, Nepal',
    type: 'Ice/Rock Barrier GLOF',
    keyHubs: 'Timure, Rasuwagadhi, Syabrubesi',
    model: '2D Diffusive Wave',
    gridSize: '12.5 m',
    duration: '2.25 hrs',
    peakDischarge: 18760,
    startedTime: '10:42 AM, 26 Aug 2026',
    milestones: [
      { timeLabel: 'T+00:00', name: 'Initial condition', fullTime: 'Time: 00:00:00 / 02:15:00', depth: 0.8, velocity: 1.2, area: 0.0, discharge: 120, arrival: '0 min' },
      { timeLabel: 'T+00:10', name: 'Ice/Rock avalanche', fullTime: 'Time: 00:10:00 / 02:15:00', depth: 3.2, velocity: 7.8, area: 2.4, discharge: 1450, arrival: '0 min' },
      { timeLabel: 'T+00:20', name: 'Temporary barrier formation', fullTime: 'Time: 00:20:00 / 02:15:00', depth: 8.5, velocity: 1.4, area: 6.2, discharge: 380, arrival: '0 min' },
      { timeLabel: 'T+00:30', name: 'Barrier/lake failure', fullTime: 'Time: 00:30:00 / 02:15:00', depth: 9.2, velocity: 8.6, area: 13.5, discharge: 18760, arrival: '2 min' },
      { timeLabel: 'T+00:45', name: 'Major flood/debris wave', fullTime: 'Time: 00:45:00 / 02:15:00', depth: 8.1, velocity: 7.2, area: 22.1, discharge: 14200, arrival: '10 min' },
      { timeLabel: 'T+01:00', name: 'Timure impact', fullTime: 'Time: 01:00:00 / 02:15:00', depth: 7.2, velocity: 5.8, area: 29.4, discharge: 9800, arrival: '18 min' },
      { timeLabel: 'T+01:20', name: 'Rasuwagadhi impact', fullTime: 'Time: 01:20:00 / 02:15:00', depth: 6.4, velocity: 5.2, area: 35.8, discharge: 6500, arrival: '25 min' },
      { timeLabel: 'T+01:40', name: 'Syabrubesi downstream impact', fullTime: 'Time: 01:40:00 / 02:15:00', depth: 4.8, velocity: 4.1, area: 40.2, discharge: 4200, arrival: '45 min' },
      { timeLabel: 'T+02:15', name: 'Maximum downstream extent', fullTime: 'Time: 02:15:00 / 02:15:00', depth: 3.2, velocity: 2.5, area: 42.3, discharge: 2100, arrival: '90 min' }
    ],
    eventSequence: ['❄️ 1. Ice/Rock Avalanche', '🪨 2. Avalanche Debris Path', '🏞️ 3. Landslide Barrier Lake', '💥 4. Dam Breach Point', '🌊 5. Mud, Rock & Debris Flow', '🏘️ 6. Downstream Impact']
  },
  'rishiganga-uttarakhand-2021': {
    id: 'rishiganga-uttarakhand-2021',
    simId: 'UK-2021-02-07-001',
    name: 'UK-2021-02-07-001 — Rishi Ganga Chamoli Flash Flood (Feb 2021)',
    shortName: 'Rishi Ganga Chamoli Flash Flood',
    corridor: 'Rishi Ganga → Dhauliganga → Alaknanda',
    region: 'Chamoli District, Uttarakhand, India',
    type: 'Rock/Ice Avalanche & Landslide Dam Breach',
    keyHubs: 'Raini Village, Tapovan Barrage, Joshimath',
    model: '2D Diffusive Wave',
    gridSize: '15.0 m',
    duration: '2.00 hrs',
    peakDischarge: 16200,
    startedTime: '08:30 AM, 07 Feb 2021',
    milestones: [
      { timeLabel: 'T+00:00', name: 'Ronti Peak mass detachment', fullTime: 'Time: 00:00:00 / 02:00:00', depth: 1.0, velocity: 2.0, area: 0.0, discharge: 80, arrival: '0 min' },
      { timeLabel: 'T+00:08', name: 'Rishiganga gorge damming', fullTime: 'Time: 00:08:00 / 02:00:00', depth: 14.5, velocity: 22.0, area: 1.8, discharge: 8500, arrival: '2 min' },
      { timeLabel: 'T+00:15', name: 'Rishi Ganga Hydro Project impact', fullTime: 'Time: 00:15:00 / 02:00:00', depth: 16.2, velocity: 18.5, area: 4.2, discharge: 12400, arrival: '6 min' },
      { timeLabel: 'T+00:25', name: 'Raini village bridge destruction', fullTime: 'Time: 00:25:00 / 02:00:00', depth: 12.8, velocity: 14.2, area: 7.9, discharge: 10200, arrival: '12 min' },
      { timeLabel: 'T+00:40', name: 'Tapovan barrage breach', fullTime: 'Time: 00:40:00 / 02:00:00', depth: 10.4, velocity: 11.0, area: 14.5, discharge: 7800, arrival: '20 min' },
      { timeLabel: 'T+01:00', name: 'Dhauliganga-Alaknanda confluence', fullTime: 'Time: 01:00:00 / 02:00:00', depth: 7.8, velocity: 7.5, area: 22.0, discharge: 5400, arrival: '35 min' },
      { timeLabel: 'T+01:20', name: 'Joshimath downstream surge', fullTime: 'Time: 01:20:00 / 02:00:00', depth: 6.2, velocity: 5.8, area: 28.6, discharge: 3900, arrival: '50 min' },
      { timeLabel: 'T+01:40', name: 'Chamoli / Pipalkoti surge attenuation', fullTime: 'Time: 01:40:00 / 02:00:00', depth: 4.5, velocity: 4.2, area: 34.2, discharge: 2800, arrival: '75 min' },
      { timeLabel: 'T+02:00', name: 'Rudraprayag / Srinagar containment', fullTime: 'Time: 02:00:00 / 02:00:00', depth: 3.1, velocity: 2.8, area: 38.5, discharge: 1900, arrival: '110 min' }
    ],
    eventSequence: ['🏔️ 1. Ronti Peak Mass Detachment', '🪨 2. Gorge Impact & Lake Damming', '⚡ 3. Rishiganga Hydro Impact', '🌉 4. Raini Bridge Washout', '🌊 5. Tapovan Barrage Breach', '🏘️ 6. Joshimath Downstream Surge']
  },
  'phuktal-zanskar-2015': {
    id: 'phuktal-zanskar-2015',
    simId: 'LD-2015-03-15-001',
    name: 'LD-2015-03-15-001 — Phuktal River Landslide Dam Lake (Mar 2015)',
    shortName: 'Phuktal River Landslide Dam Lake',
    corridor: 'Tsarap Chu → Phuktal River → Zanskar',
    region: 'Zanskar Sub-Division, Kargil / Ladakh',
    type: 'Landslide Dam Lake Outburst (15M m³)',
    keyHubs: 'Sumdo, Phuktal Gompa, Purne, Padum',
    model: '2D Diffusive Wave',
    gridSize: '20.0 m',
    duration: '3.50 hrs',
    peakDischarge: 6800,
    startedTime: '09:15 AM, 15 Mar 2015',
    milestones: [
      { timeLabel: 'T+00:00', name: 'Marshun landslide slope collapse', fullTime: 'Time: 00:00:00 / 03:30:00', depth: 0.5, velocity: 1.0, area: 0.0, discharge: 45, arrival: '0 min' },
      { timeLabel: 'T+00:20', name: '15M m³ barrier lake formation', fullTime: 'Time: 00:20:00 / 03:30:00', depth: 18.5, velocity: 1.2, area: 3.5, discharge: 15, arrival: '0 min' },
      { timeLabel: 'T+00:45', name: 'Overtopping breach initiation', fullTime: 'Time: 00:45:00 / 03:30:00', depth: 16.0, velocity: 12.4, area: 8.2, discharge: 6800, arrival: '5 min' },
      { timeLabel: 'T+01:10', name: 'Phuktal Monastery cliff reach impact', fullTime: 'Time: 01:10:00 / 03:30:00', depth: 12.2, velocity: 9.8, area: 15.4, discharge: 5200, arrival: '22 min' },
      { timeLabel: 'T+01:40', name: 'Cha & Purne village bridge washouts', fullTime: 'Time: 01:40:00 / 03:30:00', depth: 9.5, velocity: 7.6, area: 24.1, discharge: 3800, arrival: '45 min' },
      { timeLabel: 'T+02:10', name: 'Padum valley entrance reach', fullTime: 'Time: 02:10:00 / 03:30:00', depth: 6.8, velocity: 5.4, area: 32.8, discharge: 2700, arrival: '75 min' },
      { timeLabel: 'T+02:40', name: 'Zanskar wide floodplain inundation', fullTime: 'Time: 02:40:00 / 03:30:00', depth: 4.2, velocity: 3.8, area: 41.5, discharge: 1850, arrival: '110 min' },
      { timeLabel: 'T+03:00', name: 'Peak downstream extent reached', fullTime: 'Time: 03:00:00 / 03:30:00', depth: 2.8, velocity: 2.2, area: 46.2, discharge: 1100, arrival: '150 min' },
      { timeLabel: 'T+03:30', name: 'Recession phase', fullTime: 'Time: 03:30:00 / 03:30:00', depth: 1.6, velocity: 1.5, area: 38.0, discharge: 550, arrival: '180 min' }
    ],
    eventSequence: ['⛰️ 1. Marshun Slope Collapse', '🏞️ 2. 15M m³ Barrier Lake Formation', '💥 3. Overtopping Breach Initiation', '🏛️ 4. Phuktal Monastery Reach Impact', '🌉 5. Cha & Purne Bridge Washouts', '🌊 6. Padum Valley Inundation']
  },
  'wapriyang-2021': {
    id: 'wapriyang-2021',
    simId: 'WP-2021-11-12-001',
    name: 'WP-2021-11-12-001 — Wapriyang River Landslide Outburst (Nov 2021)',
    shortName: 'Wapriyang Landslide Outburst',
    corridor: 'Wapriyang River → Siang Valley',
    region: 'Eastern Himalayas / Siang Catchment',
    type: 'Canyon Landslide Barrier Outburst',
    keyHubs: 'Wapriyang Tribal Settlement, Siang Confluence',
    model: '2D Diffusive Wave',
    gridSize: '15.0 m',
    duration: '3.00 hrs',
    peakDischarge: 5600,
    startedTime: '11:00 AM, 12 Nov 2021',
    milestones: [
      { timeLabel: 'T+00:00', name: 'Steep canyon debris slide', fullTime: 'Time: 00:00:00 / 03:00:00', depth: 0.5, velocity: 1.0, area: 0.0, discharge: 30, arrival: '0 min' },
      { timeLabel: 'T+00:15', name: 'Barrier lake impoundment', fullTime: 'Time: 00:15:00 / 03:00:00', depth: 11.2, velocity: 1.1, area: 2.1, discharge: 10, arrival: '0 min' },
      { timeLabel: 'T+00:35', name: 'Progressive overtopping failure', fullTime: 'Time: 00:35:00 / 03:00:00', depth: 10.5, velocity: 13.8, area: 5.4, discharge: 5600, arrival: '4 min' },
      { timeLabel: 'T+00:55', name: 'Gorge wave routing', fullTime: 'Time: 00:55:00 / 03:00:00', depth: 8.8, velocity: 10.2, area: 11.2, discharge: 4200, arrival: '15 min' },
      { timeLabel: 'T+01:15', name: 'Downstream river crossing impact', fullTime: 'Time: 01:15:00 / 03:00:00', depth: 7.1, velocity: 7.8, area: 18.6, discharge: 3100, arrival: '30 min' },
      { timeLabel: 'T+01:35', name: 'Valley confluence expansion', fullTime: 'Time: 01:35:00 / 03:00:00', depth: 5.4, velocity: 5.6, area: 25.4, discharge: 2200, arrival: '50 min' },
      { timeLabel: 'T+02:00', name: 'Maximum inundation extent', fullTime: 'Time: 02:00:00 / 03:00:00', depth: 3.8, velocity: 3.9, area: 31.8, discharge: 1500, arrival: '75 min' },
      { timeLabel: 'T+02:30', name: 'Main Siang river entry', fullTime: 'Time: 02:30:00 / 03:00:00', depth: 2.5, velocity: 2.6, area: 36.2, discharge: 950, arrival: '110 min' },
      { timeLabel: 'T+03:00', name: 'Hydraulic stabilization', fullTime: 'Time: 03:00:00 / 03:00:00', depth: 1.4, velocity: 1.6, area: 33.0, discharge: 420, arrival: '140 min' }
    ],
    eventSequence: ['🧗 1. Steep Canyon Debris Slide', '🏞️ 2. Barrier Lake Impoundment', '💥 3. Progressive Overtopping Failure', '🌊 4. Gorge Wave Routing', '🌉 5. Frontier Road Crossing Impact', '🌊 6. Main Siang River Entry']
  },
  'kosi-2008': {
    id: 'kosi-2008',
    simId: 'KS-2008-08-18-001',
    name: 'KS-2008-08-18-001 — Kosi River Kushaha Embankment Breach (2008)',
    shortName: 'Kosi Kushaha Embankment Avulsion',
    corridor: 'Kushaha Breach → Supaul Mega-Avulsion',
    region: 'Sunsari (Nepal) & Supaul/Saharsa (Bihar)',
    type: 'Embankment Failure & Mega-Channel Avulsion',
    keyHubs: 'Kushaha, Birpur, Supaul District HQ',
    model: '2D Diffusive Wave',
    gridSize: '30.0 m',
    duration: '6.00 hrs',
    peakDischarge: 24500,
    startedTime: '01:30 PM, 18 Aug 2008',
    milestones: [
      { timeLabel: 'T+00:00', name: 'Afflux bund seepage & piping', fullTime: 'Time: 00:00:00 / 06:00:00', depth: 0.8, velocity: 0.6, area: 0.0, discharge: 4500, arrival: '0 min' },
      { timeLabel: 'T+00:30', name: 'Kushaha 1.7km breach initiation', fullTime: 'Time: 00:30:00 / 06:00:00', depth: 2.8, velocity: 2.4, area: 45.0, discharge: 12500, arrival: '10 min' },
      { timeLabel: 'T+01:00', name: '85% river flow avulsion', fullTime: 'Time: 01:00:00 / 06:00:00', depth: 4.5, velocity: 3.8, area: 120.0, discharge: 24500, arrival: '25 min' },
      { timeLabel: 'T+01:30', name: 'East-West Highway inundation', fullTime: 'Time: 01:30:00 / 06:00:00', depth: 5.2, velocity: 3.5, area: 280.0, discharge: 22000, arrival: '45 min' },
      { timeLabel: 'T+02:00', name: 'Birpur flood command impact', fullTime: 'Time: 02:00:00 / 06:00:00', depth: 4.8, velocity: 3.0, area: 480.0, discharge: 18500, arrival: '75 min' },
      { timeLabel: 'T+03:00', name: 'Supaul mega-flooding', fullTime: 'Time: 03:00:00 / 06:00:00', depth: 4.2, velocity: 2.6, area: 750.0, discharge: 15000, arrival: '120 min' },
      { timeLabel: 'T+04:00', name: 'Madhepura wide inundation', fullTime: 'Time: 04:00:00 / 06:00:00', depth: 3.6, velocity: 2.2, area: 1100.0, discharge: 12000, arrival: '180 min' },
      { timeLabel: 'T+05:00', name: 'Avulsion channel expansion', fullTime: 'Time: 05:00:00 / 06:00:00', depth: 3.0, velocity: 1.8, area: 1450.0, discharge: 9500, arrival: '240 min' },
      { timeLabel: 'T+06:00', name: 'Peak avulsion stabilization', fullTime: 'Time: 06:00:00 / 06:00:00', depth: 2.4, velocity: 1.4, area: 1680.0, discharge: 7200, arrival: '300 min' }
    ],
    eventSequence: ['🌊 1. Afflux Bund Seepage & Piping', '💥 2. Kushaha 1.7km Embankment Breach', '⚡ 3. 85% River Flow Avulsion Eastward', '🌊 4. Birpur & East-West Highway Inundation', '🏘️ 5. Supaul & Madhepura Mega-Flooding', '🌊 6. Avulsion Channel Stabilization']
  }
};

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

  const activeScenario = SCENARIO_MAP[selectedScenarioId] || SCENARIO_MAP['scen-nepal-glof'];
  const activeMilestones = activeScenario.milestones;
  const activeMilestone = activeMilestones[currentTsIndex] || activeMilestones[activeMilestones.length - 1];
  const formattedTime = activeMilestone.fullTime;
  const intel = analyzeScenarioIntelligence(result, impact, null, exposure);

  const handleScenarioChange = (scenId: string) => {
    setSelectedScenarioId(scenId);
    const cfg = SCENARIO_MAP[scenId] || SCENARIO_MAP['scen-nepal-glof'];
    setSelectedSimId(cfg.simId);
    setCurrentTsIndex(0);
    setIsPlaying(false);
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#BED3C6', color: '#081C15', width: '100%', overflowX: 'hidden' }}>

      {/* ==================================================
          MAIN CONTENT WORKSPACE (KPI Strip + 3-Column Grid + Timeline)
         ================================================== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', padding: '0.65rem 1rem 0' }}>

        {/* 5-Step Operational Workflow Sequence Bar */}
        <WorkflowSequenceBar currentStep={4} activeSimulationId={selectedSimId} />

        {/* TOP KPI CARDS STRIP (5 Mint & Emerald Cards) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '0.65rem' }}>

          {/* KPI 1: Max Water Depth */}
          <div className="cc-kpi-card" onClick={() => navigate(`/simulations/${selectedSimId}/map?var=depth`)} style={{ cursor: 'pointer' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#C7EADB', border: '1px solid #8EAE9D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#006E52' }}>
              💧
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#395E50', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Max Water Depth
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#081C15', lineHeight: 1.1 }}>
                {activeMilestone.depth.toFixed(1)} m
              </div>
            </div>
          </div>

          {/* KPI 2: Max Velocity */}
          <div className="cc-kpi-card" onClick={() => navigate(`/simulations/${selectedSimId}/map?var=velocity`)} style={{ cursor: 'pointer' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#C7EADB', border: '1px solid #8EAE9D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#006E52' }}>
              ⏱️
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#395E50', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Max Velocity
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#081C15', lineHeight: 1.1 }}>
                {activeMilestone.velocity.toFixed(1)} m/s
              </div>
            </div>
          </div>

          {/* KPI 3: Flooded Area */}
          <div className="cc-kpi-card" onClick={() => navigate(`/simulations/${selectedSimId}/results`)} style={{ cursor: 'pointer' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#C7EADB', border: '1px solid #8EAE9D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#006E52' }}>
              🗺️
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#395E50', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Flooded Area
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#081C15', lineHeight: 1.1 }}>
                {activeMilestone.area.toFixed(1)} km²
              </div>
            </div>
          </div>

          {/* KPI 4: Discharge (Peak) */}
          <div className="cc-kpi-card" onClick={() => navigate(`/simulations/${selectedSimId}/results`)} style={{ cursor: 'pointer' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#C7EADB', border: '1px solid #8EAE9D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#006E52' }}>
              ⚡
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#395E50', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Discharge (Peak)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#081C15', lineHeight: 1.1 }}>
                {activeMilestone.discharge.toLocaleString()} m³/s
              </div>
            </div>
          </div>

          {/* KPI 5: Arrival Time (Min) */}
          <div className="cc-kpi-card" onClick={() => navigate(`/simulations/${selectedSimId}/map?var=arrival`)} style={{ cursor: 'pointer' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: '#C7EADB', border: '1px solid #8EAE9D', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', color: '#006E52' }}>
              🕒
            </div>
            <div>
              <div style={{ fontSize: '0.64rem', fontWeight: 700, color: '#395E50', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Arrival Time (Min)
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#081C15', lineHeight: 1.1 }}>
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
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#395E50', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                Scenario
              </div>
              <select
                className="cc-select"
                value={selectedScenarioId}
                onChange={(e) => handleScenarioChange(e.target.value)}
                style={{ width: '100%', fontSize: '0.82rem', fontWeight: 700, color: '#081C15' }}
              >
                <option value="scen-nepal-glof">NP-2026-08-26-001 — Nepal GLOF (Lhende Khola → Bhote Koshi)</option>
                <option value="rishiganga-uttarakhand-2021">UK-2021-02-07-001 — Rishi Ganga Chamoli Flash Flood (Feb 2021)</option>
                <option value="phuktal-zanskar-2015">LD-2015-03-15-001 — Phuktal River Landslide Dam Lake (Mar 2015)</option>
                <option value="wapriyang-2021">WP-2021-11-12-001 — Wapriyang River Landslide Outburst (Nov 2021)</option>
                <option value="kosi-2008">KS-2008-08-18-001 — Kosi River Kushaha Embankment Breach (2008)</option>
              </select>

              <div style={{ marginTop: '0.6rem', background: '#E2ECE5', border: '1px solid #8EAE9D', borderRadius: '4px', padding: '0.5rem 0.65rem', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1E5C3A' }}></span>
                  <strong style={{ color: '#1E5C3A' }}>Active Operational Run</strong>
                </div>
                <div style={{ color: '#395E50', marginTop: '0.15rem' }}>
                  Started: <strong>{activeScenario.startedTime}</strong>
                </div>
              </div>

              {/* Event Hazard Sequence */}
              <div style={{ marginTop: '0.6rem', background: '#E2ECE5', border: '1px solid #8EAE9D', borderRadius: '4px', padding: '0.5rem 0.65rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#395E50', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Hazard Sequence
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.72rem' }}>
                  {activeScenario.eventSequence.map((step, idx) => (
                    <div key={idx} style={{ color: '#081C15', fontWeight: 600 }}>{step}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs: Layers / Legends */}
            <div style={{ borderTop: '1px solid #8EAE9D', paddingTop: '0.65rem' }}>
              <div style={{ display: 'flex', borderBottom: '1px solid #8EAE9D', marginBottom: '0.65rem' }}>
                <button
                  onClick={() => setLeftTab('layers')}
                  style={{
                    flex: 1,
                    padding: '0.35rem',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    color: leftTab === 'layers' ? '#006E52' : '#395E50',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: leftTab === 'layers' ? '2px solid #006E52' : 'none',
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
                    color: leftTab === 'legends' ? '#006E52' : '#395E50',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: leftTab === 'legends' ? '2px solid #006E52' : 'none',
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
                    { label: `${activeScenario.shortName} River Network`, checked: layerRiverNetwork, toggle: () => setLayerRiverNetwork(!layerRiverNetwork) },
                    { label: 'Roads & Evacuation Routes', checked: layerRoads, toggle: () => setLayerRoads(!layerRoads) },
                    { label: 'Bridges & Crossings', checked: layerBridges, toggle: () => setLayerBridges(!layerBridges) },
                    { label: 'Buildings / Logistics Hubs', checked: layerBuildings, toggle: () => setLayerBuildings(!layerBuildings) },
                    { label: 'Population / Settlements', checked: layerSettlements, toggle: () => setLayerSettlements(!layerSettlements) },
                    { label: 'Critical Infrastructure', checked: layerInfrastructure, toggle: () => setLayerInfrastructure(!layerInfrastructure) }
                  ].map((item, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: item.checked ? '#081C15' : '#395E50', fontWeight: item.checked ? 600 : 500, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <input type="checkbox" checked={item.checked} onChange={item.toggle} style={{ accentColor: '#006E52' }} />
                        <span>{item.label}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', opacity: 0.5, fontSize: '0.72rem' }}>
                        <span>ⓘ</span>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
                  {/* Water Depth Legend */}
                  <div>
                    <div style={{ fontWeight: 700, color: '#081C15', marginBottom: '0.35rem' }}>Water Depth (m)</div>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'linear-gradient(to right, #075985, #0ea5e9, #22d3ee, #fde047, #f97316, #dc2626)', marginBottom: '0.2rem' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#395E50', fontSize: '0.7rem' }}>
                      <span>0.0</span>
                      <span>2.5</span>
                      <span>5.0</span>
                      <span>7.5</span>
                      <span>10.0+</span>
                    </div>
                  </div>

                  {/* Flow Velocity Legend */}
                  <div style={{ borderTop: '1px solid #8EAE9D', paddingTop: '0.5rem' }}>
                    <div style={{ fontWeight: 700, color: '#081C15', marginBottom: '0.35rem' }}>Flow Velocity (m/s)</div>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'linear-gradient(to right, #1565C0, #00ACC1, #FBC02D, #FF9800, #D32F2F)', marginBottom: '0.2rem' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#395E50', fontSize: '0.7rem' }}>
                      <span>0.0</span>
                      <span>2.5</span>
                      <span>5.0</span>
                      <span>7.5</span>
                      <span>10.0+</span>
                    </div>
                  </div>

                  {/* Arrival Time Legend */}
                  <div style={{ borderTop: '1px solid #8EAE9D', paddingTop: '0.5rem' }}>
                    <div style={{ fontWeight: 700, color: '#081C15', marginBottom: '0.35rem' }}>Arrival Time (min)</div>
                    <div style={{ height: '8px', borderRadius: '4px', background: 'linear-gradient(to right, #D32F2F, #F57C00, #FBC02D, #00ACC1, #1565C0)', marginBottom: '0.2rem' }}></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#395E50', fontSize: '0.7rem' }}>
                      <span>5 min</span>
                      <span>30 min</span>
                      <span>60 min</span>
                      <span>120 min</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* GIS Tools Selector */}
            <div style={{ borderTop: '1px solid #8EAE9D', paddingTop: '0.65rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#395E50', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                Spatial Analysis Tools
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.35rem' }}>
                {['Select', 'Query', 'Draw', 'Measure', 'Clear'].map((tool) => (
                  <button
                    key={tool}
                    onClick={() => setActiveMapTool(tool)}
                    style={{
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      border: activeMapTool === tool ? '1px solid #006E52' : '1px solid #8EAE9D',
                      background: activeMapTool === tool ? '#006E52' : '#E2ECE5',
                      color: activeMapTool === tool ? '#FFFFFF' : '#081C15',
                      cursor: 'pointer'
                    }}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* --------------------------------------------------
              CENTER PANEL: INTERACTIVE 3D/2D MAP VIEWER
             -------------------------------------------------- */}
          <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid #8EAE9D' }}>
            <FloodMap
              simulationId={selectedSimId}
              basemap={basemap}
              activeVariable={activeMapVariable}
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
              onPlaybackSpeedChange={setPlaybackSpeed}
              formattedTime={formattedTime}
              onTimelineChange={(newIndex) => setCurrentTsIndex(newIndex)}
              onPlayPauseChange={(playing) => setIsPlaying(playing)}
              onReset={() => {
                setIsPlaying(false);
                setCurrentTsIndex(0);
              }}
              isFullscreen={isMapFullscreen}
              onToggleFullscreen={setIsMapFullscreen}
              activeMapTool={activeMapTool}
              onActiveMapToolChange={setActiveMapTool}
            />
          </div>

          {/* --------------------------------------------------
              RIGHT SIDEBAR PANEL: SIMULATION INFO & HYDROGRAPH
             -------------------------------------------------- */}
          <div className="cc-panel cc-scrollbar" style={{ padding: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.9rem', overflowY: 'auto' }}>

            {/* Simulation Info Table */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#395E50', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.04em' }}>
                Simulation Info
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.3rem 0.75rem', color: '#081C15', fontSize: '0.76rem' }}>
                <span style={{ color: '#395E50', fontWeight: 600 }}>ID:</span> <strong style={{ color: '#006E52' }}>{activeScenario.simId}</strong>
                <span style={{ color: '#395E50', fontWeight: 600 }}>Type:</span> <span>{activeScenario.type}</span>
                <span style={{ color: '#395E50', fontWeight: 600 }}>Corridor:</span> <span>{activeScenario.corridor}</span>
                <span style={{ color: '#395E50', fontWeight: 600 }}>Key Hubs:</span> <span>{activeScenario.keyHubs}</span>
                <span style={{ color: '#395E50', fontWeight: 600 }}>Model:</span> <span>{activeScenario.model}</span>
                <span style={{ color: '#395E50', fontWeight: 600 }}>Grid Size:</span> <span>{activeScenario.gridSize}</span>
                <span style={{ color: '#395E50', fontWeight: 600 }}>Duration:</span> <span>{activeScenario.duration}</span>
                <span style={{ color: '#395E50', fontWeight: 600 }}>Current Time:</span> <span style={{ color: '#006E52', fontWeight: 700 }}>{activeMilestone.timeLabel}</span>
                <span style={{ color: '#395E50', fontWeight: 600 }}>Peak Discharge:</span> <span style={{ color: '#DC2626', fontWeight: 700 }}>{activeScenario.peakDischarge.toLocaleString()} m³/s</span>
                <span style={{ color: '#395E50', fontWeight: 600 }}>Status:</span> <span style={{ color: '#006E52', fontWeight: 700 }}>Active Simulation</span>
              </div>
            </div>

            {/* Simulation Progress Stages */}
            <div style={{ borderTop: '1px solid #8EAE9D', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#395E50', textTransform: 'uppercase', marginBottom: '0.45rem', letterSpacing: '0.04em' }}>
                Progress
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem' }}>
                <div style={{ color: '#1E5C3A', fontWeight: 600 }}>✓ Preparing DEM & Catchment</div>
                <div style={{ color: '#1E5C3A', fontWeight: 600 }}>✓ Setting up Hydrodynamic Mesh</div>
                <div style={{ color: '#1E5C3A', fontWeight: 600 }}>✓ Processing Valley Topography</div>
                <div style={{ color: '#1E5C3A', fontWeight: 600 }}>✓ Initializing Rupture Inflow</div>
                <div style={{ color: '#006E52', fontWeight: 800 }}>● Running Wave Propagation ({((currentTsIndex + 1) / 9 * 100).toFixed(0)}%)</div>
                <div style={{ color: currentTsIndex >= 7 ? '#1E5C3A' : '#6B8E80', fontWeight: currentTsIndex >= 7 ? 600 : 400 }}>{currentTsIndex >= 7 ? '✓' : '○'} GIS Exposure & Inundation</div>
                <div style={{ color: currentTsIndex >= 8 ? '#1E5C3A' : '#6B8E80', fontWeight: currentTsIndex >= 8 ? 600 : 400 }}>{currentTsIndex >= 8 ? '✓' : '○'} Decision Support Cards</div>
              </div>
            </div>

            {/* Hydrograph (Outlet Discharge Curve) */}
            <div style={{ borderTop: '1px solid #8EAE9D', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#395E50', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                Hydrograph (Outlet Discharge)
              </div>
              <div style={{ background: '#E2ECE5', border: '1px solid #8EAE9D', borderRadius: '4px', padding: '0.6rem' }}>
                <div style={{ fontSize: '0.68rem', color: '#395E50', marginBottom: '0.25rem', fontWeight: 600 }}>Discharge (m³/s)</div>
                <svg width="100%" height="90" viewBox="0 0 170 90" style={{ overflow: 'visible' }}>
                  <line x1="25" y1="75" x2="160" y2="75" stroke="#8EAE9D" strokeWidth="1" />
                  <line x1="25" y1="10" x2="25" y2="75" stroke="#8EAE9D" strokeWidth="1" />

                  {/* Peak Discharge Curve */}
                  <path d="M 25 73 Q 55 70 80 20 T 115 50 T 160 70" fill="none" stroke="#006E52" strokeWidth="2.5" />

                  {/* Active time indicator dot on hydrograph */}
                  {(() => {
                    const cx = 25 + (currentTsIndex / 8) * 135;
                    const cy = 75 - Math.sin((currentTsIndex / 8) * Math.PI) * 55;
                    return <circle cx={cx} cy={cy} r="4" fill="#006E52" stroke="#FFFFFF" strokeWidth="1.5" />;
                  })()}

                  <text x="5" y="15" fill="#395E50" fontSize="7" fontWeight="600">{((activeScenario.peakDischarge) / 1000).toFixed(0)}k</text>
                  <text x="5" y="45" fill="#395E50" fontSize="7" fontWeight="600">{((activeScenario.peakDischarge) / 2000).toFixed(0)}k</text>
                  <text x="12" y="75" fill="#395E50" fontSize="7" fontWeight="600">0</text>

                  <text x="25" y="85" fill="#395E50" fontSize="7" fontWeight="600">0</text>
                  <text x="58" y="85" fill="#395E50" fontSize="7" fontWeight="600">0.5</text>
                  <text x="90" y="85" fill="#395E50" fontSize="7" fontWeight="600">1.0</text>
                  <text x="123" y="85" fill="#395E50" fontSize="7" fontWeight="600">1.5</text>
                  <text x="153" y="85" fill="#395E50" fontSize="7" fontWeight="600">2.0</text>
                </svg>
                <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#395E50', marginTop: '0.25rem', fontWeight: 600 }}>Time ({activeScenario.duration})</div>
              </div>
            </div>

          </div>

        </div>

        {/* ==================================================
            BOTTOM TIMELINE PLAYBACK BAR (Fully Interactive)
           ================================================== */}
        <div style={{ background: '#C7D9CE', border: '1px solid #8EAE9D', borderRadius: '6px', padding: '0.5rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.65rem', marginBottom: '0.65rem', boxShadow: '0 1px 4px rgba(8, 28, 21, 0.08)' }}>

          {/* Playback Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn btn-primary"
              style={{ padding: '0.35rem 0.65rem', fontWeight: 800, fontSize: '0.85rem', background: '#006E52', borderColor: '#006E52', width: '38px' }}
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
              <span style={{ fontSize: '0.74rem', color: '#081C15', fontWeight: 800 }}>
                📍 Timeline Event Stage: <span style={{ color: '#006E52' }}>{activeMilestone.timeLabel} — {activeMilestone.name}</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: '#395E50', fontWeight: 700 }}>
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
              style={{ width: '100%', cursor: 'pointer', accentColor: '#006E52' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#395E50', fontSize: '0.68rem', fontWeight: 700, padding: '0 2px' }}>
              {activeMilestones.map((m, idx) => (
                <span
                  key={idx}
                  onClick={() => { setIsPlaying(false); setCurrentTsIndex(idx); }}
                  style={{
                    color: currentTsIndex === idx ? '#006E52' : '#395E50',
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
            <button className="cc-btn" title="Expand Immersive Fullscreen 3D Simulation Map" onClick={() => setIsMapFullscreen(true)} style={{ background: '#006E52', color: '#FFF', fontWeight: 800, borderColor: '#006E52' }}>⤢ Fullscreen Map</button>
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
