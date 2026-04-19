export interface MetaSnapshot {
  generatedAt: string
  app: {
    title: string
    region: string
    deployment: string
    frontend: string
    backend: string
    database: string
    llm: string
    rag: string
  }
  filters: {
    states: string[]
    voltageLevels: number[]
    defaultDateRange: {
      start: string
      end: string
    }
  }
  overview: {
    assetCount: number
    sensorReadingCount: number
    outageCount: number
    corridorCount: number
    criticalAssets: number
    highRiskCorridors: number
    currentDemandMw: number
    peakDllPct: number
  }
}

export interface AssetSnapshot {
  assets: AssetCard[]
  statusCounts: Record<string, number>
  states: string[]
  voltageLevels: number[]
}

export interface AssetCard {
  assetId: string
  substation: string
  state: string
  capacityMva: number
  voltageKv: number
  ageYears: number
  manufacturer: string
  faultType: string | null
  lastMaintenance: string | null
  healthIndex: number
  healthDelta30d: number
  rulDays: number
  rulBand: { low: number; high: number }
  anomaly: {
    score: number
    threshold: number
    isDetected: boolean
    drivers: { feature: string; score: number; severity: string }[]
  }
  status: 'critical' | 'warning' | 'stable'
  latestReadings: {
    oilTemp: number | null
    windingTemp: number | null
    loadPct: number | null
    h2Ppm: number | null
    ch4Ppm: number | null
    coPpm: number | null
  }
  history: { date: string; value: number }[]
  sensors7d: { timestamp: string; oil_temp: number; winding_temp: number; load_pct: number }[]
  gases30d: { timestamp: string; h2_ppm: number; ch4_ppm: number; co_ppm: number }[]
}

export interface GridSnapshot {
  currentDemandMw: number
  demandDeltaMw: number
  gridFrequencyHz: number
  outagesToday: number
  peakDllPct: number
  weather: {
    temperatureC: number
    windSpeedMs: number
    solarRadiationWm2: number
    rainfallMm: number
  }
  loadHistory: { date: string; actualMw: number }[]
  loadForecast: { date: string; forecastMw: number; lowerMw: number; upperMw: number }[]
  outageFeed: {
    timestamp: string
    lineId: string
    state: string
    rootCause: string
    durationHours: number
    voltageKv: number
    confidence: number
  }[]
  causeDistribution: { cause: string; count: number }[]
  failureHeatmap: { rootCause: string; ageGroup: string; count: number; ratio: number }[]
  generationMix: { source: string; mw: number; pct: number }[]
}

export interface CorridorsSnapshot {
  segments: CorridorSegment[]
  alerts: CorridorAlert[]
  riskSummary: { riskLabel: string; count: number }[]
  changeSummary: { flag: string; count: number }[]
}

export interface CorridorSegment {
  segmentId: string
  states: string
  voltageKv: number
  lengthKm: number
  terrainSlope: number
  baseNdvi: number
  lastInspection: string | null
  latestNdvi: number
  delta3m: number
  delta6m: number
  riskLabel: 'Critical' | 'High' | 'Medium' | 'Low'
  changeFlag: 'Significant' | 'Moderate' | 'Stable'
  geometry: [number, number][]
  history: { month: string; ndvi: number }[]
  forecast: { month: string; forecastNdvi: number; lowerNdvi: number; upperNdvi: number }[]
}

export interface CorridorAlert {
  segmentId: string
  states: string
  voltageKv: number
  latestNdvi: number
  delta3m: number
  riskLabel: 'Critical' | 'High' | 'Medium' | 'Low'
  recommendedAction: string
}

export interface InsightResponse {
  text: string
  cached: boolean
  expires_at: string
}

export interface RulPredictionResponse {
  asset_id: string
  rul_days: number
  health_index: number
  severity: string
  confidence: number
  features: Record<string, number>
  timestamp: string
}

export interface AnomalyPredictionResponse {
  asset_id: string
  score: number
  threshold: number
  is_detected: boolean
  severity: string
  confidence: number
  drivers: { feature: string; score: number }[]
  timestamp: string
}

export interface LoadForecastResponse {
  region: string
  horizon_days: number
  severity: string
  confidence: number
  forecast: { date: string; forecastMw: number; lowerMw: number; upperMw: number }[]
  timestamp: string
}

export interface OutageCauseResponse {
  predicted_cause: string
  confidence: number
  severity: string
  top_candidates: { label: string; probability: number }[]
  timestamp: string
}

export interface NdviRiskResponse {
  risk_label: string
  confidence: number
  severity: string
  threshold_label: string
  timestamp: string
}

export interface RagResponse {
  answer: string
  citations: {
    title: string
    source?: string | null
    page?: number | null
    chunk?: number | null
  }[]
}
