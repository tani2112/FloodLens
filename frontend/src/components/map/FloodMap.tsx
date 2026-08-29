import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { apiClient } from '../../services/api/client';
import { FloodLayer } from '../../types';

interface FloodMapProps {
  simulationId: string;
}

export const FloodMap: React.FC<FloodMapProps> = ({ simulationId }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  
  const [layers, setLayers] = useState<FloodLayer[]>([]);
  const [activeLayerType, setActiveLayerType] = useState<'extent' | 'depth' | 'velocity' | 'arrivalTime'>('extent');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize MapLibre GL Map
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
            id: 'dark-background',
            type: 'background',
            paint: { 'background-color': '#0B1220' }
          },
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
            paint: { 'raster-opacity': 0.35, 'raster-saturation': -0.8 }
          }
        ]
      },
      center: [76.9740, 10.0510], // Idukki Canonical AOI center
      zoom: 11
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    mapRef.current = map;

    // Fetch layers and flood extent GeoJSON
    async function loadMapData() {
      try {
        setLoading(true);
        const fileUrl = apiClient.getResultFileUrl(simulationId, 'flood_extent.geojson');
        const descLayers = await apiClient.getFloodLayers(simulationId);
        setLayers(descLayers);

        map.on('load', async () => {
          try {
            const geojsonRes = await fetch(fileUrl);
            if (geojsonRes.ok) {
              const geojsonData = await geojsonRes.json();

              map.addSource('flood-extent-src', {
                type: 'geojson',
                data: geojsonData
              });

              // Extent Polygon Fill Layer
              map.addLayer({
                id: 'flood-extent-fill',
                type: 'fill',
                source: 'flood-extent-src',
                paint: {
                  'fill-color': '#0EA5E9',
                  'fill-opacity': 0.6
                }
              });

              // Extent Outline Layer
              map.addLayer({
                id: 'flood-extent-stroke',
                type: 'line',
                source: 'flood-extent-src',
                paint: {
                  'line-color': '#38BDF8',
                  'line-width': 2
                }
              });

              // Add Idukki Dam Marker
              new maplibregl.Marker({ color: '#EF4444' })
                .setLngLat([76.9740, 10.0510])
                .setPopup(new maplibregl.Popup().setHTML('<strong>Idukki Arch Dam</strong><br/>Breach Source Origin'))
                .addTo(map);

              // Fit map to flood extent bounding box if features exist
              if (geojsonData.features && geojsonData.features.length > 0) {
                const bounds = new maplibregl.LngLatBounds();
                geojsonData.features.forEach((feature: any) => {
                  const coords = feature.geometry.coordinates;
                  const processCoords = (arr: any) => {
                    if (typeof arr[0] === 'number') {
                      bounds.extend(arr as [number, number]);
                    } else {
                      arr.forEach(processCoords);
                    }
                  };
                  processCoords(coords);
                });
                if (!bounds.isEmpty()) {
                  map.fitBounds(bounds, { padding: 40, maxZoom: 14 });
                }
              }
            }
          } catch (e: any) {
            setError(`Failed loading flood extent GeoJSON: ${e.message}`);
          } finally {
            setLoading(false);
          }
        });
      } catch (err: any) {
        setError(`Failed fetching layer descriptors: ${err.message}`);
        setLoading(false);
      }
    }

    loadMapData();

    return () => {
      map.remove();
    };
  }, [simulationId]);

  // Handle Layer Toggle
  const handleToggleLayer = (layerType: 'extent' | 'depth' | 'velocity' | 'arrivalTime') => {
    setActiveLayerType(layerType);
    const map = mapRef.current;
    if (!map || !map.getLayer('flood-extent-fill')) return;

    if (layerType === 'extent') {
      map.setPaintProperty('flood-extent-fill', 'fill-color', '#0EA5E9');
      map.setPaintProperty('flood-extent-fill', 'fill-opacity', 0.6);
    } else if (layerType === 'depth') {
      map.setPaintProperty('flood-extent-fill', 'fill-color', '#2563EB');
      map.setPaintProperty('flood-extent-fill', 'fill-opacity', 0.75);
    } else if (layerType === 'velocity') {
      map.setPaintProperty('flood-extent-fill', 'fill-color', '#F97316');
      map.setPaintProperty('flood-extent-fill', 'fill-opacity', 0.7);
    } else if (layerType === 'arrivalTime') {
      map.setPaintProperty('flood-extent-fill', 'fill-color', '#EAB308');
      map.setPaintProperty('flood-extent-fill', 'fill-opacity', 0.65);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Layer Control Panel Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          background: 'rgba(17, 26, 46, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '0.75rem',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          minWidth: '200px'
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Map Layers
        </span>
        {[
          { key: 'extent', label: 'Flood Extent' },
          { key: 'depth', label: 'Water Depth (m)' },
          { key: 'velocity', label: 'Velocity (m/s)' },
          { key: 'arrivalTime', label: 'Arrival Time (min)' }
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => handleToggleLayer(item.key as any)}
            className="btn"
            style={{
              justifyContent: 'flex-start',
              padding: '0.35rem 0.65rem',
              fontSize: '0.8rem',
              background: activeLayerType === item.key ? 'var(--accent-cyan)' : 'transparent',
              color: activeLayerType === item.key ? '#000' : 'var(--text-primary)',
              border: '1px solid var(--border-color)'
            }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Dynamic Map Legend Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          left: '1rem',
          background: 'rgba(17, 26, 46, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem'
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Legend — {activeLayerType.toUpperCase()}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
          <div style={{ width: '16px', height: '16px', borderRadius: '3px', background: activeLayerType === 'extent' ? '#0EA5E9' : activeLayerType === 'depth' ? '#2563EB' : activeLayerType === 'velocity' ? '#F97316' : '#EAB308' }} />
          <span>{activeLayerType === 'extent' ? 'Inundated Extent' : activeLayerType === 'depth' ? 'Depth > 0.1m' : activeLayerType === 'velocity' ? 'Flow Speed' : 'Arrival Time'}</span>
        </div>
      </div>

      {loading && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(11, 18, 32, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
          <span>Loading Hydrodynamic Map Layers...</span>
        </div>
      )}

      {error && (
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#450A0A', border: '1px solid #7F1D1D', color: '#FCA5A5', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', zIndex: 10 }}>
          {error}
        </div>
      )}
    </div>
  );
};
