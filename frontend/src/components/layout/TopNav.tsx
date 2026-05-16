import { Waves } from 'lucide-react'
import type { ReactNode } from 'react'

import type { MetaSnapshot } from '../../lib/contracts'

interface TopNavProps {
  meta: MetaSnapshot
  /** Slot for hamburger button on mobile (rendered to the left of the brand). */
  leading?: ReactNode
}

/**
 * TopNav — persistent top navigation bar.
 *
 * Composition:
 *   [hamburger (mobile)]  [brand mark + title]                  [region badge]
 *
 * Primary navigation lives in the Sidebar on desktop and inside the mobile
 * drawer below `lg:` — so this bar stays clean. Glass surface, sticky.
 */
export function TopNav({ meta, leading }: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-glassEdge bg-panel/70 backdrop-blur-glass shadow-glass">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {leading}
          <span
            aria-hidden
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-glass"
          >
            <Waves className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-mono text-eyebrow uppercase text-muted">POWERGRID</p>
            <p className="truncate text-h3 font-semibold leading-none text-ink">ER-I Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-pill border border-glassEdge bg-white/50 px-3 py-1.5 font-mono text-eyebrow uppercase text-muted sm:inline-flex">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {meta.app.region}
          </span>
        </div>
      </div>
    </header>
  )
}
