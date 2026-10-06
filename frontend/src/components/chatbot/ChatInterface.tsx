import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Database, Loader2, RefreshCw } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ChatMessage } from '@/types'
import { chatbotApi } from '@/api/chatbotApi'
import {
  mockChatInitialMessages,
  mockChatSuggestedQuestions,
} from '@/services/mock/mockData'

interface ChatInterfaceProps {
  datasetName: string
  datasetId: string
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ datasetName, datasetId }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatInitialMessages)
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText
    if (!text.trim() || isTyping) return

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: 'Just now',
    }

    setMessages((prev) => [...prev, userMessage])
    if (!textToSend) setInputText('')
    setIsTyping(true)

    try {
      const response = await chatbotApi.sendMessage({
        message: text.trim(),
        datasetId,
      })

      // Simulate human-like thinking delay
      setTimeout(() => {
        const auraMessage: ChatMessage = {
          id: `msg_aura_${Date.now()}`,
          sender: 'aura',
          text: response.message,
          timestamp: 'Just now',
          suggestedQuestions: response.suggestedQuestions,
        }
        setMessages((prev) => [...prev, auraMessage])
        setIsTyping(false)
      }, 700)
    } catch {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleResetChat = () => {
    setMessages(mockChatInitialMessages)
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
                Online
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
                        onClick={() => handleSend(q)}
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

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Quick Carousel */}
      <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          Suggested:
        </span>
        {mockChatSuggestedQuestions.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => handleSend(suggestion)}
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
            onClick={() => handleSend()}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Send
          </Button>
        </div>
      </div>
    </Card>
  )
}
