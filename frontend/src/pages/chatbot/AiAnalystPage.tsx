import React from 'react'
import { Bot, Sparkles, Database } from 'lucide-react'
import { useDataset } from '@/context/DatasetContext'
import { ChatInterface } from '@/components/chatbot/ChatInterface'

export const AiAnalystPage: React.FC = () => {
  const { selectedDataset, datasets, setSelectedDataset } = useDataset()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-50 text-blue-600">
              <Bot className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Natural Language Dataset Querying
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            AURA AI Analyst
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ask questions about your dataset. AURA combines agent profiles, data distributions, and
            cleaning logs to provide instant, factual answers.
          </p>
        </div>

        {/* Dataset Selector Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-500 whitespace-nowrap">
            Active Dataset:
          </label>
          <select
            value={selectedDataset.id}
            onChange={(e) => {
              const found = datasets.find((d) => d.id === e.target.value)
              if (found) setSelectedDataset(found)
            }}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600/30 text-slate-800"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.rowCount.toLocaleString()} rows)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ChatGPT-style Interactive Interface */}
      <ChatInterface
        datasetName={selectedDataset.name}
        datasetId={selectedDataset.id}
      />
    </div>
  )
}
