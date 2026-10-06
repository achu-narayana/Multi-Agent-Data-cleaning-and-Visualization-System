import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { AgentInfo } from '@/types'

interface AgentPerformanceTableProps {
  agents: AgentInfo[]
}

export const AgentPerformanceTable: React.FC<AgentPerformanceTableProps> = ({ agents }) => {
  const chartData = agents.map((a) => ({
    name: a.name.replace(' Agent', ''),
    fullName: a.name,
    time: a.executionTime,
    records: a.recordsAffected,
  }))

  const colors = [
    '#3b82f6',
    '#6366f1',
    '#8b5cf6',
    '#ec4899',
    '#f59e0b',
    '#10b981',
    '#14b8a6',
    '#06b6d4',
    '#3b82f6',
  ]

  return (
    <div className="space-y-6">
      {/* Bar Chart: Agent Execution Time */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Agent Execution Time (seconds)</CardTitle>
            <CardDescription>
              Runtime latency profiling per specialized multi-agent subtask
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  unit="s"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: any) => [`${val} seconds`, 'Latency']}
                  labelFormatter={(_label: any, payload: any) =>
                    payload?.[0]?.payload?.fullName || _label
                  }
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Bar dataKey="time" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table: Agent Performance */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>Agent Execution Telemetry</CardTitle>
            <CardDescription>
              Detailed status, processing latency, and records modified by each agent
            </CardDescription>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-medium">
                <th className="py-3 px-6">Agent</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Execution Time</th>
                <th className="py-3 px-6 text-right">Records Affected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-6">
                    <span className="font-semibold text-slate-900">{agent.name}</span>
                    <span className="text-[11px] text-slate-400 block truncate max-w-sm">
                      {agent.description}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={agent.status} />
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-slate-700">
                    {agent.status === 'waiting' ? '--' : `${agent.executionTime}s`}
                  </td>
                  <td className="py-3 px-6 text-right font-mono font-bold text-slate-900">
                    {agent.status === 'waiting'
                      ? '--'
                      : agent.recordsAffected.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
