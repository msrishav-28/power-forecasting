import { Badge } from '@tremor/react'
import { Activity, BrainCircuit, Satellite, Waves, Zap } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import type { MetaSnapshot } from '../../lib/contracts'
import { formatCompact } from '../../lib/format'

const navItems = [
  { to: '/dashboard/assets', label: 'Asset Health', icon: BrainCircuit },
  { to: '/dashboard/grid', label: 'Grid Operations', icon: Zap },
  { to: '/dashboard/corridors', label: 'Corridor Monitor', icon: Satellite },
]

export function Sidebar({ meta }: { meta: MetaSnapshot }) {
  return (
    <aside className="flex w-full max-w-[290px] flex-col gap-6 rounded-[34px] border border-white/70 bg-panel/90 p-6 shadow-panel">
      <div className="rounded-[26px] bg-grid p-5 shadow-insetSoft">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-panel shadow-panel">
            <Waves className="h-6 w-6" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.32em] text-muted">POWERGRID</p>
            <h1 className="text-xl font-semibold text-ink">ER-I Intelligence</h1>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">
          Control-room dashboard for predictive maintenance, grid operations, and corridor risk surveillance.
        </p>
      </div>

      <nav className="space-y-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-2xl px-4 py-3 transition ${
                isActive ? 'bg-ink text-white shadow-lg' : 'bg-recessed/50 text-ink hover:bg-white/70'
              }`
            }
          >
            <span className="flex items-center gap-3">
              <Icon className="h-5 w-5" />
              {label}
            </span>
            <Activity className="h-4 w-4 opacity-70" />
          </NavLink>
        ))}
      </nav>

      <div className="rounded-[24px] bg-recessed/70 p-5 shadow-insetSoft">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">Situation Board</p>
        <div className="mt-4 space-y-3 text-sm text-ink">
          <div className="flex items-center justify-between">
            <span>Assets</span>
            <strong>{formatCompact(meta.overview.assetCount)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Critical Assets</span>
            <strong>{meta.overview.criticalAssets}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>High-Risk Corridors</span>
            <strong>{meta.overview.highRiskCorridors}</strong>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="border-0 bg-orange-100 px-3 py-1 text-orange-700">{meta.app.llm}</Badge>
          <Badge className="border-0 bg-sky-100 px-3 py-1 text-sky-700">{meta.app.database}</Badge>
        </div>
      </div>
    </aside>
  )
}
