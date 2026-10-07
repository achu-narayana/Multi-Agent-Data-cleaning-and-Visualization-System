import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet, UploadCloud, Eye, Sparkles, Trash2 } from 'lucide-react'
import { useDataset } from '@/context/useDataset'
import { DatasetUpload } from '@/components/datasets/DatasetUpload'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Dataset } from '@/types'
import { getErrorMessage } from '@/api/client'
import { formatDateTime } from '@/utils/format'

export const DatasetsPage: React.FC = () => {
  const {
    datasets,
    isLoadingDatasets,
    datasetsError,
    refreshDatasets,
    selectDataset,
    uploadDatasetFile,
    deleteDataset,
  } = useDataset()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleUploadSuccess = (newDataset: Dataset) => {
    setShowUploadModal(false)
    navigate(`/datasets/${newDataset.id}`)
  }

  const openDataset = (d: Dataset) => {
    selectDataset(d.id)
    navigate(`/datasets/${d.id}`)
  }

  const handleDelete = async (d: Dataset) => {
    if (!window.confirm(`Delete "${d.name}"? This cannot be undone.`)) return
    setActionError(null)
    setDeletingId(d.id)
    try {
      await deleteDataset(d.id)
    } catch (error) {
      setActionError(getErrorMessage(error, 'Failed to delete dataset.'))
    } finally {
      setDeletingId(null)
    }
  }

  const showUpload = showUploadModal || (!isLoadingDatasets && !datasetsError && datasets.length === 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Datasets</h1>
          <p className="text-xs text-slate-500 mt-1">
            Upload raw data files, inspect automated profiles, and run the multi-agent cleaning engine.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setShowUploadModal(!showUploadModal)}
          leftIcon={<UploadCloud className="w-4 h-4" />}
        >
          {showUploadModal ? 'Hide Upload Area' : '+ Upload Dataset'}
        </Button>
      </div>

      {showUpload && (
        <DatasetUpload
          onUpload={uploadDatasetFile}
          onUploadSuccess={handleUploadSuccess}
          onCancel={() => setShowUploadModal(false)}
        />
      )}

      {actionError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
          {actionError}
        </div>
      )}

      {isLoadingDatasets && datasets.length === 0 ? (
        <LoadingState title="Loading datasets..." subtitle="Fetching your uploaded datasets" />
      ) : datasetsError && datasets.length === 0 ? (
        <ErrorState
          title="Could not load datasets"
          message={datasetsError}
          onRetry={() => void refreshDatasets()}
        />
      ) : datasets.length === 0 ? null : (
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>All Uploaded Datasets ({datasets.length})</CardTitle>
              <CardDescription>
                Click any dataset to inspect rows and start multi-agent cleaning
              </CardDescription>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-medium">
                  <th className="py-3 px-6">Dataset Name</th>
                  <th className="py-3 px-4">Size & Format</th>
                  <th className="py-3 px-4">Dimensions</th>
                  <th className="py-3 px-4">Quality Score</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {datasets.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                    onClick={() => openDataset(d)}
                  >
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                          <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {d.name}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Uploaded {formatDateTime(d.uploadedAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-700">
                      <span className="font-semibold">{d.size}</span>
                      <span className="text-[11px] text-slate-400 ml-1.5 uppercase font-sans">
                        ({d.format})
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-700">
                      <div className="font-medium">{(d.rowCount ?? 0).toLocaleString()} rows</div>
                      <div className="text-[11px] text-slate-400">{d.columnCount ?? 0} columns</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{d.qualityScore ?? 0}%</span>
                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              d.qualityScore >= 90
                                ? 'bg-emerald-500'
                                : d.qualityScore >= 70
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, d.qualityScore || 0))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDataset(d)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Inspect
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            selectDataset(d.id)
                            navigate(`/cleaning/${d.id}`)
                          }}
                          leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                        >
                          Clean
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          isLoading={deletingId === d.id}
                          onClick={() => void handleDelete(d)}
                          title="Delete dataset"
                          aria-label={`Delete ${d.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
