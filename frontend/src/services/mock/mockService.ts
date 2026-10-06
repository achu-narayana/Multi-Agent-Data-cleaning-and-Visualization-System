import {
  Dataset,
  CleaningJob,
  AgentInfo,
  AnalyticsSummary,
  VisualizationItem,
  InsightItem,
  BeforeAfterRow,
} from '@/types'
import {
  mockDatasets,
  mockCleaningJob,
  mockDatasetPreviewRows,
  mockBeforeAfterRows,
  mockAnalyticsSummary,
  mockVisualizations,
  mockInsights,
} from './mockData'

// In-memory mock storage that persists throughout the session
let datasetsStore: Dataset[] = [...mockDatasets]
let cleaningJobsStore: Record<string, CleaningJob> = {
  [mockCleaningJob.id]: mockCleaningJob,
  // Also index by datasetId for convenience
  ['job_' + mockDatasets[0].id]: { ...mockCleaningJob, id: 'job_' + mockDatasets[0].id, datasetId: mockDatasets[0].id },
}

export const mockService = {
  getDatasets: (): Dataset[] => {
    return datasetsStore
  },

  getDatasetById: (id: string): Dataset => {
    const found = datasetsStore.find((d) => d.id === id)
    return found || datasetsStore[0]
  },

  createDataset: (file: File): Dataset => {
    const id = `ds_${Date.now()}`
    const newDataset: Dataset = {
      id,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      rowCount: Math.floor(Math.random() * 8000) + 2000,
      columnCount: 18,
      format: file.name.endsWith('.xlsx') ? 'xlsx' : 'csv',
      uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      qualityScore: 61.4,
      status: 'raw',
      missingValues: 421,
      duplicateRows: 231,
      numericalColumns: 8,
      categoricalColumns: 7,
      dateColumns: 3,
      columns: [
        'Employee ID',
        'Name',
        'Age',
        'Department',
        'Role',
        'Salary',
        'Experience',
        'Education',
        'Performance Rating',
        'Work Hours',
        'Projects Completed',
        'Joining Date',
        'City',
        'Remote Ratio',
        'Satisfaction Score',
        'Last Promotion Date',
        'Attrition Risk',
        'Sick Leave Days',
      ],
    }
    datasetsStore = [newDataset, ...datasetsStore]
    return newDataset
  },

  getDatasetPreview: (_id: string): Record<string, any>[] => {
    return mockDatasetPreviewRows
  },

  createCleaningJob: (datasetId: string): CleaningJob => {
    const ds = datasetsStore.find((d) => d.id === datasetId) || datasetsStore[0]
    const jobId = `job_${Date.now()}`

    const newJob: CleaningJob = {
      id: jobId,
      datasetId: ds.id,
      datasetName: ds.name,
      status: 'pending',
      startedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      quality: {
        beforeScore: 61.4,
        afterScore: 94.2,
        improvement: 32.8,
        breakdown: {
          completeness: 96,
          consistency: 92,
          validity: 95,
          uniqueness: 94,
        },
      },
      agents: mockCleaningJob.agents.map((ag) => ({
        ...ag,
        status: 'waiting',
      })),
    }

    cleaningJobsStore[jobId] = newJob
    return newJob
  },

  getCleaningJob: (jobId: string): CleaningJob => {
    if (cleaningJobsStore[jobId]) {
      return cleaningJobsStore[jobId]
    }
    // Return standard mock job with this id
    return {
      ...mockCleaningJob,
      id: jobId,
    }
  },

  getJobAgents: (jobId: string): AgentInfo[] => {
    const job = cleaningJobsStore[jobId] || mockCleaningJob
    return job.agents
  },

  getBeforeAfterData: (_jobId: string): BeforeAfterRow[] => {
    return mockBeforeAfterRows
  },

  getAnalytics: (datasetId: string): AnalyticsSummary => {
    return {
      ...mockAnalyticsSummary,
      datasetId,
    }
  },

  getVisualizations: (_datasetId: string): VisualizationItem[] => {
    return mockVisualizations
  },

  getInsights: (_datasetId: string): InsightItem[] => {
    return mockInsights
  },

  getAgentPerformance: (): AgentInfo[] => {
    return mockCleaningJob.agents
  },
}
