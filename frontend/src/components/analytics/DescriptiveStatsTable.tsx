import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { DescriptiveStat } from '@/types'

interface DescriptiveStatsTableProps {
  stats: DescriptiveStat[]
}

export const DescriptiveStatsTable: React.FC<DescriptiveStatsTableProps> = ({ stats }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Descriptive Statistics</CardTitle>
          <CardDescription>
            Central tendency, dispersion, and spread metrics across cleaned numerical variables
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
            {stats.map((item) => {
              const isSalary = item.column.toLowerCase().includes('salary')
              return (
                <tr key={item.column} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-6 font-sans font-semibold text-slate-900">
                    {item.column}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    {isSalary ? `₹${item.mean.toLocaleString()}` : item.mean}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700">
                    {isSalary ? `₹${item.median.toLocaleString()}` : item.median}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {isSalary ? `₹${item.min.toLocaleString()}` : item.min}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {isSalary ? `₹${item.max.toLocaleString()}` : item.max}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-700 font-medium">
                    {isSalary ? `₹${item.stdDev.toLocaleString()}` : item.stdDev}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-600">
                    {item.count.toLocaleString()}
                  </td>
                  <td className="py-3 px-6 text-right">
                    <span className="font-sans text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      0 ({item.nullCount}%)
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
