import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { DescriptiveStat } from '@/types'

interface DescriptiveStatsTableProps {
  stats: DescriptiveStat[]
}

const fmt = (val: number | null | undefined): string =>
  typeof val === 'number' && Number.isFinite(val)
    ? val.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '—'

export const DescriptiveStatsTable: React.FC<DescriptiveStatsTableProps> = ({ stats }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Descriptive Statistics</CardTitle>
          <CardDescription>
            Central tendency, dispersion, and spread metrics across numerical variables
          </CardDescription>
        </div>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-medium">
              <th className="py-3 px-6">Column Name</th>
              <th className="py-3 px-4 text-right">Mean</th>
              <th className="py-3 px-4 text-right">Median</th>
              <th className="py-3 px-4 text-right">Min</th>
              <th className="py-3 px-4 text-right">Max</th>
              <th className="py-3 px-4 text-right">Std Dev (σ)</th>
              <th className="py-3 px-4 text-right">Total Count</th>
              <th className="py-3 px-6 text-right">Null Values</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[12px]">
            {stats.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center font-sans text-slate-400">
                  No numerical columns to summarise.
                </td>
              </tr>
            )}
            {stats.map((item) => (
              <tr key={item.column} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-6 font-sans font-semibold text-slate-900">{item.column}</td>
                <td className="py-3 px-4 text-right text-slate-700">{fmt(item.mean)}</td>
                <td className="py-3 px-4 text-right text-slate-700">{fmt(item.median)}</td>
                <td className="py-3 px-4 text-right text-slate-600">{fmt(item.min)}</td>
                <td className="py-3 px-4 text-right text-slate-600">{fmt(item.max)}</td>
                <td className="py-3 px-4 text-right text-slate-700 font-medium">{fmt(item.stdDev)}</td>
                <td className="py-3 px-4 text-right text-slate-600">{fmt(item.count)}</td>
                <td className="py-3 px-6 text-right">
                  <span
                    className={`font-sans text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      item.nullCount
                        ? 'text-amber-700 bg-amber-50 border-amber-200'
                        : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    }`}
                  >
                    {fmt(item.nullCount ?? 0)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
