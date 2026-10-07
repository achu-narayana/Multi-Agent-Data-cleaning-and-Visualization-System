import React from 'react'
import {
  X,
  Clock,
  Database,
  AlertTriangle,
  Lightbulb,
  Zap,
  Cpu,
  Layers,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AgentInfo } from '@/types'

interface AgentDetailPanelProps {
  agent: AgentInfo | null
  onClose?: () => void
}

export const AgentDetailPanel: React.FC<AgentDetailPanelProps> = ({ agent, onClose }) => {
  if (!agent) {
    return (
      <Card className="p-6 text-center text-slate-400">
        <Cpu className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p className="text-xs">Click on any pipeline agent to view explainability rationale and execution telemetry.</p>
      </Card>
    )
  }

  return (
    <Card className="p-5 sm:p-6 border-slate-200/90 shadow-sm relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between pr-8 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Agent Telemetry & Explainability
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mt-1.5">{agent.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{agent.description}</p>
        </div>
      </div>

      <div className="py-4 space-y-4">
        {/* Status & Key Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] text-slate-400 block font-medium">Status</span>
            <div className="mt-1">
              <StatusBadge status={agent.status} />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] text-slate-400 block font-medium">Execution Time</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-800 text-sm">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{agent.status === 'waiting' ? '--' : `${agent.executionTime}s`}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
            <span className="text-[11px] text-slate-400 block font-medium">Records Affected</span>
            <div className="flex items-center gap-1.5 mt-1 font-bold text-slate-800 text-sm">
              <Database className="w-3.5 h-3.5 text-blue-600" />
              <span>{agent.status === 'waiting' ? '--' : agent.recordsAffected.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Problem Detected */}
        {agent.problem && (
          <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Problem Identified</span>
            </div>
            <p className="text-xs text-amber-900 mt-1 pl-6 leading-relaxed">{agent.problem}</p>
          </div>
        )}

        {/* Action Taken */}
        {agent.action && (
          <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-200/80">
            <div className="flex items-center gap-2 text-blue-800 font-semibold text-xs">
              <Zap className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Action Taken</span>
            </div>
            <p className="text-xs text-blue-950 mt-1 pl-6 font-medium leading-relaxed">
              {agent.action}
            </p>
          </div>
        )}

        {/* Explainability Reason */}
        {agent.reason && (
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
              <span>AIML Rationale & Decision Logic</span>
            </div>
            <p className="text-xs text-slate-700 mt-1 pl-6 leading-relaxed italic">
              &ldquo;{agent.reason}&rdquo;
            </p>
          </div>
        )}

        {/* Extra Telemetry Metrics */}
        {agent.metrics && Object.keys(agent.metrics).length > 0 && (
          <div className="pt-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Internal Agent Telemetry</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(agent.metrics).map(([key, val]) => (
                <div key={key} className="p-2 rounded bg-slate-100/70 text-xs">
                  <span className="text-[10px] text-slate-500 block truncate">{key}</span>
                  <span className="font-semibold text-slate-800 truncate block">{String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
