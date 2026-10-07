import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Upload, Sparkles, Database, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useDataset } from '@/context/useDataset'

interface TopbarProps {
  onOpenSidebar: () => void
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenSidebar }) => {
  const navigate = useNavigate()
  const { selectedDataset, processingDatasetId } = useDataset()
  const isCleaningRunning = !!processingDatasetId

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
          aria-label="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Selected Dataset Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-500 font-medium">Dataset:</span>
          <span className="font-semibold text-slate-800">
            {selectedDataset?.name || 'None selected'}
          </span>
          {selectedDataset && (
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              {selectedDataset.qualityScore ?? 0}%
            </span>
          )}
        </div>

        {/* Pipeline System status */}
        <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Multi-Agent Engine</span>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/datasets')}
          leftIcon={<Upload className="w-3.5 h-3.5" />}
        >
          Upload
        </Button>
        <Button
          variant="primary"
          size="sm"
          isLoading={isCleaningRunning}
          onClick={() =>
            navigate(
              processingDatasetId
                ? `/cleaning/${processingDatasetId}`
                : selectedDataset
                ? `/cleaning/${selectedDataset.id}`
                : '/datasets'
            )
          }
          leftIcon={<Sparkles className="w-3.5 h-3.5" />}
        >
          {isCleaningRunning ? 'Agents Running...' : 'Multi-Agent Cleaning'}
        </Button>
      </div>
    </header>
  )
}
