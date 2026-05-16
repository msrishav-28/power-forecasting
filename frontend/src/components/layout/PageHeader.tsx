import type { ReactNode } from 'react'

import { formatDateTime } from '../../lib/format'

interface PageHeaderProps {
  eyebrow?: string
  title: string
  subtitle?: string
  lastUpdated?: string
  actions?: ReactNode
  className?: string
}

/**
 * PageHeader — every dashboard page begins with this. Gradient accent bar
 * anchors the title; subtitle gives operator context; actions slot houses
 * Refresh / export / quick-pick controls; lastUpdated reassures the operator
 * that the data on screen is real.
 */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  actions,
  className = '',
}: PageHeaderProps) {
  return (
    <header className={`animate-fade-up ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-stretch gap-4">
          <span aria-hidden className="w-1 rounded-pill bg-brand" />
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-mono text-eyebrow uppercase text-muted">{eyebrow}</p>
            )}
            <h1 className="mt-1 text-display font-semibold text-ink">{title}</h1>
            {subtitle && (
              <p className="mt-2 max-w-2xl text-body text-muted">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {lastUpdated && (
            <div className="inline-flex items-center gap-2 rounded-pill border border-glassEdge bg-panel/70 px-4 py-2 text-small text-muted shadow-glass backdrop-blur-glass">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
              <span className="font-mono text-eyebrow uppercase tracking-[0.18em]">Updated</span>
              <span className="text-ink">{formatDateTime(lastUpdated)}</span>
            </div>
          )}
          {actions}
        </div>
      </div>
    </header>
  )
}
