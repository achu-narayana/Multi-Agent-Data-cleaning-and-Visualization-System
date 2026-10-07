import { apiClient } from './client'
import { AnalyticsSummary } from '@/types'

export const analyticsApi = {
  getAnalytics: (datasetId: string): Promise<AnalyticsSummary> =>
    apiClient<AnalyticsSummary>(`/analytics/${encodeURIComponent(datasetId)}`, { method: 'GET' }),
}
