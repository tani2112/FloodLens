import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status?.toLowerCase() || 'pending';
  let className = 'badge-pending';
  if (s === 'completed') className = 'badge-completed';
  else if (s === 'running') className = 'badge-running';
  else if (s === 'failed') className = 'badge-failed';

  return (
    <span className={`badge ${className}`}>
      {status?.toUpperCase() || 'PENDING'}
    </span>
  );
};
