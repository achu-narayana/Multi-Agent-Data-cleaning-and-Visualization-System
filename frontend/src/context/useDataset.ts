import { createContext, useContext, useEffect } from 'react'
import { Dataset } from '@/types'
import { ProcessingResult } from '@/api/datasetApi'

export interface DatasetContextType {
  /** The logged-in user's datasets, newest first (GET /datasets). */
  datasets: Dataset[]
  isLoadingDatasets: boolean
  datasetsError: string | null
  refreshDatasets: () => Promise<void>

  /** Dataset the user is currently working with (route param or last chosen). */
  selectedDataset: Dataset | null
  selectDataset: (datasetId: string | null) => void

  /** Cached ProcessingResults keyed by dataset id (`null` = known not processed). */
  results: Record<string, ProcessingResult | null>
  /** Dataset id whose pipeline is currently running, if any. */
  processingDatasetId: string | null

  uploadDatasetFile: (file: File) => Promise<Dataset>
  deleteDataset: (datasetId: string) => Promise<void>
  /** POST /datasets/{id}/process. Throws on failure. */
  processDataset: (datasetId: string) => Promise<ProcessingResult>
  /** GET /datasets/{id}/result, cached. Resolves to null on 404 (never processed). */
  loadProcessingResult: (datasetId: string, force?: boolean) => Promise<ProcessingResult | null>
}

export const DatasetContext = createContext<DatasetContextType | undefined>(undefined)

export const useDataset = (): DatasetContextType => {
  const context = useContext(DatasetContext)
  if (!context) {
    throw new Error('useDataset must be used within DatasetProvider')
  }
  return context
}

/**
 * Resolves the dataset referenced by a `:datasetId` route param and marks it
 * as the selected dataset so the sidebar / topbar follow along.
 */
export const useRouteDataset = (datasetId: string | undefined) => {
  const { datasets, isLoadingDatasets, datasetsError, refreshDatasets, selectDataset } =
    useDataset()

  useEffect(() => {
    if (datasetId) selectDataset(datasetId)
  }, [datasetId, selectDataset])

  const dataset = datasetId ? datasets.find((d) => d.id === datasetId) || null : null

  return {
    dataset,
    isLoading: isLoadingDatasets && !dataset,
    error: datasetsError,
    retry: refreshDatasets,
  }
}
