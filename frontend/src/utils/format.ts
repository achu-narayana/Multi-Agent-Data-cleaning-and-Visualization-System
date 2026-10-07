/** Formats an ISO timestamp for display; returns the input unchanged if unparsable. */
export const formatDateTime = (iso: string | undefined | null): string => {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export const round1 = (n: number | undefined | null): number =>
  typeof n === 'number' && Number.isFinite(n) ? Math.round(n * 10) / 10 : 0
