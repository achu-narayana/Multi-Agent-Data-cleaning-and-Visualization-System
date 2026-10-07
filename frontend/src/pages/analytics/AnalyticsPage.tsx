import React from 'react'
import { useParams } from 'react-router-dom'
import { BarChart3, Download } from 'lucide-react'
import { useRouteDataset } from '@/context/useDataset'
import { analyticsApi } from '@/api/analyticsApi'
import { getErrorMessage, isNotFound } from '@/api/client'
import { DescriptiveStatsTable } from '@/components/analytics/DescriptiveStatsTable'
import { CorrelationHeatmap } from '@/components/analytics/CorrelationHeatmap'
import { DistributionCharts } from '@/components/analytics/DistributionCharts'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { useApiData } from '@/hooks/useApiData'
import { saveBlob, toCsv } from '@/utils/download'

export const AnalyticsPage: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>()
  const { dataset } = useRouteDataset(datasetId)
  const { data: analytics, error, isLoading, reload } = useApiData(datasetId || null, () =>
    analyticsApi.getAnalytics(datasetId!)
  )

  const handleExport = () => {
    if (!analytics) return
    const columns = ['column', 'count', 'nullCount', 'mean', 'median', 'min', 'max', 'stdDev']
    const csv = toCsv(columns, analytics.descriptiveStats as unknown as Array<Record<string, unknown>>)
    const base = (dataset?.name || datasetId || 'dataset').replace(/\.[^.]+$/, '')
    saveBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `stats_${base}.csv`)
  }

  if (isLoading && !analytics) {
    return (
      <LoadingState
        title="Computing statistical metrics..."
        subtitle="Calculating descriptive statistics, distributions and correlations"
      />
    )
  }

  if (error || !analytics) {
    return (
      <ErrorState
        title={isNotFound(error) ? 'Dataset not found' : 'Could not load analytics'}
        message={getErrorMessage(error, 'No analytics data was returned.')}
        onRetry={reload}
      />
    )
  }

  const keyStats = analytics.keyStats || []
  const correlation = analytics.correlationMatrix || { columns: [], matrix: [] }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-50 text-blue-600">
              <BarChart3 className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Exploratory Data Analysis
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">Dataset Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dataset: <span className="font-semibold text-slate-700">{dataset?.name || datasetId}</span>
            {dataset && (
              <>
                {' '}
                • {dataset.columnCount} columns •{' '}
                {dataset.status === 'cleaned' ? 'computed from cleaned data' : 'computed from original data'}
              </>
            )}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={(analytics.descriptiveStats || []).length === 0}
          leftIcon={<Download className="w-3.5 h-3.5" />}
        >
          Export Stats CSV
        </Button>
      </div>

      {keyStats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {keyStats.map((stat, idx) => (
            <Card key={`${stat.label}-${idx}`} className="p-4 bg-white">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                {stat.label}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 font-mono">{stat.value}</h3>
              {stat.change && (
                <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 rounded mt-1.5 border border-emerald-200">
                  {stat.change}
                </span>
              )}
              {stat.hint && !stat.change && (
                <p className="text-[11px] text-slate-400 mt-1">{stat.hint}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <DescriptiveStatsTable stats={analytics.descriptiveStats || []} />

      <DistributionCharts
        categoryDistributions={analytics.categoryDistributions || {}}
        numericalDistributions={analytics.numericalDistributions || {}}
      />

      {correlation.columns.length > 1 ? (
        <CorrelationHeatmap columns={correlation.columns} matrix={correlation.matrix} />
      ) : (
        <Card className="p-6 text-center text-xs text-slate-400">
          A correlation matrix needs at least two numeric columns.
        </Card>
      )}
    </div>
  )
}
