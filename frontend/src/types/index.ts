export interface User {
  id: string
  name: string
  email: string
  role?: string
  avatar?: string
}

export type DatasetStatus = 'raw' | 'profiling' | 'cleaned' | 'failed'

export interface Dataset {
  id: string
  name: string
  size: string
  rowCount: number
  columnCount: number
  format: 'csv' | 'xlsx'
  uploadedAt: string
  qualityScore: number
  status: DatasetStatus
  missingValues: number
  duplicateRows: number
  numericalColumns: number
  categoricalColumns: number
  dateColumns: number
  columns: string[]
}

export type AgentStatus = 'waiting' | 'running' | 'completed' | 'failed'

export type AgentType =
  | 'orchestrator'
  | 'profiling'
  | 'missing_value'
  | 'duplicate_detection'
  | 'standardization'
  | 'anomaly_detection'
  | 'validation'
  | 'visualization'
  | 'insight'

export interface AgentInfo {
  id: string
  name: string
  type: AgentType
  description: string
  status: AgentStatus
  executionTime: number // in seconds
  recordsAffected: number
  problem?: string
  action?: string
  reason?: string
  metrics?: Record<string, string | number>
}

export interface QualityBreakdown {
  completeness: number
  consistency: number
  validity: number
  uniqueness: number
}

export interface QualityScoreData {
  beforeScore: number
  afterScore: number
  improvement: number
  breakdown: QualityBreakdown
}

export interface CleaningJob {
  id: string
  datasetId: string
  datasetName: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  startedAt: string
  completedAt?: string
  agents: AgentInfo[]
  quality: QualityScoreData
}

export type ChangeType = 'modified' | 'removed_duplicate' | 'standardized' | 'anomaly_fixed' | 'original'

export interface BeforeAfterRow {
  rowId: string
  changeType: ChangeType
  before: Record<string, any>
  after: Record<string, any> | null
  changeDescription: string
}

export interface DescriptiveStat {
  column: string
  mean: number
  median: number
  min: number
  max: number
  stdDev: number
  count: number
  nullCount: number
}

export interface AnalyticsSummary {
  datasetId: string
  descriptiveStats: DescriptiveStat[]
  categoryDistributions: Record<string, Array<{ name: string; count: number; percentage: number }>>
  numericalDistributions: Record<string, Array<{ bin: string; count: number }>>
  correlationMatrix: {
    columns: string[]
    matrix: number[][]
  }
  keyStats: Array<{
    label: string
    value: string | number
    change?: string
    isPositive?: boolean
    hint?: string
  }>
}

export type ChartType = 'scatter' | 'bar' | 'line' | 'histogram' | 'box'

export interface VisualizationItem {
  id: string
  title: string
  chartType: ChartType
  description: string
  columnsUsed: string[]
  reasonSelected: string
  data: any[]
  xKey: string
  yKey?: string
  yKeys?: string[]
}

export type InsightCategory = 'Correlation' | 'Distribution' | 'Data Quality' | 'Anomaly' | 'Trend'

export interface InsightItem {
  id: string
  title: string
  description: string
  confidence: number // percentage e.g. 92
  category: InsightCategory
  impact: 'high' | 'medium' | 'low'
  recommendation?: string
}

export interface ChatMessage {
  id: string
  sender: 'user' | 'aura'
  text: string
  timestamp: string
  suggestedQuestions?: string[]
  metadata?: {
    datasetId?: string
    relatedAgent?: string
  }
}
