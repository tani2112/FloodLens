import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { ValidationResult } from '../types';
import { KpiCard } from '../components/common/KpiCard';
import { ScientificDisclaimer } from '../components/common/ScientificDisclaimer';

import { LoadingState, ErrorState } from '../components/common/StateComponents';

export const ValidationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const simId = id || 'NP-2026-08-26-001';

  const [val, setVal] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchValidation = () => {
    setLoading(true);
    setError(null);
    apiClient.getValidation(simId)
      .then((data) => {
        setVal(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.detail || err.message || 'Failed loading validation data');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchValidation();
  }, [simId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '950px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Sentinel-1 Satellite Observation Validation
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Quantitative IoU, Precision, and Recall spatial overlap comparison against satellite SAR inundation masks.
        </p>
      </div>

      <ScientificDisclaimer />

      <div className="card" style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', fontSize: '0.85rem' }}>
        <strong>Nepal Himalayan validation context:</strong> Sentinel-1 SAR and Sentinel-2 imagery can be used to compare modeled inundation along the Lhende Khola → Bhote Koshi corridor.
      </div>

      {loading ? (
        <LoadingState message="Loading satellite validation metrics..." />
      ) : error ? (
        <ErrorState title="Satellite Validation Error" message={error} onRetry={fetchValidation} />
      ) : val ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            <KpiCard
              label="Intersection over Union (IoU)"
              value={(val.iou * 100).toFixed(1)}
              unit="%"
              subtext="Spatial overlap agreement"
              badge="Overlap"
            />

            <KpiCard
              label="Precision Score"
              value={(val.precision * 100).toFixed(1)}
              unit="%"
              subtext="True positive flood ratio"
              badge="Precision"
            />

            <KpiCard
              label="Recall Score"
              value={(val.recall * 100).toFixed(1)}
              unit="%"
              subtext="Detected flood coverage"
              badge="Recall"
              badgeType="safe"
            />

            <KpiCard
              label="F1 Metric Score"
              value={(val.f1 * 100).toFixed(1)}
              unit="%"
              subtext="Harmonic accuracy mean"
              badge="F1 Accuracy"
            />
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              📡 Earth Observation Dataset Reference
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Satellite validation utilizes Sentinel-1 Ground Range Detected (GRD) Synthetic Aperture Radar (SAR) C-band backscatter intensity thresholding (VV/VH polarization) to construct ground-truth inundation masks during active flood events.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
