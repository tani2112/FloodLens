import React from 'react';

interface SeverityBadgeProps {
  severity: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const s = severity?.toLowerCase() || 'advisory';
  let className = 'badge-advisory';
  if (s.includes('critical')) className = 'badge-critical';
  else if (s.includes('high') || s.includes('warning')) className = 'badge-warning';
  else if (s.includes('watch') || s.includes('moderate')) className = 'badge-watch';
  else if (s.includes('safe') || s.includes('low') || s.includes('advisory')) className = 'badge-safe';

  return (
    <span className={`badge ${className}`}>
      {severity?.toUpperCase() || 'ADVISORY'}
    </span>
  );
};
