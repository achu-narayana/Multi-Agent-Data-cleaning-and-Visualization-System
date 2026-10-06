import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FileSpreadsheet, ArrowRight, Eye, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Dataset } from '@/types'

interface RecentDatasetsTableProps {
  datasets: Dataset[]
}

export const RecentDatasetsTable: React.FC<RecentDatasetsTableProps> = ({ datasets }) => {
  const navigate = useNavigate()

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Recent Datasets</CardTitle>
          <CardDescription>Datasets active in the multi-agent cleaning pipeline</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/datasets')}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          View All Datasets
        </Button>
      </CardHeader>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-medium">
              <th className="py-3 px-4 sm:px-6">Dataset</th>
              <th className="py-3 px-4">Rows</th>
              <th className="py-3 px-4">Columns</th>
              <th className="py-3 px-4">Quality</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right pr-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {datasets.map((dataset) => (
              <tr
                key={dataset.id}
                className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                onClick={() => navigate(`/datasets/${dataset.id}`)}
              >
                <td className="py-3.5 px-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {dataset.name}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {dataset.size} • {dataset.format.toUpperCase()}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4 font-medium text-slate-700">
                  {dataset.rowCount.toLocaleString()} rows
                </td>
                <td className="py-3.5 px-4 text-slate-600">{dataset.columnCount} columns</td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">{dataset.qualityScore}%</span>
                    <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                      <div
                        className={`h-full rounded-full ${
                          dataset.qualityScore > 80
                            ? 'bg-emerald-500'
                            : dataset.qualityScore > 60
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${dataset.qualityScore}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <StatusBadge status={dataset.status} />
                </td>
                <td className="py-3.5 px-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/datasets/${dataset.id}`)}
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/cleaning/job_workforce_clean_882`)}
                      leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                    >
                      Pipeline
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
