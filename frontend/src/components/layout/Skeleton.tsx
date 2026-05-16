import type { CSSProperties } from 'react'

type SkeletonVariant = 'line' | 'block' | 'kpi' | 'chart' | 'map' | 'page'

interface SkeletonProps {
  variant?: SkeletonVariant
  className?: string
  style?: CSSProperties
}

const shimmerBg =
  'bg-[linear-gradient(110deg,rgba(255,255,255,0.4)_0%,rgba(255,255,255,0.85)_45%,rgba(255,255,255,0.4)_70%)] bg-[length:200%_100%] animate-shimmer'

export function Skeleton({ variant = 'line', className = '', style }: SkeletonProps) {
  if (variant === 'kpi') {
    return (
      <div
        className={`rounded-card bg-panel/70 backdrop-blur-glass border border-glassEdge p-pane shadow-glass ${className}`}
        style={style}
      >
        <div className={`h-3 w-24 rounded-pill ${shimmerBg}`} />
        <div className={`mt-4 h-9 w-32 rounded-chip ${shimmerBg}`} />
        <div className={`mt-4 h-5 w-20 rounded-pill ${shimmerBg}`} />
      </div>
    )
  }

  if (variant === 'chart') {
    return (
      <div
        className={`rounded-panel bg-panel/70 backdrop-blur-glass border border-glassEdge p-pane shadow-glass ${className}`}
        style={style}
      >
        <div className={`h-3 w-32 rounded-pill ${shimmerBg}`} />
        <div className={`mt-3 h-5 w-48 rounded-chip ${shimmerBg}`} />
        <div className={`mt-6 h-[260px] w-full rounded-chip ${shimmerBg}`} />
      </div>
    )
  }

  if (variant === 'map') {
    return (
      <div
        className={`rounded-panel bg-panel/70 backdrop-blur-glass border border-glassEdge p-pane shadow-glass ${className}`}
        style={style}
      >
        <div className={`h-3 w-28 rounded-pill ${shimmerBg}`} />
        <div className={`mt-3 h-5 w-44 rounded-chip ${shimmerBg}`} />
        <div className={`mt-6 h-[480px] w-full rounded-chip ${shimmerBg}`} />
      </div>
    )
  }

  if (variant === 'page') {
    return (
      <div className={`space-y-gutter ${className}`}>
        <div className="space-y-3">
          <div className={`h-3 w-32 rounded-pill ${shimmerBg}`} />
          <div className={`h-10 w-72 rounded-chip ${shimmerBg}`} />
          <div className={`h-4 w-96 max-w-full rounded-pill ${shimmerBg}`} />
        </div>
        <div className="grid gap-gutter sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton variant="kpi" />
          <Skeleton variant="kpi" />
          <Skeleton variant="kpi" />
          <Skeleton variant="kpi" />
        </div>
        <Skeleton variant="chart" />
      </div>
    )
  }

  if (variant === 'block') {
    return <div className={`rounded-chip ${shimmerBg} ${className}`} style={style} />
  }

  return <div className={`h-3 rounded-pill ${shimmerBg} ${className}`} style={style} />
}
