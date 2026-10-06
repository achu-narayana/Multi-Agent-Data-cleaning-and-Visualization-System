import React, { createContext, useContext, useState } from 'react'
import { Dataset, CleaningJob, AgentInfo, AgentType } from '@/types'
import { datasetApi, ProcessingResult } from '@/api/datasetApi'
import { mockService } from '@/services/mock/mockService'

interface DatasetContextType {
  datasets: Dataset[]
  selectedDataset: Dataset
  setSelectedDataset: (dataset: Dataset) => void

  activeJob: CleaningJob
  setActiveJob: (job: CleaningJob) => void

  processingResult: ProcessingResult | null

  isCleaningRunning: boolean
  cleaningStepMessage: string
  currentRunningAgentIndex: number | null

  uploadDatasetFile: (file: File) => Promise<Dataset>
  startCleaningForDataset: (datasetId: string) => Promise<CleaningJob>
  startLiveCleaningPipeline: (onComplete?: () => void) => Promise<void>
  resetCleaningState: () => void
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined)

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const initialDatasets = mockService.getDatasets()

  const [datasets, setDatasets] = useState<Dataset[]>(initialDatasets)

  const [selectedDataset, setSelectedDataset] = useState<Dataset>(
    initialDatasets[0]
  )

  const [activeJob, setActiveJob] = useState<CleaningJob>(() =>
    mockService.getCleaningJob('job_workforce_clean_882')
  )

  const [processingResult, setProcessingResult] =
    useState<ProcessingResult | null>(null)

  const [isCleaningRunning, setIsCleaningRunning] =
    useState<boolean>(false)

  const [cleaningStepMessage, setCleaningStepMessage] =
    useState<string>('')

  const [currentRunningAgentIndex, setCurrentRunningAgentIndex] =
    useState<number | null>(null)

  /**
   * Upload a real dataset to FastAPI.
   */
  const uploadDatasetFile = async (file: File): Promise<Dataset> => {
    const uploaded = await datasetApi.uploadDataset(file)

    const extension =
      file.name.split('.').pop()?.toLowerCase()

    const format: 'csv' | 'xlsx' =
      extension === 'xlsx' ? 'xlsx' : 'csv'

    const newDataset: Dataset = {
      id: uploaded.dataset_id,
      name: uploaded.filename,
      size: `${(file.size / 1024).toFixed(1)} KB`,
      rowCount: 0,
      columnCount: 0,
      format,
      uploadedAt: new Date().toISOString(),
      qualityScore: 0,
      status: 'raw',
      missingValues: 0,
      duplicateRows: 0,
      numericalColumns: 0,
      categoricalColumns: 0,
      dateColumns: 0,
      columns: [],
    }

    setDatasets((prev) => [newDataset, ...prev])
    setSelectedDataset(newDataset)

    return newDataset
  }

  /**
   * Execute the REAL FastAPI + LangGraph pipeline.
   */
  const startCleaningForDataset = async (
    datasetId: string
  ): Promise<CleaningJob> => {
    setIsCleaningRunning(true)
    setCleaningStepMessage('Initializing LangGraph Workflow...')
    setCurrentRunningAgentIndex(0)

    const startedAt = new Date().toISOString()

    try {
      const result = await datasetApi.processDataset(datasetId)

      setProcessingResult(result)

      const profile = result.profile || {}

      const rowCount = Number(
        profile.rows ??
        profile.row_count ??
        0
      )

      const columnCount = Number(
        profile.columns ??
        profile.column_count ??
        profile.column_names?.length ??
        0
      )

      const columns: string[] =
        Array.isArray(profile.column_names)
          ? profile.column_names
          : []

      const missingValues = Object.values(
        profile.missing_values || {}
      ).reduce((total: number, value: any) => {
        if (typeof value === 'number') {
          return total + value
        }

        if (value && typeof value.count === 'number') {
          return total + value.count
        }

        return total
      }, 0)

      const duplicateRows = Number(
        profile.duplicate_rows ?? 0
      )

      /*
       * The backend profile contains numerical statistics.
       * Use those keys to determine numerical column count.
       */
      const numericalColumns =
        profile.numerical_statistics &&
        typeof profile.numerical_statistics === 'object'
          ? Object.keys(profile.numerical_statistics).length
          : 0

      const categoricalColumns =
        profile.categorical_columns &&
        typeof profile.categorical_columns === 'object'
          ? Object.keys(profile.categorical_columns).length
          : 0

      const dateColumns =
        columns.filter((column) => {
          const lower = column.toLowerCase()

          return (
            lower.includes('date') ||
            lower.includes('time')
          )
        }).length

      const updatedDataset: Dataset = {
        id: datasetId,
        name: result.filename,
        size: selectedDataset?.size || '0 KB',
        rowCount,
        columnCount,
        format:
          selectedDataset?.format ||
          (result.filename.toLowerCase().endsWith('.xlsx')
            ? 'xlsx'
            : 'csv'),
        uploadedAt:
          selectedDataset?.uploadedAt ||
          new Date().toISOString(),
        qualityScore: Number(
          result.quality_score ?? 0
        ),
        status: 'cleaned',
        missingValues,
        duplicateRows,
        numericalColumns,
        categoricalColumns,
        dateColumns,
        columns,
      }

      setSelectedDataset(updatedDataset)

      setDatasets((prev) =>
        prev.map((dataset) =>
          dataset.id === datasetId
            ? updatedDataset
            : dataset
        )
      )

      /**
       * Build AgentInfo objects using the exact AgentType
       * values defined by the frontend.
       */
      const createAgent = (
        id: string,
        name: string,
        type: AgentType,
        description: string,
        recordsAffected: number
      ): AgentInfo => ({
        id,
        name,
        type,
        description,
        status: 'completed',
        executionTime: 0,
        recordsAffected,
      })

      const agents: AgentInfo[] = [
        createAgent(
          'profiling',
          'Profiling Agent',
          'profiling',
          'Profiles the uploaded dataset and identifies schema, missing values and statistics.',
          rowCount
        ),

        createAgent(
          'missing-value',
          'Missing Value Agent',
          'missing_value',
          'Detects and imputes missing numerical and categorical values.',
          result.cleaning_actions?.length || 0
        ),

        createAgent(
          'duplicate-detection',
          'Duplicate Agent',
          'duplicate_detection',
          'Detects and removes duplicate records.',
          duplicateRows
        ),

        createAgent(
          'standardization',
          'Standardization Agent',
          'standardization',
          'Normalizes inconsistent categorical values and formats.',
          result.cleaning_actions?.length || 0
        ),

        createAgent(
          'anomaly-detection',
          'Anomaly Agent',
          'anomaly_detection',
          'Detects domain violations, negative values and statistical outliers.',
          result.anomalies?.length || 0
        ),

        createAgent(
          'validation',
          'Validation Agent',
          'validation',
          'Validates the cleaned dataset and calculates the quality score.',
          0
        ),

        createAgent(
          'visualization',
          'Visualization Agent',
          'visualization',
          'Generates meaningful visualizations from the cleaned dataset.',
          result.visualizations?.length || 0
        ),

        createAgent(
          'insight',
          'Insight Agent',
          'insight',
          'Uses Gemini to generate data-driven findings and recommendations.',
          result.insights?.key_findings?.length || 0
        ),
      ]

      const qualityScore = Number(
        result.quality_score ?? 0
      )

      const job: CleaningJob = {
        id: datasetId,
        datasetId,
        datasetName: result.filename,
        status: 'completed',
        startedAt,
        completedAt: new Date().toISOString(),
        agents,
        quality: {
          beforeScore: 0,
          afterScore: qualityScore,
          improvement: qualityScore,
          breakdown: {
            completeness: qualityScore,
            consistency: qualityScore,
            validity: qualityScore,
            uniqueness: qualityScore,
          },
        },
      }

      setActiveJob(job)

      setCleaningStepMessage(
        'Processing completed successfully.'
      )

      setCurrentRunningAgentIndex(null)
      setIsCleaningRunning(false)

      return job
    } catch (error) {
      setIsCleaningRunning(false)
      setCurrentRunningAgentIndex(null)
      setCleaningStepMessage('Processing failed.')

      throw error
    }
  }

  /**
   * Compatibility function for the existing cleaning UI.
   * The actual work is now performed by FastAPI + LangGraph.
   */
  const startLiveCleaningPipeline = async (
    onComplete?: () => void
  ): Promise<void> => {
    if (
      isCleaningRunning ||
      !selectedDataset?.id
    ) {
      return
    }

    await startCleaningForDataset(
      selectedDataset.id
    )

    if (onComplete) {
      onComplete()
    }
  }

  const resetCleaningState = () => {
    setIsCleaningRunning(false)
    setCurrentRunningAgentIndex(null)
    setCleaningStepMessage('')
    setProcessingResult(null)

    setActiveJob(
      mockService.getCleaningJob(
        selectedDataset?.id ||
        'job_workforce_clean_882'
      )
    )
  }

  return (
    <DatasetContext.Provider
      value={{
        datasets,
        selectedDataset,
        setSelectedDataset,

        activeJob,
        setActiveJob,

        processingResult,

        isCleaningRunning,
        cleaningStepMessage,
        currentRunningAgentIndex,

        uploadDatasetFile,
        startCleaningForDataset,
        startLiveCleaningPipeline,
        resetCleaningState,
      }}
    >
      {children}
    </DatasetContext.Provider>
  )
}

export const useDataset = () => {
  const context = useContext(DatasetContext)

  if (!context) {
    throw new Error(
      'useDataset must be used within DatasetProvider'
    )
  }

  return context
}