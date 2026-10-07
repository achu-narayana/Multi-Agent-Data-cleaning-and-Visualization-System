import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, RefreshCw } from 'lucide-react'
import { AgentPerformanceTable } from '@/components/agents/AgentPerformanceTable'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { agentApi } from '@/api/agentApi'
import { getErrorMessage } from '@/api/client'
import { useApiData } from '@/hooks/useApiData'

export const AgentPerformancePage: React.FC = () => {
  const navigate = useNavigate()
  const { data, error, isLoading, reload } = useApiData('agents-performance', () =>
    agentApi.getAgentPerformance()
  )
  const agents = data || []

  const totalExecutionTime = agents
    .reduce((acc, curr) => acc + (curr.executionTime || 0), 0)
    .toFixed(2)

  const totalRecordsRemediated = agents
    .filter((a) => a.type !== 'validation' && a.type !== 'orchestrator' && a.type !== 'profiling')
    .reduce((acc, curr) => acc + (curr.recordsAffected || 0), 0)

  const completed = agents.filter((a) => a.status === 'completed').length
  const successRatio = agents.length > 0 ? Math.round((completed / agents.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-50 text-blue-600">
              <Activity className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              System Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Agent Performance
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated over all of your processed datasets: average execution time and total
            records affected per agent.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          isLoading={isLoading}
          onClick={reload}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh
        </Button>
      </div>

      {isLoading && !data ? (
        <LoadingState title="Loading agent telemetry..." />
      ) : error ? (
        <ErrorState
          title="Could not load agent performance"
          message={getErrorMessage(error)}
          onRetry={reload}
        />
      ) : agents.length === 0 ? (
        <EmptyState
          title="No agent telemetry yet"
          description="Agent metrics appear after you run the cleaning pipeline on at least one dataset."
          actionLabel="Go to Datasets"
          onAction={() => navigate('/datasets')}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 bg-white">
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                Average Pipeline Latency
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900 font-mono">
                  {totalExecutionTime}s
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Sum of each agent&apos;s average execution time
              </p>
            </Card>

            <Card className="p-4 bg-white">
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                Total Records Affected
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-blue-600 font-mono">
                  {totalRecordsRemediated.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Excludes profiling and validation agents
              </p>
            </Card>

            <Card className="p-4 bg-white">
              <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
                Agents Completed
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-600 font-mono">{successRatio}%</span>
                <span className="text-xs text-slate-500 font-medium">
                  {completed} / {agents.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Agents reporting status “completed”</p>
            </Card>
          </div>

          <AgentPerformanceTable agents={agents} />
        </>
      )}
    </div>
  )
}
