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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', padding: '0.85rem 1.25rem', background: '#E2ECE5', border: '1px solid #8EAE9D', borderRadius: '8px', boxShadow: '0 1px 4px rgba(8, 28, 21, 0.08)' }}>
      {steps.map((step, idx) => {
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;

        return (
          <React.Fragment key={step.number}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  background: isCompleted ? '#134227' : isActive ? '#006E52' : '#C7D9CE',
                  color: isCompleted || isActive ? '#FFFFFF' : '#395E50',
                  border: isCompleted ? '2px solid #134227' : isActive ? '2px solid #006E52' : '1.5px solid #8EAE9D',
                  boxShadow: isActive ? '0 0 0 3px rgba(0, 110, 82, 0.25)' : 'none'
                }}
              >
                {isCompleted ? '✓' : step.number}
              </div>
              <span
                style={{
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 800 : isCompleted ? 700 : 600,
                  color: isActive ? '#081C15' : isCompleted ? '#134227' : '#395E50'
                }}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{ flex: 1, height: '2.5px', margin: '0 0.85rem', borderRadius: '2px', background: isCompleted ? '#134227' : '#8EAE9D' }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
