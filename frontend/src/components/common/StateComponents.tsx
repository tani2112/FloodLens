import React from 'react';

export interface LoadingStateProps {
  message?: string;
  subtext?: string;
  inline?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading simulation data...',
  subtext = 'Processing hydrodynamic matrices and spatial vectors',
  inline = false
}) => {
  if (inline) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
        <span className="spinner" style={{ width: '14px', height: '14px', border: '2px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span>{message}</span>
      </div>
    );
  }

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center', gap: '0.75rem' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{message}</h4>
      {subtext && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '400px' }}>{subtext}</p>}
    </div>
  );
};

export interface SkeletonProps {
  height?: string;
  width?: string;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  height = '1rem',
  width = '100%',
  borderRadius = '4px',
  className = ''
}) => {
  return (
    <div
      className={`skeleton-loader ${className}`}
      style={{
        height,
        width,
        borderRadius,
        background: 'linear-gradient(90deg, var(--bg-surface-secondary) 25%, var(--bg-surface-muted) 50%, var(--bg-surface-secondary) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite'
      }}
    />
  );
};

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  description = 'No matching simulation records or spatial vectors are available for the selected parameters.',
  actionLabel,
  onAction,
  icon = '📂'
}) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1.5rem', textAlign: 'center', gap: '0.75rem' }}>
      <span style={{ fontSize: '2.5rem', lineHeight: 1 }} role="img" aria-label="empty">
        {icon}
      </span>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '440px' }}>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
  backLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Simulation Data',
  message = 'An unexpected network error occurred while querying simulation artifacts or spatial layers.',
  onRetry,
  onBack,
  backLabel = 'Back to Simulations'
}) => {
  return (
    <div className="card" style={{ borderColor: 'var(--severity-critical-border)', background: 'var(--severity-critical-bg)', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--severity-critical-text)' }}>
        <span style={{ fontSize: '1.25rem' }}>⚠️</span>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>{title}</h3>
      </div>
      <p style={{ fontSize: '0.88rem', color: 'var(--severity-critical-text)', margin: 0, opacity: 0.9 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.35rem' }}>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-primary" style={{ background: '#991b1b', borderColor: '#7f1d1d' }}>
            🔄 Retry Request
          </button>
        )}
        {onBack && (
          <button onClick={onBack} className="btn btn-secondary">
            ← {backLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export interface ApiDisconnectedStateProps {
  onRetry?: () => void;
}

export const ApiDisconnectedState: React.FC<ApiDisconnectedStateProps> = ({ onRetry }) => {
  return (
    <div className="card" style={{ borderColor: '#fde68a', background: '#fffbeb', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e' }}>
        <span style={{ fontSize: '1.2rem' }}>⚡</span>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>Backend REST Service Unavailable</h3>
      </div>
      <p style={{ fontSize: '0.85rem', color: '#92400e', margin: 0 }}>
        Unable to connect to the local FloodLens FastAPI backend service (`http://localhost:8000`). Please verify the backend service is running and accessible.
      </p>
      {onRetry && (
        <div>
          <button onClick={onRetry} className="btn btn-secondary" style={{ borderColor: '#d97706', color: '#92400e' }}>
            🔄 Reconnect to Backend
          </button>
        </div>
      )}
    </div>
  );
};

export interface NotFoundStateProps {
  resourceName?: string;
  resourceId?: string;
  onBack?: () => void;
}

export const NotFoundState: React.FC<NotFoundStateProps> = ({
  resourceName = 'Simulation Record',
  resourceId,
  onBack
}) => {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ fontSize: '2.5rem' }}>🔍</span>
      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
        {resourceName} Not Found
      </h3>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '420px' }}>
        {resourceId ? `The requested ID "${resourceId}" does not exist or has been removed.` : 'The requested resource could not be found in the current workspace.'}
      </p>
      {onBack && (
        <button onClick={onBack} className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
          ← Return to Registry
        </button>
      )}
    </div>
  );
};

export interface InlineErrorProps {
  message: string;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message }) => {
  return (
    <div style={{ background: 'var(--severity-critical-bg)', border: '1px solid var(--severity-critical-border)', color: 'var(--severity-critical-text)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 600 }}>
      ⚠️ {message}
    </div>
  );
};

export interface ToastProps {
  message: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => {
  const bgMap = {
    success: 'var(--status-completed-bg)',
    info: 'var(--status-running-bg)',
    warning: 'var(--severity-watch-bg)',
    error: 'var(--severity-critical-bg)'
  };

  const borderMap = {
    success: 'var(--status-completed-border)',
    info: 'var(--status-running-border)',
    warning: 'var(--severity-watch-border)',
    error: 'var(--severity-critical-border)'
  };

  const textMap = {
    success: 'var(--status-completed-text)',
    info: 'var(--status-running-text)',
    warning: 'var(--severity-watch-text)',
    error: 'var(--severity-critical-text)'
  };

  return (
    <div
      style={{
        background: bgMap[type],
        border: `1px solid ${borderMap[type]}`,
        color: textMap[type],
        padding: '0.75rem 1rem',
        borderRadius: '6px',
        fontSize: '0.85rem',
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}
    >
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 800, fontSize: '1rem', marginLeft: '0.75rem' }}>
          ×
        </button>
      )}
    </div>
  );
};

export interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDangerous?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  isDangerous = false
}) => {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{title}</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>{message}</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button onClick={onCancel} className="btn btn-secondary">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="btn btn-primary"
            style={{
              background: isDangerous ? '#dc2626' : 'var(--accent-primary)',
              borderColor: isDangerous ? '#b91c1c' : 'var(--accent-primary)'
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
