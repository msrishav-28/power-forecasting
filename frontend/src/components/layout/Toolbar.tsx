import { ChevronRight, RefreshCw } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  assets: 'Asset Health',
  grid: 'Grid Operations',
  corridors: 'Corridor Monitor',
  overview: 'Overview',
}

interface ToolbarProps {
  className?: string
  /** Optional refresh handler. Defaults to window.location.reload(). */
  onRefresh?: () => void
}

/**
 * Toolbar — slim sub-header that lives just under TopNav. Breadcrumb on the
 * left for wayfinding, refresh button on the right. Data is snapshot-backed,
 * so the refresh button is a hard reload by default.
 */
export function Toolbar({ className = '', onRefresh }: ToolbarProps) {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-panel border border-glassEdge bg-panel/60 px-pane py-3 backdrop-blur-glass shadow-glass ${className}`}
    >
      <nav aria-label="Breadcrumb" className="min-w-0">
        <ol className="flex items-center gap-1 text-small text-muted">
          <li>
            <Link to="/dashboard" className="rounded-chip px-2 py-1 hover:bg-white/60 hover:text-ink">
              Home
            </Link>
          </li>
          {segments.map((seg, idx) => {
            const href = '/' + segments.slice(0, idx + 1).join('/')
            const label = ROUTE_LABELS[seg] ?? seg
            const isLast = idx === segments.length - 1
            return (
              <li key={href} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 opacity-60" aria-hidden />
                {isLast ? (
                  <span className="rounded-chip px-2 py-1 font-medium text-ink" aria-current="page">
                    {label}
                  </span>
                ) : (
                  <Link to={href} className="rounded-chip px-2 py-1 hover:bg-white/60 hover:text-ink">
                    {label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <button
        type="button"
        onClick={onRefresh ?? (() => window.location.reload())}
        className="inline-flex items-center gap-2 rounded-pill border border-glassEdge bg-white/60 px-4 py-2 text-small font-medium text-ink transition hover:bg-white/80 hover:shadow-cardHover"
      >
        <RefreshCw className="h-4 w-4" aria-hidden />
        Refresh
      </button>
    </div>
  )
}
