import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface WorkflowSequenceBarProps {
  currentStep?: 1 | 2 | 3 | 4 | 5;
  activeSimulationId?: string;
}

export const WorkflowSequenceBar: React.FC<WorkflowSequenceBarProps> = ({
  currentStep,
  activeSimulationId = 'NP-2026-08-26-001'
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-detect current step if not explicitly provided
  const getDetectedStep = (): 1 | 2 | 3 | 4 | 5 => {
    if (currentStep) return currentStep;
    const path = location.pathname;
    if (path.includes('/study-areas') || path.includes('/simulations/new/study-area') || path.includes('/case-studies')) return 1;
    if (path.includes('/simulations/new/scenario')) return 2;
    if (path.includes('/simulations/new/model') || path.includes('/simulations/new/review') || path.includes('/progress')) return 3;
    if (path.includes('/map') || path === '/' || path.includes('/overview') || path.includes('/results')) return 4;
    if (path.includes('/impact') || path.includes('/warnings')) return 5;
    return 1;
  };

  const activeStepNum = getDetectedStep();

  const steps = [
    {
      step: 1,
      title: '1. Select River & Dam',
      subtitle: 'Catchment & Baseline DEM',
      path: '/study-areas'
    },
    {
      step: 2,
      title: '2. Configure Breach Scenario',
      subtitle: 'Reservoir & Breach Width',
      path: `/simulations/new/scenario?studyAreaId=bhotekoshi-nepal`
    },
    {
      step: 3,
      title: '3. Run Simulation',
      subtitle: '2D Hydrodynamic Solver',
      path: `/simulations/new/review`
    },
    {
      step: 4,
      title: '4. View Dynamic Inundation Map',
      subtitle: 'Wavefront & Depth Timelines',
      path: `/simulations/${activeSimulationId}/map`
    },
    {
      step: 5,
      title: '5. Analyze Impact & Evacuation',
      subtitle: 'Settlements, Roads & Alerts',
      path: `/simulations/${activeSimulationId}/impact`
    }
  ];

  const getScenarioLabel = (id: string) => {
    const s = (id || '').toLowerCase();
    if (s.includes('rishi') || s.includes('uk-') || s.includes('chamoli') || s.includes('uttarakhand')) return 'Rishi Ganga Flash Flood (UK-2021-02-07-001)';
    if (s.includes('phuktal') || s.includes('ld-') || s.includes('zanskar') || s.includes('ladakh')) return 'Phuktal River Landslide Dam (LD-2015-03-15-001)';
    if (s.includes('wapriyang') || s.includes('wp-') || s.includes('siang')) return 'Wapriyang Landslide Outburst (WP-2021-11-12-001)';
    if (s.includes('kosi') || s.includes('ks-') || s.includes('kushaha') || s.includes('bihar')) return 'Kosi Kushaha Embankment Breach (KS-2008-08-18-001)';
    return 'Nepal Demonstration Baseline (NP-2026-08-26-001)';
  };

  return (
    <div
      style={{
        background: '#C7D9CE',
        border: '1px solid #8EAE9D',
        borderRadius: '8px',
        padding: '0.65rem 0.85rem',
        marginBottom: '0.85rem',
        boxShadow: '0 1px 4px rgba(8, 28, 21, 0.08)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#081C15', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            OPERATIONAL WORKFLOW SEQUENCE
          </span>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#E2ECE5', color: '#13382B', border: '1px solid #8EAE9D', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
            {getScenarioLabel(activeSimulationId)}
          </span>
        </div>

        {/* Step Navigation Controls */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {activeStepNum > 1 && (
            <button
              onClick={() => navigate(steps[activeStepNum - 2].path)}
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.2rem 0.55rem',
                borderRadius: '4px',
                border: '1px solid #8EAE9D',
                background: '#E2ECE5',
                color: '#081C15',
                cursor: 'pointer'
              }}
            >
              ← Back to Step {activeStepNum - 1}
            </button>
          )}
          {activeStepNum < 5 && (
            <button
              onClick={() => navigate(steps[activeStepNum].path)}
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '0.2rem 0.65rem',
                borderRadius: '4px',
                border: '1px solid #00A37A',
                background: '#006E52',
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 110, 82, 0.3)'
              }}
            >
              Proceed to Step {activeStepNum + 1} →
            </button>
          )}
        </div>
      </div>

      {/* 5 Stepper Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', alignItems: 'stretch' }}>
        {steps.map((item) => {
          const isActive = item.step === activeStepNum;
          const isCompleted = item.step < activeStepNum;

          return (
            <div
              key={item.step}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.55rem',
                borderRadius: '6px',
                background: isActive ? '#E2ECE5' : isCompleted ? '#D4EDD9' : '#E2ECE5',
                border: isActive ? '1.5px solid #006E52' : isCompleted ? '1px solid #9ECDA7' : '1px solid #A4C3B2',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: isActive ? '#006E52' : isCompleted ? '#134227' : '#8EAE9D',
                  color: '#ffffff',
                  flexShrink: 0
                }}
              >
                {isCompleted ? '✓' : item.step}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: isActive ? 800 : 700,
                    color: isActive ? '#081C15' : isCompleted ? '#134227' : '#13382B',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: isActive ? '#006E52' : isCompleted ? '#1E5C3A' : '#395E50',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {item.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
