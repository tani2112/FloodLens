import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { apiClient } from '../../services/api/client';
import { TimelineSummary } from '../../types';

export type BasemapType = 'satellite' | 'terrain' | 'osm' | 'dark' | 'light';

export interface FloodMapProps {
  simulationId: string;
  basemap?: BasemapType;
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
  initialViewMode?: '3d' | '2d';
  viewMode?: '3d' | '2d';
  onViewModeChange?: (mode: '3d' | '2d') => void;
  activeMapTool?: string;
  onActiveMapToolChange?: (tool: string) => void;
}

type Coordinate = [number, number];

interface Milestone {
  timeLabel: string;
  name: string;
  fullTime: string;
  depth: number;
  velocity: number;
  area: number;
  discharge: number;
  arrival: string;
}

interface IncidentReach {
  path: Coordinate[];
  outerWidth: number;
  depth: number;
  velocity: number;
  arrival: number;
}

interface IncidentData {
  id: string;
  incidentName: string;
  region: string;
  center: Coordinate;
  zoom: number;
  milestones: Milestone[];
  floodReaches: IncidentReach[];
  contextFeatures: any;
  satelliteBlueNetwork: any;
  satelliteRedRoutes: any;
  satelliteMagentaZones: any;
  satelliteBuildings: any;
  markers: Array<{ label: string; coords: Coordinate; labelCoords: Coordinate; bg: string; border: string }>;
}

// Haversine geodesic distance calculation
const calculateDistanceKm = (c1: Coordinate, c2: Coordinate): number => {
  const R = 6371;
  const dLat = ((c2[1] - c1[1]) * Math.PI) / 180;
  const dLon = ((c2[0] - c1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1[1] * Math.PI) / 180) * Math.cos((c2[1] * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Geodesic polygon area
const calculatePolygonAreaKm2 = (coords: Coordinate[]): number => {
  if (coords.length < 3) return 0;
  let area = 0;
  const R = 6371;
  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];
    const x1 = ((p1[0] * Math.PI) / 180) * Math.cos((p1[1] * Math.PI) / 180) * R;
    const y1 = ((p1[1] * Math.PI) / 180) * R;
    const x2 = ((p2[0] * Math.PI) / 180) * Math.cos((p2[1] * Math.PI) / 180) * R;
    const y2 = ((p2[1] * Math.PI) / 180) * R;
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area / 2);
};

// Circle helper for GeoJSON buffers
const createGeoJSONCircle = (center: Coordinate, radiusInMeters: number, points: number = 48): Coordinate[] => {
  const [lng, lat] = center;
  const coords: Coordinate[] = [];
  const km = radiusInMeters / 1000;
  const distanceX = km / (111.32 * Math.cos((lat * Math.PI) / 180));
  const distanceY = km / 110.574;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([lng + x, lat + y]);
  }
  coords.push(coords[0]);
  return coords;
};

// Dynamic Ribbon Polygons generator
const makeRibbon = (path: Coordinate[], width: number): Coordinate[] => {
  const left: Coordinate[] = [];
  const right: Coordinate[] = [];
  path.forEach((point, index) => {
    const before = path[Math.max(0, index - 1)];
    const after = path[Math.min(path.length - 1, index + 1)];
    const dx = after[0] - before[0];
    const dy = after[1] - before[1];
    const length = Math.max(Math.hypot(dx, dy), 0.00001);
    const nx = (-dy / length) * width;
    const ny = (dx / length) * width * 0.72;
    left.push([point[0] + nx, point[1] + ny]);
    right.push([point[0] - nx, point[1] - ny]);
  });
  return [...left, ...right.reverse(), left[0]];
};

// Color Expressions
const depthColorExpression: any[] = [
  'interpolate', ['linear'], ['get', 'max_depth_m'],
  0, '#075985', 1.2, '#0ea5e9', 2.5, '#22d3ee',
  4.0, '#fde047', 6.0, '#fb923c', 7.5, '#f97316', 9.5, '#dc2626'
];

const velocityColorExpression: any[] = [
  'interpolate', ['linear'], ['get', 'max_velocity_ms'],
  0.0, '#1565C0', 1.5, '#1E88E5', 3.0, '#00ACC1',
  5.0, '#FBC02D', 7.0, '#FF9800', 9.0, '#D32F2F'
];

const arrivalColorExpression: any[] = [
  'interpolate', ['linear'], ['get', 'arrival_time_min'],
  5.0, '#D32F2F', 15.0, '#F57C00', 30.0, '#FF9800',
  45.0, '#FBC02D', 60.0, '#00ACC1', 120.0, '#1565C0'
];

// =========================================================================
// 1. NEPAL HIMALAYAS — LHENDE KHOLA & BHOTE KOSHI / TRISHULI CATCHMENT (2026)
// =========================================================================
const nepalScenarioData: IncidentData = {
  id: 'nepal-lhende-bhotekoshi-aoi',
  incidentName: 'Lhende Khola – Bhote Koshi Himalayan GLOF & Landslide Dam (Nepal 2026)',
  region: 'Bagmati Province, Rasuwa District, Nepal',
  center: [85.35, 28.20],
  zoom: 11.5,
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
  floodReaches: [
    { path: [[85.405, 28.311], [85.399, 28.300]], outerWidth: 0.0055, depth: 1.3, velocity: 1.2, arrival: 0 },
    { path: [[85.399, 28.300], [85.390, 28.284]], outerWidth: 0.0070, depth: 3.4, velocity: 7.9, arrival: 2 },
    { path: [[85.390, 28.284], [85.381, 28.270]], outerWidth: 0.0090, depth: 8.8, velocity: 2.0, arrival: 5 },
    { path: [[85.381, 28.270], [85.373, 28.252]], outerWidth: 0.0085, depth: 9.6, velocity: 9.2, arrival: 10 },
    { path: [[85.373, 28.252], [85.363, 28.230]], outerWidth: 0.0100, depth: 8.2, velocity: 7.6, arrival: 18 },
    { path: [[85.363, 28.230], [85.352, 28.204]], outerWidth: 0.0115, depth: 7.4, velocity: 6.3, arrival: 25 },
    { path: [[85.352, 28.204], [85.339, 28.169]], outerWidth: 0.0125, depth: 6.5, velocity: 5.5, arrival: 40 },
    { path: [[85.339, 28.169], [85.313, 28.120]], outerWidth: 0.0155, depth: 5.0, velocity: 4.2, arrival: 60 },
    { path: [[85.313, 28.120], [85.282, 28.055], [85.240, 27.980]], outerWidth: 0.0180, depth: 3.6, velocity: 2.8, arrival: 90 }
  ],
  contextFeatures: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { kind: 'river', name: 'Bhote Koshi / Lhende Khola River' }, geometry: { type: 'LineString', coordinates: [[85.405, 28.311], [85.390, 28.284], [85.378, 28.263], [85.363, 28.230], [85.352, 28.204], [85.339, 28.169], [85.313, 28.120], [85.282, 28.055], [85.240, 27.980]] } },
      { type: 'Feature', properties: { kind: 'road', name: 'Pasang Lhamu Highway' }, geometry: { type: 'LineString', coordinates: [[85.398, 28.309], [85.385, 28.276], [85.371, 28.246], [85.360, 28.218], [85.345, 28.184], [85.326, 28.151], [85.300, 28.100]] } },
      { type: 'Feature', properties: { kind: 'bridge', label: 'Rasuwagadhi Bridge' }, geometry: { type: 'Point', coordinates: [85.378, 28.263] } },
      { type: 'Feature', properties: { kind: 'settlement', label: 'Timure Village', population: 1250 }, geometry: { type: 'Point', coordinates: [85.374, 28.233] } },
      { type: 'Feature', properties: { kind: 'settlement', label: 'Syabrubesi Township', population: 2800 }, geometry: { type: 'Point', coordinates: [85.326, 28.173] } },
      { type: 'Feature', properties: { kind: 'infrastructure', label: 'Rasuwagadhi Hydro & Port' }, geometry: { type: 'Point', coordinates: [85.388, 28.266] } }
    ]
  },
  satelliteBlueNetwork: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Pasang Lhamu Highway' }, geometry: { type: 'LineString', coordinates: [[85.405, 28.315], [85.398, 28.309], [85.385, 28.276], [85.378, 28.260], [85.371, 28.246], [85.360, 28.218], [85.345, 28.184], [85.326, 28.151], [85.300, 28.100]] } },
      { type: 'Feature', properties: { name: 'Timure Access Link' }, geometry: { type: 'LineString', coordinates: [[85.374, 28.233], [85.388, 28.242], [85.402, 28.250]] } }
    ]
  },
  satelliteRedRoutes: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'GLOF Surge Vector' }, geometry: { type: 'LineString', coordinates: [[85.405, 28.311], [85.390, 28.284], [85.378, 28.263], [85.363, 28.230], [85.339, 28.169], [85.282, 28.055]] } },
      { type: 'Feature', properties: { name: 'Timure Escape Route' }, geometry: { type: 'LineString', coordinates: [[85.363, 28.230], [85.370, 28.238], [85.378, 28.245]] } }
    ]
  },
  satelliteMagentaZones: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { type: 'core-zone' }, geometry: { type: 'Polygon', coordinates: [createGeoJSONCircle([85.390, 28.284], 650)] } },
      { type: 'Feature', properties: { type: 'core-zone' }, geometry: { type: 'Polygon', coordinates: [createGeoJSONCircle([85.378, 28.263], 800)] } },
      { type: 'Feature', properties: { type: 'core-zone' }, geometry: { type: 'Polygon', coordinates: [createGeoJSONCircle([85.363, 28.230], 950)] } },
      { type: 'Feature', properties: { type: 'core-zone' }, geometry: { type: 'Polygon', coordinates: [createGeoJSONCircle([85.339, 28.169], 1100)] } }
    ]
  },
  satelliteBuildings: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Timure Port Terminal' }, geometry: { type: 'Polygon', coordinates: [[[85.368, 28.239], [85.373, 28.239], [85.373, 28.236], [85.368, 28.236], [85.368, 28.239]]] } },
      { type: 'Feature', properties: { name: 'Rasuwagadhi Hydro' }, geometry: { type: 'Polygon', coordinates: [[[85.386, 28.267], [85.390, 28.267], [85.390, 28.264], [85.386, 28.264], [85.386, 28.267]]] } }
    ]
  },
  markers: [
    { label: 'Lhende Khola source', coords: [85.405, 28.311], labelCoords: [85.414, 28.314], bg: '#0284C7', border: '#38BDF8' },
    { label: 'Landslide / barrier lake', coords: [85.390, 28.284], labelCoords: [85.401, 28.287], bg: '#2563EB', border: '#60A5FA' },
    { label: 'Rasuwagadhi', coords: [85.378, 28.263], labelCoords: [85.389, 28.266], bg: '#0F172A', border: '#38BDF8' },
    { label: 'Timure Hub', coords: [85.363, 28.230], labelCoords: [85.374, 28.233], bg: '#0F172A', border: '#FBBF24' },
    { label: 'Syabrubesi', coords: [85.339, 28.169], labelCoords: [85.326, 28.173], bg: '#0F172A', border: '#F87171' }
  ]
};

