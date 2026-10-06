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
  ZAxis,
} from 'recharts'
import { Sparkles, BarChart3, ScatterChart as ScatterIcon, TrendingUp, Info } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { VisualizationItem } from '@/types'

interface ChartCardProps {
  item: VisualizationItem
}

export const ChartCard: React.FC<ChartCardProps> = ({ item }) => {
  const renderChart = () => {
    switch (item.chartType) {
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                dataKey={item.xKey}
                name="Experience"
                unit=" yrs"
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <YAxis
                type="number"
                dataKey={item.yKey}
                name="Salary"
                unit="₹"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `₹${val / 1000}k`}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(val: any, name: any) => [
                  name === 'Salary' ? `₹${val.toLocaleString()}` : `${val} yrs`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Scatter name="Employees" data={item.data} fill="#2563eb" />
            </ScatterChart>
          </ResponsiveContainer>
        )

      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={item.data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey={item.xKey} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(val: any) => [`${val} projects avg`, 'Delivered']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey={item.yKey!}
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4, fill: '#6366f1' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={item.data} margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey={item.xKey} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `₹${val / 1000}k`}
              />
              <Tooltip
                formatter={(val: any) => [`₹${val.toLocaleString()}`, 'Avg Salary']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey={item.yKey!} fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'histogram':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={item.data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey={item.xKey} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(val: any) => [`${val.toLocaleString()} employees`, 'Count']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey={item.yKey!} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      case 'box':
        // Box plot distribution approximation using range bars
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={item.data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey={item.xKey} tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[30, 60]} unit=" hrs" tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(val: any, name: any, payload: any) => [
                  `Median: ${payload.payload.medianHours} hrs (Range: ${payload.payload.min}-${payload.payload.max} hrs)`,
                  'Hours / Week',
                ]}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="medianHours" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )

      default:
        return <div className="text-center py-12 text-slate-400">Chart not supported</div>
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
          <CardDescription>{item.description}</CardDescription>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
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
      </CardHeader>

      <CardContent className="flex-1 pb-4">
        <div className="h-64 sm:h-72 w-full">{renderChart()}</div>

        {/* Explainability Callout: Why it was selected */}
        <div className="mt-4 p-3 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-blue-900 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Why Visualization Agent selected this chart</span>
          </div>
          <p className="text-blue-950 leading-relaxed italic pl-5">
            &ldquo;{item.reasonSelected}&rdquo;
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
