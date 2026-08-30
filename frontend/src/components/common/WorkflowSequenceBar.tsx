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

  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #bae6fd',
        borderRadius: '8px',
        padding: '0.65rem 0.85rem',
        marginBottom: '0.85rem',
        boxShadow: '0 1px 3px rgba(0,149,255,0.06)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            OPERATIONAL WORKFLOW SEQUENCE
          </span>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, background: '#e0f2fe', color: '#0369a1', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
            Nepal Demonstration Baseline (NP-2026-08-26-001)
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
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#475569',
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
                border: '1px solid #0284c7',
                background: '#0284c7',
                color: '#ffffff',
                cursor: 'pointer'
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
                background: isActive ? '#e0f2fe' : isCompleted ? '#f0fdf4' : '#f8fafc',
                border: isActive ? '1.5px solid #0284c7' : isCompleted ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
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
                  background: isActive ? '#0284c7' : isCompleted ? '#16a34a' : '#cbd5e1',
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
                    color: isActive ? '#0369a1' : isCompleted ? '#15803d' : '#334155',
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
                    color: isActive ? '#0284c7' : isCompleted ? '#16a34a' : '#64748b',
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
