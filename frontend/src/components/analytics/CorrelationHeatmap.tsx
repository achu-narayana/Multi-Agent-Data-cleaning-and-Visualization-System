import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'

interface CorrelationHeatmapProps {
  columns: string[]
  matrix: number[][]
}

export const CorrelationHeatmap: React.FC<CorrelationHeatmapProps> = ({ columns, matrix }) => {
  // Helper to get heat color for correlation value (-1 to 1)
  const getCellColor = (val: number) => {
    if (val === 1.0) return 'bg-blue-600 text-white font-bold'
    if (val >= 0.8) return 'bg-blue-500 text-white font-bold'
    if (val >= 0.6) return 'bg-blue-400 text-white font-semibold'
    if (val >= 0.4) return 'bg-blue-200 text-blue-900'
    if (val >= 0.2) return 'bg-blue-100 text-blue-800'
    if (val >= 0.0) return 'bg-slate-50 text-slate-700'
    return 'bg-rose-100 text-rose-800'
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Pearson Correlation Matrix</CardTitle>
          <CardDescription>
            Bivariate linear correlation coefficients (-1.0 to +1.0) between numeric features
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="inline-block min-w-full">
            <table className="border-collapse mx-auto text-xs">
              <thead>
                <tr>
                  <th className="p-2.5 text-left text-slate-400 font-normal">Feature</th>
                  {columns.map((col) => (
                    <th key={col} className="p-2.5 text-center font-semibold text-slate-700 w-24">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, rIdx) => (
                  <tr key={columns[rIdx]}>
                    <td className="p-2.5 font-semibold text-slate-800 pr-4 whitespace-nowrap">
                      {columns[rIdx]}
                    </td>
                    {row.map((val, cIdx) => (
                      <td key={`${rIdx}-${cIdx}`} className="p-1">
                        <div
                          className={`w-20 h-10 rounded-md flex items-center justify-center font-mono text-xs transition-transform hover:scale-105 shadow-2xs ${getCellColor(
                            val
                          )}`}
                          title={`${columns[rIdx]} vs ${columns[cIdx]}: ${val.toFixed(2)}`}
                        >
                          {val.toFixed(2)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Inverse Correlation (&lt; 0.0)</span>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-3 rounded bg-slate-50 border border-slate-200" />
            <span>0.0</span>
            <span className="w-4 h-3 rounded bg-blue-100" />
            <span>0.2</span>
            <span className="w-4 h-3 rounded bg-blue-300" />
            <span>0.6</span>
            <span className="w-4 h-3 rounded bg-blue-600" />
            <span>1.0</span>
          </div>
          <span>Strong Linear Relationship (&gt; 0.8)</span>
        </div>
      </CardContent>
    </Card>
  )
}
