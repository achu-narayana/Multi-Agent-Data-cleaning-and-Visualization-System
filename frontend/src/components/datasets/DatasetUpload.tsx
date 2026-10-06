import React, { useState, useRef } from 'react'
import { UploadCloud, FileSpreadsheet, X, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dataset } from '@/types'

interface DatasetUploadProps {
  onUploadSuccess?: (dataset: Dataset) => void
  onCancel?: () => void
}

export const DatasetUpload: React.FC<DatasetUploadProps> = ({ onUploadSuccess, onCancel }) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const validateAndSetFile = (file: File) => {
    setError(null)
    const validExtensions = ['.csv', '.xlsx', '.xls']
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))

    if (!hasValidExt) {
      setError('Unsupported file type. Please upload a CSV or XLSX file.')
      return
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File is too large. Maximum supported file size is 50 MB.')
      return
    }

    setSelectedFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const handleAnalyze = () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(15)

    // Simulate progress
    const timer1 = setTimeout(() => setUploadProgress(45), 300)
    const timer2 = setTimeout(() => setUploadProgress(80), 700)
    const timer3 = setTimeout(() => {
      setUploadProgress(100)
      setIsUploading(false)

      const newDataset: Dataset = {
        id: `ds_${Date.now()}`,
        name: selectedFile.name,
        size: `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`,
        rowCount: Math.floor(Math.random() * 8000) + 2000,
        columnCount: 16,
        format: selectedFile.name.endsWith('.xlsx') ? 'xlsx' : 'csv',
        uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        qualityScore: 68.4,
        status: 'raw',
        missingValues: 342,
        duplicateRows: 185,
        numericalColumns: 8,
        categoricalColumns: 6,
        dateColumns: 2,
        columns: ['ID', 'Name', 'Age', 'Department', 'Role', 'Salary', 'Experience', 'Joining Date'],
      }

      if (onUploadSuccess) onUploadSuccess(newDataset)
    }, 1100)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setIsUploading(false)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    if (onCancel) onCancel()
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">Upload Dataset</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Select or drop your raw CSV or XLSX file. The profiling agent will inspect column distributions immediately.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />

      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
            dragActive
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-200 hover:border-blue-400 bg-slate-50/40'
          }`}
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 border border-blue-100">
            <UploadCloud className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">
            Click to browse or drag and drop your dataset
          </h4>
          <p className="text-xs text-slate-500 mt-1">Supported file formats: CSV, XLSX (Up to 50 MB)</p>
          <div className="mt-4">
            <Button variant="outline" size="sm" type="button">
              Choose File
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Info Bar */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'text/csv'}
                </p>
              </div>
            </div>

            {!isUploading && (
              <button
                onClick={handleReset}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-1.5 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-blue-800">Uploading and inspecting schema...</span>
                <span className="font-bold text-blue-800">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-blue-100 overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Buttons: Cancel & Analyze Dataset */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isUploading}
              onClick={handleAnalyze}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Analyze Dataset
            </Button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}
    </Card>
  )
}
