import React from 'react'
import { Card } from '@/components/ui/Card'
import { ArrowUpRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react'
import { QualityScoreData } from '@/types'

interface QualityScoreCardProps {
  data: QualityScoreData
  onRunCleaning?: () => void
}

export const QualityScoreCard: React.FC<QualityScoreCardProps> = ({ data, onRunCleaning }) => {
  const { beforeScore, afterScore, improvement, breakdown } = data

  const metrics = [
    { label: 'Completeness', value: breakdown.completeness, color: 'bg-blue-600', description: 'Zero unhandled null or empty cells' },
    { label: 'Consistency', value: breakdown.consistency, color: 'bg-indigo-600', description: 'Canonical formats and uniform encodings' },
    { label: 'Validity', value: breakdown.validity, color: 'bg-emerald-600', description: 'Domain assertions & range bounds satisfied' },
    { label: 'Uniqueness', value: breakdown.uniqueness, color: 'bg-purple-600', description: 'Duplicate composite keys eliminated' },
  ]

  return (
    <Card className="p-6 overflow-hidden relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-blue-50 text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Data Quality Summary
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Overall Data Quality</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated metric across dimensional validation rules & agent transformations.
          </p>
        </div>

        {/* Big Score Display */}
        <div className="flex items-center gap-6 bg-slate-50 px-5 py-3 rounded-xl border border-slate-200/80">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-4xl font-extrabold text-blue-600 tracking-tight">{afterScore}</span>
              <span className="text-base font-semibold text-slate-400">/ 100</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" /> +{improvement} Improvement
            </span>
          </div>

          <div className="h-10 w-px bg-slate-200" />

          <div className="text-xs space-y-1">
            <div className="text-slate-500 flex items-center justify-between gap-3">
              <span>Before:</span>
              <span className="font-semibold text-slate-700">{beforeScore}</span>
            </div>
            <div className="text-slate-500 flex items-center justify-between gap-3">
              <span>After:</span>
              <span className="font-semibold text-emerald-600">{afterScore}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Dimension Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-6">
        {metrics.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="font-bold text-slate-900">{item.value}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${item.color} transition-all duration-500`}
                style={{ width: `${item.value}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">{item.description}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
