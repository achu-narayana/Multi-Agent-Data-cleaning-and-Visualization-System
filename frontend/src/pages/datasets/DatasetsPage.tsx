import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileSpreadsheet,
  UploadCloud,
  Eye,
  Sparkles,
  BarChart3,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { useDataset } from '@/context/DatasetContext'
import { DatasetUpload } from '@/components/datasets/DatasetUpload'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Dataset } from '@/types'

export const DatasetsPage: React.FC = () => {
  const { datasets, setSelectedDataset, uploadDatasetFile } = useDataset()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const navigate = useNavigate()

  const handleUploadSuccess = (newDataset: Dataset) => {
    uploadDatasetFile(new File([''], newDataset.name))
    setSelectedDataset(newDataset)
    setShowUploadModal(false)
    navigate(`/datasets/${newDataset.id}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Drag & Drop Upload Section */}
      {(showUploadModal || datasets.length === 0) && (
        <DatasetUpload
          onUploadSuccess={handleUploadSuccess}
          onCancel={() => setShowUploadModal(false)}
        />
      )}

      {/* Datasets Table */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>All Uploaded Datasets ({datasets.length})</CardTitle>
            <CardDescription>
              Click any dataset to inspect spreadsheet rows and start multi-agent cleaning
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
                  onClick={() => {
                    setSelectedDataset(d)
                    navigate(`/datasets/${d.id}`)
                  }}
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
                        <p className="text-[11px] text-slate-400">Uploaded {d.uploadedAt}</p>
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
                    <div className="font-medium">{d.rowCount.toLocaleString()} rows</div>
                    <div className="text-[11px] text-slate-400">{d.columnCount} columns</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{d.qualityScore}%</span>
                      <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            d.qualityScore >= 90
                              ? 'bg-emerald-500'
                              : d.qualityScore >= 70
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${d.qualityScore}%` }}
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
                        onClick={() => {
                          setSelectedDataset(d)
                          navigate(`/datasets/${d.id}`)
                        }}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDataset(d)
                          navigate(`/cleaning/job_workforce_clean_882`)
                        }}
                        leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                      >
                        Clean
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
