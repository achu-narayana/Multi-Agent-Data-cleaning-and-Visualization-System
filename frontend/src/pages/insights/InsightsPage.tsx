import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Lightbulb, Sparkles, Bot, Filter, ArrowRight } from 'lucide-react'
import { useDataset } from '@/context/DatasetContext'
import { insightApi } from '@/api/insightApi'
import { InsightCard } from '@/components/insights/InsightCard'
import { LoadingState } from '@/components/ui/LoadingState'
import { Button } from '@/components/ui/Button'
import { InsightItem } from '@/types'
import { mockInsights } from '@/services/mock/mockData'

export const InsightsPage: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>()
  const navigate = useNavigate()
  const { selectedDataset } = useDataset()
  const [insights, setInsights] = useState<InsightItem[]>(mockInsights)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchInsights = async () => {
      setIsLoading(true)
      try {
        const data = await insightApi.getInsights(datasetId || selectedDataset.id)
        setInsights(data)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInsights()
  }, [datasetId, selectedDataset.id])

  const categories = ['all', 'Correlation', 'Distribution', 'Data Quality', 'Anomaly', 'Trend']

  const filteredInsights = insights.filter((ins) => {
    if (selectedCategory === 'all') return true
    return ins.category === selectedCategory
  })

  if (isLoading) {
    return (
      <LoadingState
        title="Generating insights..."
        subtitle="Insight Agent is running Bayesian hypothesis checks and correlation clustering"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            AI-Generated Insights
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Key statistical findings, anomalies, and business trends surfaced autonomously by the
            Insight Agent.
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

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {categories.map((cat) => (
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

      {/* Insights Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredInsights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  )
}
