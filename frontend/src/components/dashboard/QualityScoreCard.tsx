import React from 'react'
import { ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ValidationResult, ValidationCheckName, ValidationCheckStatus } from '@/api/datasetApi'
import { cn } from '@/utils/cn'

interface QualityScoreCardProps {
  datasetName: string
  beforeScore: number
  afterScore: number
  validation?: ValidationResult
  onOpenPipeline?: () => void
}

const CHECK_LABELS: Record<ValidationCheckName, { label: string; description: string }> = {
  missing_values: { label: 'Completeness', description: 'Missing values check' },
  duplicates: { label: 'Uniqueness', description: 'Duplicate rows check' },
  numeric_values: { label: 'Numeric Validity', description: 'Infinite / non-numeric values' },
  dataset_structure: { label: 'Structure', description: 'Rows & columns present' },
  business_rules: { label: 'Business Rules', description: 'Domain rule violations' },
  statistical_outliers: { label: 'Outliers', description: 'Statistical outlier check' },
}

const statusStyles: Record<ValidationCheckStatus, string> = {
  PASS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  WARNING: 'bg-amber-50 text-amber-700 border-amber-200',
  FAIL: 'bg-rose-50 text-rose-700 border-rose-200',
}

const round1 = (n: number) => Math.round(n * 10) / 10

export const QualityScoreCard: React.FC<QualityScoreCardProps> = ({
  datasetName,
  beforeScore,
  afterScore,
  validation,
  onOpenPipeline,
}) => {
  const improvement = round1(afterScore - beforeScore)
  const checks = Object.entries(validation?.checks || {}) as Array<
    [ValidationCheckName, { status: ValidationCheckStatus }]
  >

  return (
    <Card className="p-6 overflow-hidden relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-50 text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Latest Data Quality Result
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">{datasetName}</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quality score computed by the Validation Agent before and after cleaning.
          </p>
          {onOpenPipeline && (
            <Button variant="outline" size="sm" className="mt-3" onClick={onOpenPipeline}>
              Open pipeline result
            </Button>
          )}
        </div>

        <div className="flex items-center gap-6 bg-slate-50 px-5 py-3 rounded-xl border border-slate-200/80">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold text-blue-600 tracking-tight">
                {round1(afterScore)}
              </span>
              <span className="text-base font-semibold text-slate-400">/ 100</span>
            </div>
            <span
              className={cn(
                'text-[11px] font-medium px-2 py-0.5 rounded-full border inline-flex items-center gap-1 mt-1',
                improvement >= 0
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-rose-700 bg-rose-50 border-rose-200'
              )}
            >
              {improvement >= 0 ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {improvement >= 0 ? `+${improvement}` : improvement} points
            </span>
          </div>

          <div className="h-10 w-px bg-slate-200" />

          <div className="text-xs space-y-1">
            <div className="text-slate-500 flex items-center justify-between gap-3">
              <span>Before:</span>
              <span className="font-semibold text-slate-700">{round1(beforeScore)}</span>
            </div>
            <div className="text-slate-500 flex items-center justify-between gap-3">
              <span>After:</span>
              <span className="font-semibold text-emerald-600">{round1(afterScore)}</span>
            </div>
          </div>
        </div>
      </div>

      {checks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-6">
          {checks.map(([name, check]) => {
            const meta = CHECK_LABELS[name] || { label: name, description: '' }
            const status = check?.status || 'WARNING'
            return (
              <div key={name} className="p-3 rounded-lg border border-slate-200/80 bg-white space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-700">{meta.label}</span>
                  <span
                    className={cn(
                      'text-[10px] font-bold px-1.5 py-0.5 rounded border',
                      statusStyles[status] || statusStyles.WARNING
                    )}
                  >
                    {status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">{meta.description}</p>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="pt-6 text-xs text-slate-400">No validation check details were returned.</p>
      )}

      {validation?.issues && validation.issues.length > 0 && (
        <ul className="mt-4 space-y-1 text-[11px] text-amber-800 list-disc pl-5">
          {validation.issues.slice(0, 5).map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
    </Card>
  )
}
