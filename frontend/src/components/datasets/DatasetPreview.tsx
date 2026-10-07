import React, { useState, useMemo } from 'react'
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface DatasetPreviewProps {
  data: Record<string, any>[]
  /** Explicit column order (e.g. from the preview endpoint); falls back to the first row's keys. */
  columns?: string[]
  title?: string
  rowsPerPageDefault?: number
}

export const DatasetPreview: React.FC<DatasetPreviewProps> = ({
  data,
  columns: columnsProp,
  title = 'Data Preview (Spreadsheet View)',
  rowsPerPageDefault = 8,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage] = useState(rowsPerPageDefault)

  const columns = useMemo(() => {
    if (columnsProp && columnsProp.length > 0) return columnsProp
    if (!data || data.length === 0) return []
    return Object.keys(data[0])
  }, [data, columnsProp])

  // Filter by search
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data
    const term = searchTerm.toLowerCase()
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col]
        return val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      })
    )
  }, [data, searchTerm, columns])

  // Sort
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]
      if (aVal === bVal) return 0
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      const strA = String(aVal).toLowerCase()
      const strB = String(bVal).toLowerCase()
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA)
    })
  }, [filteredData, sortColumn, sortDirection])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / rowsPerPage))
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return sortedData.slice(start, start + rowsPerPage)
  }, [sortedData, currentPage, rowsPerPage])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else {
        setSortColumn(null)
        setSortDirection('asc')
      }
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  return (
    <Card className="overflow-hidden flex flex-col">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-200/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{title}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {sortedData.length} records
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search across all columns..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Spreadsheet Table with Sticky Header & Horizontal Scroll */}
      <div className="relative overflow-x-auto max-h-[460px] border-b border-slate-100">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-slate-600 font-semibold shadow-2xs">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center text-slate-400 font-normal">#</th>
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="py-2.5 px-4 font-semibold hover:bg-slate-200/70 transition-colors cursor-pointer select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col}</span>
                    <ArrowUpDown
                      className={`w-3 h-3 ${
                        sortColumn === col ? 'text-blue-600 font-bold' : 'text-slate-400'
                      }`}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white font-mono text-[12px]">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                  <td className="py-2 px-3 text-center text-slate-400 font-sans text-[11px]">
                    {(currentPage - 1) * rowsPerPage + idx + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col]
                    const isSalary = col.toLowerCase().includes('salary')
                    return (
                      <td key={col} className="py-2 px-4 whitespace-nowrap text-slate-700">
                        {val !== null && val !== undefined ? (
                          isSalary && typeof val === 'number' ? (
                            `₹${val.toLocaleString()}`
                          ) : (
                            String(val)
                          )
                        ) : (
                          <span className="text-amber-500 font-sans italic text-xs">NULL</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length + 1} className="py-8 text-center text-slate-400">
                  No records matching &quot;{searchTerm}&quot;
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-3 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
        <div>
          Showing {(currentPage - 1) * rowsPerPage + 1} to{' '}
          {Math.min(currentPage * rowsPerPage, sortedData.length)} of {sortedData.length} records
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            leftIcon={<ChevronLeft className="w-3.5 h-3.5" />}
          >
            Prev
          </Button>
          <span className="px-2 text-slate-700 font-semibold">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}
