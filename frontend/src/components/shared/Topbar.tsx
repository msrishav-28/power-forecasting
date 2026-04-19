import { Badge } from '@tremor/react'

import type { MetaSnapshot } from '../../lib/contracts'
import { formatDateTime } from '../../lib/format'

export function Topbar({ meta }: { meta: MetaSnapshot }) {
  return (
    <header className="grid gap-5 rounded-[34px] border border-white/70 bg-panel/90 p-5 shadow-panel lg:grid-cols-[1.6fr,0.9fr]">
      <div className="rounded-[28px] bg-grid p-6 shadow-insetSoft">
        <p className="font-mono text-xs uppercase tracking-[0.34em] text-muted">Mission Status</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight text-ink">{meta.app.title}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">
          React + Vite on Vercel, FastAPI on Render, static snapshots for resilient startup, and live API calls only
          when the operator explicitly asks for predictions or AI support.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge className="border-0 bg-slate-100 px-3 py-1 text-slate-700">{meta.app.frontend}</Badge>
          <Badge className="border-0 bg-slate-100 px-3 py-1 text-slate-700">{meta.app.backend}</Badge>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[28px]">
        <img
          src="https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80"
          alt="Transmission infrastructure and energy landscape"
          className="h-full min-h-[220px] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-white/75">Snapshot Ready</p>
          <p className="mt-2 text-sm leading-6 text-white/90">Last refresh: {formatDateTime(meta.generatedAt)}</p>
          <p className="mt-1 text-sm leading-6 text-white/75">{meta.app.deployment}</p>
        </div>
      </div>
    </header>
  )
}
