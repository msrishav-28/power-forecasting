import type { GridSnapshot } from '../../lib/contracts'
import { formatDateTime, riskTone } from '../../lib/format'

export function OutageFeed({ items }: { items: GridSnapshot['outageFeed'] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={`${item.lineId}-${item.timestamp}`} className="rounded-[22px] bg-recessed/70 p-4 shadow-insetSoft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-ink">{item.lineId}</p>
              <p className="mt-1 text-sm text-muted">
                {item.state} · {item.voltageKv} kV · {formatDateTime(item.timestamp)}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${riskTone(item.rootCause)}`}>{item.rootCause}</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-ink">
            <span>{item.durationHours} h duration</span>
            <span>{Math.round(item.confidence * 100)}% confidence</span>
          </div>
        </div>
      ))}
    </div>
  )
}
