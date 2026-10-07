import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sparkles, Download, ArrowLeft, AlertTriangle, Workflow } from 'lucide-react'
import { useDataset, useRouteDataset } from '@/context/useDataset'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { DatasetPreview } from '@/components/datasets/DatasetPreview'
import { datasetApi } from '@/api/datasetApi'
import { getErrorMessage } from '@/api/client'
import { useApiData } from '@/hooks/useApiData'
import { formatDateTime } from '@/utils/format'

export const DatasetDetailPage: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>()
  const navigate = useNavigate()
  const { processDataset, processingDatasetId } = useDataset()
  const { dataset, isLoading: isLoadingDataset, error: datasetError, retry } =
    useRouteDataset(datasetId)

  const [actionError, setActionError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  // Re-fetch the preview whenever the dataset status changes (cleaned preview after processing).
  const previewKey = dataset ? `${dataset.id}:${dataset.status}` : null
  const preview = useApiData(previewKey, () => datasetApi.getDatasetPreview(dataset!.id, 100))

  const isProcessing = !!dataset && processingDatasetId === dataset.id

  if (isLoadingDataset) {
    return <LoadingState title="Loading dataset..." />
  }

  if (!dataset) {
    return (
      <ErrorState
        title={datasetError ? 'Could not load datasets' : 'Dataset not found'}
        message={
          datasetError ||
          'This dataset does not exist or does not belong to your account.'
        }
        onRetry={datasetError ? () => void retry() : () => navigate('/datasets')}
      />
    )
  }

  const handleDownloadCleaned = async () => {
    setActionError(null)
    setIsDownloading(true)
    try {
      await datasetApi.downloadCleanedDataset(dataset.id, dataset.name)
    } catch (error) {
      setActionError(getErrorMessage(error, 'Download failed.'))
    } finally {
      setIsDownloading(false)
    }
  }

  const handleStartCleaning = async () => {
    setActionError(null)
    try {
      await processDataset(dataset.id)
      navigate(`/cleaning/${dataset.id}`)
    } catch (error) {
      setActionError(getErrorMessage(error, 'The cleaning pipeline failed.'))
    }
  }

  const stats: Array<{ label: string; value: number; tone?: 'amber' | 'rose' }> = [
    { label: 'Total Rows', value: dataset.rowCount ?? 0 },
    { label: 'Columns', value: dataset.columnCount ?? 0 },
    { label: 'Missing Values', value: dataset.missingValues ?? 0, tone: 'amber' },
    { label: 'Duplicate Rows', value: dataset.duplicateRows ?? 0, tone: 'rose' },
    { label: 'Numerical Cols', value: dataset.numericalColumns ?? 0 },
    { label: 'Categorical Cols', value: dataset.categoricalColumns ?? 0 },
    { label: 'Date Cols', value: dataset.dateColumns ?? 0 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/datasets')}
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            Back
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900">{dataset.name}</h1>
              <StatusBadge status={dataset.status} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Uploaded {formatDateTime(dataset.uploadedAt)} • Format:{' '}
              {(dataset.format || '').toUpperCase()} ({dataset.size}) • Quality score:{' '}
              {dataset.qualityScore ?? 0}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dataset.status === 'cleaned' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/cleaning/${dataset.id}`)}
                leftIcon={<Workflow className="w-3.5 h-3.5 text-blue-600" />}
              >
                View Pipeline Result
              </Button>
              <Button
                variant="outline"
                size="sm"
                isLoading={isDownloading}
                onClick={() => void handleDownloadCleaned()}
                leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600" />}
              >
                Download Cleaned CSV
              </Button>
            </>
          )}

          <Button
            variant="primary"
            size="sm"
            isLoading={isProcessing}
            disabled={!!processingDatasetId && !isProcessing}
            onClick={() => void handleStartCleaning()}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {isProcessing
              ? 'Running pipeline...'
              : dataset.status === 'cleaned'
              ? 'Re-run Cleaning'
              : 'Run Cleaning'}
          </Button>
        </div>
      </div>

      {isProcessing && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900">
          The multi-agent pipeline is running. This can take up to a minute for larger files.
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{actionError}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {stats.map((stat) => (
          <Card
            key={stat.label}
            className={
              stat.tone === 'amber'
                ? 'p-3.5 text-center bg-amber-50/40 border-amber-200/80'
                : stat.tone === 'rose'
                ? 'p-3.5 text-center bg-rose-50/40 border-rose-200/80'
                : 'p-3.5 text-center'
            }
          >
            <span className="text-[11px] font-medium text-slate-500 block">{stat.label}</span>
            <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
              {stat.value.toLocaleString()}
            </span>
          </Card>
        ))}
      </div>

      {preview.isLoading && !preview.data ? (
        <LoadingState title="Loading preview..." subtitle="Fetching the first 100 rows" />
      ) : preview.error ? (
        <ErrorState
          title="Could not load preview"
          message={getErrorMessage(preview.error)}
          onRetry={preview.reload}
        />
      ) : (
        <DatasetPreview
          data={preview.data?.rows || []}
          columns={preview.data?.columns}
          title={`Preview (${preview.data?.source === 'cleaned' ? 'cleaned' : 'original'} data): ${dataset.name}`}
          rowsPerPageDefault={8}
        />
      )}
    </div>
  )
}
