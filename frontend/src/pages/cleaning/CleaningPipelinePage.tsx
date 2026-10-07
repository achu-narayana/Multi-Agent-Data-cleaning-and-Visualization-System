import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  Play,
  Download,
  BarChart3,
  Bot,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'
import { useDataset, useRouteDataset } from '@/context/useDataset'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { AgentPipeline } from '@/components/agents/AgentPipeline'
import { AgentDetailPanel } from '@/components/agents/AgentDetailPanel'
import { BeforeAfterComparison } from '@/components/cleaning/BeforeAfterComparison'
import { datasetApi } from '@/api/datasetApi'
import { getErrorMessage } from '@/api/client'
import { formatDateTime, round1 } from '@/utils/format'

export const CleaningPipelinePage: React.FC = () => {
  const { datasetId } = useParams<{ datasetId: string }>()
  const navigate = useNavigate()
  const { results, processingDatasetId, processDataset, loadProcessingResult } = useDataset()
  const { dataset, isLoading: isLoadingDataset, error: datasetError, retry } =
    useRouteDataset(datasetId)

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'pipeline' | 'before_after'>('pipeline')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)

  const hasCachedEntry = !!datasetId && datasetId in results
  const result = datasetId ? results[datasetId] ?? null : null
  const isProcessing = !!datasetId && processingDatasetId === datasetId

  // Load an existing result (GET /result) when we don't have one cached.
  useEffect(() => {
    if (!datasetId || hasCachedEntry) return
    let cancelled = false
    loadProcessingResult(datasetId)
      .then(() => {
        if (!cancelled) setLoadError(null)
      })
      .catch((error: unknown) => {
        if (!cancelled) setLoadError(getErrorMessage(error, 'Failed to load the pipeline result.'))
      })
    return () => {
      cancelled = true
    }
  }, [datasetId, hasCachedEntry, loadProcessingResult, reloadToken])

  if (!datasetId) return null

  if (isLoadingDataset) {
    return <LoadingState title="Loading dataset..." />
  }

  if (!dataset) {
    return (
      <ErrorState
        title={datasetError ? 'Could not load datasets' : 'Dataset not found'}
        message={datasetError || 'This dataset does not exist or does not belong to your account.'}
        onRetry={datasetError ? () => void retry() : () => navigate('/datasets')}
      />
    )
  }

  const agents = result?.agents || []
  // Derived selection: never stale when the result (and its agents) change.
  const selectedAgent =
    agents.find((a) => a.id === selectedAgentId) ||
    agents.find((a) => a.recordsAffected > 0 && a.type !== 'profiling') ||
    agents[0] ||
    null

  const handleRun = async () => {
    setActionError(null)
    try {
      await processDataset(dataset.id)
      setLoadError(null)
    } catch (error) {
      setActionError(getErrorMessage(error, 'The cleaning pipeline failed.'))
    }
  }

  const handleDownloadCleaned = async () => {
    setActionError(null)
    setIsDownloading(true)
    try {
      await datasetApi.downloadCleanedDataset(dataset.id, result?.filename || dataset.name)
    } catch (error) {
      setActionError(getErrorMessage(error, 'Download failed.'))
    } finally {
      setIsDownloading(false)
    }
  }

  const beforeScore = round1(result?.original_quality_score)
  const afterScore = round1(result?.quality_score)
  const profile = result?.profile
  const totalMissingBefore = profile
    ? Object.values(profile.missing_values || {}).reduce(
        (sum, v) => sum + (typeof v === 'number' ? v : 0),
        0
      )
    : 0
  const issues = result?.validation?.issues || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              LangGraph Multi-Agent Engine
            </span>
            {result?.processed_at && (
              <span className="text-xs text-slate-400">
                Last run {formatDateTime(result.processed_at)}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Multi-Agent Cleaning Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Dataset: <span className="font-semibold text-slate-700">{dataset.name}</span>
            {agents.length > 0 && <> • {agents.length} agents coordinated by LangGraph</>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            isLoading={isProcessing}
            disabled={!!processingDatasetId && !isProcessing}
            onClick={() => void handleRun()}
            leftIcon={<Play className="w-3.5 h-3.5" />}
          >
            {isProcessing ? 'Executing Pipeline...' : result ? 'Re-run Pipeline' : 'Run Multi-Agent Pipeline'}
          </Button>

          {result && (
            <Button
              variant="outline"
              size="sm"
              isLoading={isDownloading}
              onClick={() => void handleDownloadCleaned()}
              leftIcon={<Download className="w-3.5 h-3.5 text-emerald-600" />}
            >
              Download Cleaned Dataset
            </Button>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3 text-xs text-blue-900 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div>
            <div className="font-bold text-sm text-blue-950">Running the cleaning pipeline...</div>
            <p className="text-[11px] text-blue-800/80 mt-0.5">
              Profiling, cleaning, validation, visualization and insight agents run sequentially.
              This can take 10-60 seconds.
            </p>
          </div>
        </div>
      )}

      {actionError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{actionError}</span>
        </div>
      )}

      {!hasCachedEntry && !loadError ? (
        <LoadingState title="Loading pipeline result..." />
      ) : loadError && !result ? (
        <ErrorState
          title="Could not load the pipeline result"
          message={loadError}
          onRetry={() => setReloadToken((t) => t + 1)}
        />
      ) : !result ? (
        isProcessing ? null : (
          <EmptyState
            icon={<Sparkles className="w-6 h-6" />}
            title="This dataset has not been cleaned yet"
            description="Run the multi-agent pipeline to profile, clean and validate the dataset. Results, before/after comparisons and agent explanations will appear here."
            actionLabel="Run Multi-Agent Pipeline"
            onAction={() => void handleRun()}
          />
        )
      ) : (
        <>
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
                <span>Agent Pipeline ({agents.length} Agents)</span>
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
                <span>
                  Before vs After Quality ({beforeScore} → {afterScore})
                </span>
              </div>
            </button>
          </div>

          {activeTab === 'pipeline' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-4">
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-center justify-between">
                  <span>Click on any agent to inspect its reasoning and decision rationale.</span>
                  <span className="font-semibold text-blue-700">
                    {isProcessing ? 'Executing...' : `Status: ${result.status}`}
                  </span>
                </div>

                {agents.length === 0 ? (
                  <EmptyState
                    title="No agent telemetry"
                    description="The backend did not return agent details for this run."
                  />
                ) : (
                  <AgentPipeline
                    agents={agents}
                    selectedAgentId={selectedAgent?.id || null}
                    onSelectAgent={(agent) => setSelectedAgentId(agent.id)}
                    datasetName={result.filename || dataset.name}
                    qualityScore={afterScore}
                  />
                )}
              </div>

              <div className="lg:col-span-5 sticky top-20 space-y-4">
                <AgentDetailPanel agent={selectedAgent} />

                <Card className="p-4 bg-slate-50 border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Next Steps
                  </h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between"
                      onClick={() => navigate(`/analytics/${dataset.id}`)}
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
                      onClick={() => navigate(`/visualizations/${dataset.id}`)}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        Visualizations
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
            <BeforeAfterComparison
              rows={result.before_after || []}
              beforeScore={beforeScore}
              afterScore={afterScore}
              beforeSummary={
                profile
                  ? `Profile found ${totalMissingBefore.toLocaleString()} missing values and ${(
                      profile.duplicate_rows ?? 0
                    ).toLocaleString()} duplicate rows.`
                  : undefined
              }
              afterSummary={
                result.validation
                  ? result.validation.valid
                    ? 'Validation passed.'
                    : `Validation reported ${issues.length} issue${issues.length === 1 ? '' : 's'}.`
                  : undefined
              }
            />
          )}
        </>
      )}
    </div>
  )
}
