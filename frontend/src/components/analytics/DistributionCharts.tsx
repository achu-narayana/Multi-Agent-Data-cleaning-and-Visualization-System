import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

interface DistributionChartsProps {
  categoryDistributions: Record<string, Array<{ name: string; count: number; percentage: number }>>
  numericalDistributions: Record<string, Array<{ bin: string; count: number }>>
  /** Max charts rendered per kind, to keep the page readable on wide datasets. */
  maxPerKind?: number
}

const COLORS = ['#2563eb', '#4f46e5', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2', '#64748b']

const tooltipStyle = {
  backgroundColor: '#ffffff',
  borderColor: '#e2e8f0',
  borderRadius: '8px',
  fontSize: '12px',
}

const formatCount = (val: unknown) => (typeof val === 'number' ? val.toLocaleString() : String(val))

export const DistributionCharts: React.FC<DistributionChartsProps> = ({
  categoryDistributions,
  numericalDistributions,
  maxPerKind = 6,
}) => {
  const numerical = Object.entries(numericalDistributions || {})
    .filter(([, bins]) => Array.isArray(bins) && bins.length > 0)
    .slice(0, maxPerKind)
  const categorical = Object.entries(categoryDistributions || {})
    .filter(([, values]) => Array.isArray(values) && values.length > 0)
    .slice(0, maxPerKind)

  if (numerical.length === 0 && categorical.length === 0) {
    return (
      <Card className="p-6 text-center text-xs text-slate-400">
        No distribution data available for this dataset.
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {numerical.map(([column, bins], idx) => (
        <Card key={`num-${column}`}>
          <CardHeader>
            <div>
              <CardTitle>{column} Distribution</CardTitle>
              <CardDescription>Frequency of values across binned ranges</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bins} margin={{ top: 10, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="bin" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(val: unknown) => [formatCount(val), 'Count']}
                    contentStyle={tooltipStyle}
                  />
                  <Bar dataKey="count" fill={COLORS[idx % COLORS.length]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}

      {categorical.map(([column, values]) => (
        <Card key={`cat-${column}`}>
          <CardHeader>
            <div>
              <CardTitle>{column} Breakdown</CardTitle>
              <CardDescription>Share of records per category</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={values}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="name"
                  >
                    {values.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: unknown, name: unknown, entry: { payload?: { percentage?: number } }) => [
                      `${formatCount(val)}${
                        entry?.payload?.percentage !== undefined ? ` (${entry.payload.percentage}%)` : ''
                      }`,
                      String(name),
                    ]}
                    contentStyle={tooltipStyle}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(val: unknown) => (
                      <span className="text-xs text-slate-700">{String(val)}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
