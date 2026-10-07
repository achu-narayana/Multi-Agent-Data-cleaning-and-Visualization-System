import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot } from 'lucide-react'
import { useDataset } from '@/context/useDataset'
import { ChatInterface } from '@/components/chatbot/ChatInterface'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'

export const AiAnalystPage: React.FC = () => {
  const navigate = useNavigate()
  const { selectedDataset, datasets, selectDataset, isLoadingDatasets, datasetsError, refreshDatasets } =
    useDataset()

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">AURA AI Analyst</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ask questions about your dataset. Answers are grounded in the dataset profile, cleaning
            results and insights.
          </p>
        </div>

        {datasets.length > 0 && selectedDataset && (
          <div className="flex items-center gap-2">
            <label htmlFor="chat-dataset" className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Active Dataset:
            </label>
            <select
              id="chat-dataset"
              value={selectedDataset.id}
              onChange={(e) => selectDataset(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600/30 text-slate-800"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({(d.rowCount ?? 0).toLocaleString()} rows)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isLoadingDatasets && datasets.length === 0 ? (
        <LoadingState title="Loading datasets..." />
      ) : datasetsError && datasets.length === 0 ? (
        <ErrorState
          title="Could not load datasets"
          message={datasetsError}
          onRetry={() => void refreshDatasets()}
        />
      ) : !selectedDataset ? (
        <EmptyState
          icon={<Bot className="w-6 h-6" />}
          title="No dataset to discuss yet"
          description="Upload a dataset first, then ask the AI analyst about it."
          actionLabel="Upload Dataset"
          onAction={() => navigate('/datasets')}
        />
      ) : (
        // key resets the conversation when the dataset changes
        <ChatInterface
          key={selectedDataset.id}
          datasetName={selectedDataset.name}
          datasetId={selectedDataset.id}
        />
      )}
    </div>
  )
}
