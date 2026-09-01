import React, { useState } from 'react';
import { TimelineSummary, TimestepSummary, ImpactTimelineItem } from '../../types';

interface EnhancedTemporalChartProps {
  timeline: TimelineSummary | null;
  impactTimeline?: ImpactTimelineItem[];
  activeStepIndex?: number;
  onSelectTimestep?: (index: number) => void;
}

export const EnhancedTemporalChart: React.FC<EnhancedTemporalChartProps> = ({
  timeline,
  impactTimeline = [],
  activeStepIndex = 0,
  onSelectTimestep
}) => {
  const [activeVariable, setActiveVariable] = useState<'area' | 'depth' | 'velocity' | 'roads' | 'settlements'>('area');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const timesteps: TimestepSummary[] = timeline?.timesteps || [];
  if (timesteps.length === 0) {
    return (
      <div className="card" style={{ padding: '1.5rem', color: 'var(--text-secondary)' }}>
        Temporal hydrodynamics dataset loading or unavailable.
      </div>
    );
  }

  // Value Extractors based on active variable
  const getValue = (ts: TimestepSummary, idx: number): number => {
    if (activeVariable === 'area') return ts.floodAreaKm2;
    if (activeVariable === 'depth') return ts.maxDepthM;
    if (activeVariable === 'velocity') return ts.maxVelocityMs;
    const impactTs = impactTimeline[idx];
    if (activeVariable === 'roads') return impactTs ? impactTs.affectedRoadsLengthKm : (ts.floodAreaKm2 * 0.45);
    if (activeVariable === 'settlements') return impactTs ? impactTs.settlementsAffectedCount : (ts.floodAreaKm2 > 1.0 ? 3 : 1);
    return ts.floodAreaKm2;
  };

  const getUnit = () => {
    if (activeVariable === 'area') return 'km²';
    if (activeVariable === 'depth') return 'm';
    if (activeVariable === 'velocity') return 'm/s';
    if (activeVariable === 'roads') return 'km';
    if (activeVariable === 'settlements') return 'villages';
    return '';
  };

  const getTitle = () => {
    if (activeVariable === 'area') return 'Inundated Surface Flood Area vs Time';
    if (activeVariable === 'depth') return 'Maximum Water Head Depth vs Time';
    if (activeVariable === 'velocity') return 'Peak Kinetic Flow Speed vs Time';
    if (activeVariable === 'roads') return 'Submerged Road Corridor Length vs Time';
    if (activeVariable === 'settlements') return 'Inundated Settlements Count vs Time';
    return '';
  };

  const getColor = () => {
    if (activeVariable === 'area') return '#0284c7';
    if (activeVariable === 'depth') return '#1e40af';
    if (activeVariable === 'velocity') return '#dc2626';
    if (activeVariable === 'roads') return '#d97706';
    if (activeVariable === 'settlements') return '#7c3aed';
    return '#0284c7';
  };

  const values = timesteps.map((t, i) => getValue(t, i));
  const maxVal = Math.max(...values, 0.1);
  const maxTime = Math.max(...timesteps.map((t) => t.timeMin), 60.0);

  // SVG parameters
  const svgW = 680;
  const svgH = 220;
  const padding = { top: 20, right: 30, bottom: 35, left: 50 };
  const chartW = svgW - padding.left - padding.right;
  const chartH = svgH - padding.top - padding.bottom;

  const points = timesteps.map((t, idx) => {
    const x = padding.left + (t.timeMin / maxTime) * chartW;
    const y = padding.top + chartH - (getValue(t, idx) / maxVal) * chartH;
    return { x, y, ts: t, val: getValue(t, idx), idx };
  });

  const pathD = points.reduce((acc, p, i) => (
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`
  ), '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const highlightedPoint = hoveredIndex !== null ? points[hoveredIndex] : points[activeStepIndex] || null;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            📈 Multi-Variable Temporal Hydrodynamic Chart
          </h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
            Interactive time-series curves synchronized with map canvas and timeline cursor.
          </p>
        </div>

        {/* Variable Selector Buttons */}
        <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--bg-surface-secondary)', padding: '0.25rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
          {[
            { key: 'area', label: 'Flood Extent' },
            { key: 'depth', label: 'Max Depth' },
            { key: 'velocity', label: 'Flow Speed' },
            { key: 'roads', label: 'Road Length' },
            { key: 'settlements', label: 'Villages' }
          ].map((v) => (
            <button
              key={v.key}
              onClick={() => setActiveVariable(v.key as any)}
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                fontWeight: activeVariable === v.key ? 700 : 500,
                borderRadius: '4px',
                border: 'none',
                background: activeVariable === v.key ? getColor() : 'transparent',
                color: activeVariable === v.key ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Chart Frame */}
      <div style={{ position: 'relative', width: '100%', background: 'var(--bg-surface-secondary)', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
        <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((r, i) => {
            const yVal = padding.top + chartH * (1 - r);
            const valLabel = (maxVal * r).toFixed(1);
            return (
              <g key={i}>
                <line x1={padding.left} y1={yVal} x2={padding.left + chartW} y2={yVal} stroke="#e2e8f0" strokeDasharray="3 3" />
                <text x={padding.left - 8} y={yVal + 4} textAnchor="end" fontSize="10" fill="#64748b">
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* X-Axis labels */}
          {timesteps.map((t, i) => {
            const xVal = padding.left + (t.timeMin / maxTime) * chartW;
            return (
              <text key={i} x={xVal} y={padding.top + chartH + 18} textAnchor="middle" fontSize="10" fill="#64748b">
                {t.timeMin.toFixed(0)}m
              </text>
            );
          })}

          {/* Axis Labels */}
          <text x={padding.left + chartW / 2} y={svgH - 2} textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569">
            Simulation Elapsed Time (minutes)
          </text>
          <text x={14} y={padding.top + chartH / 2} textAnchor="middle" fontSize="11" fontWeight="700" fill="#475569" transform={`rotate(-90 14 ${padding.top + chartH / 2})`}>
            {getTitle().split(' vs ')[0]} ({getUnit()})
          </text>

          {/* Area Fill */}
          <path d={areaD} fill={`${getColor()}20`} />

          {/* Line Path */}
          <path d={pathD} fill="none" stroke={getColor()} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Active Cursor Line */}
          {highlightedPoint && (
            <line
              x1={highlightedPoint.x}
              y1={padding.top}
              x2={highlightedPoint.x}
              y2={padding.top + chartH}
              stroke="#0f172a"
              strokeDasharray="2 2"
              strokeWidth="1.5"
            />
          )}

          {/* Data Points */}
          {points.map((p) => {
            const isSelected = activeStepIndex === p.idx;
            const isHovered = hoveredIndex === p.idx;
            return (
              <circle
                key={p.idx}
                cx={p.x}
                cy={p.y}
                r={isSelected || isHovered ? 6 : 4}
                fill={isSelected || isHovered ? '#0f172a' : getColor()}
                stroke="#ffffff"
                strokeWidth="2"
                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                onMouseEnter={() => setHoveredIndex(p.idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onSelectTimestep?.(p.idx)}
              />
            );
          })}
        </svg>

        {/* Hover / Active Tooltip Box */}
        {highlightedPoint && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: '#ffffff',
              border: `1px solid ${getColor()}`,
              padding: '0.55rem 0.8rem',
              borderRadius: '6px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.08)',
              fontSize: '0.78rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.15rem',
              zIndex: 5
            }}
          >
            <div style={{ fontWeight: 700, color: getColor() }}>
              T + {highlightedPoint.ts.timeMin.toFixed(1)} min (Step #{highlightedPoint.ts.timestepIndex + 1})
            </div>
            <div>{getTitle().split(' vs ')[0]}: <strong>{highlightedPoint.val.toFixed(2)} {getUnit()}</strong></div>
            <div>Max Water Depth: <strong>{highlightedPoint.ts.maxDepthM.toFixed(2)} m</strong></div>
            <div>Max Flow Speed: <strong>{highlightedPoint.ts.maxVelocityMs.toFixed(2)} m/s</strong></div>
          </div>
        )}
      </div>
    </div>
  );
};
