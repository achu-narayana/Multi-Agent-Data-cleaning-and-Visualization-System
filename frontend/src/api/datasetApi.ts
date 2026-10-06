import { apiClient } from './client'
import { Dataset } from '@/types'

export interface UploadResponse {
  status: string
  dataset_id: string
  filename: string
  message?: string
}

export interface DatasetProfile {
  rows: number
  columns: number
  column_names: string[]
  missing_values?: Record<string, any>
  duplicate_rows?: number
  [key: string]: any
}

export interface ProcessingResult {
  dataset_id: string
  filename: string
  status: string
  quality_score: number
  profile: Record<string, any>
  cleaning_actions: any[]
  anomalies: any[]
  validation: Record<string, any>
  visualizations: any[]
  insights: Record<string, any>
  cleaned_filename?: string
  cleaned_data?: Record<string, any>[]
}

export const datasetApi = {
  uploadDataset: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    return await apiClient<UploadResponse>('/datasets/upload', {
      method: 'POST',
      data: formData,
    })
  },

  getDatasetProfile: async (
    datasetId: string
  ): Promise<DatasetProfile> => {
    return await apiClient<DatasetProfile>(
      `/datasets/${datasetId}/profile`,
      {
        method: 'GET',
      }
    )
  },

  processDataset: async (
    datasetId: string
  ): Promise<ProcessingResult> => {
    return await apiClient<ProcessingResult>(
      `/datasets/${datasetId}/process`,
      {
        method: 'POST',
      }
    )
  },

  getProcessingResult: async (
    datasetId: string
  ): Promise<ProcessingResult> => {
    return await apiClient<ProcessingResult>(
      `/datasets/${datasetId}/result`,
      {
        method: 'GET',
      }
    )
  },

  getDatasetDownloadUrl: (datasetId: string): string => {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL ||
      'http://localhost:8000'

    return `${baseUrl}/datasets/${datasetId}/download`
  },

  // Compatibility method for existing pages.
  // The current backend does not have a generic GET /datasets endpoint.
  getDatasets: async (): Promise<Dataset[]> => {
    return []
  },

  // Compatibility method for existing pages.
  // Dataset metadata is currently available through the profile/result APIs.
  getDatasetById: async (datasetId: string): Promise<any> => {
    return await datasetApi.getProcessingResult(datasetId)
  },

  // Compatibility method for existing UI.
  getDatasetPreview: async (
    datasetId: string
  ): Promise<Record<string, any>[]> => {
    const result = await datasetApi.getProcessingResult(datasetId)

    return result.cleaned_data || []
  },

  deleteDataset: async (
    _datasetId: string
  ): Promise<{ success: boolean }> => {
    throw new Error(
      'Dataset deletion is not implemented by the current backend.'
    )
  },
}