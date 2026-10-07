import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { DatasetProvider } from '@/context/DatasetContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DatasetRedirect } from '@/components/layout/DatasetRedirect'
import { LoadingState } from '@/components/ui/LoadingState'

// Route-level code splitting keeps the initial bundle small (recharts etc. load on demand).
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const RegisterPage = lazy(() =>
  import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
)
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const DatasetsPage = lazy(() =>
  import('@/pages/datasets/DatasetsPage').then((m) => ({ default: m.DatasetsPage }))
)
const DatasetDetailPage = lazy(() =>
  import('@/pages/datasets/DatasetDetailPage').then((m) => ({ default: m.DatasetDetailPage }))
)
const CleaningPipelinePage = lazy(() =>
  import('@/pages/cleaning/CleaningPipelinePage').then((m) => ({ default: m.CleaningPipelinePage }))
)
const AgentPerformancePage = lazy(() =>
  import('@/pages/agents/AgentPerformancePage').then((m) => ({ default: m.AgentPerformancePage }))
)
const AnalyticsPage = lazy(() =>
  import('@/pages/analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
)
const VisualizationsPage = lazy(() =>
  import('@/pages/visualizations/VisualizationsPage').then((m) => ({ default: m.VisualizationsPage }))
)
const InsightsPage = lazy(() =>
  import('@/pages/insights/InsightsPage').then((m) => ({ default: m.InsightsPage }))
)
const AiAnalystPage = lazy(() =>
  import('@/pages/chatbot/AiAnalystPage').then((m) => ({ default: m.AiAnalystPage }))
)

const PageFallback = () => <LoadingState title="Loading..." subtitle="" className="m-6" />

export function App() {
  return (
    <AuthProvider>
      <DatasetProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes (JWT session required) */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/datasets" element={<DatasetsPage />} />
                  <Route path="/datasets/:datasetId" element={<DatasetDetailPage />} />
                  <Route path="/cleaning/:datasetId" element={<CleaningPipelinePage />} />
                  <Route path="/cleaning" element={<DatasetRedirect section="cleaning" />} />
                  <Route path="/agents" element={<AgentPerformancePage />} />
                  <Route path="/analytics/:datasetId" element={<AnalyticsPage />} />
                  <Route path="/analytics" element={<DatasetRedirect section="analytics" />} />
                  <Route path="/visualizations/:datasetId" element={<VisualizationsPage />} />
                  <Route
                    path="/visualizations"
                    element={<DatasetRedirect section="visualizations" />}
                  />
                  <Route path="/insights/:datasetId" element={<InsightsPage />} />
                  <Route path="/insights" element={<DatasetRedirect section="insights" />} />
                  <Route path="/ai-analyst" element={<AiAnalystPage />} />
                </Route>
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </DatasetProvider>
    </AuthProvider>
  )
}

export default App
