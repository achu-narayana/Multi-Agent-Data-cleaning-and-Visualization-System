import { apiClient } from './client'
import { VisualizationItem } from '@/types'

export const visualizationApi = {
  getVisualizations: (datasetId: string): Promise<VisualizationItem[]> =>
    apiClient<VisualizationItem[]>(`/visualizations/${encodeURIComponent(datasetId)}`, {
      method: 'GET',
    }),
}
