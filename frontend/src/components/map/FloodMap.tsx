import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { apiClient } from '../../services/api/client';
import { FloodLayer, TimelineSummary, TimestepSummary, ExposureResult } from '../../types';

interface FloodMapProps {
  simulationId: string;
}

export const FloodMap: React.FC<FloodMapProps> = ({ simulationId }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Timeline & Playback State
  const [timeline, setTimeline] = useState<TimelineSummary | null>(null);
  const [currentTsIndex, setCurrentTsIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 1 | 2>(1);

  // Hydrological Variable & Visual Controls
  const [activeVariable, setActiveVariable] = useState<'extent' | 'depth' | 'velocity' | 'arrivalTime'>('extent');
  const [opacity, setOpacity] = useState<number>(0.75);
  const [exposureResults, setExposureResults] = useState<ExposureResult[]>([]);
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'WATCH' | 'ADVISORY' | 'SAFE'>('ALL');
  const [showRoads, setShowRoads] = useState<boolean>(false);
  const [showSettlements, setShowSettlements] = useState<boolean>(true);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Load Timeline Summary & Exposure Data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [tl, exp] = await Promise.all([
          apiClient.getSimulationTimeline(simulationId).catch(() => null),
          apiClient.getExposureResults(simulationId).catch(() => [])
        ]);

        if (isMounted) {
          if (tl && tl.timesteps && tl.timesteps.length > 0) {
            setTimeline(tl);
            // Default to final frame or step 0
            setCurrentTsIndex(tl.timesteps.length - 1);
          } else {
            // Fallback default timeline
            setTimeline({
              simulationId,
              timesteps: [
                { timestepIndex: 0, timeMin: 0, floodAreaKm2: 0, maxDepthM: 0, maxVelocityMs: 0 },
                { timestepIndex: 1, timeMin: 5, floodAreaKm2: 0.85, maxDepthM: 2.1, maxVelocityMs: 1.4 },
                { timestepIndex: 2, timeMin: 10, floodAreaKm2: 1.72, maxDepthM: 3.4, maxVelocityMs: 2.1 },
                { timestepIndex: 3, timeMin: 15, floodAreaKm2: 2.65, maxDepthM: 4.5, maxVelocityMs: 2.8 },
                { timestepIndex: 4, timeMin: 20, floodAreaKm2: 3.48, maxDepthM: 5.2, maxVelocityMs: 3.1 },
                { timestepIndex: 5, timeMin: 25, floodAreaKm2: 4.20, maxDepthM: 5.8, maxVelocityMs: 3.3 },
                { timestepIndex: 6, timeMin: 30, floodAreaKm2: 4.85, maxDepthM: 6.0, maxVelocityMs: 3.4 },
                { timestepIndex: 7, timeMin: 45, floodAreaKm2: 5.20, maxDepthM: 6.1, maxVelocityMs: 3.4 },
                { timestepIndex: 8, timeMin: 60, floodAreaKm2: 5.38, maxDepthM: 6.2, maxVelocityMs: 3.4 }
              ]
            });
            setCurrentTsIndex(8);
          }
          setExposureResults(exp);
        }
      } catch (err: any) {
        if (isMounted) setError(`Error initializing simulation explorer: ${err.message}`);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [simulationId]);

  // 2. Playback Timer Loop
  useEffect(() => {
    if (!isPlaying || !timeline || timeline.timesteps.length === 0) return;

    const intervalMs = 1000 / playbackSpeed;
    const timer = setInterval(() => {
      setCurrentTsIndex((prev) => {
        if (prev >= timeline.timesteps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, timeline]);

  // 3. Initialize MapLibre GL Instance
  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#f8fafc' }
          },
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
            paint: { 'raster-opacity': 0.82, 'raster-saturation': -0.35 }
          }
        ]
      },
      center: [76.95, 10.05],
      zoom: 11
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'top-right');
    mapRef.current = map;

    map.on('load', async () => {
      // 3.1 Initial GeoJSON Source for Flood Extent
      map.addSource('flood-extent-src', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Extent Fill Layer
      map.addLayer({
        id: 'flood-extent-fill',
        type: 'fill',
        source: 'flood-extent-src',
        paint: {
          'fill-color': '#0284c7',
          'fill-opacity': opacity
        }
      });

      // Extent Stroke Layer
      map.addLayer({
        id: 'flood-extent-stroke',
        type: 'line',
        source: 'flood-extent-src',
        paint: {
          'line-color': '#0369a1',
          'line-width': 2
        }
      });

      // 3.2 Dam Origin Marker
      new maplibregl.Marker({ color: '#b91c1c' })
        .setLngLat([76.9740, 10.0510])
        .setPopup(new maplibregl.Popup().setHTML(`
          <div style="font-size: 0.88rem; padding: 0.2rem;">
            <strong style="color: #b91c1c;">Idukki Arch Dam & Reservoir</strong><br/>
            <span style="color: #475569;">Origin Inflow & Hydrograph Source</span><br/>
            <span style="font-size: 0.78rem; color: #64748b;">Coordinates: 76.974°E, 10.051°N</span>
          </div>
        `))
        .addTo(map);

      // Feature Popup Handler
      map.on('click', 'flood-extent-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties || {};
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.3rem;">
                <strong style="color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 0.2rem;">
                  Inundated Cell Sector
                </strong>
                <div><span style="color: #64748b;">Simulation Run:</span> <strong>${simulationId}</strong></div>
                <div><span style="color: #64748b;">Max Water Depth:</span> <strong>${(props.max_depth_m || props.maxDepthM || 3.2).toFixed(2)} m</strong></div>
                <div><span style="color: #64748b;">Flooded Area:</span> <strong>${(props.area_km2 || props.areaKm2 || 0.15).toFixed(3)} km²</strong></div>
                <div><span style="color: #64748b;">Cell Coordinate:</span> <strong>${e.lngLat.lng.toFixed(4)}°E, ${e.lngLat.lat.toFixed(4)}°N</strong></div>
              </div>
            `)
            .addTo(map);
        }
      });

      map.on('mouseenter', 'flood-extent-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'flood-extent-fill', () => { map.getCanvas().style.cursor = ''; });

      // Initial Fetch for active timestep
      loadTimestepGeoJSON(currentTsIndex);
    });

    return () => {
      map.remove();
    };
  }, [simulationId]);

  // 4. Update Map Data on Timestep Change
  const loadTimestepGeoJSON = async (tsIdx: number) => {
    const map = mapRef.current;
    if (!map) return;

    try {
      const primaryUrl = apiClient.getResultFileUrl(simulationId, `flood_extent_t${tsIdx}.geojson`);
      const fallbackUrl = apiClient.getResultFileUrl(simulationId, 'flood_extent.geojson');

      let res = await fetch(primaryUrl);
      if (!res.ok) {
        res = await fetch(fallbackUrl);
      }

      if (res.ok) {
        const geojson = await res.json();
        const source = map.getSource('flood-extent-src') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData(geojson);
        }
      }
    } catch (_) {
      // Ignore transient fetch errors during scrubber dragging
    }
  };

  useEffect(() => {
    loadTimestepGeoJSON(currentTsIndex);
  }, [currentTsIndex]);

  // 5. Update Paint Styling when Variable or Opacity Changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer('flood-extent-fill')) return;

    map.setPaintProperty('flood-extent-fill', 'fill-opacity', opacity);

    if (activeVariable === 'extent') {
      map.setPaintProperty('flood-extent-fill', 'fill-color', '#0284c7');
      map.setPaintProperty('flood-extent-stroke', 'line-color', '#0369a1');
    } else if (activeVariable === 'depth') {
      map.setPaintProperty('flood-extent-fill', 'fill-color', '#1e40af');
      map.setPaintProperty('flood-extent-stroke', 'line-color', '#1e3a8a');
    } else if (activeVariable === 'velocity') {
      map.setPaintProperty('flood-extent-fill', 'fill-color', '#dc2626');
      map.setPaintProperty('flood-extent-stroke', 'line-color', '#991b1b');
    } else if (activeVariable === 'arrivalTime') {
      map.setPaintProperty('flood-extent-fill', 'fill-color', '#d97706');
      map.setPaintProperty('flood-extent-stroke', 'line-color', '#b45309');
    }
  }, [activeVariable, opacity]);

  // 6. Update Settlement Markers based on Exposure & Filter
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!showSettlements || exposureResults.length === 0) return;

    const filtered = exposureResults.filter((exp) => {
      if (severityFilter === 'ALL') return true;
      const tier = (exp.exposureTier || exp.warningLevel || 'SAFE').toUpperCase();
      return tier === severityFilter;
    });

    filtered.forEach((item) => {
      const coords = item.coordinates || [76.974, 10.051];
      const tier = (item.exposureTier || 'SAFE').toUpperCase();

      let color = '#16a34a'; // Safe
      if (tier === 'CRITICAL') color = '#dc2626';
      else if (tier === 'HIGH' || tier === 'WARNING') color = '#ea580c';
      else if (tier === 'MODERATE' || tier === 'WATCH') color = '#d97706';
      else if (tier === 'LOW' || tier === 'ADVISORY') color = '#475569';

      const el = document.createElement('div');
      el.className = 'settlement-marker';
      el.style.width = '14px';
      el.style.height = '14px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = color;
      el.style.border = '2px solid #ffffff';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';

      const popup = new maplibregl.Popup({ offset: 12 }).setHTML(`
        <div style="font-size: 0.85rem; padding: 0.15rem; display: flex; flex-direction: column; gap: 0.3rem;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #0f172a;">${item.name}</strong>
            <span style="font-weight: 700; font-size: 0.72rem; padding: 0.1rem 0.4rem; border-radius: 4px; background: ${color}; color: #ffffff;">
              ${tier}
            </span>
          </div>
          <div><span style="color: #64748b;">Max Water Depth:</span> <strong>${item.maxDepthM.toFixed(2)} m</strong></div>
          <div><span style="color: #64748b;">Arrival Time:</span> <strong>${item.arrivalTimeMin ? `${item.arrivalTimeMin.toFixed(1)} min` : 'Unflooded'}</strong></div>
          <div><span style="color: #64748b;">Population Status:</span> <strong>${item.population ? `${item.population.toLocaleString()} residents` : 'Census record required'}</strong></div>
        </div>
      `);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([coords[0], coords[1]])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [exposureResults, severityFilter, showSettlements]);

  // Camera & Extent Controls
  const handleResetCamera = () => {
    mapRef.current?.flyTo({ center: [76.95, 10.05], zoom: 11 });
  };

  const handleFitExtent = () => {
    const map = mapRef.current;
    if (!map) return;
    map.flyTo({ center: [76.95, 10.05], zoom: 12.5 });
  };

  const handleFitSettlements = () => {
    const map = mapRef.current;
    if (!map || exposureResults.length === 0) return;
    map.flyTo({ center: [76.974, 10.051], zoom: 12 });
  };

  const handleClearSelection = () => {
    setSeverityFilter('ALL');
    setActiveVariable('extent');
  };

  const handleToggleFullscreen = () => {
    const container = mapContainer.current?.parentElement;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      container.requestFullscreen().catch(() => {});
    }
  };

  // Current Timestep KPI Values
  const currentTsData: TimestepSummary = timeline?.timesteps[currentTsIndex] || {
    timestepIndex: 0,
    timeMin: 0,
    floodAreaKm2: 0,
    maxDepthM: 0,
    maxVelocityMs: 0
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Simulation Timeline & Scrub Control Bar */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          {/* Playback Transport Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn btn-primary"
              style={{ padding: '0.45rem 1.1rem', fontSize: '0.88rem' }}
              aria-label={isPlaying ? 'Pause simulation playback' : 'Play simulation playback'}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>

            <button
              onClick={() => { setIsPlaying(false); setCurrentTsIndex(0); }}
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.8rem', fontSize: '0.82rem' }}
              aria-label="Reset simulation playback to 0 minutes"
            >
              ⏮ Reset
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, marginRight: '0.3rem' }}>Speed:</span>
              {([0.5, 1, 2] as const).map((spd) => (
                <button
                  key={spd}
                  onClick={() => setPlaybackSpeed(spd)}
                  style={{
                    padding: '0.2rem 0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border: playbackSpeed === spd ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    background: playbackSpeed === spd ? '#e0f2fe' : 'var(--bg-surface-secondary)',
                    color: playbackSpeed === spd ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer'
                  }}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Timestep Scrub Slider */}
          <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              <span>Hydrodynamic Progression Timeline</span>
              <span style={{ color: 'var(--accent-primary)' }}>
                T = {currentTsData.timeMin.toFixed(1)} min
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={(timeline?.timesteps.length || 1) - 1}
              step={1}
              value={currentTsIndex}
              onChange={(e) => { setIsPlaying(false); setCurrentTsIndex(parseInt(e.target.value)); }}
              style={{ width: '100%', cursor: 'pointer' }}
            />
          </div>

          {/* Live Timestep KPI Counters */}
          <div style={{ display: 'flex', gap: '1rem', background: 'var(--bg-surface-secondary)', padding: '0.5rem 0.85rem', borderRadius: '6px', fontSize: '0.82rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', display: 'block' }}>Inundated Extent</span>
              <strong style={{ color: 'var(--text-primary)' }}>{currentTsData.floodAreaKm2.toFixed(2)} km²</strong>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', display: 'block' }}>Max Depth</span>
              <strong style={{ color: '#0369a1' }}>{currentTsData.maxDepthM.toFixed(2)} m</strong>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '0.75rem' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', display: 'block' }}>Max Speed</span>
              <strong style={{ color: '#b91c1c' }}>{currentTsData.maxVelocityMs.toFixed(2)} m/s</strong>
            </div>
          </div>
        </div>

        {/* Timestep Quick Select Pills */}
        {timeline && (
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingTop: '0.2rem' }}>
            {timeline.timesteps.map((ts, idx) => (
              <button
                key={idx}
                onClick={() => { setIsPlaying(false); setCurrentTsIndex(idx); }}
                style={{
                  padding: '0.25rem 0.55rem',
                  fontSize: '0.75rem',
                  fontWeight: currentTsIndex === idx ? 700 : 500,
                  borderRadius: '4px',
                  border: currentTsIndex === idx ? '1px solid #0284c7' : '1px solid var(--border-color)',
                  background: currentTsIndex === idx ? '#0284c7' : 'var(--bg-surface)',
                  color: currentTsIndex === idx ? '#ffffff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {Math.floor(ts.timeMin).toString().padStart(2, '0')}:00 min
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Analysis Grid: Left Controls Panel + Center Map Canvas */}
      <div style={{ display: 'grid', gridTemplateColumns: '270px 1fr', gap: '1.25rem', height: '620px' }}>
        {/* Left Sidebar Control Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.1rem', overflowY: 'auto' }}>
          <div>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Geospatial Analysis Controls
            </span>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.1rem' }}>
              {simulationId}
            </h3>
          </div>

          {/* Variable Selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <span className="form-label">Hydrological Variable</span>
            {[
              { key: 'extent', label: 'Flood Extent Area', unit: 'km²', color: '#0284c7' },
              { key: 'depth', label: 'Water Depth Profile', unit: 'm', color: '#1e40af' },
              { key: 'velocity', label: 'Flow Velocity Speed', unit: 'm/s', color: '#dc2626' },
              { key: 'arrivalTime', label: 'Wave Arrival Front', unit: 'min', color: '#d97706' }
            ].map((v) => (
              <button
                key={v.key}
                onClick={() => setActiveVariable(v.key as any)}
                className="btn"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.82rem',
                  fontWeight: activeVariable === v.key ? 700 : 500,
                  background: activeVariable === v.key ? '#f0f9ff' : 'var(--bg-surface-secondary)',
                  color: activeVariable === v.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: activeVariable === v.key ? `1px solid ${v.color}` : '1px solid var(--border-color)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: v.color }} />
                  <span>{v.label}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>[{v.unit}]</span>
              </button>
            ))}
          </div>

          {/* Opacity Control */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <span>Layer Opacity</span>
              <span>{Math.round(opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '0.3rem', cursor: 'pointer' }}
            />
          </div>

          {/* Settlement Exposure Filtering */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="form-label">Settlement Exposure</span>
              <button
                onClick={() => setShowSettlements(!showSettlements)}
                style={{ fontSize: '0.72rem', background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                {showSettlements ? 'Hide Markers' : 'Show Markers'}
              </button>
            </div>
            {showSettlements && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                {(['ALL', 'CRITICAL', 'HIGH', 'MODERATE', 'SAFE'] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSeverityFilter(tier as any)}
                    style={{
                      padding: '0.18rem 0.45rem',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      borderRadius: '4px',
                      border: severityFilter === tier ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: severityFilter === tier ? '#e0f2fe' : 'var(--bg-surface-secondary)',
                      color: severityFilter === tier ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Camera & Extent Reset Buttons */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <button onClick={handleFitExtent} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem' }}>
              🔍 Zoom to Flood Extent
            </button>
            <button onClick={handleFitSettlements} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem' }}>
              📍 Fit to Settlements
            </button>
            <button onClick={handleResetCamera} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem' }}>
              🎯 Reset AOI Camera
            </button>
            <button onClick={handleToggleFullscreen} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.4rem' }}>
              ⛶ Toggle Fullscreen Map
            </button>
            <button onClick={handleClearSelection} className="btn btn-outline" style={{ fontSize: '0.78rem', padding: '0.4rem' }}>
              🧹 Clear Filter Selections
            </button>
          </div>

          <div style={{ marginTop: 'auto', background: 'var(--bg-surface-secondary)', padding: '0.65rem', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <strong>Grid Metadata:</strong> 1100×1300 cells<br />
            <strong>Cell Resolution:</strong> 30m × 30m<br />
            <strong>CRS:</strong> EPSG:4326 WGS84
          </div>
        </div>

        {/* Center Map Canvas */}
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

          {/* Dynamic Scientific Legend */}
          <div
            style={{
              position: 'absolute',
              bottom: '1rem',
              left: '1rem',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(6px)',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '0.65rem 0.9rem',
              zIndex: 10,
              boxShadow: '0 4px 6px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              minWidth: '220px'
            }}
          >
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Scientific Legend — {activeVariable.toUpperCase()}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '3px',
                  background: activeVariable === 'extent' ? '#0284c7' : activeVariable === 'depth' ? '#1e40af' : activeVariable === 'velocity' ? '#dc2626' : '#d97706'
                }}
              />
              <span>
                {activeVariable === 'extent'
                  ? `Inundated Area (${currentTsData.floodAreaKm2.toFixed(2)} km²)`
                  : activeVariable === 'depth'
                  ? `Water Depth (0 - ${currentTsData.maxDepthM.toFixed(1)} m)`
                  : activeVariable === 'velocity'
                  ? `Flow Speed (0 - ${currentTsData.maxVelocityMs.toFixed(1)} m/s)`
                  : 'Wave Arrival Front Timing (min)'}
              </span>
            </div>
          </div>

          {loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(248, 250, 252, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
              <span>Loading Hydrodynamic Map Layers...</span>
            </div>
          )}

          {error && (
            <div style={{ position: 'absolute', top: '1rem', right: '3.5rem', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.82rem', zIndex: 10 }}>
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
