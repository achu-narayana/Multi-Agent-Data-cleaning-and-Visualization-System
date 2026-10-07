import { apiClient } from './client'

export interface ChatHistoryItem {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  datasetId?: string
  history?: ChatHistoryItem[]
}

export interface ChatResponse {
  message: string
  suggestedQuestions: string[]
}

export const chatbotApi = {
  sendMessage: (payload: ChatRequest): Promise<ChatResponse> =>
    apiClient<ChatResponse>('/chat', { method: 'POST', data: payload }),
}
