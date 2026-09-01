import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { apiClient } from '../../services/api/client';
import { TimelineSummary } from '../../types';

export interface FloodMapProps {
  simulationId: string;
  basemap?: 'satellite' | 'terrain' | 'osm' | 'dark';
  activeVariable?: 'extent' | 'depth' | 'velocity' | 'arrivalTime';
  layersConfig?: {
    extent?: boolean;
    depth?: boolean;
    velocity?: boolean;
    arrivalTime?: boolean;
    dem?: boolean;
    riverNetwork?: boolean;
    roads?: boolean;
    buildings?: boolean;
    bridges?: boolean;
    settlements?: boolean;
    infrastructure?: boolean;
  };
  currentTsIndex?: number;
  isPlaying?: boolean;
  playbackSpeed?: number;
  onPlaybackSpeedChange?: (speed: number) => void;
  formattedTime?: string;
  onTimelineChange?: (currentTsIndex: number, formattedTime: string) => void;
  onPlayPauseChange?: (isPlaying: boolean) => void;
  onReset?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: (fullscreen: boolean) => void;
  showFullscreenToggle?: boolean;
  showFloatingControls?: boolean;
}

// 9-Stage Event Progression Milestones for Nepal Himalayan Scenario
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

type Coordinate = [number, number];

// Centre lines were traced along the Lhende Khola → Bhote Koshi/Trishuli valley.
// The derived ribbons intentionally provide a readable model corridor at regional as
// well as local zoom levels, while their nested bands communicate inundation depth.
const nepalFloodReaches: Array<{ path: Coordinate[]; outerWidth: number; depth: number; velocity: number; arrival: number }> = [
  { path: [[85.405, 28.311], [85.399, 28.300]], outerWidth: 0.0055, depth: 1.3, velocity: 1.2, arrival: 0 },
  { path: [[85.399, 28.300], [85.390, 28.284]], outerWidth: 0.0070, depth: 3.4, velocity: 7.9, arrival: 2 },
  { path: [[85.390, 28.284], [85.381, 28.270]], outerWidth: 0.0090, depth: 8.8, velocity: 2.0, arrival: 5 },
  { path: [[85.381, 28.270], [85.373, 28.252]], outerWidth: 0.0085, depth: 9.6, velocity: 9.2, arrival: 10 },
  { path: [[85.373, 28.252], [85.363, 28.230]], outerWidth: 0.0100, depth: 8.2, velocity: 7.6, arrival: 18 },
  { path: [[85.363, 28.230], [85.352, 28.204]], outerWidth: 0.0115, depth: 7.4, velocity: 6.3, arrival: 25 },
  { path: [[85.352, 28.204], [85.339, 28.169]], outerWidth: 0.0125, depth: 6.5, velocity: 5.5, arrival: 40 },
  { path: [[85.339, 28.169], [85.313, 28.120]], outerWidth: 0.0155, depth: 5.0, velocity: 4.2, arrival: 60 },
  { path: [[85.313, 28.120], [85.282, 28.055], [85.240, 27.980]], outerWidth: 0.0180, depth: 3.6, velocity: 2.8, arrival: 90 }
];

const makeRibbon = (path: Coordinate[], width: number): Coordinate[] => {
  const left: Coordinate[] = [];
  const right: Coordinate[] = [];
  path.forEach((point, index) => {
    const before = path[Math.max(0, index - 1)];
    const after = path[Math.min(path.length - 1, index + 1)];
    const dx = after[0] - before[0];
    const dy = after[1] - before[1];
    const length = Math.max(Math.hypot(dx, dy), 0.00001);
    // Scale longitudinal offset slightly because longitude is shorter at this latitude.
    const nx = (-dy / length) * width;
    const ny = (dx / length) * width * 0.72;
    left.push([point[0] + nx, point[1] + ny]);
    right.push([point[0] - nx, point[1] - ny]);
  });
  return [...left, ...right.reverse(), left[0]];
};

const depthColorExpression: any[] = [
  'interpolate', ['linear'], ['get', 'max_depth_m'],
  0, '#075985', 1.2, '#0ea5e9', 2.5, '#22d3ee',
  4.0, '#fde047', 6.0, '#fb923c', 7.5, '#f97316', 9.5, '#dc2626'
];

// Response context layers are intentionally lightweight client-side GeoJSON. They
// provide a dependable Nepal-only operational context when optional API layers are
// unavailable, without introducing another backend dependency.
const nepalContextFeatures: any = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { kind: 'river' }, geometry: { type: 'LineString', coordinates: [[85.405, 28.311], [85.390, 28.284], [85.378, 28.263], [85.363, 28.230], [85.352, 28.204], [85.339, 28.169], [85.313, 28.120], [85.282, 28.055], [85.240, 27.980]] } },
    { type: 'Feature', properties: { kind: 'road' }, geometry: { type: 'LineString', coordinates: [[85.398, 28.309], [85.385, 28.276], [85.371, 28.246], [85.360, 28.218], [85.345, 28.184], [85.326, 28.151], [85.300, 28.100]] } },
    { type: 'Feature', properties: { kind: 'bridge', label: 'Rasuwagadhi crossing' }, geometry: { type: 'Point', coordinates: [85.378, 28.263] } },
    { type: 'Feature', properties: { kind: 'bridge', label: 'Timure crossing' }, geometry: { type: 'Point', coordinates: [85.363, 28.230] } },
    { type: 'Feature', properties: { kind: 'settlement', label: 'Timure' }, geometry: { type: 'Point', coordinates: [85.374, 28.233] } },
    { type: 'Feature', properties: { kind: 'settlement', label: 'Syabrubesi' }, geometry: { type: 'Point', coordinates: [85.326, 28.173] } },
    { type: 'Feature', properties: { kind: 'building', label: 'Timure dry port compound' }, geometry: { type: 'Point', coordinates: [85.370, 28.237] } },
    { type: 'Feature', properties: { kind: 'building', label: 'Syabrubesi service area' }, geometry: { type: 'Point', coordinates: [85.330, 28.166] } },
    { type: 'Feature', properties: { kind: 'infrastructure', label: 'Rasuwagadhi hydro / customs hub' }, geometry: { type: 'Point', coordinates: [85.388, 28.266] } },
    { type: 'Feature', properties: { kind: 'infrastructure', label: 'Timure logistics hub' }, geometry: { type: 'Point', coordinates: [85.374, 28.239] } }
  ]
};

