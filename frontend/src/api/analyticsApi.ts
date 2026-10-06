import { apiClient } from './client'
import { AnalyticsSummary } from '@/types'
import { mockService } from '@/services/mock/mockService'

export const analyticsApi = {
  getAnalytics: async (datasetId: string): Promise<AnalyticsSummary> => {
    try {
      return await apiClient<AnalyticsSummary>(`/analytics/${datasetId}`, { method: 'GET' })
    } catch {
      return mockService.getAnalytics(datasetId)
    }
  },
}
