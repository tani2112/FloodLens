import { StudyArea, Simulation } from '../../types';

export const mockStudyAreas: StudyArea[] = [
  {
    id: 'nepal-lhende-bhotekoshi-aoi',
    name: 'Nepal Himalayas — Lhende Khola & Bhote Koshi Corridor',
    description: 'Avalanche-source, landslide-dam, Rasuwagadhi and Syabrubesi downstream response corridor.',
    bbox: [85.225, 27.980, 85.414, 28.318],
    river: 'Lhende Khola → Bhote Koshi River',
    damOrBlockage: 'Landslide Dam / Temporary Barrier Lake',
    demDataset: 'Copernicus GLO-30 + Himalayan terrain refinement',
    satelliteDataset: 'Sentinel-1 SAR / Sentinel-2 MSI',
    createdAt: '2026-08-26T10:42:00Z'
  }
];

export const mockSimulations: Simulation[] = [
  {
    id: 'NP-2026-08-26-001',
    scenarioId: 'scen-nepal-glof',
    modelLevel: 'level1',
    status: 'completed',
    dataSource: 'mock',
    createdAt: '2026-08-29T11:00:00Z'
  }
];