// =========================================================================
// 2. RISHI GANGA RIVER, UTTARAKHAND (FEB 2021) — CHAMOLI DISASTER
// =========================================================================
const rishigangaScenarioData: IncidentData = {
  id: 'rishiganga-uttarakhand-2021',
  incidentName: 'Rishi Ganga River Natural Lake & Chamoli Flash Flood (Feb 2021)',
  region: 'Chamoli District, Uttarakhand, India',
  center: [79.68, 30.50],
  zoom: 11.5,
  milestones: [
    { timeLabel: 'T+00:00', name: 'Ronti Peak rock-ice mass detachment', fullTime: 'Time: 00:00:00 / 02:00:00', depth: 1.0, velocity: 2.0, area: 0.0, discharge: 80, arrival: '0 min' },
    { timeLabel: 'T+00:08', name: 'Rishiganga gorge impact & damming', fullTime: 'Time: 00:08:00 / 02:00:00', depth: 14.5, velocity: 22.0, area: 1.8, discharge: 8500, arrival: '2 min' },
    { timeLabel: 'T+00:15', name: 'Rishi Ganga Hydro Project impact', fullTime: 'Time: 00:15:00 / 02:00:00', depth: 16.2, velocity: 18.5, area: 4.2, discharge: 12400, arrival: '6 min' },
    { timeLabel: 'T+00:25', name: 'Raini village bridge destruction', fullTime: 'Time: 00:25:00 / 02:00:00', depth: 12.8, velocity: 14.2, area: 7.9, discharge: 10200, arrival: '12 min' },
    { timeLabel: 'T+00:40', name: 'Tapovan Vishnugad Hydro barrage breach', fullTime: 'Time: 00:40:00 / 02:00:00', depth: 10.4, velocity: 11.0, area: 14.5, discharge: 7800, arrival: '20 min' },
    { timeLabel: 'T+01:00', name: 'Dhauliganga - Alaknanda confluence', fullTime: 'Time: 01:00:00 / 02:00:00', depth: 7.8, velocity: 7.5, area: 22.0, discharge: 5400, arrival: '35 min' },
    { timeLabel: 'T+01:20', name: 'Joshimath downstream surge', fullTime: 'Time: 01:20:00 / 02:00:00', depth: 6.2, velocity: 5.8, area: 28.6, discharge: 3900, arrival: '50 min' },
    { timeLabel: 'T+01:40', name: 'Chamoli / Pipalkoti surge attenuation', fullTime: 'Time: 01:40:00 / 02:00:00', depth: 4.5, velocity: 4.2, area: 34.2, discharge: 2800, arrival: '75 min' },
    { timeLabel: 'T+02:00', name: 'Rudraprayag / Srinagar containment', fullTime: 'Time: 02:00:00 / 02:00:00', depth: 3.1, velocity: 2.8, area: 38.5, discharge: 1900, arrival: '110 min' }
  ],
  floodReaches: [
    { path: [[79.740, 30.380], [79.720, 30.430]], outerWidth: 0.0060, depth: 14.5, velocity: 22.0, arrival: 2 },
    { path: [[79.720, 30.430], [79.705, 30.470]], outerWidth: 0.0075, depth: 16.2, velocity: 18.5, arrival: 6 },
    { path: [[79.705, 30.470], [79.695, 30.490]], outerWidth: 0.0090, depth: 12.8, velocity: 14.2, arrival: 12 },
    { path: [[79.695, 30.490], [79.660, 30.505]], outerWidth: 0.0105, depth: 10.4, velocity: 11.0, arrival: 20 },
    { path: [[79.660, 30.505], [79.620, 30.520]], outerWidth: 0.0120, depth: 8.5, velocity: 8.8, arrival: 30 },
    { path: [[79.620, 30.520], [79.570, 30.550]], outerWidth: 0.0140, depth: 6.8, velocity: 6.5, arrival: 45 },
    { path: [[79.570, 30.550], [79.520, 30.560]], outerWidth: 0.0160, depth: 5.2, velocity: 4.8, arrival: 65 },
    { path: [[79.520, 30.560], [79.460, 30.540]], outerWidth: 0.0180, depth: 4.0, velocity: 3.5, arrival: 90 },
    { path: [[79.460, 30.540], [79.380, 30.480]], outerWidth: 0.0200, depth: 3.0, velocity: 2.5, arrival: 120 }
  ],
  contextFeatures: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { kind: 'river', name: 'Rishi Ganga & Dhauliganga River' }, geometry: { type: 'LineString', coordinates: [[79.740, 30.380], [79.705, 30.470], [79.660, 30.505], [79.570, 30.550], [79.460, 30.540], [79.380, 30.480]] } },
      { type: 'Feature', properties: { kind: 'road', name: 'Joshimath - Malari Border Road' }, geometry: { type: 'LineString', coordinates: [[79.560, 30.555], [79.620, 30.525], [79.690, 30.495], [79.730, 30.450]] } },
      { type: 'Feature', properties: { kind: 'bridge', label: 'Raini Strategic Border Bridge' }, geometry: { type: 'Point', coordinates: [79.695, 30.490] } },
      { type: 'Feature', properties: { kind: 'settlement', label: 'Raini Village', population: 450 }, geometry: { type: 'Point', coordinates: [79.698, 30.494] } },
      { type: 'Feature', properties: { kind: 'settlement', label: 'Tapovan Township', population: 1850 }, geometry: { type: 'Point', coordinates: [79.625, 30.525] } },
      { type: 'Feature', properties: { kind: 'infrastructure', label: 'Tapovan Vishnugad Barrage (520 MW)' }, geometry: { type: 'Point', coordinates: [79.630, 30.518] } },
      { type: 'Feature', properties: { kind: 'infrastructure', label: 'Rishiganga Power Plant (13.2 MW)' }, geometry: { type: 'Point', coordinates: [79.710, 30.465] } }
    ]
  },
  satelliteBlueNetwork: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Joshimath-Malari Strategic Highway' }, geometry: { type: 'LineString', coordinates: [[79.560, 30.555], [79.620, 30.525], [79.690, 30.495], [79.730, 30.450], [79.780, 30.410]] } }
    ]
  },
  satelliteRedRoutes: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Rishiganga Debris Surge Vector' }, geometry: { type: 'LineString', coordinates: [[79.740, 30.380], [79.705, 30.470], [79.695, 30.490], [79.620, 30.520], [79.570, 30.550]] } },
      { type: 'Feature', properties: { name: 'Raini High Ridge Evacuation Path' }, geometry: { type: 'LineString', coordinates: [[79.695, 30.490], [79.702, 30.505], [79.710, 30.520]] } }
    ]
  },
  satelliteMagentaZones: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { type: 'core-zone' }, geometry: { type: 'Polygon', coordinates: [createGeoJSONCircle([79.740, 30.380], 900)] } },
      { type: 'Feature', properties: { type: 'core-zone' }, geometry: { type: 'Polygon', coordinates: [createGeoJSONCircle([79.695, 30.490], 750)] } },
      { type: 'Feature', properties: { type: 'core-zone' }, geometry: { type: 'Polygon', coordinates: [createGeoJSONCircle([79.630, 30.518], 1100)] } }
    ]
  },
  satelliteBuildings: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Tapovan Powerhouse Complex' }, geometry: { type: 'Polygon', coordinates: [[[79.628, 30.520], [79.634, 30.520], [79.634, 30.516], [79.628, 30.516], [79.628, 30.520]]] } }
    ]
  },
  markers: [
    { label: 'Ronti Peak Avalanche Origin', coords: [79.740, 30.380], labelCoords: [79.752, 30.385], bg: '#DC2626', border: '#F87171' },
    { label: 'Rishiganga Dam Site', coords: [79.710, 30.465], labelCoords: [79.722, 30.470], bg: '#0284C7', border: '#38BDF8' },
    { label: 'Raini Village & Bridge', coords: [79.695, 30.490], labelCoords: [79.708, 30.495], bg: '#0F172A', border: '#FBBF24' },
    { label: 'Tapovan Barrage', coords: [79.630, 30.518], labelCoords: [79.642, 30.524], bg: '#0F172A', border: '#38BDF8' },
    { label: 'Joshimath / Alaknanda Confluence', coords: [79.560, 30.555], labelCoords: [79.545, 30.560], bg: '#1E293B', border: '#60A5FA' }
  ]
};

