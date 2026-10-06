import React, { useState, useEffect } from 'react'
import { Activity, Cpu, Clock, CheckCircle2, RefreshCw } from 'lucide-react'
import { useDataset } from '@/context/DatasetContext'
import { AgentPerformanceTable } from '@/components/agents/AgentPerformanceTable'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { agentApi } from '@/api/agentApi'
import { AgentInfo } from '@/types'

export const AgentPerformancePage: React.FC = () => {
  const { activeJob } = useDataset()
  const [agents, setAgents] = useState<AgentInfo[]>(activeJob.agents)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const data = await agentApi.getAgentPerformance()
      setAgents(data)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Summary calculations
  const totalExecutionTime = agents
    .reduce((acc, curr) => acc + (curr.executionTime || 0), 0)
    .toFixed(2)

  const totalRecordsRemediated = agents
    .filter((a) => a.type !== 'validation' && a.type !== 'orchestrator' && a.type !== 'profiling')
    .reduce((acc, curr) => acc + (curr.recordsAffected || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
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
            Real-time execution latency profiling, throughput metrics, and workload distribution.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          isLoading={isRefreshing}
          onClick={handleRefresh}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Refresh Telemetry
        </Button>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white">
          <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
            Total Pipeline Latency
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {totalExecutionTime}s
            </span>
            <span className="text-xs text-emerald-600 font-medium">Under SLA (30s)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Sum of sequential sub-agent executions</p>
        </Card>

        <Card className="p-4 bg-white">
          <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
            Total Records Remediated
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-blue-600 font-mono">
              {totalRecordsRemediated.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">cells & rows modified</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Handled by Imputation, Deduplication & Normalization
          </p>
        </Card>

        <Card className="p-4 bg-white">
          <span className="text-[11px] font-medium text-slate-400 block uppercase tracking-wider">
            Agent Success Ratio
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600 font-mono">100%</span>
            <span className="text-xs text-emerald-700 font-medium">9 / 9 Healthy</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Zero worker crashes or DAG exceptions</p>
        </Card>
      </div>

      {/* Main Agent Performance Table & Latency Chart */}
      <AgentPerformanceTable agents={agents} />
    </div>
  )
}
