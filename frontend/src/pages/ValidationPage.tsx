import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../services/api/client';
import { ValidationResult } from '../types';

export const ValidationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const simId = id || 'sim-level1-default';

  const [val, setVal] = useState<ValidationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getValidation(simId)
      .then((data) => {
        setVal(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.detail || err.message || 'Failed loading validation data');
        setLoading(false);
      });
  }, [simId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
          Sentinel-1 Earth Observation Satellite Validation
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Quantitative IoU, Precision, and Recall comparison against satellite SAR inundation maps.
        </p>
      </div>

      <div className="card" style={{ borderColor: '#EAB308', background: '#422006', color: '#FDE047', fontSize: '0.85rem' }}>
        <strong>Module Status Note:</strong> Automated Sentinel-1 SAR inundation extraction and binary confusion matrix validation pipeline (Planned Phase).
      </div>

      {loading ? (
        <div className="card" style={{ color: 'var(--text-secondary)' }}>Loading satellite validation statistics...</div>
      ) : error ? (
        <div className="card" style={{ borderColor: '#7F1D1D', background: '#450A0A', color: '#FCA5A5' }}>{error}</div>
      ) : val ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="card">
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Intersection over Union (IoU)
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--accent-cyan)', marginTop: '0.25rem' }}>
                {(val.iou * 100).toFixed(1)}%
              </div>
            </div>

            <div className="card">
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Precision Score
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#38BDF8', marginTop: '0.25rem' }}>
                {(val.precision * 100).toFixed(1)}%
              </div>
            </div>

            <div className="card">
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Recall Score
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#22C55E', marginTop: '0.25rem' }}>
                {(val.recall * 100).toFixed(1)}%
              </div>
            </div>

            <div className="card">
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                F1 Metric Score
              </span>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#F97316', marginTop: '0.25rem' }}>
                {(val.f1 * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
