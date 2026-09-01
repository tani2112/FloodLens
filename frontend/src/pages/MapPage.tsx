import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SimulationNav } from '../components/simulations/SimulationNav';
import { FloodMap } from '../components/map/FloodMap';
import { WorkflowSequenceBar } from '../components/common/WorkflowSequenceBar';

interface ScenarioMilestone {
  timeLabel: string;
  name: string;
  fullTime: string;
  depth: number;
  velocity: number;
  area: number;
}

const SCENARIO_MILESTONES: Record<string, { incidentName: string; duration: string; milestones: ScenarioMilestone[] }> = {
  'UK-2021-02-07-001': {
    incidentName: 'Rishi Ganga & Chamoli Flash Flood (Feb 2021)',
    duration: '02:00 hr',
    milestones: [
      { timeLabel: '00:00', name: 'Ronti Peak Rock/Ice Avalanche Detachment', fullTime: 'Time: 00:00:00 / 02:00:00', depth: 0.0, velocity: 0.0, area: 0.0 },
      { timeLabel: '00:05', name: 'Rishi Ganga Gorge Debris Surge Inflow', fullTime: 'Time: 00:05:00 / 02:00:00', depth: 4.8, velocity: 16.5, area: 3.1 },
      { timeLabel: '00:12', name: 'Rishi Ganga Hydro Project Impact', fullTime: 'Time: 00:12:00 / 02:00:00', depth: 12.4, velocity: 21.0, area: 8.5 },
      { timeLabel: '00:20', name: 'Raini Village Bridge Demolition Wave', fullTime: 'Time: 00:20:00 / 02:00:00', depth: 16.2, velocity: 22.0, area: 15.2 },
      { timeLabel: '00:35', name: 'Tapovan Barrage & Tunnel Inundation', fullTime: 'Time: 00:35:00 / 02:00:00', depth: 14.5, velocity: 18.2, area: 22.8 },
      { timeLabel: '00:50', name: 'Dhauliganga-Alaknanda Confluence Surge', fullTime: 'Time: 00:50:00 / 02:00:00', depth: 11.2, velocity: 14.0, area: 29.5 },
      { timeLabel: '01:10', name: 'Joshimath Sub-Catchment Wave Routing', fullTime: 'Time: 01:10:00 / 02:00:00', depth: 8.4, velocity: 10.5, area: 34.2 },
      { timeLabel: '01:30', name: 'Pipalkoti Reservoir Backwater Surge', fullTime: 'Time: 01:30:00 / 02:00:00', depth: 6.2, velocity: 7.8, area: 37.0 },
      { timeLabel: '02:00', name: 'Alaknanda Valley Wave Attenuation', fullTime: 'Time: 02:00:00 / 02:00:00', depth: 4.5, velocity: 5.0, area: 38.5 }
    ]
  },
  'LD-2015-03-15-001': {
    incidentName: 'Phuktal River Landslide Dam Lake Outburst (Mar 2015)',
    duration: '03:00 hr',
    milestones: [
      { timeLabel: '00:00', name: 'Sumdo Landslide Dam Impoundment Overtopping', fullTime: 'Time: 00:00:00 / 03:00:00', depth: 0.0, velocity: 0.0, area: 0.0 },
      { timeLabel: '00:15', name: 'Lake Outflow Erosion & Pilot Channel Widening', fullTime: 'Time: 00:15:00 / 03:00:00', depth: 2.5, velocity: 5.5, area: 2.8 },
      { timeLabel: '00:30', name: 'Phuktal Gompa Gorge Wavefront Arrival', fullTime: 'Time: 00:30:00 / 03:00:00', depth: 6.8, velocity: 11.2, area: 7.4 },
      { timeLabel: '00:50', name: 'Purne Village & Tsarap Confluence Inundation', fullTime: 'Time: 00:50:00 / 03:00:00', depth: 8.5, velocity: 12.8, area: 14.6 },
      { timeLabel: '01:15', name: 'Anmu & Cha Suspension Bridges Destruction', fullTime: 'Time: 01:15:00 / 03:00:00', depth: 7.2, velocity: 10.4, area: 21.0 },
      { timeLabel: '01:45', name: 'Pipiting River Corridor Surge Propagation', fullTime: 'Time: 01:45:00 / 03:00:00', depth: 6.0, velocity: 8.5, area: 28.5 },
      { timeLabel: '02:10', name: 'Padum District Center Flash Flood Ingress', fullTime: 'Time: 02:10:00 / 03:00:00', depth: 5.2, velocity: 6.8, area: 33.8 },
      { timeLabel: '02:35', name: 'Zanskar River Mainstem Flood Merging', fullTime: 'Time: 02:35:00 / 03:00:00', depth: 4.1, velocity: 5.2, area: 36.5 },
      { timeLabel: '03:00', name: 'Terminal Zanskar Basin Flood Stabilization', fullTime: 'Time: 03:00:00 / 03:00:00', depth: 3.0, velocity: 3.8, area: 38.2 }
    ]
  },
  'WP-2021-11-12-001': {
    incidentName: 'Wapriyang Landslide Lake Outburst (Nov 2021)',
    duration: '02:30 hr',
    milestones: [
      { timeLabel: '00:00', name: 'Debris Avalanche Dam Overtopping Failure', fullTime: 'Time: 00:00:00 / 02:30:00', depth: 0.0, velocity: 0.0, area: 0.0 },
      { timeLabel: '00:10', name: 'Steep Gorge Supercritical Flow Initiation', fullTime: 'Time: 00:10:00 / 02:30:00', depth: 3.8, velocity: 8.2, area: 2.1 },
      { timeLabel: '00:25', name: 'Mid-Canyon Hydraulic Jump & Debris Loading', fullTime: 'Time: 00:25:00 / 02:30:00', depth: 7.6, velocity: 13.5, area: 6.8 },
      { timeLabel: '00:45', name: 'Wapriyang River Valley Inundation Peak', fullTime: 'Time: 00:45:00 / 02:30:00', depth: 10.4, velocity: 15.2, area: 13.5 },
      { timeLabel: '01:05', name: 'Siang Tributary Confluence Surge Ingress', fullTime: 'Time: 01:05:00 / 02:30:00', depth: 8.8, velocity: 11.0, area: 19.8 },
      { timeLabel: '01:30', name: 'Downstream Hamlet Evacuation Alert Zone', fullTime: 'Time: 01:30:00 / 02:30:00', depth: 6.5, velocity: 8.0, area: 25.2 },
      { timeLabel: '01:55', name: 'Siang Valley Flood Channel Widening', fullTime: 'Time: 01:55:00 / 02:30:00', depth: 5.0, velocity: 6.2, area: 29.6 },
      { timeLabel: '02:15', name: 'Pasighat Lower Reach Backwater Wave', fullTime: 'Time: 02:15:00 / 02:30:00', depth: 3.8, velocity: 4.5, area: 32.8 },
      { timeLabel: '02:30', name: 'Brahmaputra Flood Discharge Merging', fullTime: 'Time: 02:30:00 / 02:30:00', depth: 2.8, velocity: 3.2, area: 34.5 }
    ]
  },
  'KS-2008-08-18-001': {
    incidentName: 'Kosi Kushaha Embankment Breach & Mega-Avulsion (Aug 2008)',
    duration: '06:00 hr',
    milestones: [
      { timeLabel: '00:00', name: 'Kushaha Left Afflux Embankment Initial Breach', fullTime: 'Time: 00:00:00 / 06:00:00', depth: 0.0, velocity: 0.0, area: 0.0 },
      { timeLabel: '00:30', name: 'Breach Width Expands to 200m; 80% Flow Diverts', fullTime: 'Time: 00:30:00 / 06:00:00', depth: 3.2, velocity: 4.8, area: 45.0 },
      { timeLabel: '01:00', name: 'Avulsion Wave Cuts into Abandoned East Channels', fullTime: 'Time: 01:00:00 / 06:00:00', depth: 4.8, velocity: 5.8, area: 140.0 },
      { timeLabel: '01:45', name: 'Supaul District Highway & Rail Link Severance', fullTime: 'Time: 01:45:00 / 06:00:00', depth: 5.8, velocity: 5.5, area: 290.0 },
      { timeLabel: '02:30', name: 'Madhepura Rural Inundation & Village Cutoffs', fullTime: 'Time: 02:30:00 / 06:00:00', depth: 6.8, velocity: 5.0, area: 480.0 },
      { timeLabel: '03:30', name: 'Saharsa & Purnia Floodplain Wide Inundation', fullTime: 'Time: 03:30:00 / 06:00:00', depth: 5.5, velocity: 4.2, area: 680.0 },
      { timeLabel: '04:30', name: 'Kosi Mega-Avulsion Multi-District Flood Crest', fullTime: 'Time: 04:30:00 / 06:00:00', depth: 4.6, velocity: 3.5, area: 820.0 },
      { timeLabel: '05:15', name: 'Ganga Confluence Transboundary Inundation', fullTime: 'Time: 05:15:00 / 06:00:00', depth: 3.8, velocity: 2.8, area: 910.0 },
      { timeLabel: '06:00', name: 'Terminal Avulsion Inundation Footprint (~950 km²)', fullTime: 'Time: 06:00:00 / 06:00:00', depth: 3.2, velocity: 2.1, area: 950.0 }
    ]
  },
  'NP-2026-08-26-001': {
    incidentName: 'Lhende Khola & Bhote Koshi GLOF / Landslide Dam (Nepal 2026)',
    duration: '02:15 hr',
    milestones: [
      { timeLabel: '00:00', name: 'Avalanche & initial blockage', fullTime: 'Time: 00:00:00 / 02:15:00', depth: 0.0, velocity: 0.0, area: 0.0 },
      { timeLabel: '00:10', name: 'Breach formation & overtopping', fullTime: 'Time: 00:10:00 / 02:15:00', depth: 3.2, velocity: 7.8, area: 2.4 },
      { timeLabel: '00:18', name: 'Outburst surge begins', fullTime: 'Time: 00:18:00 / 02:15:00', depth: 8.5, velocity: 8.4, area: 6.2 },
      { timeLabel: '00:30', name: 'Peak discharge wavefront', fullTime: 'Time: 00:30:00 / 02:15:00', depth: 9.2, velocity: 8.6, area: 13.5 },
      { timeLabel: '00:45', name: 'Major flood/debris wave', fullTime: 'Time: 00:45:00 / 02:15:00', depth: 8.1, velocity: 7.2, area: 22.1 },
      { timeLabel: '01:00', name: 'Timure impact', fullTime: 'Time: 01:00:00 / 02:15:00', depth: 7.2, velocity: 5.8, area: 29.4 },
      { timeLabel: '01:20', name: 'Rasuwagadhi impact', fullTime: 'Time: 01:20:00 / 02:15:00', depth: 6.4, velocity: 5.2, area: 35.8 },
      { timeLabel: '01:40', name: 'Syabrubesi downstream impact', fullTime: 'Time: 01:40:00 / 02:15:00', depth: 4.8, velocity: 4.1, area: 40.2 },
      { timeLabel: '02:15', name: 'Maximum downstream extent', fullTime: 'Time: 02:15:00 / 02:15:00', depth: 3.2, velocity: 2.5, area: 42.3 }
    ]
  }
};

