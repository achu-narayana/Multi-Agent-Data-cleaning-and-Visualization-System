import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Dataset } from '@/types'
import { datasetApi, ProcessingResult } from '@/api/datasetApi'
import { getErrorMessage, isNotFound } from '@/api/client'
import { useAuth } from './useAuth'
import { DatasetContext } from './useDataset'

const SELECTED_KEY = 'aura_selected_dataset'

const readSelectedId = (): string | null => {
  try {
    return localStorage.getItem(SELECTED_KEY)
  } catch {
    return null
  }
}

const writeSelectedId = (id: string | null) => {
  try {
    if (id) localStorage.setItem(SELECTED_KEY, id)
    else localStorage.removeItem(SELECTED_KEY)
  } catch {
    // ignore storage failures
  }
}

export const DatasetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth()

  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false)
  const [datasetsError, setDatasetsError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(() => readSelectedId())
  const [results, setResults] = useState<Record<string, ProcessingResult | null>>({})
  const [processingDatasetId, setProcessingDatasetId] = useState<string | null>(null)

  // Keep a ref to the latest results so loadProcessingResult stays referentially stable.
  const resultsRef = useRef(results)
  useEffect(() => {
    resultsRef.current = results
  }, [results])

  const upsertDataset = useCallback((dataset: Dataset) => {
    setDatasets((prev) => {
      const exists = prev.some((d) => d.id === dataset.id)
      return exists ? prev.map((d) => (d.id === dataset.id ? dataset : d)) : [dataset, ...prev]
    })
  }, [])

  const refreshDatasets = useCallback(async () => {
    setIsLoadingDatasets(true)
    setDatasetsError(null)
    try {
      const list = await datasetApi.getDatasets()
      setDatasets(Array.isArray(list) ? list : [])
    } catch (error) {
      setDatasetsError(getErrorMessage(error, 'Failed to load datasets.'))
    } finally {
      setIsLoadingDatasets(false)
    }
  }, [])

  // On every login: drop anything cached for a previous session (adjusting state during
  // render when auth changes, per React docs), then load this user's datasets.
  const [sessionActive, setSessionActive] = useState(false)
  if (isAuthenticated !== sessionActive) {
    setSessionActive(isAuthenticated)
    if (isAuthenticated) {
      setDatasets([])
      setResults({})
      setProcessingDatasetId(null)
      setDatasetsError(null)
      setIsLoadingDatasets(true)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    let cancelled = false
    datasetApi
      .getDatasets()
      .then((list) => {
        if (!cancelled) setDatasets(Array.isArray(list) ? list : [])
      })
      .catch((error: unknown) => {
        if (!cancelled) setDatasetsError(getErrorMessage(error, 'Failed to load datasets.'))
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDatasets(false)
      })
    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const selectDataset = useCallback((datasetId: string | null) => {
    setSelectedId(datasetId)
    writeSelectedId(datasetId)
  }, [])

  const selectedDataset = useMemo<Dataset | null>(() => {
    if (datasets.length === 0) return null
    return datasets.find((d) => d.id === selectedId) || datasets[0]
  }, [datasets, selectedId])

  const uploadDatasetFile = useCallback(
    async (file: File): Promise<Dataset> => {
      const uploaded = await datasetApi.uploadDataset(file)
      const dataset = uploaded.dataset
      upsertDataset(dataset)
      selectDataset(dataset.id)
      return dataset
    },
    [upsertDataset, selectDataset]
  )

  const deleteDataset = useCallback(
    async (datasetId: string) => {
      await datasetApi.deleteDataset(datasetId)
      setDatasets((prev) => prev.filter((d) => d.id !== datasetId))
      setResults((prev) => {
        const next = { ...prev }
        delete next[datasetId]
        return next
      })
      if (selectedId === datasetId) selectDataset(null)
    },
    [selectedId, selectDataset]
  )

  const processDataset = useCallback(
    async (datasetId: string): Promise<ProcessingResult> => {
      setProcessingDatasetId(datasetId)
      try {
        const result = await datasetApi.processDataset(datasetId)
        setResults((prev) => ({ ...prev, [datasetId]: result }))
        if (result.dataset) upsertDataset(result.dataset)
        return result
      } catch (error) {
        // Status may have changed to 'failed' server-side.
        datasetApi
          .getDataset(datasetId)
          .then(upsertDataset)
          .catch(() => undefined)
        throw error
      } finally {
        setProcessingDatasetId((current) => (current === datasetId ? null : current))
      }
    },
    [upsertDataset]
  )

  const loadProcessingResult = useCallback(
    async (datasetId: string, force = false): Promise<ProcessingResult | null> => {
      if (!force && datasetId in resultsRef.current) {
        return resultsRef.current[datasetId]
      }
      try {
        const result = await datasetApi.getProcessingResult(datasetId)
        setResults((prev) => ({ ...prev, [datasetId]: result }))
        return result
      } catch (error) {
        if (isNotFound(error)) {
          setResults((prev) => ({ ...prev, [datasetId]: null }))
          return null
        }
        throw error
      }
    },
    []
  )

  const value = useMemo(
    () => ({
      // Never expose a previous session's data while logged out.
      datasets: isAuthenticated ? datasets : [],
      isLoadingDatasets,
      datasetsError: isAuthenticated ? datasetsError : null,
      refreshDatasets,
      selectedDataset: isAuthenticated ? selectedDataset : null,
      selectDataset,
      results: isAuthenticated ? results : {},
      processingDatasetId: isAuthenticated ? processingDatasetId : null,
      uploadDatasetFile,
      deleteDataset,
      processDataset,
      loadProcessingResult,
    }),
    [
      isAuthenticated,
      datasets,
      isLoadingDatasets,
      datasetsError,
      refreshDatasets,
      selectedDataset,
      selectDataset,
      results,
      processingDatasetId,
      uploadDatasetFile,
      deleteDataset,
      processDataset,
      loadProcessingResult,
    ]
  )

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
}
