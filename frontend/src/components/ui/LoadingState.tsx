import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface LoadingStateProps {
  title?: string
  subtitle?: string
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  title = 'Loading data intelligence...',
  subtitle = 'Please wait while agents process the request',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center rounded-xl bg-slate-50/50 border border-dashed border-slate-200',
        className
      )}
    >
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full border-3 border-blue-100 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      </div>
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">{subtitle}</p>
    </div>
  )
}
