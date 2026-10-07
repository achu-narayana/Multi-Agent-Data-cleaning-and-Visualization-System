import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Lightbulb, Bot, ArrowRight } from 'lucide-react'
import { useRouteDataset } from '@/context/useDataset'
import { insightApi } from '@/api/insightApi'
import { getErrorMessage, isNotFound } from '@/api/client'
import { InsightCard } from '@/components/insights/InsightCard'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { NotProcessedState } from '@/components/ui/NotProcessedState'
import { Button } from '@/components/ui/Button'
import { useApiData } from '@/hooks/useApiData'

const CATEGORIES = ['all', 'Correlation', 'Distribution', 'Data Quality', 'Anomaly', 'Trend']

export const InsightsPage: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>()
  const navigate = useNavigate()
  const { dataset } = useRouteDataset(datasetId)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { data, error, isLoading, reload } = useApiData(datasetId || null, () =>
    insightApi.getInsights(datasetId!)
  )

  const insights = data || []
  const filteredInsights = insights.filter(
    (ins) => selectedCategory === 'all' || ins.category === selectedCategory
  )

  const renderBody = () => {
    if (isLoading && !data) {
      return <LoadingState title="Loading insights..." />
    }
    if (error) {
      if (isNotFound(error) && datasetId && dataset) {
        return <NotProcessedState datasetId={datasetId} what="Insights" />
      }
      return (
        <ErrorState title="Could not load insights" message={getErrorMessage(error)} onRetry={reload} />
      )
    }
    if (insights.length === 0) {
      return (
        <EmptyState
          icon={<Lightbulb className="w-6 h-6" />}
          title="No insights available"
          description="The Insight Agent returned no findings for this dataset (the AI model may have been unavailable during processing). Re-run the pipeline to try again."
        />
      )
    }
    if (filteredInsights.length === 0) {
      return (
        <EmptyState
          icon={<Lightbulb className="w-6 h-6" />}
          title="No insights in this category"
          description="Choose another category to see more findings."
        />
      )
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredInsights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-50 text-blue-600">
              <Lightbulb className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Insight Agent Signals
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">AI-Generated Insights</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Findings and recommendations for{' '}
            <span className="font-semibold text-slate-700">{dataset?.name || datasetId}</span>.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => navigate('/ai-analyst')}
          leftIcon={<Bot className="w-4 h-4" />}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Discuss with AURA AI
        </Button>
      </div>

      {insights.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'All Insights' : cat}
            </button>
          ))}
        </div>
      )}

      {renderBody()}
    </div>
  )
}
