import React from 'react'
import {
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { VisualizationItem } from '@/types'

interface ChartCardProps {
  item: VisualizationItem
}

const tooltipStyle = {
  backgroundColor: '#ffffff',
  borderColor: '#e2e8f0',
  borderRadius: '8px',
  fontSize: '12px',
}

const axisTick = { fontSize: 11, fill: '#64748b' }

const formatNumber = (val: unknown) =>
  typeof val === 'number' ? val.toLocaleString() : String(val ?? '')

export const ChartCard: React.FC<ChartCardProps> = ({ item }) => {
  const data = Array.isArray(item.data) ? item.data : []
  const yKey = item.yKey || item.yKeys?.[0] || (item.chartType === 'line' ? 'value' : 'count')

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="h-full flex items-center justify-center text-xs text-slate-400">
          No data points for this chart.
        </div>
      )
    }

    switch (item.chartType) {
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" dataKey={item.xKey} name={item.xKey} tick={axisTick} />
              <YAxis type="number" dataKey={yKey} name={yKey} tick={axisTick} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(val: unknown, name: unknown) => [formatNumber(val), String(name)]}
                contentStyle={tooltipStyle}
              />
              <Scatter data={data} fill="#2563eb" />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey={item.xKey} tick={axisTick} />
              <YAxis tick={axisTick} />
              <Tooltip
                formatter={(val: unknown) => [formatNumber(val), yKey]}
                contentStyle={tooltipStyle}
              />
              <Line
                type="monotone"
                dataKey={yKey}
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={data.length <= 60 ? { r: 3, fill: '#6366f1' } : false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
      case 'histogram':
      case 'box':
      default:
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey={item.xKey} tick={axisTick} />
              <YAxis tick={axisTick} />
              <Tooltip
                formatter={(val: unknown) => [formatNumber(val), yKey]}
                contentStyle={tooltipStyle}
              />
              <Bar
                dataKey={yKey}
                fill={item.chartType === 'histogram' ? '#0ea5e9' : '#3b82f6'}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <Card className="overflow-hidden flex flex-col">
      <CardHeader className="flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="blue" size="sm">
              {item.chartType.toUpperCase()}
            </Badge>
            <CardTitle>{item.title}</CardTitle>
          </div>
          {item.description && <CardDescription>{item.description}</CardDescription>}
        </div>

        {item.columnsUsed?.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span className="font-medium">Columns:</span>
            {item.columnsUsed.map((col) => (
              <span
                key={col}
                className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[11px]"
              >
                {col}
              </span>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <div className="h-64 sm:h-72 w-full">{renderChart()}</div>

        {item.reasonSelected && (
          <div className="mt-4 p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-blue-900 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Why the Visualization Agent selected this chart</span>
            </div>
            <p className="text-blue-950 leading-relaxed italic pl-5">
              &ldquo;{item.reasonSelected}&rdquo;
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
