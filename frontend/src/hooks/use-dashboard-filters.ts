import { useContext } from 'react'

import { DashboardContext } from '../context/dashboard-context'

export function useDashboardFilters() {
  const context = useContext(DashboardContext)
  if (!context) {
    throw new Error('useDashboardFilters must be used within DashboardFiltersProvider')
  }
  return context
}
