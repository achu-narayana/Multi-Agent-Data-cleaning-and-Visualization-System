import { apiClient } from './client'
import { AgentInfo } from '@/types'

export const agentApi = {
  getAgentPerformance: (): Promise<AgentInfo[]> =>
    apiClient<AgentInfo[]>('/agents/performance', { method: 'GET' }),
}
