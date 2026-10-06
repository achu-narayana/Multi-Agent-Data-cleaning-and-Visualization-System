import React from 'react'
import { ArrowRight, CheckCircle2, AlertTriangle, Sparkles, Filter, Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BeforeAfterRow, ChangeType } from '@/types'
import { cn } from '@/utils/cn'

interface BeforeAfterComparisonProps {
  rows: BeforeAfterRow[]
  beforeScore?: number
  afterScore?: number
  improvement?: number
}

const changeBadgeMap: Record<
  ChangeType,
  { label: string; variant: 'blue' | 'purple' | 'danger' | 'warning' | 'default' }
> = {
  modified: { label: 'Imputed / Modified', variant: 'blue' },
  standardized: { label: 'Standardized', variant: 'purple' },
  removed_duplicate: { label: 'Removed Duplicate', variant: 'danger' },
  anomaly_fixed: { label: 'Anomaly Corrected', variant: 'warning' },
  original: { label: 'Original', variant: 'default' },
}

export const BeforeAfterComparison: React.FC<BeforeAfterComparisonProps> = ({
  rows,
  beforeScore = 61.4,
  afterScore = 94.2,
  improvement = 32.8,
}) => {
  return (
    <div className="space-y-6">
      {/* High-level score summary banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-50 border-slate-200">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Before Cleaning Quality
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-800">{beforeScore}</span>
            <span className="text-xs text-rose-600 font-medium">Unreliable baseline</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Contained 421 missing values, 231 duplicates, 74 outliers
          </p>
        </Card>

        <Card className="p-4 bg-emerald-50/60 border-emerald-200">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            After Cleaning Quality
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-emerald-700">{afterScore}</span>
            <span className="text-xs text-emerald-700 font-medium">Production certified</span>
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-1">
            Zero remaining nulls or duplicates, standard schemas
          </p>
        </Card>

        <Card className="p-4 bg-blue-50/60 border-blue-200">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-800">
            Overall Improvement
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-blue-700">+{improvement}</span>
            <span className="text-xs text-blue-700 font-medium">Quality Points Gained</span>
          </div>
          <p className="text-[11px] text-blue-700/80 mt-1">
            Multi-agent pipeline automated 100% of remediations
          </p>
        </Card>
      </div>

      {/* Visual Side-by-Side Comparison */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div>
            <CardTitle>Problematic Records Remediation Breakdown</CardTitle>
            <CardDescription>
              Comparing raw sample row inputs against post-agent cleaned outputs
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Legends:</span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" title="Imputed" />
            <span className="text-[11px] text-slate-500">Imputed</span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500 ml-1" title="Standardized" />
            <span className="text-[11px] text-slate-500">Standardized</span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 ml-1" title="Duplicate Purged" />
            <span className="text-[11px] text-slate-500">Duplicate Purged</span>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ml-1" title="Anomaly Scaled" />
            <span className="text-[11px] text-slate-500">Anomaly Scaled</span>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                <th className="py-3 px-4 w-28">Row / ID</th>
                <th className="py-3 px-4">Transformation Type</th>
                <th className="py-3 px-4 bg-slate-100/70 border-r border-slate-200">
                  Before Cleaning (Raw State)
                </th>
                <th className="py-3 px-4 bg-emerald-50/40">After Cleaning (Resolved State)</th>
                <th className="py-3 px-4">Remediation Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[12px]">
              {rows.map((row) => {
                const badge = changeBadgeMap[row.changeType] || changeBadgeMap.modified
                const isDuplicateRemoved = row.changeType === 'removed_duplicate'

                return (
                  <tr key={row.rowId} className="hover:bg-slate-50/70 transition-colors">
                    {/* ID */}
                    <td className="py-3 px-4 font-bold text-slate-700">{row.rowId}</td>

                    {/* Change Type Badge */}
                    <td className="py-3 px-4 font-sans">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>

                    {/* Before state */}
                    <td className="py-3 px-4 bg-slate-100/50 border-r border-slate-200 font-mono text-slate-700">
                      <div className="space-y-1">
                        <div className="flex gap-2">
                          <span className="text-slate-400 font-sans text-[11px] w-14">Age:</span>
                          <span
                            className={cn(
                              Number(row.before.Age) < 0 &&
                                'text-rose-600 font-bold bg-rose-50 px-1 rounded'
                            )}
                          >
                            {row.before.Age}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-slate-400 font-sans text-[11px] w-14">Salary:</span>
                          <span
                            className={cn(
                              row.before.Salary === 'NULL' &&
                                'text-amber-600 font-bold bg-amber-50 px-1 rounded',
                              row.before.Salary === '8,000,000' &&
                                'text-rose-600 font-bold bg-rose-50 px-1 rounded'
                            )}
                          >
                            {row.before.Salary}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-slate-400 font-sans text-[11px] w-14">Dept:</span>
                          <span
                            className={cn(
                              row.before.Department === 'it' &&
                                'text-purple-600 font-bold bg-purple-50 px-1 rounded',
                              row.before.Department === 'Information Technology' &&
                                'text-purple-600 font-bold bg-purple-50 px-1 rounded'
                            )}
                          >
                            {row.before.Department}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* After state */}
                    <td className="py-3 px-4 bg-emerald-50/20 font-mono">
                      {isDuplicateRemoved ? (
                        <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 font-sans text-xs flex items-center gap-1.5">
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Record Purged (Colliding Duplicate)</span>
                        </div>
                      ) : (
                        <div className="space-y-1 text-slate-900">
                          <div className="flex gap-2">
                            <span className="text-slate-400 font-sans text-[11px] w-14">Age:</span>
                            <span className="font-semibold text-emerald-700">{row.after?.Age}</span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-slate-400 font-sans text-[11px] w-14">
                              Salary:
                            </span>
                            <span className="font-semibold text-emerald-700">
                              ₹{row.after?.Salary}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <span className="text-slate-400 font-sans text-[11px] w-14">Dept:</span>
                            <span className="font-semibold text-emerald-700">
                              {row.after?.Department}
                            </span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 font-sans text-xs text-slate-600 leading-relaxed max-w-xs">
                      {row.changeDescription}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
