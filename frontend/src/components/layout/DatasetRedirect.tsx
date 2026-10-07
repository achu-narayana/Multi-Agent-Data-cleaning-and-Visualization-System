import React from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useDataset } from '@/context/useDataset'
import { LoadingState } from '@/components/ui/LoadingState'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'

interface DatasetRedirectProps {
  /** Route prefix, e.g. "analytics" -> /analytics/:datasetId */
  section: string
}

/** Sends `/section` to `/section/<selected dataset id>`, or asks the user to upload one. */
export const DatasetRedirect: React.FC<DatasetRedirectProps> = ({ section }) => {
  const navigate = useNavigate()
  const { selectedDataset, isLoadingDatasets, datasetsError, refreshDatasets } = useDataset()

  if (selectedDataset) {
    return <Navigate to={`/${section}/${selectedDataset.id}`} replace />
  }
  if (isLoadingDatasets) {
    return <LoadingState title="Loading datasets..." />
  }
  if (datasetsError) {
    return (
      <ErrorState
        title="Could not load datasets"
        message={datasetsError}
        onRetry={() => void refreshDatasets()}
      />
    )
  }
  return (
    <EmptyState
      title="No dataset selected"
      description="Upload a dataset first. This page shows results for a specific dataset."
      actionLabel="Upload Dataset"
      onAction={() => navigate('/datasets')}
    />
  )
}
