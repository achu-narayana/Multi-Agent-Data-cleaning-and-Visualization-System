import React from 'react'
import { CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react'
import { AgentStatus, DatasetStatus } from '@/types'
import { cn } from '@/utils/cn'

interface StatusBadgeProps {
  status: AgentStatus | DatasetStatus | 'completed' | 'in_progress' | 'pending' | 'failed'
  className?: string
  showIcon?: boolean
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  showIcon = true,
}) => {
  const normalized = status.toLowerCase()

  if (normalized === 'completed' || normalized === 'cleaned') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80',
          className
        )}
      >
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
        Completed
      </span>
    )
  }

  if (normalized === 'running' || normalized === 'in_progress' || normalized === 'profiling') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/80 animate-pulse',
          className
        )}
      >
        {showIcon && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
        {normalized === 'profiling' ? 'Profiling...' : 'Running'}
      </span>
    )
  }

  if (normalized === 'waiting' || normalized === 'pending' || normalized === 'raw') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200',
          className
        )}
      >
        {showIcon && <Clock className="w-3.5 h-3.5 text-slate-500" />}
        {normalized === 'raw' ? 'Raw Dataset' : 'Waiting'}
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200/80',
        className
      )}
    >
      {showIcon && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
      Failed
    </span>
  )
}
