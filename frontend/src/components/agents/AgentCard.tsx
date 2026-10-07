import React from 'react'
import {
  Workflow,
  SearchCode,
  HelpCircle,
  CopyX,
  Languages,
  AlertTriangle,
  CheckCheck,
  BarChart2,
  BrainCircuit,
  Clock,
  Database,
} from 'lucide-react'
import { AgentInfo, AgentType } from '@/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cn } from '@/utils/cn'

interface AgentCardProps {
  agent: AgentInfo
  isSelected: boolean
  onClick: () => void
  stepNumber: number
}

const agentIcons: Record<AgentType, React.ElementType> = {
  orchestrator: Workflow,
  profiling: SearchCode,
  missing_value: HelpCircle,
  duplicate_detection: CopyX,
  standardization: Languages,
  anomaly_detection: AlertTriangle,
  validation: CheckCheck,
  visualization: BarChart2,
  insight: BrainCircuit,
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isSelected,
  onClick,
  stepNumber,
}) => {
  const Icon = agentIcons[agent.type] || Workflow
  const isRunning = agent.status === 'running'

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative p-4 rounded-xl border transition-all cursor-pointer select-none text-left bg-white',
        isSelected
          ? 'border-blue-600 ring-2 ring-blue-600/20 shadow-sm'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-xs',
        isRunning && 'border-blue-500 ring-2 ring-blue-500/30 animate-pulse-subtle bg-blue-50/20'
      )}
    >
      {/* Top Header: Step Badge & Status */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center border border-slate-200">
            {stepNumber}
          </span>
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              isRunning
                ? 'bg-blue-600 text-white animate-spin'
                : isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700'
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
        </div>

        <StatusBadge status={agent.status} />
      </div>

      {/* Agent Title & Description */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 leading-snug">{agent.name}</h4>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {agent.description}
        </p>
      </div>

      {/* Metrics Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{agent.status === 'waiting' ? '--' : `${agent.executionTime}s`}</span>
        </div>
        <div className="flex items-center gap-1 font-medium text-slate-700">
          <Database className="w-3 h-3 text-slate-400" />
          <span>
            {agent.status === 'waiting' ? '--' : `${agent.recordsAffected.toLocaleString()} recs`}
          </span>
        </div>
      </div>
    </div>
  )
}
