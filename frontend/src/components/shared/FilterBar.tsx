import type { MetaSnapshot } from '../../lib/contracts'
import { useDashboardFilters } from '../../hooks/use-dashboard-filters'
import { toDateInputValue } from '../../lib/format'

export function FilterBar({ meta }: { meta: MetaSnapshot }) {
  const { filters, setDateRange, setVoltageLevel, toggleState } = useDashboardFilters()

  return (
    <section className="rounded-panel border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-stretch gap-3">
          <span aria-hidden className="w-[3px] rounded-pill bg-slate-800" />
          <div>
            <p className="font-mono text-eyebrow uppercase text-slate-500">Global Scope</p>
            <h3 className="mt-1 text-base font-semibold text-ink">Dashboard-wide filter parameters</h3>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label className="space-y-2">
            <span className="text-small font-medium text-ink">Start date</span>
            <input
              type="date"
              value={toDateInputValue(filters.startDate)}
              onChange={(event) => setDateRange(event.target.value, filters.endDate)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus-visible:border-slate-400"
            />
          </label>
          <label className="space-y-2">
            <span className="text-small font-medium text-ink">End date</span>
            <input
              type="date"
              value={toDateInputValue(filters.endDate)}
              min={toDateInputValue(filters.startDate)}
              onChange={(event) => setDateRange(filters.startDate, event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus-visible:border-slate-400"
            />
          </label>
          <label className="space-y-2">
            <span className="text-small font-medium text-ink">Voltage</span>
            <select
              value={String(filters.voltageLevel)}
              onChange={(event) => {
                const value = event.target.value
                setVoltageLevel(value === 'All' ? 'All' : Number(value))
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-ink outline-none focus-visible:border-slate-400"
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
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active ? 'border-ink bg-ink text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
