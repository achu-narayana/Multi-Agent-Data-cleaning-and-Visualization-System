import { apiClient } from './client'
import { AgentInfo } from '@/types'
import { mockService } from '@/services/mock/mockService'

export const agentApi = {
  getAgentPerformance: async (): Promise<AgentInfo[]> => {
    try {
      return await apiClient<AgentInfo[]>('/agents/performance', { method: 'GET' })
    } catch {
      return mockService.getAgentPerformance()
    }
  },
}
