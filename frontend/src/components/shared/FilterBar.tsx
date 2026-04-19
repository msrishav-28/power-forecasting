import type { MetaSnapshot } from '../../lib/contracts'
import { useDashboardFilters } from '../../hooks/use-dashboard-filters'
import { toDateInputValue } from '../../lib/format'

export function FilterBar({ meta }: { meta: MetaSnapshot }) {
  const { filters, setDateRange, setVoltageLevel, toggleState } = useDashboardFilters()

  return (
    <section className="rounded-[30px] border border-white/70 bg-panel/90 p-5 shadow-panel">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-muted">Global Filters</p>
          <h3 className="mt-2 text-lg font-semibold text-ink">Keep all views aligned to the same operating slice</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">Start date</span>
            <input
              type="date"
              value={toDateInputValue(filters.startDate)}
              onChange={(event) => setDateRange(event.target.value, filters.endDate)}
              className="w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-ink outline-none ring-0"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">End date</span>
            <input
              type="date"
              value={toDateInputValue(filters.endDate)}
              min={toDateInputValue(filters.startDate)}
              onChange={(event) => setDateRange(filters.startDate, event.target.value)}
              className="w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-ink outline-none ring-0"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-ink">Voltage</span>
            <select
              value={String(filters.voltageLevel)}
              onChange={(event) => {
                const value = event.target.value
                setVoltageLevel(value === 'All' ? 'All' : Number(value))
              }}
              className="w-full rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-ink outline-none ring-0"
            >
              <option value="All">All levels</option>
              {meta.filters.voltageLevels.map((voltage) => (
                <option key={voltage} value={voltage}>
                  {voltage} kV
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        {meta.filters.states.map((state) => {
          const active = filters.states.includes(state)
          return (
            <button
              key={state}
              type="button"
              onClick={() => toggleState(state)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                active ? 'bg-ink text-white shadow-lg' : 'bg-recessed/70 text-ink hover:bg-white/90'
              }`}
            >
              {state}
            </button>
          )
        })}
      </div>
    </section>
  )
}
