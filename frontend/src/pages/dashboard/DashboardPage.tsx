import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload,
  Database,
  Layers,
  Sparkles,
  Award,
  CheckCircle,
  TrendingUp,
  Activity,
  Plus,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useDataset } from '@/context/DatasetContext'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { QualityScoreCard } from '@/components/dashboard/QualityScoreCard'
import { RecentDatasetsTable } from '@/components/dashboard/RecentDatasetsTable'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { datasets, activeJob } = useDataset()
  const navigate = useNavigate()

  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const userName = user?.name?.split(' ')[0] || 'Rahul'

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Clean, understand and extract insights from your data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/datasets')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Upload Dataset
          </Button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Datasets"
          value="24"
          subtitle="4 active this week"
          icon={<Database className="w-5 h-5 text-blue-600" />}
          iconBg="bg-blue-50"
        />
        <KpiCard
          title="Rows Processed"
          value="128K"
          subtitle="Across CSV & XLSX"
          change="+18.4%"
          isPositive={true}
          icon={<Layers className="w-5 h-5 text-indigo-600" />}
          iconBg="bg-indigo-50"
        />
        <KpiCard
          title="Average Quality"
          value="91.4%"
          subtitle="+30 pts post-pipeline"
          change="+32.8 pts"
          isPositive={true}
          icon={<Award className="w-5 h-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
        />
        <KpiCard
          title="Cleaning Jobs"
          value="37"
          subtitle="100% DAG success rate"
          icon={<Sparkles className="w-5 h-5 text-purple-600" />}
          iconBg="bg-purple-50"
        />
      </div>

      {/* Quality Summary Large Card */}
      <QualityScoreCard
        data={activeJob.quality}
        onRunCleaning={() => navigate(`/cleaning/${activeJob.id}`)}
      />

      {/* Recent Datasets Table */}
      <RecentDatasetsTable datasets={datasets} />
    </div>
  )
}