// =========================================================================
// 3. PHUKTAL RIVER NEAR SUMDO, ZANSKAR, J&K / LADAKH (MARCH 2015)
// =========================================================================
const phuktalScenarioData: IncidentData = {
  id: 'phuktal-zanskar-2015',
  incidentName: 'Phuktal River Landslide Dam Lake Outburst, Zanskar (Mar 2015)',
  region: 'Zanskar Sub-Division, Kargil / Ladakh (erstwhile J&K)',
  center: [77.18, 33.26],
  zoom: 11.5,
  milestones: [
    { timeLabel: 'T+00:00', name: 'Marshun landslide slope collapse', fullTime: 'Time: 00:00:00 / 03:00:00', depth: 0.5, velocity: 1.0, area: 0.0, discharge: 45, arrival: '0 min' },
    { timeLabel: 'T+00:20', name: '15M m³ barrier lake formation at Sumdo', fullTime: 'Time: 00:20:00 / 03:00:00', depth: 18.5, velocity: 1.2, area: 3.5, discharge: 15, arrival: '0 min' },
    { timeLabel: 'T+00:45', name: 'Overtopping breach initiation', fullTime: 'Time: 00:45:00 / 03:00:00', depth: 16.0, velocity: 12.4, area: 8.2, discharge: 6800, arrival: '5 min' },
    { timeLabel: 'T+01:10', name: 'Phuktal Monastery cliffside reach impact', fullTime: 'Time: 01:10:00 / 03:00:00', depth: 12.2, velocity: 9.8, area: 15.4, discharge: 5200, arrival: '22 min' },
    { timeLabel: 'T+01:40', name: 'Cha & Purne village bridge washouts', fullTime: 'Time: 01:40:00 / 03:00:00', depth: 9.5, velocity: 7.6, area: 24.1, discharge: 3800, arrival: '45 min' },
    { timeLabel: 'T+02:10', name: 'Padum valley entrance reach', fullTime: 'Time: 02:10:00 / 03:00:00', depth: 6.8, velocity: 5.4, area: 32.8, discharge: 2700, arrival: '75 min' },
    { timeLabel: 'T+02:40', name: 'Zanskar river wide floodplain inundation', fullTime: 'Time: 02:40:00 / 03:00:00', depth: 4.2, velocity: 3.8, area: 41.5, discharge: 1850, arrival: '110 min' },
    { timeLabel: 'T+03:00', name: 'Peak downstream extent reached', fullTime: 'Time: 03:00:00 / 03:00:00', depth: 2.8, velocity: 2.2, area: 46.2, discharge: 1100, arrival: '150 min' },
    { timeLabel: 'T+03:30', name: 'Recession phase', fullTime: 'Time: 03:30:00 / 03:00:00', depth: 1.6, velocity: 1.5, area: 38.0, discharge: 550, arrival: '180 min' }
  ],
  floodReaches: [
    { path: [[77.280, 33.150], [77.240, 33.190]], outerWidth: 0.0065, depth: 18.5, velocity: 12.4, arrival: 5 },
    { path: [[77.240, 33.190], [77.200, 33.240]], outerWidth: 0.0080, depth: 14.2, velocity: 10.5, arrival: 15 },
    { path: [[77.200, 33.240], [77.170, 33.270]], outerWidth: 0.0095, depth: 12.2, velocity: 9.8, arrival: 25 },
    { path: [[77.170, 33.270], [77.120, 33.310]], outerWidth: 0.0110, depth: 10.0, velocity: 8.2, arrival: 40 },
    { path: [[77.120, 33.310], [77.060, 33.360]], outerWidth: 0.0130, depth: 8.0, velocity: 6.8, arrival: 60 },
    { path: [[77.060, 33.360], [76.980, 33.410]], outerWidth: 0.0150, depth: 6.2, velocity: 5.2, arrival: 85 },
    { path: [[76.980, 33.410], [76.880, 33.460]], outerWidth: 0.0180, depth: 4.5, velocity: 3.8, arrival: 115 },
    { path: [[76.880, 33.460], [76.780, 33.520]], outerWidth: 0.0210, depth: 3.2, velocity: 2.8, arrival: 150 },
    { path: [[76.780, 33.520], [76.680, 33.580]], outerWidth: 0.0240, depth: 2.2, velocity: 1.8, arrival: 190 }
  ],
  contextFeatures: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { kind: 'river', name: 'Tsarap Chu & Phuktal River' }, geometry: { type: 'LineString', coordinates: [[77.280, 33.150], [77.200, 33.240], [77.120, 33.310], [76.980, 33.410], [76.880, 33.460]] } },
      { type: 'Feature', properties: { kind: 'road', name: 'Padum - Darcha Winter Trek & Road' }, geometry: { type: 'LineString', coordinates: [[76.880, 33.460], [77.020, 33.380], [77.160, 33.280], [77.260, 33.170]] } },
      { type: 'Feature', properties: { kind: 'bridge', label: 'Sumdo Suspension Bridge' }, geometry: { type: 'Point', coordinates: [77.260, 33.170] } },
      { type: 'Feature', properties: { kind: 'settlement', label: 'Purne Village', population: 120 }, geometry: { type: 'Point', coordinates: [77.150, 33.280] } },
      { type: 'Feature', properties: { kind: 'settlement', label: 'Padum Main Town', population: 3100 }, geometry: { type: 'Point', coordinates: [76.880, 33.460] } },
      { type: 'Feature', properties: { kind: 'infrastructure', label: 'Phuktal Cliffside Monastery' }, geometry: { type: 'Point', coordinates: [77.180, 33.260] } }
    ]
  },
  satelliteBlueNetwork: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Zanskar Valley Highway Link' }, geometry: { type: 'LineString', coordinates: [[76.880, 33.460], [77.020, 33.380], [77.160, 33.280], [77.260, 33.170]] } }
    ]
  },
  satelliteRedRoutes: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Tsarap Chu Outburst Vector' }, geometry: { type: 'LineString', coordinates: [[77.280, 33.150], [77.200, 33.240], [77.120, 33.310], [76.980, 33.410], [76.880, 33.460]] } }
    ]
  },
  satelliteMagentaZones: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { type: 'core-zone' }, geometry: { type: 'Polygon', coordinates: [createGeoJSONCircle([77.280, 33.150], 900)] } },
      { type: 'Feature', properties: { type: 'core-zone' }, geometry: { type: 'Polygon', coordinates: [createGeoJSONCircle([77.180, 33.260], 650)] } },
      { type: 'Feature', properties: { type: 'core-zone' }, geometry: { type: 'Polygon', coordinates: [createGeoJSONCircle([76.880, 33.460], 1200)] } }
    ]
  },
  satelliteBuildings: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Phuktal Monastery Sanctuary' }, geometry: { type: 'Polygon', coordinates: [[[77.178, 33.262], [77.183, 33.262], [77.183, 33.258], [77.178, 33.258], [77.178, 33.262]]] } }
    ]
  },
  markers: [
    { label: 'Sumdo Landslide Dam Lake (15M m³)', coords: [77.280, 33.150], labelCoords: [77.295, 33.155], bg: '#DC2626', border: '#F87171' },
    { label: 'Phuktal Gompa', coords: [77.180, 33.260], labelCoords: [77.195, 33.265], bg: '#0284C7', border: '#38BDF8' },
    { label: 'Purne Village & Confluence', coords: [77.150, 33.280], labelCoords: [77.135, 33.285], bg: '#0F172A', border: '#FBBF24' },
    { label: 'Padum District Center', coords: [76.880, 33.460], labelCoords: [76.865, 33.465], bg: '#0F172A', border: '#38BDF8' }
  ]
};

// =========================================================================
// 4. WAPRIYANG RIVER (NOV 2021) — NATURAL LAKE OUTBURST
// =========================================================================
const wapriyangScenarioData: IncidentData = {
  id: 'wapriyang-2021',
  incidentName: 'Wapriyang River Natural Landslide Barrier Outburst (Nov 2021)',
  region: 'Eastern Himalayas / Siang Catchment',
  center: [94.20, 28.62],
  zoom: 11.5,
  milestones: [
    { timeLabel: 'T+00:00', name: 'Steep canyon debris slide', fullTime: 'Time: 00:00:00 / 02:00:00', depth: 0.5, velocity: 1.0, area: 0.0, discharge: 30, arrival: '0 min' },
    { timeLabel: 'T+00:15', name: 'Barrier lake impoundment', fullTime: 'Time: 00:15:00 / 02:00:00', depth: 11.2, velocity: 1.1, area: 2.1, discharge: 10, arrival: '0 min' },
    { timeLabel: 'T+00:35', name: 'Progressive overtopping failure', fullTime: 'Time: 00:35:00 / 02:00:00', depth: 10.5, velocity: 13.8, area: 5.4, discharge: 5600, arrival: '4 min' },
    { timeLabel: 'T+00:55', name: 'Gorge wave routing', fullTime: 'Time: 00:55:00 / 02:00:00', depth: 8.8, velocity: 10.2, area: 11.2, discharge: 4200, arrival: '15 min' },
    { timeLabel: 'T+01:15', name: 'Downstream river crossing impact', fullTime: 'Time: 01:15:00 / 02:00:00', depth: 7.1, velocity: 7.8, area: 18.6, discharge: 3100, arrival: '30 min' },
    { timeLabel: 'T+01:35', name: 'Valley confluence expansion', fullTime: 'Time: 01:35:00 / 02:00:00', depth: 5.4, velocity: 5.6, area: 25.4, discharge: 2200, arrival: '50 min' },
    { timeLabel: 'T+02:00', name: 'Maximum inundation extent', fullTime: 'Time: 02:00:00 / 02:00:00', depth: 3.8, velocity: 3.9, area: 31.8, discharge: 1500, arrival: '75 min' },
    { timeLabel: 'T+02:30', name: 'Main Siang river discharge entry', fullTime: 'Time: 02:30:00 / 02:00:00', depth: 2.5, velocity: 2.6, area: 36.2, discharge: 950, arrival: '110 min' },
    { timeLabel: 'T+03:00', name: 'Hydraulic stabilization', fullTime: 'Time: 03:00:00 / 02:00:00', depth: 1.4, velocity: 1.6, area: 33.0, discharge: 420, arrival: '140 min' }
  ],
  floodReaches: [
    { path: [[94.280, 28.720], [94.240, 28.680]], outerWidth: 0.0060, depth: 11.2, velocity: 13.8, arrival: 4 },
    { path: [[94.240, 28.680], [94.210, 28.640]], outerWidth: 0.0075, depth: 9.8, velocity: 11.5, arrival: 12 },
    { path: [[94.210, 28.640], [94.180, 28.600]], outerWidth: 0.0090, depth: 8.2, velocity: 9.2, arrival: 22 },
    { path: [[94.180, 28.600], [94.140, 28.560]], outerWidth: 0.0110, depth: 6.8, velocity: 7.4, arrival: 35 },
    { path: [[94.140, 28.560], [94.090, 28.510]], outerWidth: 0.0135, depth: 5.2, velocity: 5.6, arrival: 55 },
    { path: [[94.090, 28.510], [94.030, 28.460]], outerWidth: 0.0160, depth: 4.0, velocity: 4.2, arrival: 80 },
    { path: [[94.030, 28.460], [93.960, 28.400]], outerWidth: 0.0190, depth: 3.0, velocity: 3.0, arrival: 110 }
  ],
  contextFeatures: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { kind: 'river', name: 'Wapriyang River System' }, geometry: { type: 'LineString', coordinates: [[94.280, 28.720], [94.210, 28.640], [94.140, 28.560], [94.030, 28.460]] } },
      { type: 'Feature', properties: { kind: 'road', name: 'Trans-Arunachal Frontier Road' }, geometry: { type: 'LineString', coordinates: [[94.040, 28.470], [94.130, 28.550], [94.200, 28.630]] } },
      { type: 'Feature', properties: { kind: 'settlement', label: 'Wapriyang Tribal Settlement', population: 380 }, geometry: { type: 'Point', coordinates: [94.180, 28.600] } }
    ]
  },
  satelliteBlueNetwork: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Valley Access Track' }, geometry: { type: 'LineString', coordinates: [[94.040, 28.470], [94.130, 28.550], [94.200, 28.630]] } }
    ]
  },
  satelliteRedRoutes: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Wapriyang Flood Surge Corridor' }, geometry: { type: 'LineString', coordinates: [[94.280, 28.720], [94.210, 28.640], [94.140, 28.560], [94.030, 28.460]] } }
    ]
  },
  satelliteMagentaZones: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { type: 'core-zone' }, geometry: { type: 'Polygon', coordinates: [createGeoJSONCircle([94.280, 28.720], 800)] } },
      { type: 'Feature', properties: { type: 'core-zone' }, geometry: { type: 'Polygon', coordinates: [createGeoJSONCircle([94.180, 28.600], 700)] } }
    ]
  },
  satelliteBuildings: {
    type: 'FeatureCollection',
    features: []
  },
  markers: [
    { label: 'Wapriyang Landslide Barrier', coords: [94.280, 28.720], labelCoords: [94.295, 28.725], bg: '#DC2626', border: '#F87171' },
    { label: 'Wapriyang Valley Hamlet', coords: [94.180, 28.600], labelCoords: [94.195, 28.605], bg: '#0284C7', border: '#38BDF8' }
  ]
};

