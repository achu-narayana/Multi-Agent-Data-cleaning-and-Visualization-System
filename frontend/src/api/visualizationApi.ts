import { apiClient } from './client'
import { VisualizationItem } from '@/types'
import { mockService } from '@/services/mock/mockService'

export const visualizationApi = {
  getVisualizations: async (datasetId: string): Promise<VisualizationItem[]> => {
    try {
      return await apiClient<VisualizationItem[]>(`/visualizations/${datasetId}`, { method: 'GET' })
    } catch {
      return mockService.getVisualizations(datasetId)
    }
  },
}
