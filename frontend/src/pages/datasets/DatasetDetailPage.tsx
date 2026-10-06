import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  FileSpreadsheet,
  Sparkles,
  Download,
  AlertCircle,
  Database,
  Hash,
  Copy,
  Calendar,
  Layers,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react'
import { useDataset } from '@/context/DatasetContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { DatasetPreview } from '@/components/datasets/DatasetPreview'
import { datasetApi } from '@/api/datasetApi'
import { mockDatasetPreviewRows } from '@/services/mock/mockData'

export const DatasetDetailPage: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>()
  const navigate = useNavigate()
  const { datasets, setSelectedDataset, startCleaningForDataset } = useDataset()
  const [previewRows, setPreviewRows] = useState<Record<string, any>[]>(mockDatasetPreviewRows)
  const [isLoading, setIsLoading] = useState(false)
  const [isStartingCleaning, setIsStartingCleaning] = useState(false)

  const dataset = datasets.find((d) => d.id === datasetId) || datasets[0]

  useEffect(() => {
    if (dataset) {
      setSelectedDataset(dataset)
    }
  }, [dataset, setSelectedDataset])

  useEffect(() => {
    const fetchPreview = async () => {
      setIsLoading(true)
      try {
        const rows = await datasetApi.getDatasetPreview(datasetId || dataset.id)
        setPreviewRows(rows)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPreview()
  }, [datasetId, dataset.id])

  const handleDownloadOriginal = () => {
    alert(`Downloading raw original: ${dataset.name}`)
  }

  const handleDownloadCleaned = () => {
    alert(`Downloading cleaned dataset: ${dataset.name.replace('.csv', '_cleaned.csv')}`)
  }

  const handleStartCleaning = async () => {
    setIsStartingCleaning(true)
    try {
      const job = await startCleaningForDataset(dataset.id)
      navigate(`/cleaning/${job.id}`)
    } finally {
      setIsStartingCleaning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button and page title */}
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
              Uploaded on {dataset.uploadedAt} • Format: {dataset.format.toUpperCase()} ({dataset.size})
            </p>
          </div>
        </div>

        {/* Action Buttons: Run Cleaning, Download Original, Download Cleaned */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadOriginal}
            leftIcon={<Download className="w-3.5 h-3.5 text-slate-600" />}
          >
            Download Original
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCleaned}
            leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Download Cleaned
          </Button>

          <Button
            variant="primary"
            size="sm"
            isLoading={isStartingCleaning}
            onClick={handleStartCleaning}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Run Cleaning
          </Button>
        </div>
      </div>

      {/* Dataset Information Metadata Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <Card className="p-3.5 text-center">
          <span className="text-[11px] font-medium text-slate-400 block">Total Rows</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
            {dataset.rowCount.toLocaleString()}
          </span>
        </Card>

        <Card className="p-3.5 text-center">
          <span className="text-[11px] font-medium text-slate-400 block">Columns</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
            {dataset.columnCount}
          </span>
        </Card>

        <Card className="p-3.5 text-center bg-amber-50/40 border-amber-200/80">
          <span className="text-[11px] font-semibold text-amber-700 block">Missing Values</span>
          <span className="text-base font-bold text-amber-900 mt-0.5 block font-mono">
            {dataset.missingValues}
          </span>
        </Card>

        <Card className="p-3.5 text-center bg-rose-50/40 border-rose-200/80">
          <span className="text-[11px] font-semibold text-rose-700 block">Duplicate Rows</span>
          <span className="text-base font-bold text-rose-900 mt-0.5 block font-mono">
            {dataset.duplicateRows}
          </span>
        </Card>

        <Card className="p-3.5 text-center">
          <span className="text-[11px] font-medium text-slate-400 block">Numerical Cols</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
            {dataset.numericalColumns}
          </span>
        </Card>

        <Card className="p-3.5 text-center">
          <span className="text-[11px] font-medium text-slate-400 block">Categorical Cols</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
            {dataset.categoricalColumns}
          </span>
        </Card>

        <Card className="p-3.5 text-center">
          <span className="text-[11px] font-medium text-slate-400 block">Date Cols</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
            {dataset.dateColumns}
          </span>
        </Card>
      </div>

      {/* Spreadsheet-Style Data Preview */}
      <DatasetPreview
        data={previewRows}
        title={`Preview: ${dataset.name}`}
        rowsPerPageDefault={8}
      />
    </div>
  )
}
