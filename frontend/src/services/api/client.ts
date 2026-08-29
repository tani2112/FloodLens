/**
 * FloodLens API Client Abstraction
 * Routes requests to FastAPI endpoints or Mock Data based on VITE_DEMO_MODE flag
 */

import { StudyArea, Simulation, FloodResult, ExposureResult, Warning } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export const apiClient = {
  async checkHealth(): Promise<{ status: string }> {
    if (IS_DEMO_MODE) return { status: 'ok (demo mode)' };
    const res = await fetch(`${API_BASE_URL}/health`);
    return res.json();
  },

  async getStudyAreas(): Promise<StudyArea[]> {
    if (IS_DEMO_MODE) {
      const mock = await import('../../data/mock');
      return mock.mockStudyAreas;
    }
    const res = await fetch(`${API_BASE_URL}/study-areas`);
    return res.json();
  },

  async getSimulations(): Promise<Simulation[]> {
    if (IS_DEMO_MODE) {
      const mock = await import('../../data/mock');
      return mock.mockSimulations;
    }
    const res = await fetch(`${API_BASE_URL}/simulations`);
    return res.json();
  }
};
