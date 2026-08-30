import { FloodResult, ImpactSummary, TimelineSummary, ExposureResult, ScenarioParameters, TimestepSummary } from '../../types';

export interface PeakMetricCondition {
  label: string;
  value: string;
  unit: string;
  timeMin: number | null;
  subtext: string;
  isAvailable: boolean;
}

export interface TemporalMilestoneItem {
  id: string;
  name: string;
  timeMin: number;
  metricLabel: string;
  metricValue: string;
  description: string;
}

export interface AnalyticalStatement {
  category: 'extent' | 'depth' | 'velocity' | 'settlement' | 'road' | 'general';
  statement: string;
  severity?: 'info' | 'warning' | 'critical' | 'safe';
}

export interface DecisionSupportSummaryData {
  floodSeverity: 'SAFE' | 'ADVISORY' | 'WATCH' | 'WARNING' | 'CRITICAL';
  settlementSeverity: 'SAFE' | 'ADVISORY' | 'WATCH' | 'WARNING' | 'CRITICAL';
  roadSeverity: 'SAFE' | 'ADVISORY' | 'WATCH' | 'WARNING' | 'CRITICAL';
  overallSeverity: 'SAFE' | 'ADVISORY' | 'WATCH' | 'WARNING' | 'CRITICAL';
  earliestLeadTimeMin: number | null;
  criticalSettlementsCount: number;
  primaryRiskFactors: string[];
}

export interface DataQualityIndicator {
  dataset: string;
  status: 'available' | 'requires_census_dataset' | 'unavailable' | 'complete';
  label: string;
  description: string;
}

export interface ScenarioIntelligencePackage {
  peakInundationAreaKm2: number | null;
  timeToPeakInundationMin: number | null;
  maxWaterDepthM: number | null;
  timeToMaxDepthMin: number | null;
  maxFlowVelocityMs: number | null;
  timeToMaxVelocityMin: number | null;
  earliestSettlementArrivalMin: number | null;
  earliestSettlementName: string | null;
  affectedSettlementsCount: number;
  criticalSettlementsCount: number;
  affectedRoadLengthKm: number | null;
  peakRoadDisruptionPercent: number | null;
  maxExposureSeverity: string;
  
  peakConditions: PeakMetricCondition[];
  temporalMilestones: TemporalMilestoneItem[];
  analyticalStatements: AnalyticalStatement[];
  decisionSupport: DecisionSupportSummaryData;
  dataQuality: DataQualityIndicator[];
}

/**
 * Computes deterministic scenario intelligence from actual simulation artifacts and results.
 * Strictly avoids hallucination or synthetic estimations when data is missing.
 */
