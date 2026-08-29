import { StudyArea, Simulation } from '../../types';

export const mockStudyAreas: StudyArea[] = [
  {
    id: 'sa-demo-01',
    name: 'Demo Catchment (Canonical AOI)',
    bbox: [76.8, 10.2, 77.2, 10.5],
    river: 'Demo River',
    damOrBlockage: 'Demo Main Dam',
    demDataset: 'SRTM',
    createdAt: '2026-08-29T10:00:00Z'
  }
];

export const mockSimulations: Simulation[] = [
  {
    id: 'sim-demo-001',
    scenarioId: 'scen-001',
    modelLevel: 'level1',
    status: 'completed',
    dataSource: 'mock',
    createdAt: '2026-08-29T11:00:00Z'
  }
];
