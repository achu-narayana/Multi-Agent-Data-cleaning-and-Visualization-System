import React from 'react'
import { Trash2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { BeforeAfterRow, ChangeType } from '@/types'
import { cn } from '@/utils/cn'

interface BeforeAfterComparisonProps {
  rows: BeforeAfterRow[]
  beforeScore: number
  afterScore: number
  beforeSummary?: string
  afterSummary?: string
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

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(4).replace(/0+$/, '')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const round1 = (n: number) => Math.round(n * 10) / 10

export const BeforeAfterComparison: React.FC<BeforeAfterComparisonProps> = ({
  rows,
  beforeScore,
  afterScore,
  beforeSummary,
  afterSummary,
}) => {
  const improvement = round1(afterScore - beforeScore)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-slate-50 border-slate-200">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Before Cleaning Quality
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-slate-800">{round1(beforeScore)}</span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>
          {beforeSummary && <p className="text-[11px] text-slate-500 mt-1">{beforeSummary}</p>}
        </Card>

        <Card className="p-4 bg-emerald-50/60 border-emerald-200">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            After Cleaning Quality
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-emerald-700">{round1(afterScore)}</span>
            <span className="text-xs text-emerald-700/70 font-medium">/ 100</span>
          </div>
          {afterSummary && <p className="text-[11px] text-emerald-700/80 mt-1">{afterSummary}</p>}
        </Card>

        <Card className="p-4 bg-blue-50/60 border-blue-200">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-800">
            Change in Quality
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-extrabold text-blue-700">
              {improvement >= 0 ? `+${improvement}` : improvement}
            </span>
            <span className="text-xs text-blue-700 font-medium">points</span>
          </div>
          <p className="text-[11px] text-blue-700/80 mt-1">
            {rows.length} sample changed record{rows.length === 1 ? '' : 's'} shown below
          </p>
        </Card>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="No record-level changes"
          description="The pipeline did not report any modified, standardized or removed rows for this dataset."
        />
      ) : (
        <Card className="overflow-hidden">
          <CardHeader>
            <div>
              <CardTitle>Record Remediation Breakdown</CardTitle>
              <CardDescription>
                Raw row values compared with the cleaned output (changed fields highlighted)
              </CardDescription>
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                  <th className="py-3 px-4 w-28">Row / ID</th>
                  <th className="py-3 px-4">Transformation</th>
                  <th className="py-3 px-4 bg-slate-100/70 border-r border-slate-200">Before</th>
                  <th className="py-3 px-4 bg-emerald-50/40">After</th>
                  <th className="py-3 px-4">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[12px]">
                {rows.map((row, idx) => {
                  const badge = changeBadgeMap[row.changeType] || changeBadgeMap.modified
                  const isRemoved = row.changeType === 'removed_duplicate' || row.after === null
                  const before = row.before || {}
                  const after = row.after || {}
                  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
                  const changed = new Set(
                    keys.filter((k) => formatValue(before[k]) !== formatValue(after[k]))
                  )
                  // Show changed fields first; cap the rest to keep rows compact.
                  const visibleKeys = [
                    ...keys.filter((k) => changed.has(k)),
                    ...keys.filter((k) => !changed.has(k)),
                  ].slice(0, Math.max(4, changed.size))

                  return (
                    <tr key={`${row.rowId}-${idx}`} className="hover:bg-slate-50/70 transition-colors align-top">
                      <td className="py-3 px-4 font-bold text-slate-700">{row.rowId}</td>
                      <td className="py-3 px-4 font-sans">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="py-3 px-4 bg-slate-100/50 border-r border-slate-200 text-slate-700">
                        <div className="space-y-1">
                          {visibleKeys.map((k) => (
                            <div key={k} className="flex gap-2">
                              <span className="text-slate-400 font-sans text-[11px] min-w-16 truncate">
                                {k}:
                              </span>
                              <span
                                className={cn(
                                  !isRemoved &&
                                    changed.has(k) &&
                                    'text-rose-600 font-bold bg-rose-50 px-1 rounded'
                                )}
                              >
                                {formatValue(before[k])}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 bg-emerald-50/20">
                        {isRemoved ? (
                          <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 font-sans text-xs flex items-center gap-1.5">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Record removed</span>
                          </div>
                        ) : (
                          <div className="space-y-1 text-slate-900">
                            {visibleKeys.map((k) => (
                              <div key={k} className="flex gap-2">
                                <span className="text-slate-400 font-sans text-[11px] min-w-16 truncate">
                                  {k}:
                                </span>
                                <span
                                  className={cn(
                                    changed.has(k) && 'font-semibold text-emerald-700 bg-emerald-50 px-1 rounded'
                                  )}
                                >
                                  {formatValue(after[k])}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
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
      )}
    </div>
  )
}
