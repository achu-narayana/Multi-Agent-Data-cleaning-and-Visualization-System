import React from 'react'
import {
  TrendingUp,
  PieChart,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { InsightItem, InsightCategory } from '@/types'
import { cn } from '@/utils/cn'

interface InsightCardProps {
  insight: InsightItem
}

const categoryIcons: Record<InsightCategory, React.ElementType> = {
  Correlation: TrendingUp,
  Distribution: PieChart,
  'Data Quality': ShieldCheck,
  Anomaly: AlertTriangle,
  Trend: ArrowUpRight,
}

const categoryColors: Record<InsightCategory, string> = {
  Correlation: 'text-blue-600 bg-blue-50 border-blue-200',
  Distribution: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  'Data Quality': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  Anomaly: 'text-amber-600 bg-amber-50 border-amber-200',
  Trend: 'text-purple-600 bg-purple-50 border-purple-200',
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const Icon = categoryIcons[insight.category] || Lightbulb
  const colorClass = categoryColors[insight.category] || 'text-blue-600 bg-blue-50 border-blue-200'

  return (
    <Card className="p-5 flex flex-col justify-between hover:shadow-sm transition-all duration-200">
      <div>
        {/* Category & Confidence Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-7 h-7 rounded-md border flex items-center justify-center shrink-0',
                colorClass
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-700">{insight.category}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-medium">Confidence:</span>
            <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {insight.confidence}%
            </span>
          </div>
        </div>

        {/* Title & Body */}
        <h4 className="text-sm font-bold text-slate-900 leading-snug">{insight.title}</h4>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">{insight.description}</p>
      </div>

      {/* Recommendation Callout */}
      {insight.recommendation && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-start gap-1.5 text-xs text-slate-700">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900">Recommended Action: </span>
              <span className="text-slate-600">{insight.recommendation}</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
