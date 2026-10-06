import React from 'react'
import { ArrowDown, Database, Award } from 'lucide-react'
import { AgentInfo } from '@/types'
import { AgentCard } from './AgentCard'

interface AgentPipelineProps {
  agents: AgentInfo[]
  selectedAgentId: string | null
  onSelectAgent: (agent: AgentInfo) => void
  datasetName: string
  qualityScore: number
}

export const AgentPipeline: React.FC<AgentPipelineProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  datasetName,
  qualityScore,
}) => {
  return (
    <div className="space-y-4">
      {/* Starting Node: Raw Dataset */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Input Source</span>
            <h4 className="text-sm font-bold text-slate-900">{datasetName}</h4>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
          Raw Input Stream
        </span>
      </div>

      <div className="flex justify-center -my-1">
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-3 bg-blue-300" />
          <ArrowDown className="w-4 h-4 text-blue-500 -mt-1" />
        </div>
      </div>

      {/* Agents 0 to 6 (Cleaning Pipeline: Orchestrator to Validation) */}
      <div className="space-y-3">
        {agents.slice(0, 7).map((agent, index) => (
          <React.Fragment key={agent.id}>
            <AgentCard
              agent={agent}
              stepNumber={index + 1}
              isSelected={selectedAgentId === agent.id}
              onClick={() => onSelectAgent(agent)}
            />
            {index < 6 && (
              <div className="flex justify-center -my-1">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-3 bg-slate-200" />
                  <ArrowDown className="w-3.5 h-3.5 text-slate-400 -mt-0.5" />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Milestone Node: Quality Score Assessment */}
      <div className="flex justify-center -my-1">
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-3 bg-emerald-300" />
          <ArrowDown className="w-4 h-4 text-emerald-500 -mt-1" />
        </div>
      </div>

      <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Milestone</span>
            <h4 className="text-sm font-bold text-emerald-950">Certified Quality Score: {qualityScore}%</h4>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-full border border-emerald-200">
          Cleaned Schema Ready
        </span>
      </div>

      <div className="flex justify-center -my-1">
        <div className="flex flex-col items-center">
          <div className="w-0.5 h-3 bg-purple-300" />
          <ArrowDown className="w-4 h-4 text-purple-500 -mt-1" />
        </div>
      </div>

      {/* Agents 7 & 8: Visualization Agent & Insight Agent */}
      <div className="space-y-3">
        {agents.slice(7).map((agent, index) => (
          <React.Fragment key={agent.id}>
            <AgentCard
              agent={agent}
              stepNumber={index + 8}
              isSelected={selectedAgentId === agent.id}
              onClick={() => onSelectAgent(agent)}
            />
            {index === 0 && (
              <div className="flex justify-center -my-1">
                <div className="flex flex-col items-center">
                  <div className="w-0.5 h-3 bg-slate-200" />
                  <ArrowDown className="w-3.5 h-3.5 text-slate-400 -mt-0.5" />
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
