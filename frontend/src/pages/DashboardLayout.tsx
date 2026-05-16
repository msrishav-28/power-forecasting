import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { MobileNav } from '../components/layout/MobileNav'
import { Toolbar } from '../components/layout/Toolbar'
import { TopNav } from '../components/layout/TopNav'
import { FilterBar } from '../components/shared/FilterBar'
import { Sidebar } from '../components/shared/Sidebar'
import { useDashboardFilters } from '../hooks/use-dashboard-filters'
import { useMetaSnapshot } from '../hooks/use-snapshots'

export function DashboardLayout() {
  const metaQuery = useMetaSnapshot()
  const { hydrateFromMeta } = useDashboardFilters()

  useEffect(() => {
    if (metaQuery.data) {
      hydrateFromMeta(metaQuery.data)
    }
  }, [hydrateFromMeta, metaQuery.data])

  if (metaQuery.isLoading || !metaQuery.data) {
    return (
      <div className="grid min-h-screen place-items-center px-6">
        <div className="rounded-panel border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
          <p className="font-mono text-eyebrow uppercase text-muted">Booting Dashboard</p>
          <h1 className="mt-3 text-h2 font-semibold text-ink">Loading snapshot contracts...</h1>
        </div>
      </div>
    )
  }

  const meta = metaQuery.data

  return (
    <div className="min-h-screen">
      <TopNav
        meta={meta}
        leading={
          <MobileNav>
            {(close) => <Sidebar meta={meta} onNavigate={close} />}
          </MobileNav>
        }
      />
      <div className="mx-auto flex max-w-content gap-gutter px-4 py-gutter sm:px-6 lg:px-8 xl:gap-gutter-lg">
        <Sidebar meta={meta} className="hidden shrink-0 lg:flex" />
        <main className="min-w-0 flex-1 space-y-gutter">
          <Toolbar />
          <FilterBar meta={meta} />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
