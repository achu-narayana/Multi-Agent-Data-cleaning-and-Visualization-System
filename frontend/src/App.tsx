import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { DatasetProvider } from '@/context/DatasetContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'

// Pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { DatasetsPage } from '@/pages/datasets/DatasetsPage'
import { DatasetDetailPage } from '@/pages/datasets/DatasetDetailPage'
import { CleaningPipelinePage } from '@/pages/cleaning/CleaningPipelinePage'
import { AgentPerformancePage } from '@/pages/agents/AgentPerformancePage'
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage'
import { VisualizationsPage } from '@/pages/visualizations/VisualizationsPage'
import { InsightsPage } from '@/pages/insights/InsightsPage'
import { AiAnalystPage } from '@/pages/chatbot/AiAnalystPage'

export function App() {
  return (
    <AuthProvider>
      <DatasetProvider>
        <BrowserRouter>
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
                <Route path="/cleaning/:jobId" element={<CleaningPipelinePage />} />
                <Route path="/cleaning" element={<Navigate to="/cleaning/job_workforce_clean_882" replace />} />
                <Route path="/agents" element={<AgentPerformancePage />} />
                <Route path="/analytics/:datasetId" element={<AnalyticsPage />} />
                <Route path="/analytics" element={<Navigate to="/analytics/ds_workforce_01" replace />} />
                <Route path="/visualizations/:datasetId" element={<VisualizationsPage />} />
                <Route path="/visualizations" element={<Navigate to="/visualizations/ds_workforce_01" replace />} />
                <Route path="/insights/:datasetId" element={<InsightsPage />} />
                <Route path="/insights" element={<Navigate to="/insights/ds_workforce_01" replace />} />
                <Route path="/ai-analyst" element={<AiAnalystPage />} />
              </Route>
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </DatasetProvider>
    </AuthProvider>
  )
}

export default App