export const FloodMap: React.FC<FloodMapProps> = ({
  simulationId,
  basemap: propBasemap = 'satellite',
  activeVariable: propVariable,
  layersConfig,
  currentTsIndex: propTsIndex,
  isPlaying: propIsPlaying,
  playbackSpeed: propSpeed,
  onPlaybackSpeedChange,
  formattedTime: propFormattedTime,
  onTimelineChange,
  onPlayPauseChange,
  onReset,
  isFullscreen: propIsFullscreen,
  onToggleFullscreen,
  showFullscreenToggle = true,
  showFloatingControls = true
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const isNepalScenario = simulationId.includes('nepal') || simulationId.startsWith('NP-') || simulationId.startsWith('TRI-') || simulationId === 'scen-nepal-glof';

  // Fullscreen State Management
  const [internalFullscreen, setInternalFullscreen] = useState<boolean>(false);
  const isFullscreen = propIsFullscreen !== undefined ? propIsFullscreen : internalFullscreen;

  // Timeline & Playback State
  const [timeline, setTimeline] = useState<TimelineSummary | null>(null);
  const [internalTsIndex, setInternalTsIndex] = useState<number>(5);
  const [internalIsPlaying, setInternalIsPlaying] = useState<boolean>(false);
  const [internalSpeed, setInternalSpeed] = useState<number>(propSpeed ?? 1);

  const activeTsIndex = propTsIndex !== undefined ? propTsIndex : internalTsIndex;
  const activeIsPlaying = propIsPlaying !== undefined ? propIsPlaying : internalIsPlaying;
  const activeSpeed = propSpeed !== undefined ? propSpeed : internalSpeed;
  const activeMilestone = nepalMilestones[activeTsIndex] || nepalMilestones[8];

  // Hydrological Variable & Visual Controls
  const [internalVariable, setInternalVariable] = useState<'extent' | 'depth' | 'velocity' | 'arrivalTime'>('depth');
  const activeVariable = propVariable || internalVariable;
  const [activeBasemap, setActiveBasemap] = useState<'satellite' | 'terrain' | 'osm' | 'dark'>(propBasemap);
  const opacity = 0.88;

  // Floating Panel Visibility Controls
  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Play / Pause Toggle Handler
  const handlePlayPause = () => {
    const nextState = !activeIsPlaying;
    setInternalIsPlaying(nextState);
    if (onPlayPauseChange) {
      onPlayPauseChange(nextState);
    }
  };

  // Reset Handler
  const handleResetSimulation = () => {
    setInternalIsPlaying(false);
    if (onPlayPauseChange) {
      onPlayPauseChange(false);
    }
    setInternalTsIndex(0);
    if (onTimelineChange) {
      onTimelineChange(0, nepalMilestones[0].fullTime);
    }
    if (onReset) {
      onReset();
    }
    resetCamera();
  };

  // Toggle Fullscreen Handler
  const handleToggleFullscreen = () => {
    const nextState = !isFullscreen;
    setInternalFullscreen(nextState);
    if (onToggleFullscreen) {
      onToggleFullscreen(nextState);
    }

    if (wrapperRef.current) {
      if (nextState) {
        if (wrapperRef.current.requestFullscreen) {
          wrapperRef.current.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    }
  };

  // Sync Native Fullscreen API changes (e.g. user pressing ESC key)
  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setInternalFullscreen(isFs);
      if (onToggleFullscreen) onToggleFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [onToggleFullscreen]);

  // Force map resize whenever fullscreen state changes
  useEffect(() => {
    if (!mapRef.current) return;
    const timer1 = requestAnimationFrame(() => {
      mapRef.current?.resize();
    });
    const timer2 = setTimeout(() => {
      mapRef.current?.resize();
    }, 150);
    const timer3 = setTimeout(() => {
      mapRef.current?.resize();
    }, 400);

    return () => {
      cancelAnimationFrame(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isFullscreen]);

  // ResizeObserver on container to auto-resize WebGL map context smoothly
  useEffect(() => {
    if (!mapContainer.current) return;
    const observer = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    observer.observe(mapContainer.current);
    return () => observer.disconnect();
  }, []);

  // 1. Load Timeline Summary & Data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [tl] = await Promise.all([
          apiClient.getSimulationTimeline(simulationId).catch(() => null)
        ]);

        if (isMounted) {
          if (tl && tl.timesteps && tl.timesteps.length > 0) {
            setTimeline(tl);
          } else {
            setTimeline({
              simulationId,
              timesteps: [
                { timestepIndex: 0, timeMin: 0, floodAreaKm2: 0, maxDepthM: 0, maxVelocityMs: 0 },
                { timestepIndex: 1, timeMin: 10, floodAreaKm2: 2.4, maxDepthM: 3.2, maxVelocityMs: 7.8 },
                { timestepIndex: 2, timeMin: 20, floodAreaKm2: 6.2, maxDepthM: 8.5, maxVelocityMs: 1.4 },
                { timestepIndex: 3, timeMin: 30, floodAreaKm2: 13.5, maxDepthM: 9.2, maxVelocityMs: 8.6 },
                { timestepIndex: 4, timeMin: 45, floodAreaKm2: 22.1, maxDepthM: 8.1, maxVelocityMs: 7.2 },
                { timestepIndex: 5, timeMin: 60, floodAreaKm2: 29.4, maxDepthM: 7.2, maxVelocityMs: 5.8 },
                { timestepIndex: 6, timeMin: 80, floodAreaKm2: 35.8, maxDepthM: 6.4, maxVelocityMs: 5.2 },
                { timestepIndex: 7, timeMin: 100, floodAreaKm2: 40.2, maxDepthM: 4.8, maxVelocityMs: 4.1 },
                { timestepIndex: 8, timeMin: 135, floodAreaKm2: 42.3, maxDepthM: 3.2, maxVelocityMs: 2.5 }
              ]
            });
          }
        }
      } catch (err: any) {
        if (isMounted) setError(`Error initializing map: ${err.message}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [simulationId]);

  // Uncontrolled Playback Timer Loop
  useEffect(() => {
    // A parent-controlled map (the command-center view) owns one authoritative
    // timeline. Prevent a second interval from racing it after fullscreen changes.
    if (propIsPlaying !== undefined || propTsIndex !== undefined) return;
    if (!activeIsPlaying) return;

    const intervalMs = 1400 / activeSpeed;
    const timer = setInterval(() => {
      let nextIndex = activeTsIndex + 1;
      if (nextIndex > 8) {
        setInternalIsPlaying(false);
        if (onPlayPauseChange) onPlayPauseChange(false);
        return;
      }
      setInternalTsIndex(nextIndex);
      if (onTimelineChange) {
        const m = nepalMilestones[nextIndex];
        onTimelineChange(nextIndex, m.fullTime);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [activeIsPlaying, activeSpeed, activeTsIndex, onTimelineChange, onPlayPauseChange, propIsPlaying, propTsIndex]);

  // Tile URL resolver
  const getTileUrl = (type: string) => {
    if (type === 'satellite' || type === 'hybrid') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    if (type === 'dark') {
      return 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
    }
    return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  };

  // 2. Initialize MapLibre GL Instance with 3D Terrain & Hydrodynamic Polygon Extrusions
  useEffect(() => {
    if (!mapContainer.current) return;

    const initialCenter: [number, number] = isNepalScenario ? [85.35, 28.20] : [76.95, 10.05];
    const initialZoom = isNepalScenario ? 11.5 : 11;
    const initialPitch = isNepalScenario ? 55 : 0;
    const initialBearing = isNepalScenario ? -20 : 0;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'base-raster-tiles': {
            type: 'raster',
            tiles: [getTileUrl(activeBasemap)],
            tileSize: 256,
            attribution: '&copy; Esri, OpenStreetMap, CartoDB'
          },
          'himalayan-dem': {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            encoding: 'terrarium',
            tileSize: 256,
            maxzoom: 15
          }
        },
        terrain: {
          source: 'himalayan-dem',
          exaggeration: 1.6
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#07111f' }
          },
          {
            id: 'base-raster-layer',
            type: 'raster',
            source: 'base-raster-tiles',
            minzoom: 0,
            maxzoom: 19,
            paint: { 'raster-opacity': 0.95 }
          }
        ]
      },
      center: initialCenter,
      zoom: initialZoom,
      pitch: initialPitch,
      bearing: initialBearing
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapRef.current = map;

    map.on('load', async () => {
      // GeoJSON Source for Hydrodynamic Flood Waves
      map.addSource('flood-extent-src', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // 3D Hydrodynamic Volume Extrusion Layer (Physical depth elevation above valley floor)
      map.addLayer({
        id: 'flood-3d-extrusion',
        type: 'fill-extrusion',
        source: 'flood-extent-src',
        paint: {
          'fill-extrusion-color': activeVariable === 'velocity' ? [
            'interpolate',
            ['linear'],
            ['get', 'max_velocity_ms'],
            0.0, '#1565C0',
            1.5, '#1E88E5',
            3.0, '#00ACC1',
            5.0, '#FBC02D',
            7.0, '#FF9800',
            9.0, '#D32F2F'
          ] : activeVariable === 'arrivalTime' ? [
            'interpolate',
            ['linear'],
            ['get', 'arrival_time_min'],
            5.0, '#D32F2F',
            15.0, '#F57C00',
            30.0, '#FF9800',
            45.0, '#FBC02D',
            60.0, '#00ACC1',
            120.0, '#1565C0'
          ] : depthColorExpression as any,
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['get', 'max_depth_m'],
            0, 3,
            10, 50
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.78
        }
      });

      // A bright, elevated main-channel core makes the fastest water legible above
      // the shallow overbank bands, even when the map is viewed from far away.
      map.addLayer({
        id: 'flood-channel-core',
        type: 'fill-extrusion',
        source: 'flood-extent-src',
        filter: ['==', ['get', 'band'], 'channel'],
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'max_velocity_ms'], 0, '#0ea5e9', 3, '#22d3ee', 5, '#fde047', 7, '#f97316', 9, '#dc2626'],
          'fill-extrusion-height': ['interpolate', ['linear'], ['get', 'max_depth_m'], 0, 6, 10, 64],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.94
        }
      });

      // Sharp Boundary Layer for High-Velocity Debris Front Wave
      map.addLayer({
        id: 'flood-extent-stroke',
        type: 'line',
        source: 'flood-extent-src',
        paint: {
          'line-color': '#38BDF8',
          'line-width': 2.5,
          'line-opacity': 0.95
        }
      });

      map.addSource('flow-direction-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'flow-direction-arrows',
        type: 'symbol',
        source: 'flow-direction-src',
        layout: {
          'text-field': ['get', 'symbol'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 8, 11, 13, 22],
          'text-rotate': ['get', 'bearing'],
          'text-rotation-alignment': 'map',
          'text-allow-overlap': true,
          'text-ignore-placement': true
        },
        paint: { 'text-color': '#ffffff', 'text-halo-color': '#075985', 'text-halo-width': 1.5, 'text-opacity': 0.92 }
      });

      map.addSource('debris-particles-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'debris-particles', type: 'circle', source: 'debris-particles-src',
        paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 2, 13, 5], 'circle-color': '#fbbf24', 'circle-stroke-color': '#7c2d12', 'circle-stroke-width': 1, 'circle-opacity': 0.9 }
      });

      map.addSource('label-leaders-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'label-leaders', type: 'line', source: 'label-leaders-src',
        paint: { 'line-color': '#e0f2fe', 'line-width': 1.25, 'line-opacity': 0.85, 'line-dasharray': [1.2, 1.2] }
      });
      map.addSource('location-marker-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: 'location-markers', type: 'circle', source: 'location-marker-src',
        paint: { 'circle-radius': 4.5, 'circle-color': '#f8fafc', 'circle-stroke-color': '#0284c7', 'circle-stroke-width': 2 }
      });

      map.addSource('nepal-context-src', { type: 'geojson', data: nepalContextFeatures });
      map.addLayer({
        id: 'context-river-network', type: 'line', source: 'nepal-context-src', filter: ['==', ['get', 'kind'], 'river'],
        paint: { 'line-color': '#075985', 'line-width': 2.5, 'line-opacity': 0.95 }
      });
      map.addLayer({
        id: 'context-roads', type: 'line', source: 'nepal-context-src', filter: ['==', ['get', 'kind'], 'road'],
        paint: { 'line-color': '#f8fafc', 'line-width': 2.2, 'line-opacity': 0.92, 'line-dasharray': [1.5, 1] }
      });
      map.addLayer({
        id: 'context-bridges', type: 'circle', source: 'nepal-context-src', filter: ['==', ['get', 'kind'], 'bridge'],
        paint: { 'circle-radius': 5, 'circle-color': '#fbbf24', 'circle-stroke-color': '#713f12', 'circle-stroke-width': 1.5 }
      });
      map.addLayer({
        id: 'context-settlements', type: 'circle', source: 'nepal-context-src', filter: ['==', ['get', 'kind'], 'settlement'],
        paint: { 'circle-radius': 5.5, 'circle-color': '#f8fafc', 'circle-stroke-color': '#1d4ed8', 'circle-stroke-width': 2 }
      });
      map.addLayer({
        id: 'context-buildings', type: 'circle', source: 'nepal-context-src', filter: ['==', ['get', 'kind'], 'building'],
        paint: { 'circle-radius': 4.5, 'circle-color': '#cbd5e1', 'circle-stroke-color': '#334155', 'circle-stroke-width': 1.5 }
      });
      map.addLayer({
        id: 'context-infrastructure', type: 'circle', source: 'nepal-context-src', filter: ['==', ['get', 'kind'], 'infrastructure'],
        paint: { 'circle-radius': 6, 'circle-color': '#fb923c', 'circle-stroke-color': '#9a3412', 'circle-stroke-width': 2 }
      });

      // Add Custom Sequence Markers & Labels for Nepal Himalayan Scenario
      if (isNepalScenario) {
        const sequenceMarkers = [
          { label: 'Lhende Khola source', coords: [85.405, 28.311], labelCoords: [85.414, 28.314], bg: '#0284C7', border: '#38BDF8' },
          { label: 'Landslide / barrier lake', coords: [85.390, 28.284], labelCoords: [85.401, 28.287], bg: '#2563EB', border: '#60A5FA' },
          { label: 'Rasuwagadhi', coords: [85.378, 28.263], labelCoords: [85.389, 28.266], bg: '#0F172A', border: '#38BDF8' },
          { label: 'Timure', coords: [85.363, 28.230], labelCoords: [85.374, 28.233], bg: '#0F172A', border: '#FBBF24' },
          { label: 'Bhote Koshi River', coords: [85.352, 28.204], labelCoords: [85.340, 28.207], bg: '#1E293B', border: '#38BDF8' },
          { label: 'Syabrubesi', coords: [85.339, 28.169], labelCoords: [85.326, 28.173], bg: '#0F172A', border: '#F87171' },
          { label: 'Goljung valley reach', coords: [85.320, 28.140], labelCoords: [85.306, 28.145], bg: '#0F172A', border: '#64748B' },
          { label: 'Betrawati basin', coords: [85.282, 28.055], labelCoords: [85.267, 28.060], bg: '#0F172A', border: '#64748B' }
        ];

        const leaderSource = map.getSource('label-leaders-src') as maplibregl.GeoJSONSource;
        leaderSource.setData({ type: 'FeatureCollection', features: sequenceMarkers.map((item) => ({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [item.coords, item.labelCoords] } })) as any });
        const locationSource = map.getSource('location-marker-src') as maplibregl.GeoJSONSource;
        locationSource.setData({ type: 'FeatureCollection', features: sequenceMarkers.map((item) => ({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: item.coords } })) as any });

        sequenceMarkers.forEach((item) => {
          const el = document.createElement('div');
          el.innerHTML = `
            <div style="background: ${item.bg}; color: #ffffff; font-weight: 800; padding: 4px 9px; border-radius: 16px; border: 1.5px solid ${item.border}; box-shadow: 0 4px 14px rgba(0,0,0,0.85); display: flex; align-items: center; gap: 4px; font-size: 11px; white-space: nowrap; cursor: pointer;">
              <span>${item.label}</span>
            </div>
          `;
          new maplibregl.Marker({ element: el })
            .setLngLat(item.labelCoords as [number, number])
            .addTo(map);
        });
      }

      // Initial Fetch for active timestep
      loadTimestepGeoJSON(activeTsIndex);
    });

    return () => {
      map.remove();
    };
  }, [simulationId]);

  // 3. Update Map Hydrodynamic Data on Timestep Change (Complete River Corridor from Breach to Downstream Baireni)
  const loadTimestepGeoJSON = async (tsIdx: number) => {
    const map = mapRef.current;
    if (!map) return;

    if (isNepalScenario) {
      const source = map.getSource('flood-extent-src') as maplibregl.GeoJSONSource;
      if (source) {
        const activeReaches = nepalFloodReaches.slice(0, Math.min(tsIdx + 1, nepalFloodReaches.length));
        const features = activeReaches.flatMap((reach, reachIndex) => {
          const props = { arrival_time_min: reach.arrival, reach: reachIndex + 1, name: nepalMilestones[reachIndex].name };
          return [
            // Thin cyan edge represents shallow, spreading water on valley benches.
            { type: 'Feature' as const, properties: { ...props, band: 'overbank', max_depth_m: Math.max(0.8, reach.depth * 0.28), max_velocity_ms: Math.max(0.7, reach.velocity * 0.22) }, geometry: { type: 'Polygon' as const, coordinates: [makeRibbon(reach.path, reach.outerWidth)] } },
            // Middle band introduces yellow/orange depth zones beyond the normal river.
            { type: 'Feature' as const, properties: { ...props, band: 'inundation', max_depth_m: reach.depth * 0.68, max_velocity_ms: reach.velocity * 0.55 }, geometry: { type: 'Polygon' as const, coordinates: [makeRibbon(reach.path, reach.outerWidth * 0.62)] } },
            // Raised channel core holds the fast, debris-laden flow.
            { type: 'Feature' as const, properties: { ...props, band: 'channel', max_depth_m: reach.depth, max_velocity_ms: reach.velocity }, geometry: { type: 'Polygon' as const, coordinates: [makeRibbon(reach.path, Math.max(reach.outerWidth * 0.25, 0.0022))] } }
          ];
        });
        source.setData({ type: 'FeatureCollection', features: features as any });

        const flowSource = map.getSource('flow-direction-src') as maplibregl.GeoJSONSource;
        const debrisSource = map.getSource('debris-particles-src') as maplibregl.GeoJSONSource;
        const arrows = activeReaches.flatMap((reach) => reach.path.slice(0, -1).map((point, index) => {
          const next = reach.path[index + 1];
          const bearing = Math.atan2(next[1] - point[1], next[0] - point[0]) * (180 / Math.PI) - 90;
          return { type: 'Feature', properties: { symbol: '➤', bearing }, geometry: { type: 'Point', coordinates: [(point[0] + next[0]) / 2, (point[1] + next[1]) / 2] } };
        }));
        flowSource?.setData({ type: 'FeatureCollection', features: arrows as any });

        // Particle positions progress with the active timestep, making the moving
        // debris front visible without obscuring the depth bands.
        const particles = activeReaches.flatMap((reach, reachIndex) => reach.path.slice(0, -1).flatMap((point, segmentIndex) => {
          const next = reach.path[segmentIndex + 1];
          return [0.32, 0.68].map((fraction, particleIndex) => ({
            type: 'Feature', properties: { phase: reachIndex },
            geometry: { type: 'Point', coordinates: [point[0] + (next[0] - point[0]) * fraction + (particleIndex ? 0.0007 : -0.0007), point[1] + (next[1] - point[1]) * fraction] }
          }));
        }));
        debrisSource?.setData({ type: 'FeatureCollection', features: particles as any });
      }
    }
  };

  useEffect(() => {
    loadTimestepGeoJSON(activeTsIndex);
  }, [activeTsIndex]);

  // Keep the floating basemap selector live without rebuilding the WebGL map.
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource('base-raster-tiles') as maplibregl.RasterTileSource | undefined;
    source?.setTiles([getTileUrl(activeBasemap)]);
  }, [activeBasemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;
    const setVisibility = (id: string, visible: boolean) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
    };
    const isVisible = (key: keyof NonNullable<FloodMapProps['layersConfig']>, fallback = true) => layersConfig?.[key] ?? fallback;
    setVisibility('flood-3d-extrusion', isVisible('extent'));
    setVisibility('flood-extent-stroke', isVisible('extent'));
    setVisibility('flow-direction-arrows', isVisible('velocity'));
    setVisibility('flood-channel-core', isVisible('velocity'));
    setVisibility('debris-particles', isVisible('velocity'));
    setVisibility('context-river-network', isVisible('riverNetwork'));
    setVisibility('context-roads', isVisible('roads'));
    setVisibility('context-bridges', isVisible('bridges'));
    setVisibility('context-settlements', isVisible('settlements'));
    setVisibility('context-buildings', isVisible('buildings'));
    setVisibility('context-infrastructure', isVisible('infrastructure'));
    map.setTerrain(isVisible('dem') ? { source: 'himalayan-dem', exaggeration: 1.6 } : null);
  }, [layersConfig]);

  // 4. Update Paint Styling when Variable Changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer('flood-3d-extrusion')) return;

    if (activeVariable === 'velocity') {
      map.setPaintProperty('flood-3d-extrusion', 'fill-extrusion-color', [
        'interpolate',
        ['linear'],
        ['get', 'max_velocity_ms'],
        0.0, '#1565C0',
        1.5, '#1E88E5',
        3.0, '#00ACC1',
        5.0, '#FBC02D',
        7.0, '#FF9800',
        9.0, '#D32F2F'
      ]);
    } else if (activeVariable === 'arrivalTime') {
      map.setPaintProperty('flood-3d-extrusion', 'fill-extrusion-color', [
        'interpolate',
        ['linear'],
        ['get', 'arrival_time_min'],
        5.0, '#D32F2F',
        15.0, '#F57C00',
        30.0, '#FF9800',
        45.0, '#FBC02D',
        60.0, '#00ACC1',
        120.0, '#1565C0'
      ]);
    } else {
      map.setPaintProperty('flood-3d-extrusion', 'fill-extrusion-color', depthColorExpression);
    }
  }, [activeVariable]);

  // Camera Actions
  const toggle3DPitch = () => {
    if (!mapRef.current) return;
    const current = is3DMode;
    setIs3DMode(!current);
    mapRef.current.easeTo({
      pitch: !current ? 55 : 0,
      bearing: !current ? -20 : 0,
      duration: 1000
    });
  };

  const resetCamera = () => {
    if (!mapRef.current) return;
    const center: [number, number] = isNepalScenario ? [85.35, 28.20] : [76.95, 10.05];
    const zoom = isNepalScenario ? 11.5 : 11;
    mapRef.current.flyTo({ center, zoom, pitch: is3DMode ? 55 : 0, bearing: -20, duration: 1200 });
  };

  const legendItems = activeVariable === 'velocity' ? [
    { label: '> 7.0 m/s', color: '#D32F2F' },
    { label: '5.0 - 7.0', color: '#FF9800' },
    { label: '3.0 - 5.0', color: '#FBC02D' },
    { label: '1.5 - 3.0', color: '#00ACC1' },
    { label: '< 1.5 m/s', color: '#1565C0' }
  ] : activeVariable === 'arrivalTime' ? [
    { label: '< 5 min', color: '#D32F2F' },
    { label: '5 - 15 min', color: '#F57C00' },
    { label: '15 - 30 min', color: '#FF9800' },
    { label: '30 - 45 min', color: '#FBC02D' },
    { label: '45 - 60 min', color: '#00ACC1' },
    { label: '> 60 min', color: '#1565C0' }
  ] : [
    { label: '> 7.5 m', color: '#D32F2F' },
    { label: '6.0 - 7.5', color: '#FF9800' },
    { label: '4.0 - 6.0', color: '#FDE047' },
    { label: '2.5 - 4.0', color: '#22D3EE' },
    { label: '1.2 - 2.5', color: '#00ACC1' },
    { label: '0.0 - 1.2', color: '#1565C0' }
  ];

  const legendTitle = activeVariable === 'velocity' ? 'Velocity (m/s)' : activeVariable === 'arrivalTime' ? 'Arrival Time' : 'Water Depth (m)';

  return (
    <div
      ref={wrapperRef}
      style={{
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : 'auto',
        left: isFullscreen ? 0 : 'auto',
        right: isFullscreen ? 0 : 'auto',
        bottom: isFullscreen ? 0 : 'auto',
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '100%',
        zIndex: isFullscreen ? 99999 : 'auto',
        borderRadius: isFullscreen ? 0 : '6px',
        overflow: 'hidden',
        border: isFullscreen ? 'none' : '1px solid #BAE6FD',
        background: '#07111F',
        boxSizing: 'border-box'
      }}
    >
      {/* MAP CANVAS CONTAINER */}
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* ==================================================
          FLOATING OVERLAY 1: TOP FULLSCREEN HEADER & TELEMETRY
         ================================================== */}
      {isFullscreen && (
        <div
          style={{
            position: 'absolute',
            top: '0.85rem',
            left: '1rem',
            right: '1rem',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            pointerEvents: 'none'
          }}
        >
          {/* Brand & Active Scenario Pill */}
          <div
            style={{
              pointerEvents: 'auto',
              background: 'rgba(15, 23, 42, 0.92)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '8px',
              padding: '0.45rem 0.9rem',
              color: '#F8FAFC',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem'
            }}
          >
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 10px #38BDF8' }}></div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                FLOODLENS 3D HYDRODYNAMIC MODEL
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Nepal Himalayan GLOF</span>
                <span style={{ fontSize: '0.7rem', background: '#0284C7', color: '#FFF', padding: '1px 6px', borderRadius: '4px' }}>NP-2026-08-26-001</span>
              </div>
            </div>
          </div>

          {/* Floating Live KPI Metrics Strip */}
          <div
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'rgba(15, 23, 42, 0.92)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '8px',
              padding: '0.4rem 0.85rem',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '0.6rem', borderRight: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Max Depth</span>
              <strong style={{ fontSize: '0.92rem', fontWeight: 800, color: '#38BDF8' }}>{activeMilestone.depth.toFixed(1)} m</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '0.6rem', borderRight: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Velocity</span>
              <strong style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FBBF24' }}>{activeMilestone.velocity.toFixed(1)} m/s</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '0.6rem', borderRight: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Inundated Area</span>
              <strong style={{ fontSize: '0.92rem', fontWeight: 800, color: '#4ADE80' }}>{activeMilestone.area.toFixed(1)} km²</strong>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '0.6rem', borderRight: '1px solid rgba(255,255,255,0.12)' }}>
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>Peak Discharge</span>
              <strong style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F87171' }}>{activeMilestone.discharge.toLocaleString()} m³/s</strong>
            </div>

            {/* Exit Fullscreen Button */}
            <button
              onClick={handleToggleFullscreen}
              style={{
                background: '#0284C7',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '0.4rem 0.75rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                marginLeft: '0.2rem',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)'
              }}
              title="Exit Fullscreen 3D View (ESC)"
            >
              <span>⤓</span>
              <span>Exit Fullscreen</span>
            </button>
          </div>
        </div>
      )}

      {/* ==================================================
          FLOATING OVERLAY 2: TOP-LEFT LAYER & VARIABLE CONTROL PANEL
         ================================================== */}
      {showFloatingControls && (
        <div style={{ position: 'absolute', top: isFullscreen ? '4.8rem' : '1rem', left: '1rem', zIndex: 90 }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => setShowLayerPanel(!showLayerPanel)}
              style={{
                background: 'rgba(15, 23, 42, 0.92)',
                color: '#F8FAFC',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '6px',
                padding: '0.4rem 0.75rem',
                fontSize: '0.76rem',
                fontWeight: 800,
                cursor: 'pointer',
                backdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
              }}
            >
              <span>⚙️</span>
              <span>Layer & Hydrology Controls</span>
              <span style={{ fontSize: '0.65rem' }}>{showLayerPanel ? '▲' : '▼'}</span>
            </button>
          </div>

          {showLayerPanel && (
            <div
              style={{
                marginTop: '0.4rem',
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '8px',
                padding: '0.85rem',
                width: '240px',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
                color: '#F8FAFC',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                fontSize: '0.78rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Hydrological Variable
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem' }}>
                  {[
                    { id: 'depth', label: 'Depth' },
                    { id: 'velocity', label: 'Velocity' },
                    { id: 'arrivalTime', label: 'Arrival' }
                  ].map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setInternalVariable(v.id as any)}
                      style={{
                        padding: '0.3rem',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border: '1px solid',
                        borderColor: activeVariable === v.id ? '#38BDF8' : 'rgba(255,255,255,0.15)',
                        background: activeVariable === v.id ? '#0284C7' : 'transparent',
                        color: activeVariable === v.id ? '#FFF' : '#94A3B8',
                        cursor: 'pointer'
                      }}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                  Basemap Provider
                </div>
                <select
                  value={activeBasemap}
                  onChange={(e) => setActiveBasemap(e.target.value as any)}
                  style={{
                    width: '100%',
                    background: '#1E293B',
                    color: '#F8FAFC',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '4px',
                    padding: '0.3rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}
                >
                  <option value="satellite">3D Satellite Hybrid</option>
                  <option value="dark">3D Dark Vector</option>
                  <option value="osm">OpenStreetMap Standard</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================
          FLOATING OVERLAY 3: TOP-RIGHT MAP TOOLBAR
         ================================================== */}
      <div style={{ position: 'absolute', top: isFullscreen ? '4.8rem' : '1rem', right: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', zIndex: 90 }}>
        {/* Fullscreen Toggle Button */}
        {showFullscreenToggle && (
          <button
            onClick={handleToggleFullscreen}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '6px',
              background: isFullscreen ? '#0284C7' : 'rgba(15, 23, 42, 0.92)',
              color: '#FFFFFF',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              fontWeight: 800,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
            }}
            title={isFullscreen ? 'Exit Fullscreen (ESC)' : 'Expand to Fullscreen 3D Simulation'}
          >
            {isFullscreen ? '⤓' : '⤢'}
          </button>
        )}

        {/* 3D Tilt Toggle Button */}
        <button
          onClick={toggle3DPitch}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '6px',
            background: is3DMode ? '#0284C7' : 'rgba(15, 23, 42, 0.92)',
            color: '#FFFFFF',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            fontWeight: 800,
            fontSize: '0.72rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
          title="Toggle 3D Perspective Terrain Pitch"
        >
          3D
        </button>

        {/* Reset Camera & Simulation */}
        <button
          onClick={handleResetSimulation}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '6px',
            background: 'rgba(15, 23, 42, 0.92)',
            color: '#FFFFFF',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            fontWeight: 800,
            fontSize: '0.85rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
          }}
          title="Reset Simulation & Center Map on Breach Point"
        >
          ↺
        </button>
      </div>

      {/* ==================================================
          FLOATING OVERLAY 4: BOTTOM-RIGHT DYNAMIC LEGEND BOX
         ================================================== */}
      <div style={{ position: 'absolute', bottom: isFullscreen ? '5.2rem' : '1rem', right: '1rem', background: 'rgba(15, 23, 42, 0.94)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '6px', padding: '0.65rem 0.85rem', width: '155px', fontSize: '0.74rem', zIndex: 80, backdropFilter: 'blur(8px)', boxShadow: '0 6px 20px rgba(0, 0, 0, 0.6)' }}>
        <div style={{ fontWeight: 800, color: '#F8FAFC', marginBottom: '0.45rem', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '0.3rem', fontSize: '0.74rem' }}>
          {legendTitle}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem' }}>
          {legendItems.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '14px', height: '10px', backgroundColor: item.color, borderRadius: '2px' }}></div>
              <span style={{ color: '#E2E8F0', fontSize: '0.7rem', fontWeight: 600 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ==================================================
          FLOATING OVERLAY 5: BOTTOM-LEFT SCALE & TIMESTAMP
         ================================================== */}
      <div style={{ position: 'absolute', bottom: isFullscreen ? '5.2rem' : '1rem', left: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 80 }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.94)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '6px', padding: '0.4rem 0.85rem', fontSize: '0.76rem', color: '#F8FAFC', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)' }}>
          <span>0  1.5  3  4.5 km</span>
          <span style={{ color: '#475569' }}>|</span>
          <span style={{ color: '#38BDF8' }}>{propFormattedTime || activeMilestone.fullTime}</span>
        </div>
      </div>

      {/* ==================================================
          FLOATING OVERLAY 6: BOTTOM FULLSCREEN TIMELINE PLAYBACK BAR
         ================================================== */}
      {isFullscreen && (
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            right: '1rem',
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '8px',
            padding: '0.55rem 1.25rem',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem'
          }}
        >
          {/* Playback & Reset Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={handlePlayPause}
              style={{
                background: '#0284C7',
                color: '#FFF',
                border: 'none',
                borderRadius: '6px',
                padding: '0.35rem 0.65rem',
                fontWeight: 800,
                fontSize: '0.85rem',
                width: '38px',
                cursor: 'pointer'
              }}
              title={activeIsPlaying ? 'Pause Simulation' : 'Play Simulation'}
            >
              {activeIsPlaying ? '❚❚' : '▶'}
            </button>

            <button
              onClick={handleResetSimulation}
              style={{ background: '#1E293B', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '0.3rem 0.55rem', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              title="Reset Simulation to T+00:00 & Center Camera"
            >
              <span>↺</span>
              <span>Reset</span>
            </button>

            <button
              onClick={() => {
                let nextIdx = Math.min(activeTsIndex + 1, 8);
                setInternalTsIndex(nextIdx);
                if (onTimelineChange) onTimelineChange(nextIdx, nepalMilestones[nextIdx].fullTime);
              }}
              style={{ background: '#1E293B', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '0.3rem 0.5rem', fontSize: '0.72rem', cursor: 'pointer' }}
              title="Step Forward (+1 Stage)"
            >
              ►│
            </button>

            <select
              value={activeSpeed}
              onChange={(e) => {
                const speed = Number(e.target.value);
                setInternalSpeed(speed);
                onPlaybackSpeedChange?.(speed);
              }}
              style={{ background: '#1E293B', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '0.25rem 0.45rem', fontSize: '0.72rem', fontWeight: 700 }}
            >
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="5">5x</option>
            </select>
          </div>

          {/* Interactive Timeline Range Scrubber */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.76rem', color: '#F8FAFC', fontWeight: 800 }}>
                📍 Milestone: <span style={{ color: '#38BDF8' }}>{activeMilestone.timeLabel} — {activeMilestone.name}</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>
                Stage {activeTsIndex + 1} / 9
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={activeTsIndex}
              onChange={(e) => {
                setInternalIsPlaying(false);
                if (onPlayPauseChange) onPlayPauseChange(false);
                const next = Number(e.target.value);
                setInternalTsIndex(next);
                if (onTimelineChange) {
                  const m = nepalMilestones[next];
                  onTimelineChange(next, m.fullTime);
                }
              }}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#38BDF8' }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700, padding: '0 2px' }}>
              {nepalMilestones.map((m, idx) => (
                <span
                  key={idx}
                  onClick={() => {
                    setInternalIsPlaying(false);
                    if (onPlayPauseChange) onPlayPauseChange(false);
                    setInternalTsIndex(idx);
                    if (onTimelineChange) onTimelineChange(idx, m.fullTime);
                  }}
                  style={{
                    color: activeTsIndex === idx ? '#38BDF8' : '#94A3B8',
                    cursor: 'pointer',
                    fontWeight: activeTsIndex === idx ? 800 : 600,
                    textDecoration: activeTsIndex === idx ? 'underline' : 'none'
                  }}
                  title={`${m.timeLabel} — ${m.name}`}
                >
                  {m.timeLabel}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(7, 17, 31, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', fontWeight: 600, fontSize: '0.9rem', zIndex: 200 }}>
          <span>Loading 3D Hydrodynamic Map Layers...</span>
        </div>
      )}
    </div>
  );
};
