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
  FloodLayer,
  ExposureResult,
  Warning,
  ComparisonResult,
  ValidationResult,
  ExportJob
} from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
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
      detail = errData.detail || JSON.stringify(errData);
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
    const res = await fetch('http://localhost:8000/health');
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
        id: `scen-demo-${Date.now().toString().slice(-4)}`,
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
        id: `sim-demo-${Date.now().toString().slice(-4)}`,
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
        floodAreaKm2: 5.38,
        maxDepthM: 6.2,
        maxVelocityMs: 3.4,
        arrivalTimeMin: 12.0,
        durationHr: 1.0,
        populationExposed: 1450,
        buildingsAffected: 0,
        roadsAffectedKm: 2.1,
        dataSource: 'mock'
      };
    }
    return request<FloodResult>(`/simulations/${id}/results`);
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
