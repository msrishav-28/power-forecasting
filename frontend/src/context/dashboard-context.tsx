import { createContext, startTransition, useState, type PropsWithChildren } from 'react'

import type { MetaSnapshot } from '../lib/contracts'

interface DashboardFiltersState {
  states: string[]
  voltageLevel: number | 'All'
  startDate: string
  endDate: string
}

interface DashboardContextValue {
  filters: DashboardFiltersState
  hydrateFromMeta: (meta: MetaSnapshot) => void
  setStates: (states: string[]) => void
  setVoltageLevel: (voltageLevel: number | 'All') => void
  setDateRange: (startDate: string, endDate: string) => void
  toggleState: (state: string) => void
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardFiltersProvider({ children }: PropsWithChildren) {
  const [filters, setFilters] = useState<DashboardFiltersState>({
    states: [],
    voltageLevel: 'All',
    startDate: '',
    endDate: '',
  })
  const [hydrated, setHydrated] = useState(false)

  const hydrateFromMeta = (meta: MetaSnapshot) => {
    if (hydrated) {
      return
    }
    startTransition(() => {
      setFilters({
        states: meta.filters.states,
        voltageLevel: 'All',
        startDate: meta.filters.defaultDateRange.start,
        endDate: meta.filters.defaultDateRange.end,
      })
      setHydrated(true)
    })
  }

  const value: DashboardContextValue = {
    filters,
    hydrateFromMeta,
    setStates: (states) =>
      startTransition(() => {
        setFilters((current) => ({ ...current, states }))
      }),
    setVoltageLevel: (voltageLevel) =>
      startTransition(() => {
        setFilters((current) => ({ ...current, voltageLevel }))
      }),
    setDateRange: (startDate, endDate) =>
      startTransition(() => {
        setFilters((current) => ({ ...current, startDate, endDate }))
      }),
    toggleState: (state) =>
      startTransition(() => {
        setFilters((current) => ({
          ...current,
          states: current.states.includes(state)
            ? current.states.filter((item) => item !== state)
            : [...current.states, state],
        }))
      }),
  }

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export { DashboardContext }
