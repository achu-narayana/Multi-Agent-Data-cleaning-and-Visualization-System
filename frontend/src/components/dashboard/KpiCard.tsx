import React from 'react'
import { Card } from '@/components/ui/Card'
import { cn } from '@/utils/cn'

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  change?: string
  isPositive?: boolean
  icon: React.ReactNode
  iconBg?: string
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  change,
  isPositive = true,
  icon,
  iconBg = 'bg-blue-50 text-blue-600',
}) => {
  return (
    <Card className="hover:shadow-sm transition-all duration-200">
      <div className="p-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
          {(change || subtitle) && (
            <div className="flex items-center gap-1.5 mt-2">
              {change && (
                <span
                  className={cn(
                    'text-xs font-semibold px-1.5 py-0.2 rounded',
                    isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  )}
                >
                  {change}
                </span>
              )}
              {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
            </div>
          )}
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
          {icon}
        </div>
      </div>
    </Card>
  )
}
