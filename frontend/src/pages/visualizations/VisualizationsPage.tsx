import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { PieChart } from 'lucide-react'
import { useRouteDataset } from '@/context/useDataset'
import { visualizationApi } from '@/api/visualizationApi'
import { getErrorMessage, isNotFound } from '@/api/client'
import { ChartCard } from '@/components/visualizations/ChartCard'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { NotProcessedState } from '@/components/ui/NotProcessedState'
import { useApiData } from '@/hooks/useApiData'

export const VisualizationsPage: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>()
  const { dataset } = useRouteDataset(datasetId)
  const [filterType, setFilterType] = useState<string>('all')
  const { data, error, isLoading, reload } = useApiData(datasetId || null, () =>
    visualizationApi.getVisualizations(datasetId!)
  )

  const visualizations = data || []
  const chartTypes = ['all', ...Array.from(new Set(visualizations.map((v) => v.chartType)))]
  const activeFilter = chartTypes.includes(filterType) ? filterType : 'all'
  const filteredCharts = visualizations.filter(
    (item) => activeFilter === 'all' || item.chartType === activeFilter
  )

  const renderBody = () => {
    if (isLoading && !data) {
      return <LoadingState title="Loading visualizations..." />
    }
    if (error) {
      // 404 = not processed yet (or dataset not found) per API contract.
      if (isNotFound(error) && datasetId && dataset) {
        return <NotProcessedState datasetId={datasetId} what="Visualizations" />
      }
      return (
        <ErrorState
          title="Could not load visualizations"
          message={getErrorMessage(error)}
          onRetry={reload}
        />
      )
    }
    if (visualizations.length === 0) {
      return (
        <EmptyState
          title="No visualizations"
          description="The Visualization Agent did not produce any charts for this dataset."
        />
      )
    }
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCharts.map((item) => (
          <ChartCard key={item.id} item={item} />
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
            Charts recommended by the Visualization Agent for{' '}
            <span className="font-semibold text-slate-700">{dataset?.name || datasetId}</span>.
          </p>
        </div>

        {visualizations.length > 0 && (
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100/80 border border-slate-200 text-xs">
            {chartTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors cursor-pointer ${
                  activeFilter === type
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      {renderBody()}
    </div>
  )
}
