import { apiClient } from './client'
import { InsightItem } from '@/types'

export const insightApi = {
  getInsights: (datasetId: string): Promise<InsightItem[]> =>
    apiClient<InsightItem[]>(`/insights/${encodeURIComponent(datasetId)}`, { method: 'GET' }),
}
