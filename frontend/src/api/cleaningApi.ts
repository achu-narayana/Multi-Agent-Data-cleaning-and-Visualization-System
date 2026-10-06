import { apiClient } from './client'
import { CleaningJob, AgentInfo, BeforeAfterRow } from '@/types'
import { mockService } from '@/services/mock/mockService'

export const cleaningApi = {
  startCleaning: async (datasetId: string): Promise<CleaningJob> => {
    try {
      return await apiClient<CleaningJob>(`/datasets/${datasetId}/clean`, {
        method: 'POST',
      })
    } catch {
      return mockService.createCleaningJob(datasetId)
    }
  },

  getCleaningJob: async (jobId: string): Promise<CleaningJob> => {
    try {
      return await apiClient<CleaningJob>(`/cleaning/${jobId}`, { method: 'GET' })
    } catch {
      return mockService.getCleaningJob(jobId)
    }
  },

  getJobAgents: async (jobId: string): Promise<AgentInfo[]> => {
    try {
      return await apiClient<AgentInfo[]>(`/cleaning/${jobId}/agents`, { method: 'GET' })
    } catch {
      return mockService.getJobAgents(jobId)
    }
  },

  getBeforeAfterData: async (_jobId: string): Promise<BeforeAfterRow[]> => {
    try {
      return await apiClient<BeforeAfterRow[]>(`/cleaning/${_jobId}/before-after`, { method: 'GET' })
    } catch {
      return mockService.getBeforeAfterData(_jobId)
    }
  },
}
