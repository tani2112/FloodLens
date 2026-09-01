/**
 * FloodLens API Client Abstraction
 * Routes requests to FastAPI REST endpoints (http://localhost:8000/api/v1) or Mock Data based on VITE_DEMO_MODE flag
 */

import {
  StudyArea,
  Scenario,
  Simulation,
  SimulationStatus,
  FloodResult,
  TimelineSummary,
  FloodLayer,
  ExposureResult,
  Warning,
  ComparisonResult,
  ValidationResult,
  ExportJob,
  ImpactSummary,
  ImpactTimeline
} from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const IS_DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(`API Error ${status}: ${detail}`);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const errData = await response.json();
      detail = errData.detail || errData.error?.message || JSON.stringify(errData);
    } catch (_) {
      // Fallback to response status text
    }
    throw new ApiError(response.status, detail);
  }

  return response.json();
}

export const apiClient = {
  async checkHealth(): Promise<{ status: string }> {
    if (IS_DEMO_MODE) return { status: 'ok (demo mode)' };
    const healthUrl = API_BASE_URL.startsWith('http')
      ? `${API_BASE_URL.replace('/v1', '')}/health`
      : '/api/health';
    const res = await fetch(healthUrl);
    return res.json();
  },

  async getStudyAreas(): Promise<StudyArea[]> {
    if (IS_DEMO_MODE) {
      const mock = await import('../../data/mock');
      return mock.mockStudyAreas;
    }
    return request<StudyArea[]>('/study-areas');
  },

  async getStudyArea(id: string): Promise<StudyArea> {
    if (IS_DEMO_MODE) {
      const mock = await import('../../data/mock');
      return mock.mockStudyAreas[0];
    }
    return request<StudyArea>(`/study-areas/${id}`);
  },

  async getScenarios(): Promise<Scenario[]> {
    if (IS_DEMO_MODE) {
      return [];
    }
    return request<Scenario[]>('/scenarios');
  },

  async createScenario(payload: {
    studyAreaId: string;
    type: string;
    parameters: Record<string, number | string>;
  }): Promise<Scenario> {
    if (IS_DEMO_MODE) {
      return {
        id: `scen-nepal-glof-${Date.now().toString().slice(-4)}`,
        studyAreaId: payload.studyAreaId,
        type: payload.type as any,
        parameters: payload.parameters,
        createdAt: new Date().toISOString()
      };
    }
    return request<Scenario>('/scenarios', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getSimulations(): Promise<Simulation[]> {
    if (IS_DEMO_MODE) {
      const mock = await import('../../data/mock');
      return mock.mockSimulations;
    }
    return request<Simulation[]>('/simulations');
  },

  async getSimulation(id: string): Promise<Simulation> {
    if (IS_DEMO_MODE) {
      const mock = await import('../../data/mock');
      return mock.mockSimulations[0];
    }
    return request<Simulation>(`/simulations/${id}`);
  },

  async createSimulation(payload: { scenarioId: string; modelLevel: string }): Promise<Simulation> {
    if (IS_DEMO_MODE) {
      return {
        id: `NP-2026-08-26-${Date.now().toString().slice(-4)}`,
        scenarioId: payload.scenarioId,
        modelLevel: payload.modelLevel as any,
        status: 'completed',
        dataSource: 'mock',
        createdAt: new Date().toISOString()
      };
    }
    return request<Simulation>('/simulations', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  async getSimulationStatus(id: string): Promise<SimulationStatus> {
    if (IS_DEMO_MODE) {
      return {
        simulationId: id,
        stage: 'Completed',
        stagePercent: 100,
        stages: [{ name: 'Execution', status: 'done' }]
      };
    }
    return request<SimulationStatus>(`/simulations/${id}/status`);
  },

  async getFloodResults(id: string): Promise<FloodResult> {
    if (IS_DEMO_MODE) {
      return {
        simulationId: id,
        floodAreaKm2: 42.3,
        maxDepthM: 9.2,
        maxVelocityMs: 8.6,
        arrivalTimeMin: 18.0,
        durationHr: 2.25,
        populationExposed: 3860,
        buildingsAffected: 84,
        roadsAffectedKm: 12.6,
        dataSource: 'mock'
      };
    }
    return request<FloodResult>(`/simulations/${id}/results`);
  },

  async getSimulationTimeline(id: string): Promise<TimelineSummary> {
    if (IS_DEMO_MODE) {
      return {
        simulationId: id,
        timesteps: [
          { timestepIndex: 0, timeMin: 0, floodAreaKm2: 0, maxDepthM: 0, maxVelocityMs: 0 },
          { timestepIndex: 1, timeMin: 10, floodAreaKm2: 2.4, maxDepthM: 3.2, maxVelocityMs: 7.8 },
          { timestepIndex: 2, timeMin: 20, floodAreaKm2: 6.2, maxDepthM: 8.5, maxVelocityMs: 1.4 },
          { timestepIndex: 3, timeMin: 30, floodAreaKm2: 13.5, maxDepthM: 9.2, maxVelocityMs: 8.6 },
          { timestepIndex: 4, timeMin: 45, floodAreaKm2: 22.1, maxDepthM: 8.1, maxVelocityMs: 7.2 },
          { timestepIndex: 5, timeMin: 60, floodAreaKm2: 29.4, maxDepthM: 7.2, maxVelocityMs: 5.8 },
          { timestepIndex: 6, timeMin: 80, floodAreaKm2: 35.8, maxDepthM: 6.4, maxVelocityMs: 5.2 },
          { timestepIndex: 7, timeMin: 100, floodAreaKm2: 40.2, maxDepthM: 4.8, maxVelocityMs: 4.1 },
          { timestepIndex: 8, timeMin: 135, floodAreaKm2: 42.3, maxDepthM: 3.2, maxVelocityMs: 2.5 }
        ]
      };
    }
    return request<TimelineSummary>(`/simulations/${id}/timeline`);
  },

  async getFloodLayers(id: string, timestep: number = -1): Promise<FloodLayer[]> {
    if (IS_DEMO_MODE) {
      return [];
    }
    return request<FloodLayer[]>(`/simulations/${id}/layers?timestep=${timestep}`);
  },

  async getExposureResults(id: string): Promise<ExposureResult[]> {
    if (IS_DEMO_MODE) {
      return [];
    }
    return request<ExposureResult[]>(`/simulations/${id}/exposure`);
  },

  async getImpactSummary(id: string): Promise<ImpactSummary> {
    return request<ImpactSummary>(`/simulations/${id}/impact-summary`);
  },

  async getImpactTimeline(id: string): Promise<ImpactTimeline> {
    return request<ImpactTimeline>(`/simulations/${id}/impact-timeline`);
  },

  async getWarnings(id: string): Promise<Warning[]> {
    if (IS_DEMO_MODE) {
      return [];
    }
    return request<Warning[]>(`/simulations/${id}/warnings`);
  },

  async compareSimulations(runA: string, runB: string): Promise<ComparisonResult> {
    if (IS_DEMO_MODE) {
      throw new ApiError(501, 'Comparison in demo mode not available');
    }
    return request<ComparisonResult>(`/comparison?runA=${encodeURIComponent(runA)}&runB=${encodeURIComponent(runB)}`);
  },

  async getValidation(id: string): Promise<ValidationResult> {
    if (IS_DEMO_MODE) {
      return {
        simulationId: id,
        iou: 0.84,
        precision: 0.88,
        recall: 0.91,
        f1: 0.89,
        areaDifferenceKm2: 0.12,
        status: 'mock'
      };
    }
    return request<ValidationResult>(`/validation/${id}`);
  },

  async exportSimulation(id: string, format: string): Promise<ExportJob> {
    if (IS_DEMO_MODE) {
      return {
        simulationId: id,
        format: format as any,
        status: 'ready',
        downloadUrl: '#'
      };
    }
    return request<ExportJob>(`/export/${id}`, {
      method: 'POST',
      body: JSON.stringify({ format })
    });
  },

  getResultFileUrl(id: string, filename: string): string {
    return `${API_BASE_URL}/simulations/${id}/files/${filename}`;
  }
};
