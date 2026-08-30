import React from 'react';

interface SimulationStepperProps {
  currentStep: 1 | 2 | 3 | 4;
}

export const SimulationStepper: React.FC<SimulationStepperProps> = ({ currentStep }) => {
  const steps = [
    { number: 1, label: '01 Study Area' },
    { number: 2, label: '02 Scenario' },
    { number: 3, label: '03 Model' },
    { number: 4, label: '04 Review' }
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', padding: '0.75rem 1.25rem', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
      {steps.map((step, idx) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;

        return (
          <React.Fragment key={step.number}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: isCompleted ? 'var(--accent-emerald)' : isActive ? 'var(--accent-primary)' : 'var(--bg-surface-secondary)',
                  color: isCompleted || isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: isActive ? '2px solid var(--accent-primary)' : '1px solid var(--border-strong)'
                }}
              >
                {isCompleted ? '✓' : step.number}
              </div>
              <span
                style={{
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 700 : isCompleted ? 600 : 500,
                  color: isActive ? 'var(--text-primary)' : isCompleted ? 'var(--text-secondary)' : 'var(--text-muted)'
                }}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{ flex: 1, height: '2px', margin: '0 0.75rem', background: isCompleted ? 'var(--accent-emerald)' : 'var(--border-color)' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
