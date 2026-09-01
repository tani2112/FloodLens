import { StudyArea, Simulation } from '../../types';

export const mockStudyAreas: StudyArea[] = [
  {
    id: 'nepal-lhende-bhotekoshi-aoi',
    name: 'Nepal Himalayas — Lhende Khola & Bhote Koshi / Trishuli Catchment (2026)',
    description: 'Avalanche-source, landslide-dam, Rasuwagadhi, Syabrubesi, and Trishuli downstream response corridor.',
    bbox: [85.200, 27.900, 85.500, 28.400],
    river: 'Lhende Khola → Bhote Koshi / Trishuli River',
    damOrBlockage: 'Landslide Dam / Temporary Barrier Lake & Rasuwagadhi Dam',
    demDataset: 'Copernicus GLO-30 / ALOS PALSAR 12.5m Himalayan DEM',
    satelliteDataset: 'Sentinel-1 SAR / Sentinel-2 MSI / PlanetScope',
    createdAt: '2026-08-26T10:42:00Z'
  },
  {
    id: 'rishiganga-uttarakhand-2021',
    name: 'Rishi Ganga River, Uttarakhand (Feb 2021) — Natural Lake & Chamoli Flash Flood',
    description: 'Ronti peak rock/ice avalanche creating temporary natural dam, triggering the devastating Chamoli flash flood through Raini and Tapovan.',
    bbox: [79.500, 30.300, 79.850, 30.650],
    river: 'Rishi Ganga → Dhauliganga → Alaknanda River',
    damOrBlockage: 'Ronti Peak Ice/Rock Avalanche Natural Dam & Tapovan Hydro Project',
    demDataset: 'Copernicus DEM 30m / Cartosat-1 DEM',
    satelliteDataset: 'Sentinel-2 / PlanetScope / Landsat-8',
    createdAt: '2021-02-07T04:30:00Z'
  },
  {
    id: 'phuktal-zanskar-2015',
    name: 'Phuktal River near Sumdo, Zanskar, J&K / Ladakh (Mar 2015) — Landslide Dam Lake',
    description: 'Massive landslide blocking the Tsarap Chu/Phuktal river creating a 15M m³ artificial lake threatening downstream bridges, Padum, and Zanskar valley.',
    bbox: [76.800, 33.100, 77.400, 33.550],
    river: 'Tsarap Chu / Phuktal River → Zanskar River',
    damOrBlockage: 'Marshun-Sumdo Massive Landslide Blockage (15M m³ Artificial Lake)',
    demDataset: 'SRTM 30m / ALOS World 3D-30m',
    satelliteDataset: 'WorldView / Sentinel-2 / Cartosat',
    createdAt: '2015-03-15T08:00:00Z'
  },
  {
    id: 'wapriyang-2021',
    name: 'Wapriyang River (Nov 2021) — Natural Landslide Lake Outburst',
    description: 'Steep gorge debris avalanche and natural damming causing rapid backwater storage and catastrophic outburst wave routing downstream.',
    bbox: [94.000, 28.400, 94.400, 28.800],
    river: 'Wapriyang River → Siang / Brahmaputra Tributaries',
    damOrBlockage: 'Steep Gorge Debris Avalanche Natural River Dam',
    demDataset: 'Copernicus GLO-30 / AW3D30',
    satelliteDataset: 'Sentinel-1 SAR / PlanetScope',
    createdAt: '2021-11-12T14:00:00Z'
  },
  {
    id: 'kosi-2008',
    name: 'Kosi River (Aug 2008) — Kushaha Transboundary Embankment Breach & Mega-Avulsion',
    description: 'Catastrophic left afflux embankment breach at Kushaha (Nepal) diverting the entire Kosi river eastward into abandoned historical channels across Bihar.',
    bbox: [86.700, 25.800, 87.200, 26.800],
    river: 'Saptakoshi / Kosi River Basin',
    damOrBlockage: 'Kosi Barrage Kushaha Left Afflux Embankment (12.9 km upstream)',
    demDataset: 'SRTM 30m / HydroSHEDS DEM',
    satelliteDataset: 'MODIS / Landsat-7 / IRS-P6',
    createdAt: '2008-08-18T07:30:00Z'
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
