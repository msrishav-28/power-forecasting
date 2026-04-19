import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { CorridorMap } from '../components/module3/CorridorMap'
import { LiveCorridorModelPanel } from '../components/module3/LiveCorridorModelPanel'
import { KpiCard } from '../components/shared/KpiCard'
import { LLMInsightPanel } from '../components/shared/LLMInsightPanel'
import { SectionCard } from '../components/shared/SectionCard'
import { useDashboardFilters } from '../hooks/use-dashboard-filters'
import { useCorridorsSnapshot } from '../hooks/use-snapshots'
import { riskTone, toDateInputValue } from '../lib/format'

export function CorridorsPage() {
  const { filters } = useDashboardFilters()
  const corridorsQuery = useCorridorsSnapshot()
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null)
  const snapshot = corridorsQuery.data

  const segments =
    snapshot?.segments.filter((segment) => {
      const matchesState =
        filters.states.length === 0 ||
        filters.states.some((state) => segment.states.toLowerCase().includes(state.toLowerCase()))
      const matchesVoltage = filters.voltageLevel === 'All' || segment.voltageKv === filters.voltageLevel
      return matchesState && matchesVoltage
    }) ?? []

  const activeSegmentId = segments.some((segment) => segment.segmentId === selectedSegmentId)
    ? selectedSegmentId
    : segments[0]?.segmentId ?? null
  const selectedSegment = segments.find((segment) => segment.segmentId === activeSegmentId) ?? segments[0]

  if (!snapshot || !selectedSegment) {
    return null
  }

  const filteredHistory = selectedSegment.history.filter((item) => {
    const date = toDateInputValue(item.month)
    return date >= filters.startDate && date <= filters.endDate
  })
  const corridorAlerts = snapshot.alerts.filter((alert) => {
    const matchesState =
      filters.states.length === 0 || filters.states.some((state) => alert.states.toLowerCase().includes(state.toLowerCase()))
    const matchesVoltage = filters.voltageLevel === 'All' || alert.voltageKv === filters.voltageLevel
    return matchesState && matchesVoltage
  })

  return (
    <div className="grid gap-5 2xl:grid-cols-[1.55fr,0.95fr]">
      <div className="space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Visible Segments" value={String(segments.length)} delta="Filtered map spans" />
          <KpiCard
            label="Active Alerts"
            value={String(corridorAlerts.length)}
            delta="High and critical risk"
            tone="signal"
          />
          <KpiCard
            label="Selected NDVI"
            value={selectedSegment.latestNdvi.toFixed(3)}
            delta={`d3m ${selectedSegment.delta3m.toFixed(3)}`}
          />
          <KpiCard
            label="Change Flag"
            value={selectedSegment.changeFlag}
            delta={`${selectedSegment.lengthKm} km segment`}
            tone={selectedSegment.changeFlag === 'Significant' ? 'signal' : 'stable'}
          />
        </section>

        <SectionCard title="Transmission corridor map" eyebrow="Interactive OSM layer">
          <CorridorMap segments={segments} selectedSegmentId={activeSegmentId} onSelect={setSelectedSegmentId} />
        </SectionCard>

        <div className="grid gap-5 xl:grid-cols-2">
          <SectionCard title={`${selectedSegment.segmentId} NDVI history`} eyebrow="Selected segment">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="ndvi" stroke="#0f766e" strokeWidth={3} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Three-month vegetation forecast" eyebrow="Prophet-ready trend">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedSegment.forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="upperNdvi" fill="#fecaca" stroke="none" />
                  <Area type="monotone" dataKey="lowerNdvi" fill="#eff6ff" stroke="none" />
                  <Line type="monotone" dataKey="forecastNdvi" stroke="#ff6b35" strokeWidth={3} dot />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Encroachment alerts" eyebrow="Action queue">
          <div className="space-y-3">
            {corridorAlerts.map((alert) => (
              <div key={alert.segmentId} className="rounded-[22px] bg-recessed/70 p-4 shadow-insetSoft">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">{alert.segmentId}</p>
                    <p className="mt-1 text-sm text-muted">
                      {alert.states} · {alert.voltageKv} kV
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${riskTone(alert.riskLabel)}`}>
                    {alert.riskLabel}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-ink">
                  <span>NDVI {alert.latestNdvi.toFixed(3)} · d3m {alert.delta3m.toFixed(3)}</span>
                  <span>{alert.recommendedAction}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="space-y-4">
        <LiveCorridorModelPanel segment={selectedSegment} />
        <LLMInsightPanel
          scope="corridor"
          title="Vegetation advisory"
          prompt="Summarize the corridor vegetation risk, change signal, and the most urgent field action."
          context={{
            segmentId: selectedSegment.segmentId,
            states: selectedSegment.states,
            voltageKv: selectedSegment.voltageKv,
            latestNdvi: selectedSegment.latestNdvi,
            delta3m: selectedSegment.delta3m,
            delta6m: selectedSegment.delta6m,
            riskLabel: selectedSegment.riskLabel,
            changeFlag: selectedSegment.changeFlag,
          }}
        />
      </div>
    </div>
  )
}
