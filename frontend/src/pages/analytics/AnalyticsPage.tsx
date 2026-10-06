import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { BarChart3, TrendingUp, Sparkles, Filter, Download } from 'lucide-react'
import { useDataset } from '@/context/DatasetContext'
import { analyticsApi } from '@/api/analyticsApi'
import { DescriptiveStatsTable } from '@/components/analytics/DescriptiveStatsTable'
import { CorrelationHeatmap } from '@/components/analytics/CorrelationHeatmap'
import { DistributionCharts } from '@/components/analytics/DistributionCharts'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { AnalyticsSummary } from '@/types'
import { mockAnalyticsSummary } from '@/services/mock/mockData'

export const AnalyticsPage: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>()
  const { selectedDataset } = useDataset()
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(mockAnalyticsSummary)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true)
      try {
        const data = await analyticsApi.getAnalytics(datasetId || selectedDataset.id)
        setAnalytics(data)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAnalytics()
  }, [datasetId, selectedDataset.id])

  if (isLoading) {
    return <LoadingState title="Computing statistical metrics..." subtitle="Profiling variables, calculating moments and Pearson matrices" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Dataset Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Dataset:{' '}
            <span className="font-semibold text-slate-700">{selectedDataset.name}</span> • 18
            Profiled Columns • Zero Missing Values
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => alert('Exporting statistical summary CSV...')}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            Export Stats CSV
          </Button>
        </div>
      </div>

      {/* Key Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {analytics.keyStats.map((stat, idx) => (
          <Card key={idx} className="p-4 bg-white">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              {stat.label}
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-1 font-mono">{stat.value}</h3>
            {stat.change && (
              <span className="inline-block text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-1.5 border border-emerald-200">
                {stat.change}
              </span>
            )}
            {stat.hint && !stat.change && (
              <p className="text-[11px] text-slate-400 mt-1">{stat.hint}</p>
            )}
          </Card>
        ))}
      </div>

      {/* Descriptive Statistics Table */}
      <DescriptiveStatsTable stats={analytics.descriptiveStats} />

      {/* Distribution Charts */}
      <DistributionCharts
        categoryDistributions={analytics.categoryDistributions}
        numericalDistributions={analytics.numericalDistributions}
      />

      {/* Correlation Heatmap */}
      <CorrelationHeatmap
        columns={analytics.correlationMatrix.columns}
        matrix={analytics.correlationMatrix.matrix}
      />
    </div>
  )
}
