export type VisualizationMode = 'bio' | 'neural' | 'globe';

export interface TimelineChapter {
  id: string;
  period: string;
  title: string;
  dateStr: string;
  summary: string;
  details: string[];
  metrics: {
    flops?: string;
    powerGw?: string;
    capex?: string;
    approval?: string;
    researchMultiplier?: string;
    agentCopies?: string;
    speedVsHuman?: string;
  };
  keyActor: 'OpenBrain' | 'DeepCent' | 'US Gov / DOD' | 'Public / Media' | 'Agent Collective';
  recommended3DMode: VisualizationMode;
  audioPromptText: string;
  quote?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  persona?: string;
}

export interface BioscienceThreatProfile {
  title: string;
  threatLevel: 'Low' | 'Medium' | 'High' | 'Severe' | 'Critical';
  vector: string;
  targetProtein: string;
  screeningStatus: string;
  containmentProtocol: string;
  evalSummary: string;
}

export interface TelemetryHistoryPoint {
  timeOffsetSec: number;
  timestamp: number;
  flopsNumeric: number;
  flopsFormatted: string;
  neuralTemperature: number;
  coolingEfficiencyPct: number;
}

export interface ClusterTelemetry {
  clusterId: 'openbrain' | 'tianwan' | 'global';
  clusterName: string;
  activeFlops: string;
  flopsNumeric: number;
  powerDrawGw: number;
  pue: number;
  coolingStatus: 'Nominal' | 'Heavy Load' | 'Critical Evaporative';
  coolingEfficiencyPct: number;
  neuralTemperature: number;
  activeAgentInstances: number;
  containmentIntegrityPct: number;
  statusBadge: 'OPTIMAL' | 'LOADED' | 'ANOMALY DETECTED';
  anomalyNote?: string;
  timestamp: number;
  history?: TelemetryHistoryPoint[];
}

