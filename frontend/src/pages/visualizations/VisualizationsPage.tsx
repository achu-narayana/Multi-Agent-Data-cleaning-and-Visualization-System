import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { PieChart, Sparkles, Filter, Layers } from 'lucide-react'
import { useDataset } from '@/context/DatasetContext'
import { visualizationApi } from '@/api/visualizationApi'
import { ChartCard } from '@/components/visualizations/ChartCard'
import { LoadingState } from '@/components/ui/LoadingState'
import { VisualizationItem, ChartType } from '@/types'
import { mockVisualizations } from '@/services/mock/mockData'

export const VisualizationsPage: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>()
  const { selectedDataset } = useDataset()
  const [visualizations, setVisualizations] = useState<VisualizationItem[]>(mockVisualizations)
  const [filterType, setFilterType] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchVisualizations = async () => {
      setIsLoading(true)
      try {
        const data = await visualizationApi.getVisualizations(datasetId || selectedDataset.id)
        setVisualizations(data)
      } finally {
        setIsLoading(false)
      }
    }
    fetchVisualizations()
  }, [datasetId, selectedDataset.id])

  const filteredCharts = visualizations.filter((item) => {
    if (filterType === 'all') return true
    return item.chartType === filterType
  })

  if (isLoading) {
    return (
      <LoadingState
        title="Generating intelligent visualizations..."
        subtitle="Visualization Agent is analyzing cardinality and generating optimal charts"
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
              <PieChart className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Visualization Agent Recommendations
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Intelligent Visualizations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualizations recommended by the Visualization Agent based on variable type, variance,
            and information density.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100/80 border border-slate-200 text-xs">
          {['all', 'scatter', 'bar', 'line', 'histogram', 'box'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors cursor-pointer ${
                filterType === type
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCharts.map((item) => (
          <ChartCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
