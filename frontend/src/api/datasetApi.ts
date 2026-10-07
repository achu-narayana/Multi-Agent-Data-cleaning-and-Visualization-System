import { apiClient, apiDownload } from './client'
import { AgentInfo, BeforeAfterRow, Dataset, VisualizationItem } from '@/types'
import { saveBlob } from '@/utils/download'

export interface UploadResponse {
  message: string
  dataset_id: string
  filename: string
  stored_file: string
  size_bytes: number
  dataset: Dataset
}

export interface ProfileColumn {
  name: string
  data_type: string
  missing_count: number
  missing_percentage: number
  unique_values: number
}

export interface NumericalStatistic {
  min: number | null
  max: number | null
  mean: number | null
  median: number | null
  standard_deviation: number | null
}

export interface CategoricalInformation {
  unique_count: number
  top_values: Record<string, number> | Array<unknown>
}

export interface DatasetProfile {
  dataset: {
    rows: number
    columns: number
    column_names: string[]
  }
  columns: ProfileColumn[]
  missing_values: Record<string, number>
  duplicate_rows: number
  numerical_statistics: Record<string, NumericalStatistic>
  outliers: unknown
  categorical_information: Record<string, CategoricalInformation>
  quality_score: number
}

export interface ProfileResponse {
  dataset_id: string
  profile: DatasetProfile
}

export interface PreviewResponse {
  columns: string[]
  rows: Record<string, unknown>[]
  source: 'cleaned' | 'original'
}

export type ValidationCheckStatus = 'PASS' | 'FAIL' | 'WARNING'

export type ValidationCheckName =
  | 'missing_values'
  | 'duplicates'
  | 'numeric_values'
  | 'dataset_structure'
  | 'business_rules'
  | 'statistical_outliers'

export interface ValidationCheck {
  status: ValidationCheckStatus
  [key: string]: unknown
}

export interface ValidationResult {
  valid: boolean
  quality_score: number
  checks: Partial<Record<ValidationCheckName, ValidationCheck>>
  issues: string[]
}

export interface GeminiInsightsPayload {
  summary: string
  key_findings: string[]
  data_quality_explanation: string
  recommendations: string[]
}

export interface InsightsEnvelope {
  status: 'success' | 'error'
  model?: string
  message?: string
  insights?: GeminiInsightsPayload
}

export interface ProcessingResult {
  dataset_id: string
  /** Original uploaded file name. */
  filename: string
  status: string
  /** Quality score after cleaning. */
  quality_score: number
  /** Quality score before cleaning. */
  original_quality_score: number
  profile: DatasetProfile
  cleaning_actions: unknown[]
  anomalies: unknown[]
  validation: ValidationResult
  cleaned_filename: string
  download_endpoint: string
  visualizations: VisualizationItem[]
  insights: InsightsEnvelope
  agents: AgentInfo[]
  before_after: BeforeAfterRow[]
  processed_at: string
  dataset: Dataset
}

const datasetPath = (datasetId: string) => `/datasets/${encodeURIComponent(datasetId)}`

/** `cleaned_<original name without extension>.csv` */
export const cleanedFileName = (originalName: string | undefined | null): string => {
  const base = (originalName || 'dataset').replace(/\.[^./\\]+$/, '') || 'dataset'
  return `cleaned_${base}.csv`
}

export const datasetApi = {
  getDatasets: (): Promise<Dataset[]> => apiClient<Dataset[]>('/datasets', { method: 'GET' }),

  getDataset: (datasetId: string): Promise<Dataset> =>
    apiClient<Dataset>(datasetPath(datasetId), { method: 'GET' }),

  uploadDataset: (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient<UploadResponse>('/datasets/upload', { method: 'POST', data: formData })
  },

  deleteDataset: (datasetId: string): Promise<{ success: boolean }> =>
    apiClient<{ success: boolean }>(datasetPath(datasetId), { method: 'DELETE' }),

  getDatasetProfile: (datasetId: string): Promise<ProfileResponse> =>
    apiClient<ProfileResponse>(`${datasetPath(datasetId)}/profile`, { method: 'GET' }),

  getDatasetPreview: (datasetId: string, limit = 100): Promise<PreviewResponse> =>
    apiClient<PreviewResponse>(`${datasetPath(datasetId)}/preview?limit=${limit}`, {
      method: 'GET',
    }),

  /** Runs the full multi-agent pipeline synchronously (can take 10-60 s). */
  processDataset: (datasetId: string): Promise<ProcessingResult> =>
    apiClient<ProcessingResult>(`${datasetPath(datasetId)}/process`, { method: 'POST' }),

  /** 404 (ApiError.status) if the dataset has never been processed. */
  getProcessingResult: (datasetId: string): Promise<ProcessingResult> =>
    apiClient<ProcessingResult>(`${datasetPath(datasetId)}/result`, { method: 'GET' }),

  /** Downloads the cleaned CSV (auth required) and triggers a browser save. */
  downloadCleanedDataset: async (datasetId: string, originalName: string): Promise<void> => {
    const blob = await apiDownload(`${datasetPath(datasetId)}/download`)
    saveBlob(blob, cleanedFileName(originalName))
  },
}
