import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'

import { FilterBar } from '../components/shared/FilterBar'
import { Sidebar } from '../components/shared/Sidebar'
import { Topbar } from '../components/shared/Topbar'
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
        <div className="rounded-[30px] bg-panel/90 px-8 py-6 text-center shadow-panel">
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-muted">Booting Dashboard</p>
          <h1 className="mt-3 text-2xl font-semibold text-ink">Loading snapshot contracts...</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-4 lg:px-5">
      <div className="mx-auto flex max-w-[1880px] flex-col gap-5 xl:flex-row">
        <Sidebar meta={metaQuery.data} />
        <main className="min-w-0 flex-1 space-y-5">
          <Topbar meta={metaQuery.data} />
          <FilterBar meta={metaQuery.data} />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