const resolveMilestones = (simId: string): { incidentName: string; duration: string; milestones: ScenarioMilestone[] } => {
  const s = (simId || '').toLowerCase();
  if (s.includes('rishi') || s.includes('uk-') || s.includes('chamoli') || s.includes('uttarakhand')) {
    return SCENARIO_MILESTONES['UK-2021-02-07-001'];
  }
  if (s.includes('phuktal') || s.includes('ld-') || s.includes('zanskar') || s.includes('ladakh')) {
    return SCENARIO_MILESTONES['LD-2015-03-15-001'];
  }
  if (s.includes('wapriyang') || s.includes('wp-') || s.includes('siang')) {
    return SCENARIO_MILESTONES['WP-2021-11-12-001'];
  }
  if (s.includes('kosi') || s.includes('ks-') || s.includes('bihar') || s.includes('kushaha')) {
    return SCENARIO_MILESTONES['KS-2008-08-18-001'];
  }
  return SCENARIO_MILESTONES['NP-2026-08-26-001'];
};

export const MapPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const simId = id || 'NP-2026-08-26-001';

  const [currentTsIndex, setCurrentTsIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isMapFullscreen, setIsMapFullscreen] = useState<boolean>(false);

  const scenarioInfo = resolveMilestones(simId);
  const activeMilestones = scenarioInfo.milestones;
  const activeMilestone = activeMilestones[currentTsIndex] || activeMilestones[0];
  const formattedTime = activeMilestone.fullTime;

  // Real-time playback animation ticker
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      const intervalMs = Math.max(250, 1600 / playbackSpeed);
      timer = setInterval(() => {
        setCurrentTsIndex((prev) => {
          if (prev >= 8) {
            setIsPlaying(false);
            return 8;
          }
          return prev + 1;
        });
      }, intervalMs);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, playbackSpeed]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* 5-Step Operational Workflow Sequence Header */}
      <WorkflowSequenceBar currentStep={4} activeSimulationId={simId} />

      {/* Page Title & Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Step 4: View Dynamic Inundation Map & Wavefront Timeline
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Catchment: <strong>{scenarioInfo.incidentName}</strong> | Simulation: <strong>{simId}</strong>
          </p>
        </div>
        <button
          onClick={() => navigate(`/simulations/${simId}/impact`)}
          className="btn btn-primary"
          style={{ padding: '0.55rem 1.1rem', fontWeight: 700 }}
        >
          Step 5: Analyze Impact & Evacuation →
        </button>
      </div>

      <SimulationNav simulationId={simId} />

      {/* 3D Map Container */}
      <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 310px)', minHeight: '520px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #8EAE9D', background: '#07111F' }}>
        <FloodMap
          simulationId={simId}
          currentTsIndex={currentTsIndex}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          onPlaybackSpeedChange={setPlaybackSpeed}
          formattedTime={formattedTime}
          onTimelineChange={(newIdx) => setCurrentTsIndex(newIdx)}
          onPlayPauseChange={(playing) => setIsPlaying(playing)}
          onReset={() => {
            setIsPlaying(false);
            setCurrentTsIndex(0);
          }}
          isFullscreen={isMapFullscreen}
          onToggleFullscreen={setIsMapFullscreen}
          showFullscreenToggle={true}
          showFloatingControls={true}
        />
      </div>

      {/* ==================================================
          BOTTOM TIMELINE PLAYBACK & SIMULATION CONTROL BAR
         ================================================== */}
      <div style={{ background: '#C7D9CE', border: '1px solid #8EAE9D', borderRadius: '6px', padding: '0.65rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 2px 8px rgba(8, 28, 21, 0.12)' }}>

        {/* Playback Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn btn-primary"
            style={{ padding: '0.45rem 0.85rem', fontWeight: 900, fontSize: '0.95rem', background: '#006E52', borderColor: '#006E52', color: '#FFF', width: '44px' }}
            title={isPlaying ? 'Pause Simulation' : 'Play 2D Wave Propagation Simulation'}
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
            title="Restart Simulation from Beginning"
          >
            ↺
          </button>

          <select
            className="cc-select"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', fontWeight: 800, background: '#E2ECE5', border: '1px solid #8EAE9D', borderRadius: '4px' }}
            title="Simulation Playback Speed"
          >
            <option value="1">1x Speed</option>
            <option value="2">2x Speed</option>
            <option value="5">5x Speed</option>
          </select>
        </div>

        {/* Interactive Timeline Range Scrubber */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: '#081C15', fontWeight: 800 }}>
              🌊 Wavefront Stage ({currentTsIndex + 1}/9): <span style={{ color: '#006E52' }}>{activeMilestone.timeLabel} — {activeMilestone.name}</span>
            </span>
            <span style={{ fontSize: '0.75rem', color: '#395E50', fontWeight: 700 }}>
              Max Depth: <strong style={{ color: '#006E52' }}>{activeMilestone.depth.toFixed(1)}m</strong> | Velocity: <strong style={{ color: '#006E52' }}>{activeMilestone.velocity.toFixed(1)}m/s</strong>
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

          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#395E50', fontSize: '0.7rem', fontWeight: 700, padding: '0 2px' }}>
            {activeMilestones.map((m, idx) => (
              <span
                key={idx}
                onClick={() => { setIsPlaying(false); setCurrentTsIndex(idx); }}
                style={{
                  color: currentTsIndex === idx ? '#006E52' : '#395E50',
                  cursor: 'pointer',
                  fontWeight: currentTsIndex === idx ? 900 : 600,
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
          <button className="cc-btn" title="Print Map View" onClick={() => window.print()}>🖨</button>
          <button className="cc-btn" title="Expand Fullscreen 3D Map" onClick={() => setIsMapFullscreen(true)} style={{ background: '#006E52', color: '#FFF', fontWeight: 800, borderColor: '#006E52' }}>
            ⤢ Fullscreen
          </button>
        </div>
      </div>
    </div>
  );
};
