import React, { useState, useRef } from 'react'
import { UploadCloud, FileSpreadsheet, X, AlertTriangle, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Dataset } from '@/types'
import { getErrorMessage } from '@/api/client'

interface DatasetUploadProps {
  /** Performs the real upload (POST /datasets/upload) and resolves to the created dataset. */
  onUpload: (file: File) => Promise<Dataset>
  onUploadSuccess?: (dataset: Dataset) => void
  onCancel?: () => void
}

const VALID_EXTENSIONS = ['.csv', '.xlsx', '.xls']
const MAX_SIZE_BYTES = 50 * 1024 * 1024

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`

export const DatasetUpload: React.FC<DatasetUploadProps> = ({ onUpload, onUploadSuccess, onCancel }) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
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
    const hasValidExt = VALID_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))

    if (!hasValidExt) {
      setError('Unsupported file type. Please upload a CSV, XLSX or XLS file.')
      return
    }

    if (file.size === 0) {
      setError('The selected file is empty. Please choose a CSV, XLSX or XLS file with data.')
      return
    }

    if (file.size > MAX_SIZE_BYTES) {
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

  const handleAnalyze = async () => {
    if (!selectedFile || isUploading) return

    setIsUploading(true)
    setError(null)
    try {
      const dataset = await onUpload(selectedFile)
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
      onUploadSuccess?.(dataset)
    } catch (err) {
      setError(
        getErrorMessage(err, 'Upload failed. Please upload a valid CSV, XLSX or XLS file.')
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
    if (onCancel) onCancel()
  }

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">Upload Dataset</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Select or drop your raw CSV, XLSX or XLS file. It is uploaded and profiled by the backend.
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
          <p className="text-xs text-slate-500 mt-1">Supported file formats: CSV, XLSX, XLS (up to 50 MB)</p>
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
                  {formatSize(selectedFile.size)}
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

          {/* Upload status (fetch exposes no upload progress, so this is indeterminate) */}
          {isUploading && (
            <div className="space-y-1.5 p-3 rounded-lg bg-blue-50/50 border border-blue-100">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-blue-800">Uploading and profiling dataset...</span>
              </div>
              <div className="w-full h-2 rounded-full bg-blue-100 overflow-hidden">
                <div className="h-full w-1/3 bg-blue-600 rounded-full animate-pulse" />
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