// =========================================================================
// 5. KOSI RIVER (AUG 2008) — KUSHAHA EMBANKMENT BREACH & MEGA-AVULSION
// =========================================================================
const kosiScenarioData: IncidentData = {
  id: 'kosi-2008',
  incidentName: 'Kosi River Kushaha Embankment Breach & Mega-Avulsion (2008)',
  region: 'Sunsari District (Nepal) & Bihar Plains (India)',
  center: [86.95, 26.35],
  zoom: 10.5,
  milestones: [
    { timeLabel: 'T+00:00', name: 'Kushaha upstream embankment spur failure', fullTime: 'Time: 00:00:00 / 04:00:00', depth: 1.5, velocity: 2.2, area: 0.0, discharge: 3800, arrival: '0 min' },
    { timeLabel: 'T+00:30', name: 'Left afflux 1.7 km breach expansion', fullTime: 'Time: 00:30:00 / 04:00:00', depth: 6.8, velocity: 5.8, area: 45.0, discharge: 8200, arrival: '5 min' },
    { timeLabel: 'T+01:00', name: 'Avulsion into abandoned eastern paleochannels', fullTime: 'Time: 01:00:00 / 04:00:00', depth: 5.5, velocity: 4.6, area: 120.0, discharge: 7500, arrival: '25 min' },
    { timeLabel: 'T+01:45', name: 'Birpur & Bhimnagar inundation', fullTime: 'Time: 01:45:00 / 04:00:00', depth: 4.8, velocity: 3.8, area: 280.0, discharge: 6800, arrival: '50 min' },
    { timeLabel: 'T+02:30', name: 'Supaul & Madhepura transboundary surge', fullTime: 'Time: 02:30:00 / 04:00:00', depth: 3.9, velocity: 3.1, area: 480.0, discharge: 5900, arrival: '90 min' },
    { timeLabel: 'T+03:15', name: 'Saharsa & Purnia district delta inundation', fullTime: 'Time: 03:15:00 / 04:00:00', depth: 3.2, velocity: 2.4, area: 720.0, discharge: 4900, arrival: '140 min' },
    { timeLabel: 'T+04:00', name: 'Maximum transboundary avulsion footprint', fullTime: 'Time: 04:00:00 / 04:00:00', depth: 2.6, velocity: 1.8, area: 950.0, discharge: 4100, arrival: '200 min' },
    { timeLabel: 'T+04:45', name: 'Eastward channel stabilisation', fullTime: 'Time: 04:45:00 / 04:00:00', depth: 2.0, velocity: 1.4, area: 920.0, discharge: 3200, arrival: '260 min' },
    { timeLabel: 'T+05:30', name: 'Post-avulsion drainage routing', fullTime: 'Time: 05:30:00 / 04:00:00', depth: 1.5, velocity: 1.0, area: 880.0, discharge: 2400, arrival: '320 min' }
  ],
  floodReaches: [
    { path: [[87.030, 26.580], [86.990, 26.520]], outerWidth: 0.0150, depth: 6.8, velocity: 5.8, arrival: 5 },
    { path: [[86.990, 26.520], [86.960, 26.440]], outerWidth: 0.0220, depth: 5.8, velocity: 4.8, arrival: 20 },
    { path: [[86.960, 26.440], [86.920, 26.340]], outerWidth: 0.0300, depth: 4.8, velocity: 3.8, arrival: 45 },
    { path: [[86.920, 26.340], [86.870, 26.220]], outerWidth: 0.0380, depth: 4.0, velocity: 3.2, arrival: 75 },
    { path: [[86.870, 26.220], [86.820, 26.080]], outerWidth: 0.0460, depth: 3.4, velocity: 2.6, arrival: 110 },
    { path: [[86.820, 26.080], [86.760, 25.920]], outerWidth: 0.0550, depth: 2.8, velocity: 2.0, arrival: 155 },
    { path: [[86.760, 25.920], [86.680, 25.750]], outerWidth: 0.0650, depth: 2.2, velocity: 1.5, arrival: 210 }
  ],
  contextFeatures: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { kind: 'river', name: 'Kosi Main River & Avulsion Channels' }, geometry: { type: 'LineString', coordinates: [[87.030, 26.580], [86.960, 26.440], [86.870, 26.220], [86.760, 25.920]] } },
      { type: 'Feature', properties: { kind: 'road', name: 'East-West Highway (Nepal) & NH-57 (India)' }, geometry: { type: 'LineString', coordinates: [[86.800, 26.650], [87.000, 26.620], [87.150, 26.580]] } },
      { type: 'Feature', properties: { kind: 'bridge', label: 'Kosi Barrage Bridge' }, geometry: { type: 'Point', coordinates: [86.920, 26.520] } },
      { type: 'Feature', properties: { kind: 'settlement', label: 'Birpur Township', population: 22000 }, geometry: { type: 'Point', coordinates: [87.010, 26.520] } },
      { type: 'Feature', properties: { kind: 'settlement', label: 'Supaul District HQ', population: 65000 }, geometry: { type: 'Point', coordinates: [86.600, 26.120] } },
      { type: 'Feature', properties: { kind: 'infrastructure', label: 'Kosi Barrage Structure (56 Gates)' }, geometry: { type: 'Point', coordinates: [86.920, 26.520] } }
    ]
  },
  satelliteBlueNetwork: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Regional Highway Grid' }, geometry: { type: 'LineString', coordinates: [[86.800, 26.650], [87.000, 26.620], [87.150, 26.580]] } }
    ]
  },
  satelliteRedRoutes: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Avulsion Mega-Flow Corridor' }, geometry: { type: 'LineString', coordinates: [[87.030, 26.580], [86.960, 26.440], [86.870, 26.220], [86.760, 25.920]] } }
    ]
  },
  satelliteMagentaZones: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { type: 'core-zone' }, geometry: { type: 'Polygon', coordinates: [createGeoJSONCircle([87.030, 26.580], 1400)] } },
      { type: 'Feature', properties: { type: 'core-zone' }, geometry: { type: 'Polygon', coordinates: [createGeoJSONCircle([87.010, 26.520], 1800)] } }
    ]
  },
  satelliteBuildings: {
    type: 'FeatureCollection',
    features: []
  },
  markers: [
    { label: 'Kushaha Breach Point (12.9 km u/s)', coords: [87.030, 26.580], labelCoords: [87.050, 26.585], bg: '#DC2626', border: '#F87171' },
    { label: 'Kosi Barrage', coords: [86.920, 26.520], labelCoords: [86.905, 26.525], bg: '#0284C7', border: '#38BDF8' },
    { label: 'Birpur Flood Command', coords: [87.010, 26.520], labelCoords: [87.025, 26.525], bg: '#0F172A', border: '#FBBF24' }
  ]
};

// Scenario Selector
const resolveScenarioData = (simulationId: string): IncidentData => {
  const s = (simulationId || '').toLowerCase();
  if (s.includes('rishi') || s.includes('chamoli') || s.includes('uttarakhand') || s.includes('uk-')) {
    return rishigangaScenarioData;
  }
  if (s.includes('phuktal') || s.includes('sumdo') || s.includes('zanskar') || s.includes('ladakh') || s.includes('ld-')) {
    return phuktalScenarioData;
  }
  if (s.includes('wapriyang') || s.includes('wp-') || s.includes('siang')) {
    return wapriyangScenarioData;
  }
  if (s.includes('kosi') || s.includes('kushaha') || s.includes('ks-') || s.includes('bihar')) {
    return kosiScenarioData;
  }
  // Default to Nepal GLOF / Trishuli Catchment for any general or new simulation ID
  return nepalScenarioData;
};

