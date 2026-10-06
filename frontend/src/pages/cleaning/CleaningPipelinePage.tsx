import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Play,
  RotateCcw,
  Download,
  BarChart3,
  Lightbulb,
  Bot,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { useDataset } from '@/context/DatasetContext'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AgentPipeline } from '@/components/agents/AgentPipeline'
import { AgentDetailPanel } from '@/components/agents/AgentDetailPanel'
import { BeforeAfterComparison } from '@/components/cleaning/BeforeAfterComparison'
import { mockBeforeAfterRows } from '@/services/mock/mockData'
import { AgentInfo } from '@/types'

export const CleaningPipelinePage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>()
  const navigate = useNavigate()
  const {
    activeJob,
    selectedDataset,
    isCleaningRunning,
    cleaningStepMessage,
    startLiveCleaningPipeline,
    resetCleaningState,
  } = useDataset()

  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(
    activeJob.agents[2] // Default to Missing Value Agent to immediately demonstrate explainability!
  )
  const [activeTab, setActiveTab] = useState<'pipeline' | 'before_after'>('pipeline')

  const handleRunSimulation = () => {
    startLiveCleaningPipeline()
  }

  const handleDownloadCleaned = () => {
    alert(`Downloading cleaned dataset: ${selectedDataset.name.replace('.csv', '_cleaned.csv')}`)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              LangGraph Multi-Agent Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">Job #{jobId || activeJob.id}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Multi-Agent Cleaning Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Dataset:{' '}
            <span className="font-semibold text-slate-700">{selectedDataset.name}</span> • 9
            Specialized Agents Coordinated by LangGraph
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={resetCleaningState}
            disabled={isCleaningRunning}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>

          <Button
            variant="primary"
            size="sm"
            isLoading={isCleaningRunning}
            onClick={handleRunSimulation}
            leftIcon={<Play className="w-3.5 h-3.5" />}
          >
            {isCleaningRunning ? 'Executing Pipeline...' : 'Run Multi-Agent Pipeline'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCleaned}
            leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600" />}
          >
            Download Cleaned Dataset
          </Button>
        </div>
      </div>

      {/* Active Phase Loading Banner */}
      {isCleaningRunning && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs text-blue-900 shadow-sm animate-pulse-subtle">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 animate-spin" />
            </div>
            <div>
              <div className="font-bold text-sm text-blue-950 flex items-center gap-2">
                <span>Active Phase:</span>
                <span className="text-blue-700 font-mono font-semibold">
                  {cleaningStepMessage || 'Processing pipeline...'}
                </span>
              </div>
              <p className="text-[11px] text-blue-800/80 mt-0.5">
                Specialized cooperating agents orchestrated sequentially by LangGraph.
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-xs border border-blue-300">
            LangGraph Coordinated
          </span>
        </div>
      )}

      {/* Navigation Tabs: Multi-Agent Pipeline vs Before/After Remediation */}
      <div className="flex items-center gap-3 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 px-1 transition-colors relative cursor-pointer ${
            activeTab === 'pipeline'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>Agent Pipeline DAG ({activeJob.agents.length} Agents)</span>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('before_after')}
          className={`pb-3 px-1 transition-colors relative cursor-pointer ${
            activeTab === 'before_after'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Before vs After Quality (61.4 → 94.2)</span>
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'pipeline' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Visual Agent Pipeline Flow (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-center justify-between">
              <span>Click on any agent to inspect its reasoning and decision rationale.</span>
              <span className="font-semibold text-blue-700">
                {isCleaningRunning ? 'Executing Live...' : 'Status: Pipeline Complete'}
              </span>
            </div>

            <AgentPipeline
              agents={activeJob.agents}
              selectedAgentId={selectedAgent?.id || null}
              onSelectAgent={(agent) => setSelectedAgent(agent)}
              datasetName={selectedDataset.name}
              qualityScore={activeJob.quality.afterScore}
            />
          </div>

          {/* Right Column: Sticky Explainable Agent Detail Panel (5 cols) */}
          <div className="lg:col-span-5 sticky top-20 space-y-4">
            <AgentDetailPanel agent={selectedAgent} />

            {/* Quick Next Steps Card */}
            <Card className="p-4 bg-slate-50 border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Downstream Next Actions
              </h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => navigate(`/analytics/${selectedDataset.id}`)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                    Dataset Analytics
                  </span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => navigate(`/visualizations/${selectedDataset.id}`)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    Intelligent Visualizations
                  </span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => navigate('/ai-analyst')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  <span className="flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-purple-600" />
                    Ask AURA AI Analyst
                  </span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* Before vs After Detailed Screen */
        <BeforeAfterComparison
          rows={mockBeforeAfterRows}
          beforeScore={activeJob.quality.beforeScore}
          afterScore={activeJob.quality.afterScore}
          improvement={activeJob.quality.improvement}
        />
      )}
    </div>
  )
}
