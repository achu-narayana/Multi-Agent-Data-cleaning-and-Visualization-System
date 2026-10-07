/** Triggers a browser "save file" for an in-memory Blob. */
export const saveBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Give the browser a moment to start the download before revoking.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const escapeCsvCell = (value: unknown): string => {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Serialises rows into CSV text using the given column order. */
export const toCsv = (columns: string[], rows: Array<Record<string, unknown>>): string =>
  [
    columns.map(escapeCsvCell).join(','),
    ...rows.map((row) => columns.map((col) => escapeCsvCell(row[col])).join(',')),
  ].join('\n')
