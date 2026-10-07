import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Database, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChatMessage } from '@/types'
import { chatbotApi, ChatHistoryItem } from '@/api/chatbotApi'
import { getErrorMessage } from '@/api/client'

interface ChatInterfaceProps {
  datasetName: string
  datasetId: string
}

const DEFAULT_SUGGESTIONS = [
  'What are the biggest data-quality problems?',
  'What changed after cleaning?',
  'Why were rows removed?',
  'Show me the important insights.',
]

const MAX_HISTORY = 12

const welcomeMessage = (datasetName: string): ChatMessage => ({
  id: 'welcome',
  sender: 'aura',
  text: `Hi! I'm AURA, your AI data analyst. Ask me anything about "${datasetName}" - its quality issues, what the cleaning agents changed, or the key insights.`,
  timestamp: '',
  suggestedQuestions: DEFAULT_SUGGESTIONS.slice(0, 3),
})

const nowLabel = () =>
  new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ datasetName, datasetId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [welcomeMessage(datasetName)])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(1)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim()
    if (!text || isTyping) return

    const history: ChatHistoryItem[] = messages
      .filter((m) => m.id !== 'welcome' && !m.id.startsWith('err_'))
      .slice(-MAX_HISTORY)
      .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }))

    const userMessage: ChatMessage = {
      id: `msg_user_${nextId.current++}`,
      sender: 'user',
      text,
      timestamp: nowLabel(),
    }

    setMessages((prev) => [...prev, userMessage])
    if (textToSend === undefined) setInputText('')
    setError(null)
    setIsTyping(true)

    try {
      const response = await chatbotApi.sendMessage({ message: text, datasetId, history })
      const auraMessage: ChatMessage = {
        id: `msg_aura_${nextId.current++}`,
        sender: 'aura',
        text: response.message,
        timestamp: nowLabel(),
        suggestedQuestions: response.suggestedQuestions || [],
      }
      setMessages((prev) => [...prev, auraMessage])
    } catch (err) {
      setError(getErrorMessage(err, 'The AI analyst is unavailable right now.'))
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const handleResetChat = () => {
    setMessages([welcomeMessage(datasetName)])
    setError(null)
  }

  return (
    <Card className="flex flex-col h-[700px] max-h-[85vh] overflow-hidden border-slate-200/90 shadow-sm">
      {/* Header with Dataset Selector */}
      <div className="p-4 border-b border-slate-200/90 bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">AURA AI Analyst</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                AI
              </span>
            </div>
            <p className="text-xs text-slate-500">Ask questions about your dataset</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Dataset Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>{datasetName}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetChat}
            title="Reset Conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/40">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user'

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  isUser ? 'bg-slate-800 text-white' : 'bg-blue-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-2">
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-2xs whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Suggested Questions under Aura Message */}
                {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.suggestedQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => void handleSend(q)}
                        className="text-[11px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-colors text-left cursor-pointer"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3 max-w-2xl">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl rounded-tl-xs bg-white border border-slate-200 text-xs text-slate-500 flex items-center gap-2 shadow-2xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>AURA is reasoning over dataset metrics...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 max-w-2xl p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Quick Carousel */}
      <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          Suggested:
        </span>
        {DEFAULT_SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            disabled={isTyping}
            onClick={() => void handleSend(suggestion)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 whitespace-nowrap transition-colors cursor-pointer"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input Field Bar */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask anything about your dataset..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isTyping}
            className="flex-1 text-xs px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-colors"
          />
          <Button
            variant="primary"
            size="md"
            disabled={!inputText.trim() || isTyping}
            onClick={() => void handleSend()}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Send
          </Button>
        </div>
      </div>
    </Card>
  )
}
