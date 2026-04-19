import { format } from 'date-fns'

export function formatNumber(value: number, suffix = '') {
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(value)}${suffix}`
}

export function formatCompact(value: number) {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

export function formatDateTime(value: string) {
  return format(new Date(value), 'dd MMM yyyy, HH:mm')
}

export function toDateInputValue(value: string) {
  return value.slice(0, 10)
}

export function riskTone(value: string) {
  if (value === 'Critical' || value === 'critical') return 'bg-red-100 text-red-700'
  if (value === 'High' || value === 'warning') return 'bg-orange-100 text-orange-700'
  if (value === 'Medium' || value === 'watch') return 'bg-amber-100 text-amber-700'
  return 'bg-emerald-100 text-emerald-700'
}
