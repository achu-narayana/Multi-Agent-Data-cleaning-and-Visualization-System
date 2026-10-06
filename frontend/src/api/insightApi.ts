import { apiClient } from './client'
import { InsightItem } from '@/types'
import { mockService } from '@/services/mock/mockService'

export const insightApi = {
  getInsights: async (datasetId: string): Promise<InsightItem[]> => {
    try {
      return await apiClient<InsightItem[]>(`/insights/${datasetId}`, { method: 'GET' })
    } catch {
      return mockService.getInsights(datasetId)
    }
  },
}
