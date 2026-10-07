import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Database, Layers, Sparkles, Award, Plus } from 'lucide-react'
import { useAuth } from '@/context/useAuth'
import { useDataset } from '@/context/useDataset'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingState } from '@/components/ui/LoadingState'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { QualityScoreCard } from '@/components/dashboard/QualityScoreCard'
import { RecentDatasetsTable } from '@/components/dashboard/RecentDatasetsTable'
import { round1 } from '@/utils/format'

const greetingForHour = (hour: number) => {
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const formatCompact = (n: number) =>
  n >= 1_000_000 ? `${round1(n / 1_000_000)}M` : n >= 1000 ? `${round1(n / 1000)}K` : String(n)

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { datasets, isLoadingDatasets, datasetsError, refreshDatasets, results, loadProcessingResult } =
    useDataset()
  const navigate = useNavigate()

  // Computed once at mount (lazy initializer) to keep render pure.
  const [greeting] = useState(() => greetingForHour(new Date().getHours()))
  const userName = user?.name?.split(' ')[0] || 'there'

  const cleaned = useMemo(() => datasets.filter((d) => d.status === 'cleaned'), [datasets])
  const latestCleaned = cleaned[0] || null
  const totalRows = datasets.reduce((sum, d) => sum + (d.rowCount || 0), 0)
  const avgQuality =
    cleaned.length > 0
      ? round1(cleaned.reduce((sum, d) => sum + (d.qualityScore || 0), 0) / cleaned.length)
      : null

  useEffect(() => {
    if (latestCleaned) {
      loadProcessingResult(latestCleaned.id).catch(() => undefined)
    }
  }, [latestCleaned, loadProcessingResult])

  const latestResult = latestCleaned ? results[latestCleaned.id] : undefined

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {greeting}, {userName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clean, understand and extract insights from your data.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => navigate('/datasets')}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Upload Dataset
        </Button>
      </div>

      {datasetsError && datasets.length === 0 ? (
        <ErrorState
          title="Could not load your datasets"
          message={datasetsError}
          onRetry={() => void refreshDatasets()}
        />
      ) : isLoadingDatasets && datasets.length === 0 ? (
        <LoadingState title="Loading your workspace..." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              title="Datasets"
              value={String(datasets.length)}
              subtitle={`${cleaned.length} cleaned`}
              icon={<Database className="w-5 h-5 text-blue-600" />}
              iconBg="bg-blue-50"
            />
            <KpiCard
              title="Total Rows"
              value={formatCompact(totalRows)}
              subtitle="Across all uploaded datasets"
              icon={<Layers className="w-5 h-5 text-indigo-600" />}
              iconBg="bg-indigo-50"
            />
            <KpiCard
              title="Average Quality"
              value={avgQuality === null ? '—' : `${avgQuality}%`}
              subtitle={avgQuality === null ? 'No cleaned datasets yet' : 'Mean of cleaned datasets'}
              icon={<Award className="w-5 h-5 text-emerald-600" />}
              iconBg="bg-emerald-50"
            />
            <KpiCard
              title="Cleaned Datasets"
              value={String(cleaned.length)}
              subtitle={`${datasets.filter((d) => d.status === 'failed').length} failed`}
              icon={<Sparkles className="w-5 h-5 text-purple-600" />}
              iconBg="bg-purple-50"
            />
          </div>

          {latestCleaned && latestResult ? (
            <QualityScoreCard
              datasetName={latestResult.filename || latestCleaned.name}
              beforeScore={latestResult.original_quality_score}
              afterScore={latestResult.quality_score}
              validation={latestResult.validation}
              onOpenPipeline={() => navigate(`/cleaning/${latestCleaned.id}`)}
            />
          ) : (
            <Card className="p-6 text-xs text-slate-500">
              {datasets.length === 0
                ? 'Upload a dataset to get started. Quality results appear here after the cleaning pipeline runs.'
                : latestCleaned && latestResult === undefined
                ? 'Loading latest quality result...'
                : latestCleaned
                ? `No stored pipeline result is available for ${latestCleaned.name}.`
                : 'No dataset has been cleaned yet. Open a dataset and run the multi-agent pipeline to see quality results.'}
            </Card>
          )}

          <RecentDatasetsTable datasets={datasets.slice(0, 5)} />
        </>
      )}
    </div>
  )
}