// Tile URL Resolver
const getTileUrl = (type: BasemapType | string): string => {
  if (type === 'satellite' || type === 'hybrid') {
    return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  }
  if (type === 'terrain') {
    return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}';
  }
  if (type === 'light') {
    return 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';
  }
  if (type === 'dark') {
    return 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png';
  }
  return 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
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
  showFloatingControls = true,
  initialViewMode = '3d',
  viewMode: propViewMode,
  onViewModeChange,
  activeMapTool = 'Select',
  onActiveMapToolChange
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  // Active Incident Data
  const activeScenarioData = resolveScenarioData(simulationId);
  const activeMilestones = activeScenarioData.milestones;

  // View Mode
  const [internalViewMode, setInternalViewMode] = useState<'3d' | '2d'>(initialViewMode);
  const viewMode = propViewMode !== undefined ? propViewMode : internalViewMode;

  // Fullscreen
  const [internalFullscreen, setInternalFullscreen] = useState<boolean>(false);
  const isFullscreen = propIsFullscreen !== undefined ? propIsFullscreen : internalFullscreen;

  // Timeline
  const [, setTimeline] = useState<TimelineSummary | null>(null);
  const [internalTsIndex, setInternalTsIndex] = useState<number>(5);
  const [internalIsPlaying, setInternalIsPlaying] = useState<boolean>(false);
  const [internalSpeed, setInternalSpeed] = useState<number>(propSpeed ?? 1);

  const activeTsIndex = propTsIndex !== undefined ? propTsIndex : internalTsIndex;
  const activeIsPlaying = propIsPlaying !== undefined ? propIsPlaying : internalIsPlaying;
  const activeSpeed = propSpeed !== undefined ? propSpeed : internalSpeed;
  const activeMilestone = activeMilestones[activeTsIndex] || activeMilestones[activeMilestones.length - 1];

  // Visual Controls
  const [internalVariable, setInternalVariable] = useState<'extent' | 'depth' | 'velocity' | 'arrivalTime'>('depth');
  const activeVariable = propVariable || internalVariable;
  const [activeBasemap, setActiveBasemap] = useState<BasemapType>(propBasemap);

  // GIS Tools State
  const [drawnPoints, setDrawnPoints] = useState<Coordinate[]>([]);
  const [isDrawingClosed, setIsDrawingClosed] = useState<boolean>(false);
  const [measuredPoints, setMeasuredPoints] = useState<Coordinate[]>([]);
  const [queryInfo, setQueryInfo] = useState<{
    lngLat: Coordinate;
    elevation: number;
    distanceKm: number;
    depthM: number;
    velocityMs: number;
    arrivalMin: number;
    status: string;
  } | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<{
    name: string;
    category: string;
    coordinates: Coordinate;
    depthM?: number;
    velocityMs?: number;
    details?: string;
  } | null>(null);

  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync Basemap
  useEffect(() => {
    if (propBasemap) {
      setActiveBasemap(propBasemap);
      setBasemapInMap(propBasemap);
    }
  }, [propBasemap]);

  const setBasemapInMap = (type: BasemapType | string) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const tileUrl = getTileUrl(type);
    const source = map.getSource('base-raster-tiles') as maplibregl.RasterTileSource | undefined;
    if (source && typeof (source as any).setTiles === 'function') {
      (source as any).setTiles([tileUrl]);
      const style = (map as any).style;
      if (style && style.sourceCaches && style.sourceCaches['base-raster-tiles']) {
        style.sourceCaches['base-raster-tiles'].clearTiles();
        style.sourceCaches['base-raster-tiles'].update(map.transform);
      }
      map.triggerRepaint();
    }
  };

  const handleViewModeChange = (newMode: '3d' | '2d') => {
    setInternalViewMode(newMode);
    onViewModeChange?.(newMode);

    const map = mapRef.current;
    if (!map) return;

    if (newMode === '2d') {
      map.setTerrain(null);
      map.easeTo({ pitch: 0, bearing: 0, duration: 800 });
    } else {
      const isDemVisible = layersConfig?.dem ?? true;
      if (isDemVisible) {
        map.setTerrain({ source: 'himalayan-dem', exaggeration: 1.6 });
      }
      map.easeTo({ pitch: 55, bearing: -20, duration: 800 });
    }
  };

  const handlePlayPause = () => {
    const nextState = !activeIsPlaying;
    setInternalIsPlaying(nextState);
    if (onPlayPauseChange) onPlayPauseChange(nextState);
  };

  const handleResetSimulation = () => {
    setInternalIsPlaying(false);
    if (onPlayPauseChange) onPlayPauseChange(false);
    setInternalTsIndex(0);
    if (onTimelineChange) onTimelineChange(0, activeMilestones[0].fullTime);
    if (onReset) onReset();
    resetCamera();
  };

  const handleToggleFullscreen = () => {
    const nextState = !isFullscreen;
    setInternalFullscreen(nextState);
    if (onToggleFullscreen) onToggleFullscreen(nextState);

    if (wrapperRef.current) {
      if (nextState) {
        if (wrapperRef.current.requestFullscreen) wrapperRef.current.requestFullscreen().catch(() => {});
      } else {
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      const isFs = !!document.fullscreenElement;
      setInternalFullscreen(isFs);
      if (onToggleFullscreen) onToggleFullscreen(isFs);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, [onToggleFullscreen]);

  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => mapRef.current?.resize(), 150);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  useEffect(() => {
    if (!mapContainer.current) return;
    const observer = new ResizeObserver(() => mapRef.current?.resize());
    observer.observe(mapContainer.current);
    return () => observer.disconnect();
  }, []);

  // Load timeline summary
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const tl = await apiClient.getSimulationTimeline(simulationId).catch(() => null);
        if (isMounted) {
          if (tl && tl.timesteps && tl.timesteps.length > 0) {
            setTimeline(tl);
          } else {
            setTimeline({
              simulationId,
              timesteps: activeMilestones.map((m, idx) => ({
                timestepIndex: idx,
                timeMin: idx * 15,
                floodAreaKm2: m.area,
                maxDepthM: m.depth,
                maxVelocityMs: m.velocity
              }))
            });
          }
        }
      } catch (err: any) {
        console.warn('Map data load error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [simulationId, activeMilestones]);

  // Uncontrolled Playback Timer
  useEffect(() => {
    if (propIsPlaying !== undefined || propTsIndex !== undefined) return;
    if (!activeIsPlaying) return;

    const intervalMs = 1400 / activeSpeed;
    const timer = setInterval(() => {
      let nextIndex = activeTsIndex + 1;
      if (nextIndex >= activeMilestones.length) {
        setInternalIsPlaying(false);
        if (onPlayPauseChange) onPlayPauseChange(false);
        return;
      }
      setInternalTsIndex(nextIndex);
      if (onTimelineChange) {
        const m = activeMilestones[nextIndex];
        onTimelineChange(nextIndex, m.fullTime);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [activeIsPlaying, activeSpeed, activeTsIndex, onTimelineChange, onPlayPauseChange, propIsPlaying, propTsIndex, activeMilestones]);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainer.current) return;

    const initialCenter = activeScenarioData.center;
    const initialZoom = activeScenarioData.zoom;
    const initialPitch = viewMode === '3d' ? 55 : 0;
    const initialBearing = viewMode === '3d' ? -20 : 0;

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
        terrain: viewMode === '3d' ? {
          source: 'himalayan-dem',
          exaggeration: 1.6
        } : undefined,
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#07111f' } },
          { id: 'base-raster-layer', type: 'raster', source: 'base-raster-tiles', minzoom: 0, maxzoom: 19, paint: { 'raster-opacity': 0.95 } }
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
      // Data Sources
      map.addSource('flood-extent-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addSource('flow-direction-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addSource('debris-particles-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addSource('satellite-blue-network-src', { type: 'geojson', data: activeScenarioData.satelliteBlueNetwork });
      map.addSource('satellite-red-routes-src', { type: 'geojson', data: activeScenarioData.satelliteRedRoutes });
      map.addSource('satellite-magenta-zones-src', { type: 'geojson', data: activeScenarioData.satelliteMagentaZones });
      map.addSource('satellite-buildings-src', { type: 'geojson', data: activeScenarioData.satelliteBuildings });
      map.addSource('nepal-context-src', { type: 'geojson', data: activeScenarioData.contextFeatures });
      map.addSource('label-leaders-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addSource('location-marker-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      // Interactive GIS Tools Sources
      map.addSource('custom-draw-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addSource('custom-measure-src', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      // GIS Layers
      map.addLayer({ id: 'custom-draw-polygon', type: 'fill', source: 'custom-draw-src', filter: ['==', '$type', 'Polygon'], paint: { 'fill-color': '#F59E0B', 'fill-opacity': 0.28 } });
      map.addLayer({ id: 'custom-draw-lines', type: 'line', source: 'custom-draw-src', paint: { 'line-color': '#F59E0B', 'line-width': 3, 'line-dasharray': [2, 1] } });
      map.addLayer({ id: 'custom-draw-points', type: 'circle', source: 'custom-draw-src', filter: ['==', '$type', 'Point'], paint: { 'circle-radius': 6, 'circle-color': '#F59E0B', 'circle-stroke-color': '#FFFFFF', 'circle-stroke-width': 2 } });

      map.addLayer({ id: 'custom-measure-line-glow', type: 'line', source: 'custom-measure-src', filter: ['==', '$type', 'LineString'], paint: { 'line-color': '#FDE047', 'line-width': 6, 'line-blur': 3, 'line-opacity': 0.7 } });
      map.addLayer({ id: 'custom-measure-line', type: 'line', source: 'custom-measure-src', filter: ['==', '$type', 'LineString'], paint: { 'line-color': '#EAB308', 'line-width': 3 } });
      map.addLayer({ id: 'custom-measure-points', type: 'circle', source: 'custom-measure-src', filter: ['==', '$type', 'Point'], paint: { 'circle-radius': 6.5, 'circle-color': '#EAB308', 'circle-stroke-color': '#0F172A', 'circle-stroke-width': 2.5 } });

      // Hazard & Network Overlays
      map.addLayer({ id: 'satellite-magenta-zones-fill', type: 'fill', source: 'satellite-magenta-zones-src', filter: ['==', ['get', 'type'], 'core-zone'], paint: { 'fill-color': '#EC4899', 'fill-opacity': 0.22 } });
      map.addLayer({ id: 'satellite-magenta-zones-stroke', type: 'line', source: 'satellite-magenta-zones-src', filter: ['==', ['get', 'type'], 'core-zone'], paint: { 'line-color': '#F43F5E', 'line-width': 2.4, 'line-opacity': 0.95, 'line-dasharray': [2, 2] } });

      map.addLayer({ id: 'satellite-buildings-fill', type: 'fill', source: 'satellite-buildings-src', paint: { 'fill-color': '#CBD5E1', 'fill-opacity': 0.55 } });
      map.addLayer({ id: 'satellite-buildings-stroke', type: 'line', source: 'satellite-buildings-src', paint: { 'line-color': '#38BDF8', 'line-width': 1.4, 'line-opacity': 0.9 } });

      map.addLayer({ id: 'context-river-network', type: 'line', source: 'nepal-context-src', filter: ['==', ['get', 'kind'], 'river'], paint: { 'line-color': '#075985', 'line-width': 2.5, 'line-opacity': 0.95 } });
      map.addLayer({ id: 'context-roads', type: 'line', source: 'nepal-context-src', filter: ['==', ['get', 'kind'], 'road'], paint: { 'line-color': '#F8FAFC', 'line-width': 2.2, 'line-opacity': 0.92, 'line-dasharray': [1.5, 1] } });

      map.addLayer({ id: 'satellite-blue-network-glow', type: 'line', source: 'satellite-blue-network-src', paint: { 'line-color': '#00E5FF', 'line-width': 4.8, 'line-blur': 2.5, 'line-opacity': 0.8 } });
      map.addLayer({ id: 'satellite-blue-network', type: 'line', source: 'satellite-blue-network-src', paint: { 'line-color': '#0284C7', 'line-width': 2.5, 'line-opacity': 0.98 } });

      map.addLayer({ id: 'satellite-red-routes-glow', type: 'line', source: 'satellite-red-routes-src', paint: { 'line-color': '#FF2A85', 'line-width': 5.2, 'line-blur': 2.2, 'line-opacity': 0.65 } });
      map.addLayer({ id: 'satellite-red-routes', type: 'line', source: 'satellite-red-routes-src', paint: { 'line-color': '#EF4444', 'line-width': 2.8, 'line-opacity': 0.98, 'line-dasharray': [3, 1.5] } });

      // Flood Simulation Layers (2D & 3D)
      map.addLayer({ id: 'flood-2d-glow', type: 'line', source: 'flood-extent-src', paint: { 'line-color': '#38BDF8', 'line-width': 4.0, 'line-blur': 2.0, 'line-opacity': 0.75 } });
      map.addLayer({ id: 'flood-2d-fill', type: 'fill', source: 'flood-extent-src', paint: { 'fill-color': depthColorExpression as any, 'fill-opacity': 0.82 } });
      map.addLayer({ id: 'flood-2d-channel-core', type: 'fill', source: 'flood-extent-src', filter: ['==', ['get', 'band'], 'channel'], paint: { 'fill-color': '#dc2626', 'fill-opacity': 0.92 } });

      map.addLayer({ id: 'flood-3d-extrusion', type: 'fill-extrusion', source: 'flood-extent-src', paint: { 'fill-extrusion-color': depthColorExpression as any, 'fill-extrusion-height': ['interpolate', ['linear'], ['get', 'max_depth_m'], 0, 3, 10, 50], 'fill-extrusion-base': 0, 'fill-extrusion-opacity': 0.78 } });
      map.addLayer({ id: 'flood-channel-core', type: 'fill-extrusion', source: 'flood-extent-src', filter: ['==', ['get', 'band'], 'channel'], paint: { 'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'max_velocity_ms'], 0, '#0ea5e9', 3, '#22d3ee', 5, '#fde047', 7, '#f97316', 9, '#dc2626'], 'fill-extrusion-height': ['interpolate', ['linear'], ['get', 'max_depth_m'], 0, 6, 10, 64], 'fill-extrusion-base': 0, 'fill-extrusion-opacity': 0.94 } });

      map.addLayer({ id: 'flood-extent-stroke', type: 'line', source: 'flood-extent-src', paint: { 'line-color': '#38BDF8', 'line-width': 2.5, 'line-opacity': 0.95 } });

      map.addLayer({ id: 'flow-direction-arrows', type: 'symbol', source: 'flow-direction-src', layout: { 'text-field': ['get', 'symbol'], 'text-size': ['interpolate', ['linear'], ['zoom'], 8, 11, 13, 22], 'text-rotate': ['get', 'bearing'], 'text-rotation-alignment': 'map', 'text-allow-overlap': true, 'text-ignore-placement': true }, paint: { 'text-color': '#ffffff', 'text-halo-color': '#075985', 'text-halo-width': 1.5, 'text-opacity': 0.92 } });
      map.addLayer({ id: 'debris-particles', type: 'circle', source: 'debris-particles-src', paint: { 'circle-radius': ['interpolate', ['linear'], ['zoom'], 8, 2, 13, 5], 'circle-color': '#fbbf24', 'circle-stroke-color': '#7c2d12', 'circle-stroke-width': 1, 'circle-opacity': 0.9 } });

      map.addLayer({ id: 'label-leaders', type: 'line', source: 'label-leaders-src', paint: { 'line-color': '#e0f2fe', 'line-width': 1.25, 'line-opacity': 0.85, 'line-dasharray': [1.2, 1.2] } });
      map.addLayer({ id: 'location-markers', type: 'circle', source: 'location-marker-src', paint: { 'circle-radius': 4.5, 'circle-color': '#f8fafc', 'circle-stroke-color': '#0284c7', 'circle-stroke-width': 2 } });
      map.addLayer({ id: 'context-bridges', type: 'circle', source: 'nepal-context-src', filter: ['==', ['get', 'kind'], 'bridge'], paint: { 'circle-radius': 5, 'circle-color': '#fbbf24', 'circle-stroke-color': '#713f12', 'circle-stroke-width': 1.5 } });
      map.addLayer({ id: 'context-settlements', type: 'circle', source: 'nepal-context-src', filter: ['==', ['get', 'kind'], 'settlement'], paint: { 'circle-radius': 5.5, 'circle-color': '#f8fafc', 'circle-stroke-color': '#1d4ed8', 'circle-stroke-width': 2 } });
      map.addLayer({ id: 'context-infrastructure', type: 'circle', source: 'nepal-context-src', filter: ['==', ['get', 'kind'], 'infrastructure'], paint: { 'circle-radius': 6, 'circle-color': '#fb923c', 'circle-stroke-color': '#9a3412', 'circle-stroke-width': 2 } });

      // Scenario Sequence Markers
      if (activeScenarioData.markers && activeScenarioData.markers.length > 0) {
        const leaderSource = map.getSource('label-leaders-src') as maplibregl.GeoJSONSource;
        leaderSource?.setData({
          type: 'FeatureCollection',
          features: activeScenarioData.markers.map((item) => ({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [item.coords, item.labelCoords] }
          })) as any
        });

        const locationSource = map.getSource('location-marker-src') as maplibregl.GeoJSONSource;
        locationSource?.setData({
          type: 'FeatureCollection',
          features: activeScenarioData.markers.map((item) => ({
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: item.coords }
          })) as any
        });

        activeScenarioData.markers.forEach((item) => {
          const el = document.createElement('div');
          el.innerHTML = `
            <div style="background: ${item.bg}; color: #ffffff; font-weight: 800; padding: 4px 9px; border-radius: 16px; border: 1.5px solid ${item.border}; box-shadow: 0 4px 14px rgba(0,0,0,0.85); display: flex; align-items: center; gap: 4px; font-size: 11px; white-space: nowrap; cursor: pointer;">
              <span>${item.label}</span>
            </div>
          `;
          new maplibregl.Marker({ element: el })
            .setLngLat(item.labelCoords as Coordinate)
            .addTo(map);
        });
      }

      loadTimestepGeoJSON(activeTsIndex);
      updateLayerVisibilities();
    });

    return () => {
      map.remove();
    };
  }, [simulationId, activeScenarioData]);

  // Update dynamic flood hydrodynamics
  const loadTimestepGeoJSON = (tsIdx: number) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const source = map.getSource('flood-extent-src') as maplibregl.GeoJSONSource;
    if (!source) return;

    const activeReaches = activeScenarioData.floodReaches.slice(0, Math.min(tsIdx + 1, activeScenarioData.floodReaches.length));
    const features = activeReaches.flatMap((reach, reachIndex) => {
      const milestone = activeMilestones[reachIndex] || activeMilestones[activeMilestones.length - 1];
      const props = { arrival_time_min: reach.arrival, reach: reachIndex + 1, name: milestone.name };
      return [
        {
          type: 'Feature' as const,
          properties: {
            ...props,
            band: 'overbank',
            max_depth_m: Math.max(0.8, reach.depth * 0.28),
            max_velocity_ms: Math.max(0.7, reach.velocity * 0.22)
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [makeRibbon(reach.path, reach.outerWidth)]
          }
        },
        {
          type: 'Feature' as const,
          properties: {
            ...props,
            band: 'inundation',
            max_depth_m: reach.depth * 0.68,
            max_velocity_ms: reach.velocity * 0.55
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [makeRibbon(reach.path, reach.outerWidth * 0.62)]
          }
        },
        {
          type: 'Feature' as const,
          properties: {
            ...props,
            band: 'channel',
            max_depth_m: reach.depth,
            max_velocity_ms: reach.velocity
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [makeRibbon(reach.path, Math.max(reach.outerWidth * 0.25, 0.0022))]
          }
        }
      ];
    });
    source.setData({ type: 'FeatureCollection', features: features as any });

    const flowSource = map.getSource('flow-direction-src') as maplibregl.GeoJSONSource;
    const debrisSource = map.getSource('debris-particles-src') as maplibregl.GeoJSONSource;
    const arrows = activeReaches.flatMap((reach) => reach.path.slice(0, -1).map((point, index) => {
      const next = reach.path[index + 1];
      const bearing = Math.atan2(next[1] - point[1], next[0] - point[0]) * (180 / Math.PI) - 90;
      return {
        type: 'Feature',
        properties: { symbol: '➤', bearing },
        geometry: { type: 'Point', coordinates: [(point[0] + next[0]) / 2, (point[1] + next[1]) / 2] }
      };
    }));
    flowSource?.setData({ type: 'FeatureCollection', features: arrows as any });

    const particles = activeReaches.flatMap((reach, reachIndex) => reach.path.slice(0, -1).flatMap((point, segmentIndex) => {
      const next = reach.path[segmentIndex + 1];
      return [0.32, 0.68].map((fraction, particleIndex) => ({
        type: 'Feature',
        properties: { phase: reachIndex },
        geometry: {
          type: 'Point',
          coordinates: [point[0] + (next[0] - point[0]) * fraction + (particleIndex ? 0.0007 : -0.0007), point[1] + (next[1] - point[1]) * fraction]
        }
      }));
    }));
    debrisSource?.setData({ type: 'FeatureCollection', features: particles as any });
  };

  useEffect(() => {
    loadTimestepGeoJSON(activeTsIndex);
  }, [activeTsIndex]);

  // Synchronize Layer Visibilities
  const updateLayerVisibilities = () => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded()) return;

    const setVisibility = (id: string, visible: boolean) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
    };

    const isVisible = (key: keyof NonNullable<FloodMapProps['layersConfig']>, fallback = true) => layersConfig?.[key] ?? fallback;

    const extentOn = isVisible('extent');
    const velocityOn = isVisible('velocity');
    const roadsOn = isVisible('roads');
    const infrastructureOn = isVisible('infrastructure');
    const buildingsOn = isVisible('buildings');
    const riverOn = isVisible('riverNetwork');
    const bridgesOn = isVisible('bridges');
    const settlementsOn = isVisible('settlements');
    const demOn = isVisible('dem');

    if (viewMode === '2d') {
      setVisibility('flood-3d-extrusion', false);
      setVisibility('flood-channel-core', false);
      setVisibility('flood-2d-fill', extentOn);
      setVisibility('flood-2d-channel-core', velocityOn);
      setVisibility('flood-2d-glow', extentOn);
      setVisibility('flood-extent-stroke', extentOn);

      setVisibility('satellite-blue-network', roadsOn);
      setVisibility('satellite-blue-network-glow', roadsOn);
      setVisibility('satellite-red-routes', roadsOn);
      setVisibility('satellite-red-routes-glow', roadsOn);
      setVisibility('satellite-magenta-zones-fill', infrastructureOn);
      setVisibility('satellite-magenta-zones-stroke', infrastructureOn);
      setVisibility('satellite-buildings-fill', buildingsOn);
      setVisibility('satellite-buildings-stroke', buildingsOn);
      map.setTerrain(null);
    } else {
      setVisibility('flood-3d-extrusion', extentOn);
      setVisibility('flood-channel-core', velocityOn);
      setVisibility('flood-2d-fill', false);
      setVisibility('flood-2d-channel-core', false);
      setVisibility('flood-2d-glow', false);
      setVisibility('flood-extent-stroke', extentOn);

      setVisibility('satellite-blue-network', roadsOn);
      setVisibility('satellite-blue-network-glow', roadsOn);
      setVisibility('satellite-red-routes', roadsOn);
      setVisibility('satellite-red-routes-glow', roadsOn);
      setVisibility('satellite-magenta-zones-fill', infrastructureOn);
      setVisibility('satellite-magenta-zones-stroke', infrastructureOn);
      setVisibility('satellite-buildings-fill', buildingsOn);
      setVisibility('satellite-buildings-stroke', buildingsOn);
      map.setTerrain(demOn ? { source: 'himalayan-dem', exaggeration: 1.6 } : null);
    }

    setVisibility('flow-direction-arrows', velocityOn);
    setVisibility('debris-particles', velocityOn);
    setVisibility('context-river-network', riverOn);
    setVisibility('context-roads', roadsOn);
    setVisibility('context-bridges', bridgesOn);
    setVisibility('context-settlements', settlementsOn);
    setVisibility('context-infrastructure', infrastructureOn);
  };

  useEffect(() => {
    updateLayerVisibilities();
  }, [layersConfig, viewMode]);

  // Color Variable Updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    let targetColorExp = depthColorExpression;
    if (activeVariable === 'velocity') targetColorExp = velocityColorExpression;
    else if (activeVariable === 'arrivalTime') targetColorExp = arrivalColorExpression;

    if (map.getLayer('flood-3d-extrusion')) map.setPaintProperty('flood-3d-extrusion', 'fill-extrusion-color', targetColorExp);
    if (map.getLayer('flood-2d-fill')) map.setPaintProperty('flood-2d-fill', 'fill-color', targetColorExp);
  }, [activeVariable]);

  // GIS Tools Effects
  useEffect(() => {
    if (activeMapTool === 'Clear') {
      setDrawnPoints([]);
      setIsDrawingClosed(false);
      setMeasuredPoints([]);
      setQueryInfo(null);
      setSelectedFeature(null);

      const map = mapRef.current;
      if (map && map.isStyleLoaded()) {
        const drawSrc = map.getSource('custom-draw-src') as maplibregl.GeoJSONSource | undefined;
        drawSrc?.setData({ type: 'FeatureCollection', features: [] });
        const measureSrc = map.getSource('custom-measure-src') as maplibregl.GeoJSONSource | undefined;
        measureSrc?.setData({ type: 'FeatureCollection', features: [] });
      }
      onActiveMapToolChange?.('Select');
    }
  }, [activeMapTool, onActiveMapToolChange]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (activeMapTool === 'Draw' || activeMapTool === 'Measure') map.getCanvas().style.cursor = 'crosshair';
    else if (activeMapTool === 'Query') map.getCanvas().style.cursor = 'help';
    else map.getCanvas().style.cursor = '';
  }, [activeMapTool]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const drawSrc = map.getSource('custom-draw-src') as maplibregl.GeoJSONSource | undefined;
    if (!drawSrc) return;

    if (drawnPoints.length === 0) {
      drawSrc.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const features: any[] = drawnPoints.map((pt, i) => ({
      type: 'Feature',
      properties: { vertexIndex: i + 1 },
      geometry: { type: 'Point', coordinates: pt }
    }));

    if (drawnPoints.length >= 2) {
      features.push({
        type: 'Feature',
        properties: {},
        geometry: {
          type: isDrawingClosed && drawnPoints.length >= 3 ? 'Polygon' : 'LineString',
          coordinates: isDrawingClosed && drawnPoints.length >= 3 ? [[...drawnPoints, drawnPoints[0]]] : drawnPoints
        }
      });
    }
    drawSrc.setData({ type: 'FeatureCollection', features });
  }, [drawnPoints, isDrawingClosed]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const measureSrc = map.getSource('custom-measure-src') as maplibregl.GeoJSONSource | undefined;
    if (!measureSrc) return;

    if (measuredPoints.length === 0) {
      measureSrc.setData({ type: 'FeatureCollection', features: [] });
      return;
    }

    const features: any[] = measuredPoints.map((pt, i) => ({
      type: 'Feature',
      properties: { stepIndex: i + 1 },
      geometry: { type: 'Point', coordinates: pt }
    }));

    if (measuredPoints.length >= 2) {
      features.push({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: measuredPoints }
      });
    }
    measureSrc.setData({ type: 'FeatureCollection', features });
  }, [measuredPoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      const clickCoord: Coordinate = [Number(e.lngLat.lng.toFixed(5)), Number(e.lngLat.lat.toFixed(5))];

      if (activeMapTool === 'Draw') {
        if (isDrawingClosed) {
          setDrawnPoints([clickCoord]);
          setIsDrawingClosed(false);
        } else {
          if (drawnPoints.length >= 2) {
            const distToStart = calculateDistanceKm(clickCoord, drawnPoints[0]);
            if (distToStart < 0.25) {
              setIsDrawingClosed(true);
              return;
            }
          }
          setDrawnPoints((prev) => [...prev, clickCoord]);
        }
      } else if (activeMapTool === 'Measure') {
        setMeasuredPoints((prev) => [...prev, clickCoord]);
      } else if (activeMapTool === 'Query') {
        const distFromOrigin = calculateDistanceKm(clickCoord, activeScenarioData.center);
        const baseElevation = Math.max(400, Math.min(5200, Math.round(1850 + (clickCoord[1] - activeScenarioData.center[1]) * 8500)));

        let isFlooded = false;
        let depth = 0;
        let vel = 0;
        let arrival = 0;

        activeScenarioData.floodReaches.forEach((r, idx) => {
          if (idx <= activeTsIndex) {
            const d = calculateDistanceKm(clickCoord, r.path[0]);
            if (d < 2.2) {
              isFlooded = true;
              depth = r.depth;
              vel = r.velocity;
              arrival = r.arrival;
            }
          }
        });

        setQueryInfo({
          lngLat: clickCoord,
          elevation: baseElevation,
          distanceKm: Number(distFromOrigin.toFixed(2)),
          depthM: Number(depth.toFixed(1)),
          velocityMs: Number(vel.toFixed(1)),
          arrivalMin: arrival,
          status: isFlooded ? 'Inundated Hazard Zone' : 'Dry / High Ground Safe'
        });
      } else if (activeMapTool === 'Select') {
        const pointFeatures = (activeScenarioData.contextFeatures.features || []).filter((f: any) => f.geometry.type === 'Point');
        let nearest: any = null;
        let minD = 999;
        pointFeatures.forEach((f: any) => {
          const d = calculateDistanceKm(clickCoord, f.geometry.coordinates);
          if (d < minD && d < 3.5) {
            minD = d;
            nearest = f;
          }
        });

        if (nearest) {
          setSelectedFeature({
            name: nearest.properties.label || nearest.properties.name || 'Selected Asset',
            category: nearest.properties.kind || 'Point Asset',
            coordinates: nearest.geometry.coordinates,
            depthM: activeMilestone.depth,
            velocityMs: activeMilestone.velocity,
            details: nearest.properties.population
              ? `Population: ${nearest.properties.population.toLocaleString()}`
              : 'Monitored Critical Asset'
          });
        }
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [activeMapTool, drawnPoints, isDrawingClosed, activeTsIndex, activeMilestone, activeScenarioData]);

  const totalMeasuredDistanceKm = measuredPoints.reduce((acc, pt, i) => {
    if (i === 0) return 0;
    return acc + calculateDistanceKm(measuredPoints[i - 1], pt);
  }, 0);

  const drawnPerimeterKm = drawnPoints.reduce((acc, pt, i) => {
    if (i === 0) return 0;
    return acc + calculateDistanceKm(drawnPoints[i - 1], pt);
  }, 0) + (isDrawingClosed && drawnPoints.length >= 3 ? calculateDistanceKm(drawnPoints[drawnPoints.length - 1], drawnPoints[0]) : 0);

  const drawnAreaKm2 = isDrawingClosed && drawnPoints.length >= 3 ? calculatePolygonAreaKm2(drawnPoints) : 0;

  const toggle3DPitch = () => {
    if (!mapRef.current) return;
    if (viewMode === '2d') {
      handleViewModeChange('3d');
    } else {
      const currentPitch = mapRef.current.getPitch();
      const nextPitch = currentPitch > 20 ? 0 : 55;
      mapRef.current.easeTo({ pitch: nextPitch, bearing: nextPitch > 20 ? -20 : 0, duration: 800 });
    }
  };

  const resetCamera = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: activeScenarioData.center,
      zoom: activeScenarioData.zoom,
      pitch: viewMode === '3d' ? 55 : 0,
      bearing: viewMode === '3d' ? -20 : 0,
      duration: 1000
    });
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
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* ==================================================
          TOP OVERVIEW INCIDENT BADGE (Name of Incident prominently shown)
         ================================================== */}
      {!isFullscreen && (
        <div
          style={{
            position: 'absolute',
            top: '0.85rem',
            left: '0.85rem',
            zIndex: 89,
            background: 'rgba(15, 23, 42, 0.94)',
            border: '1px solid rgba(56, 189, 248, 0.5)',
            borderRadius: '8px',
            padding: '0.45rem 0.85rem',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 18px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            maxWidth: 'calc(100% - 240px)'
          }}
        >
          <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 10px #38BDF8', flexShrink: 0 }}></div>
          <div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              INCIDENT & CATCHMENT OVERVIEW
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              📍 {activeScenarioData.incidentName}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          TOP FULLSCREEN HEADER
         ================================================== */}
      {isFullscreen && (
        <div style={{ position: 'absolute', top: '0.85rem', left: '1rem', right: '1rem', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'auto', background: 'rgba(15, 23, 42, 0.92)', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '8px', padding: '0.45rem 0.9rem', color: '#F8FAFC', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#38BDF8', boxShadow: '0 0 10px #38BDF8' }}></div>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                FLOODLENS {viewMode === '3d' ? '3D HYDRODYNAMIC MODEL' : '2D SATELLITE NETWORK ASSESSMENT'}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FFFFFF' }}>
                📍 {activeScenarioData.incidentName}
              </div>
            </div>
          </div>

          <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(15, 23, 42, 0.92)', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '8px', padding: '0.4rem 0.85rem', backdropFilter: 'blur(8px)' }}>
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
            <button onClick={handleToggleFullscreen} style={{ background: '#0284C7', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0.4rem 0.75rem', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer' }}>
              ⤓ Exit Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* ==================================================
          TOP-RIGHT MAP VIEW MODE TOGGLE: [ 3D Terrain ] [ 2D Satellite ]
         ================================================== */}
      <div style={{ position: 'absolute', top: isFullscreen ? '4.8rem' : '0.85rem', right: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 90 }}>
        <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.94)', border: '1px solid rgba(56, 189, 248, 0.45)', borderRadius: '6px', padding: '2.5px', backdropFilter: 'blur(8px)', gap: '3px' }}>
          <button
            id="map-toggle-3d"
            onClick={() => handleViewModeChange('3d')}
            style={{
              padding: '0.35rem 0.7rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: viewMode === '3d' ? '#0284C7' : 'transparent',
              color: viewMode === '3d' ? '#FFFFFF' : '#94A3B8'
            }}
          >
            <span>🏔️</span>
            <span>3D Terrain</span>
          </button>

          <button
            id="map-toggle-2d"
            onClick={() => handleViewModeChange('2d')}
            style={{
              padding: '0.35rem 0.7rem',
              fontSize: '0.75rem',
              fontWeight: 800,
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: viewMode === '2d' ? '#0284C7' : 'transparent',
              color: viewMode === '2d' ? '#FFFFFF' : '#94A3B8'
            }}
          >
            <span>🛰️</span>
            <span>2D Satellite</span>
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {showFullscreenToggle && (
            <button
              onClick={handleToggleFullscreen}
              style={{ width: '32px', height: '32px', borderRadius: '6px', background: isFullscreen ? '#0284C7' : 'rgba(15, 23, 42, 0.92)', color: '#FFFFFF', border: '1px solid rgba(56, 189, 248, 0.4)', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isFullscreen ? '⤓' : '⤢'}
            </button>
          )}

          <button
            onClick={toggle3DPitch}
            style={{ width: '32px', height: '32px', borderRadius: '6px', background: viewMode === '3d' ? '#0284C7' : 'rgba(15, 23, 42, 0.92)', color: '#FFFFFF', border: '1px solid rgba(56, 189, 248, 0.4)', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            3D
          </button>

          <button
            onClick={handleResetSimulation}
            style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.92)', color: '#FFFFFF', border: '1px solid rgba(56, 189, 248, 0.4)', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ↺
          </button>
        </div>
      </div>

      {/* ==================================================
          INTERACTIVE GIS TOOL HUDS
         ================================================== */}
      {activeMapTool === 'Draw' && (
        <div style={{ position: 'absolute', top: isFullscreen ? '4.8rem' : '4.2rem', left: '0.85rem', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #F59E0B', borderRadius: '6px', padding: '0.65rem 0.85rem', fontSize: '0.76rem', zIndex: 88, backdropFilter: 'blur(8px)', color: '#F8FAFC', minWidth: '200px' }}>
          <div style={{ fontWeight: 800, color: '#F59E0B', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '0.3rem' }}>✏️ Drawing AOI ({drawnPoints.length} points)</div>
          <div style={{ marginTop: '0.3rem', fontSize: '0.72rem' }}>Perimeter: <strong style={{ color: '#F59E0B' }}>{drawnPerimeterKm.toFixed(2)} km</strong> | Area: <strong style={{ color: '#F59E0B' }}>{drawnAreaKm2.toFixed(2)} km²</strong></div>
          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem' }}>
            {drawnPoints.length >= 3 && !isDrawingClosed && (
              <button onClick={() => setIsDrawingClosed(true)} style={{ flex: 1, padding: '0.25rem', background: '#F59E0B', color: '#000', border: 'none', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}>Close Shape</button>
            )}
            <button onClick={() => { setDrawnPoints([]); setIsDrawingClosed(false); }} style={{ flex: 1, padding: '0.25rem', background: '#334155', color: '#FFF', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Reset</button>
          </div>
        </div>
      )}

      {activeMapTool === 'Measure' && (
        <div style={{ position: 'absolute', top: isFullscreen ? '4.8rem' : '4.2rem', left: '0.85rem', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #EAB308', borderRadius: '6px', padding: '0.65rem 0.85rem', fontSize: '0.76rem', zIndex: 88, backdropFilter: 'blur(8px)', color: '#F8FAFC', minWidth: '220px' }}>
          <div style={{ fontWeight: 800, color: '#EAB308', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '0.3rem' }}>📏 Distance Measurement</div>
          <div style={{ marginTop: '0.3rem' }}>Total Distance: <strong style={{ color: '#FDE047', fontSize: '0.95rem' }}>{totalMeasuredDistanceKm.toFixed(2)} km</strong></div>
          <button onClick={() => setMeasuredPoints([])} style={{ marginTop: '0.3rem', width: '100%', padding: '0.25rem', background: '#334155', color: '#FFF', border: 'none', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Clear</button>
        </div>
      )}

      {queryInfo && activeMapTool === 'Query' && (
        <div style={{ position: 'absolute', top: isFullscreen ? '4.8rem' : '4.2rem', left: '0.85rem', background: 'rgba(15, 23, 42, 0.96)', border: '1px solid #38BDF8', borderRadius: '6px', padding: '0.75rem 0.9rem', fontSize: '0.76rem', zIndex: 88, backdropFilter: 'blur(8px)', color: '#F8FAFC', minWidth: '240px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '0.3rem' }}>
            <span style={{ fontWeight: 800, color: '#38BDF8' }}>🔍 Point Query & Telemetry</span>
            <button onClick={() => setQueryInfo(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: 800 }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.2rem 0.5rem', marginTop: '0.3rem', fontSize: '0.72rem' }}>
            <span style={{ color: '#94A3B8' }}>Coord:</span><span>{queryInfo.lngLat[1]}°N, {queryInfo.lngLat[0]}°E</span>
            <span style={{ color: '#94A3B8' }}>Elevation:</span><strong>{queryInfo.elevation.toLocaleString()} m</strong>
            <span style={{ color: '#94A3B8' }}>Status:</span><span style={{ color: queryInfo.depthM > 0 ? '#F87171' : '#4ADE80', fontWeight: 800 }}>{queryInfo.status}</span>
            {queryInfo.depthM > 0 && (
              <>
                <span style={{ color: '#94A3B8' }}>Depth:</span><strong style={{ color: '#38BDF8' }}>{queryInfo.depthM} m</strong>
                <span style={{ color: '#94A3B8' }}>Velocity:</span><strong style={{ color: '#FBBF24' }}>{queryInfo.velocityMs} m/s</strong>
              </>
            )}
          </div>
        </div>
      )}

      {selectedFeature && (
        <div style={{ position: 'absolute', bottom: isFullscreen ? '5.2rem' : '1rem', left: '1rem', background: 'rgba(15, 23, 42, 0.96)', border: '1px solid #38BDF8', borderRadius: '6px', padding: '0.75rem 0.9rem', fontSize: '0.76rem', zIndex: 88, backdropFilter: 'blur(8px)', color: '#F8FAFC', minWidth: '220px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '0.3rem' }}>
            <span style={{ fontWeight: 800, color: '#38BDF8' }}>🎯 {selectedFeature.name}</span>
            <button onClick={() => setSelectedFeature(null)} style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontWeight: 800 }}>✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.2rem 0.5rem', marginTop: '0.3rem', fontSize: '0.72rem' }}>
            <span style={{ color: '#94A3B8' }}>Asset:</span><span>{selectedFeature.category}</span>
            <span style={{ color: '#94A3B8' }}>Location:</span><span>{selectedFeature.coordinates[1]}°N, {selectedFeature.coordinates[0]}°E</span>
            <span style={{ color: '#94A3B8' }}>Modeled Depth:</span><strong style={{ color: '#38BDF8' }}>{selectedFeature.depthM?.toFixed(1)} m</strong>
          </div>
        </div>
      )}

      {/* 2D Satellite Overlays Key */}
      {viewMode === '2d' && (
        <div style={{ position: 'absolute', top: isFullscreen ? '4.8rem' : '3.6rem', right: '0.85rem', background: 'rgba(15, 23, 42, 0.94)', border: '1px solid rgba(236, 72, 153, 0.4)', borderRadius: '6px', padding: '0.45rem 0.75rem', fontSize: '0.72rem', zIndex: 85, backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F8FAFC', fontWeight: 800 }}>
            <span style={{ color: '#00E5FF' }}>■</span><span>Blue Corridor Network</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F8FAFC', fontWeight: 800 }}>
            <span style={{ color: '#EF4444' }}>━ ━</span><span>Red Evacuation Routes</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#F8FAFC', fontWeight: 800 }}>
            <span style={{ color: '#EC4899' }}>◎</span><span>Magenta Hazard Zones</span>
          </div>
        </div>
      )}

      {/* Bottom-Right Legend */}
      <div style={{ position: 'absolute', bottom: isFullscreen ? '5.2rem' : '1rem', right: '1rem', background: 'rgba(15, 23, 42, 0.94)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '6px', padding: '0.65rem 0.85rem', width: '155px', fontSize: '0.74rem', zIndex: 80, backdropFilter: 'blur(8px)' }}>
        <div style={{ fontWeight: 800, color: '#F8FAFC', marginBottom: '0.45rem', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '0.3rem', fontSize: '0.74rem' }}>
          {activeVariable === 'velocity' ? 'Velocity (m/s)' : activeVariable === 'arrivalTime' ? 'Arrival Time' : 'Water Depth (m)'}
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

      {/* Bottom-Left Metadata */}
      {!selectedFeature && (
        <div style={{ position: 'absolute', bottom: isFullscreen ? '5.2rem' : '1rem', left: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 80 }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.94)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '6px', padding: '0.4rem 0.85rem', fontSize: '0.76rem', color: '#F8FAFC', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.75rem', backdropFilter: 'blur(8px)' }}>
            <span style={{ color: viewMode === '2d' ? '#EC4899' : '#38BDF8' }}>{viewMode === '2d' ? '2D Satellite View' : '3D Terrain View'}</span>
            <span style={{ color: '#475569' }}>|</span>
            <span style={{ color: '#38BDF8' }}>{propFormattedTime || activeMilestone.fullTime}</span>
          </div>
        </div>
      )}

      {/* Fullscreen Timeline Playback Bar */}
      {isFullscreen && (
        <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem', zIndex: 100, background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: '8px', padding: '0.55rem 1.25rem', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button onClick={handlePlayPause} style={{ background: '#0284C7', color: '#FFF', border: 'none', borderRadius: '6px', padding: '0.35rem 0.65rem', fontWeight: 800, fontSize: '0.85rem', width: '38px', cursor: 'pointer' }}>
              {activeIsPlaying ? '❚❚' : '▶'}
            </button>
            <button onClick={handleResetSimulation} style={{ background: '#1E293B', color: '#FFF', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', padding: '0.3rem 0.55rem', fontSize: '0.76rem', fontWeight: 800, cursor: 'pointer' }}>
              ↺ Reset
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.76rem', color: '#F8FAFC', fontWeight: 800 }}>
                📍 Milestone: <span style={{ color: '#38BDF8' }}>{activeMilestone.timeLabel} — {activeMilestone.name}</span>
              </span>
              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>
                Stage {activeTsIndex + 1} / {activeMilestones.length}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max={activeMilestones.length - 1}
              step="1"
              value={activeTsIndex}
              onChange={(e) => {
                setInternalIsPlaying(false);
                if (onPlayPauseChange) onPlayPauseChange(false);
                const next = Number(e.target.value);
                setInternalTsIndex(next);
                if (onTimelineChange) onTimelineChange(next, activeMilestones[next].fullTime);
              }}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#38BDF8' }}
            />
          </div>
        </div>
      )}

      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(7, 17, 31, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38BDF8', fontWeight: 600, fontSize: '0.9rem', zIndex: 200 }}>
          <span>Loading Map Simulation Layers...</span>
        </div>
      )}
    </div>
  );
};