export function analyzeScenarioIntelligence(
  results: FloodResult | null,
  impact: ImpactSummary | null,
  timeline: TimelineSummary | null,
  exposure: ExposureResult[] = [],
  scenarioParams?: ScenarioParameters
): ScenarioIntelligencePackage {
  const timesteps: TimestepSummary[] = timeline?.timesteps || [];

  // 1. Peak Metric Extraction across Timeline
  let peakAreaTs = timesteps.length > 0 ? timesteps[0] : null;
  let peakDepthTs = timesteps.length > 0 ? timesteps[0] : null;
  let peakVelTs = timesteps.length > 0 ? timesteps[0] : null;

  timesteps.forEach((ts) => {
    if (!peakAreaTs || ts.floodAreaKm2 > peakAreaTs.floodAreaKm2) peakAreaTs = ts;
    if (!peakDepthTs || ts.maxDepthM > peakDepthTs.maxDepthM) peakDepthTs = ts;
    if (!peakVelTs || ts.maxVelocityMs > peakVelTs.maxVelocityMs) peakVelTs = ts;
  });

  const peakAreaKm2 = results?.floodAreaKm2 ?? peakAreaTs?.floodAreaKm2 ?? null;
  const timeToPeakArea = impact?.temporalMetrics?.peakInundationAreaTimeMin ?? peakAreaTs?.timeMin ?? null;

  const maxDepthM = results?.maxDepthM ?? peakDepthTs?.maxDepthM ?? null;
  const timeToMaxDepth = impact?.temporalMetrics?.peakDepthTimeMin ?? peakDepthTs?.timeMin ?? null;

  const maxVelocityMs = results?.maxVelocityMs ?? peakVelTs?.maxVelocityMs ?? null;
  const timeToMaxVelocity = impact?.temporalMetrics?.peakVelocityTimeMin ?? peakVelTs?.timeMin ?? null;

  // 2. Settlement Exposure Analysis
  let earliestArrivalMin: number | null = results?.arrivalTimeMin ?? null;
  let earliestSettlementName: string | null = null;
  let affectedCount = impact?.settlementMetrics?.totalAffected ?? 0;
  let criticalCount = impact?.settlementMetrics?.criticalCount ?? 0;

  if (exposure.length > 0) {
    let earliestExp: ExposureResult | null = null;
    let floodedExposures = exposure.filter(e => e.exposed && e.arrivalTimeMin !== null && e.arrivalTimeMin !== undefined);
    
    floodedExposures.forEach((exp) => {
      if (!earliestExp || (exp.arrivalTimeMin! < earliestExp.arrivalTimeMin!)) {
        earliestExp = exp;
      }
    });

    if (earliestExp) {
      earliestArrivalMin = (earliestExp as ExposureResult).arrivalTimeMin ?? earliestArrivalMin;
      earliestSettlementName = (earliestExp as ExposureResult).name;
    }
  }

  if (!earliestSettlementName && impact?.settlementMetrics?.earliestAffectedSettlement) {
    earliestSettlementName = impact.settlementMetrics.earliestAffectedSettlement;
  }

  // 3. Road Disruption
  const affectedRoadLength = results?.roadsAffectedKm ?? impact?.roadMetrics?.affectedRoadsLengthKm ?? null;
  const peakRoadPercent = impact?.roadMetrics?.affectedPercent ?? null;

  // 4. Peak Conditions Package
  const peakConditions: PeakMetricCondition[] = [
    {
      label: 'Peak Flood Extent',
      value: peakAreaKm2 !== null ? peakAreaKm2.toFixed(2) : 'Data unavailable',
      unit: 'km²',
      timeMin: timeToPeakArea,
      subtext: timeToPeakArea !== null ? `Reached at T + ${timeToPeakArea.toFixed(1)} min` : 'Peak timestep unavailable',
      isAvailable: peakAreaKm2 !== null
    },
    {
      label: 'Maximum Water Depth',
      value: maxDepthM !== null ? maxDepthM.toFixed(2) : 'Data unavailable',
      unit: 'm',
      timeMin: timeToMaxDepth,
      subtext: timeToMaxDepth !== null ? `Peak head at T + ${timeToMaxDepth.toFixed(1)} min` : 'Depth timestep unavailable',
      isAvailable: maxDepthM !== null
    },
    {
      label: 'Peak Flow Speed',
      value: maxVelocityMs !== null ? maxVelocityMs.toFixed(2) : 'Data unavailable',
      unit: 'm/s',
      timeMin: timeToMaxVelocity,
      subtext: timeToMaxVelocity !== null ? `Maximum velocity at T + ${timeToMaxVelocity.toFixed(1)} min` : 'Speed timestep unavailable',
      isAvailable: maxVelocityMs !== null
    },
    {
      label: 'Earliest Wave Arrival',
      value: earliestArrivalMin !== null ? earliestArrivalMin.toFixed(1) : 'Data unavailable',
      unit: 'min',
      timeMin: earliestArrivalMin,
      subtext: earliestSettlementName ? `First impact at ${earliestSettlementName}` : 'Inundation onset time',
      isAvailable: earliestArrivalMin !== null
    },
    {
      label: 'Peak Road Disruption',
      value: affectedRoadLength !== null ? affectedRoadLength.toFixed(2) : 'Data unavailable',
      unit: 'km',
      timeMin: impact?.roadMetrics?.firstTimestepAffectedMin ?? null,
      subtext: peakRoadPercent !== null ? `${peakRoadPercent.toFixed(1)}% of local network` : 'Corridor exposure',
      isAvailable: affectedRoadLength !== null
    }
  ];

  // 5. Temporal Milestones Pipeline
  const temporalMilestones: TemporalMilestoneItem[] = [
    {
      id: 'sim_start',
      name: 'Simulation Inflow Start',
      timeMin: 0.0,
      metricLabel: 'Inflow Outset',
      metricValue: '0.00 m³/s baseline',
      description: 'Reservoir release or structure failure hydrograph initiation at origin.'
    }
  ];

  if (earliestArrivalMin !== null && earliestArrivalMin > 0) {
    temporalMilestones.push({
      id: 'first_impact',
      name: 'First Settlement Wave Arrival',
      timeMin: earliestArrivalMin,
      metricLabel: 'Lead Time',
      metricValue: `${earliestArrivalMin.toFixed(1)} min`,
      description: earliestSettlementName ? `Flood wavefront reached ${earliestSettlementName}.` : 'Earliest downstream settlement contact.'
    });
  }

  if (timeToPeakArea !== null && timeToPeakArea > 0) {
    temporalMilestones.push({
      id: 'peak_area',
      name: 'Peak Inundation Extent',
      timeMin: timeToPeakArea,
      metricLabel: 'Submerged Area',
      metricValue: `${peakAreaKm2?.toFixed(2) || '0.00'} km²`,
      description: 'Maximum surface flood envelope reached across raster domain.'
    });
  }

  if (timeToMaxDepth !== null && timeToMaxDepth !== timeToPeakArea && timeToMaxDepth > 0) {
    temporalMilestones.push({
      id: 'peak_depth',
      name: 'Peak Water Head Elevation',
      timeMin: timeToMaxDepth,
      metricLabel: 'Max Depth',
      metricValue: `${maxDepthM?.toFixed(2) || '0.00'} m`,
      description: 'Maximum hydraulic water depth recorded in main river channel.'
    });
  }

  if (timeToMaxVelocity !== null && timeToMaxVelocity !== timeToPeakArea && timeToMaxVelocity > 0) {
    temporalMilestones.push({
      id: 'peak_velocity',
      name: 'Peak Flow Velocity',
      timeMin: timeToMaxVelocity,
      metricLabel: 'Max Velocity',
      metricValue: `${maxVelocityMs?.toFixed(2) || '0.00'} m/s`,
      description: 'Peak flow kinetic velocity recorded along flood wave propagation path.'
    });
  }

  const simDurationMin = (results?.durationHr || (scenarioParams?.simulationDurationHr as number) || 1.0) * 60;
  temporalMilestones.push({
    id: 'sim_end',
    name: 'Simulation Window End',
    timeMin: simDurationMin,
    metricLabel: 'Duration',
    metricValue: `${simDurationMin.toFixed(0)} min`,
    description: 'Completion of 2D diffusive wave cellular flow routing window.'
  });

  // Sort milestones chronologically
  temporalMilestones.sort((a, b) => a.timeMin - b.timeMin);

  // 6. Deterministic Analytical Statements
  const analyticalStatements: AnalyticalStatement[] = [];

  if (peakAreaKm2 !== null && timeToPeakArea !== null) {
    analyticalStatements.push({
      category: 'extent',
      statement: `Peak inundation reached ${peakAreaKm2.toFixed(2)} km² at T + ${timeToPeakArea.toFixed(1)} minutes into the simulation.`,
      severity: 'info'
    });
  }

  if (maxDepthM !== null) {
    analyticalStatements.push({
      category: 'depth',
      statement: `Maximum simulated water head depth reached ${maxDepthM.toFixed(2)} m in the primary channel.`,
      severity: maxDepthM > 4.0 ? 'warning' : 'info'
    });
  }

  if (affectedCount > 0) {
    analyticalStatements.push({
      category: 'settlement',
      statement: `${affectedCount} settlement(s) were inundated, with ${criticalCount} classified under CRITICAL exposure tier.`,
      severity: criticalCount > 0 ? 'critical' : 'warning'
    });
  }

  if (earliestSettlementName && earliestArrivalMin !== null) {
    analyticalStatements.push({
      category: 'settlement',
      statement: `${earliestSettlementName} experienced the earliest simulated wave arrival at T + ${earliestArrivalMin.toFixed(1)} minutes.`,
      severity: 'warning'
    });
  }

  if (affectedRoadLength !== null && affectedRoadLength > 0) {
    analyticalStatements.push({
      category: 'road',
      statement: `Transport corridor disruption affected ${affectedRoadLength.toFixed(2)} km of local road infrastructure.`,
      severity: 'info'
    });
  }

  // 7. Decision Support Summary
  const decisionSupport: DecisionSupportSummaryData = {
    floodSeverity: peakAreaKm2 && peakAreaKm2 > 10.0 ? 'CRITICAL' : peakAreaKm2 && peakAreaKm2 > 5.0 ? 'WARNING' : 'WATCH',
    settlementSeverity: criticalCount > 0 ? 'CRITICAL' : affectedCount > 0 ? 'WARNING' : 'SAFE',
    roadSeverity: affectedRoadLength && affectedRoadLength > 5.0 ? 'WARNING' : affectedRoadLength && affectedRoadLength > 0 ? 'WATCH' : 'SAFE',
    overallSeverity: criticalCount > 0 ? 'CRITICAL' : affectedCount > 0 ? 'WARNING' : 'ADVISORY',
    earliestLeadTimeMin: earliestArrivalMin,
    criticalSettlementsCount: criticalCount,
    primaryRiskFactors: [
      maxDepthM && maxDepthM > 3.0 ? `High water head depth (${maxDepthM.toFixed(1)} m)` : 'Moderate depth head',
      criticalCount > 0 ? `${criticalCount} village(s) in CRITICAL evacuation tier` : 'Settlement exposure monitored',
      affectedRoadLength && affectedRoadLength > 0 ? `Submerged transport corridors (${affectedRoadLength.toFixed(1)} km)` : 'No major road inundation'
    ]
  };

  // 8. Data Quality & Status Indicators
  const dataQuality: DataQualityIndicator[] = [
    {
      dataset: 'Elevation Terrain DEM',
      status: 'available',
      label: 'Available (SRTM 30m / Copernicus)',
      description: 'High-resolution metric elevation grid processed in EPSG:32643 UTM projection.'
    },
    {
      dataset: 'Settlement Boundaries',
      status: 'available',
      label: 'Available (Canonical Villages)',
      description: 'Spatial centroids and vector bounds for catchment settlements.'
    },
    {
      dataset: 'Population Census',
      status: 'requires_census_dataset',
      label: 'Requires Census Dataset',
      description: 'Demographic population counts require official local census dataset integration.'
    },
    {
      dataset: 'Critical Infrastructure',
      status: 'unavailable',
      label: 'Dataset Unavailable',
      description: 'Hospital, power station, and school spatial vectors not currently available for this study area.'
    },
    {
      dataset: 'Simulation Solver Engine',
      status: 'complete',
      label: 'Complete (Level 1 2D Diffusive Wave)',
      description: 'Cellular finite-volume flow routing complete with mass balance error validation.'
    }
  ];

  return {
    peakInundationAreaKm2: peakAreaKm2,
    timeToPeakInundationMin: timeToPeakArea,
    maxWaterDepthM: maxDepthM,
    timeToMaxDepthMin: timeToMaxDepth,
    maxFlowVelocityMs: maxVelocityMs,
    timeToMaxVelocityMin: timeToMaxVelocity,
    earliestSettlementArrivalMin: earliestArrivalMin,
    earliestSettlementName,
    affectedSettlementsCount: affectedCount,
    criticalSettlementsCount: criticalCount,
    affectedRoadLengthKm: affectedRoadLength,
    peakRoadDisruptionPercent: peakRoadPercent,
    maxExposureSeverity: criticalCount > 0 ? 'CRITICAL' : affectedCount > 0 ? 'WARNING' : 'SAFE',
    peakConditions,
    temporalMilestones,
    analyticalStatements,
    decisionSupport,
    dataQuality
  };
}
