
import { Activity, BrainCircuit, Satellite, Waves, Zap } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import type { MetaSnapshot } from '../../lib/contracts'
import { formatCompact } from '../../lib/format'

const navItems = [
  { to: '/dashboard', label: 'Overview', icon: Waves, end: true },
  { to: '/dashboard/assets', label: 'Asset Health', icon: BrainCircuit },
  { to: '/dashboard/grid', label: 'Grid Operations', icon: Zap },
  { to: '/dashboard/corridors', label: 'Corridor Monitor', icon: Satellite },
]

interface SidebarProps {
  meta: MetaSnapshot
  /** Optional className appended to the root <aside> (used to hide on mobile). */
  className?: string
  /** Called whenever a nav link is clicked (used by the mobile drawer to close). */
  onNavigate?: () => void
}

export function Sidebar({ meta, className = '', onNavigate }: SidebarProps) {
  return (
    <aside
      aria-label="Primary navigation"
      className={`flex w-full max-w-[290px] flex-col gap-6 rounded-rail border border-slate-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="rounded-[26px] border border-slate-100 bg-slate-50 p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-white shadow-glass">
            <Waves className="h-6 w-6" />
          </div>
          <div>
            <p className="font-mono text-eyebrow uppercase text-muted">POWERGRID</p>
            <h1 className="text-h3 font-semibold text-ink">ER-I Intelligence</h1>
          </div>
        </div>
        <p className="mt-4 text-small leading-6 text-muted">
          Control-room dashboard for predictive maintenance, grid operations, and corridor risk surveillance.
        </p>
      </div>

      <nav className="space-y-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-2xl px-4 py-3 transition ${
                isActive
                  ? 'bg-ink text-white shadow-sm'
                  : 'bg-slate-50 text-ink hover:bg-slate-100'
              }`
            }
          >
            <span className="flex items-center gap-3">
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </span>
            <Activity className="h-4 w-4 opacity-70" aria-hidden />
          </NavLink>
        ))}
      </nav>

      <div className="rounded-card border border-slate-100 bg-slate-50 p-5">
        <p className="font-mono text-eyebrow uppercase text-muted">Situation Board</p>
        <div className="mt-4 space-y-3 text-small text-ink">
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
      </div>
    </aside>
  )
}
