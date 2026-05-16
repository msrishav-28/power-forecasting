import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { ChartGradients, GlassTooltip } from '../components/charts/ChartComponents'
import { areaGradientIds, chartAxis, chartGrid, chartPalette } from '../components/charts/ChartTheme'
import { BentoCell } from '../components/layout/BentoCell'
import { BentoGrid } from '../components/layout/BentoGrid'
import { PageHeader } from '../components/layout/PageHeader'
import { RightRail } from '../components/layout/RightRail'
import { CorridorMap } from '../components/module3/CorridorMap'
import { LiveCorridorModelPanel } from '../components/module3/LiveCorridorModelPanel'
import { KpiCard } from '../components/shared/KpiCard'
import { LLMInsightPanel } from '../components/shared/LLMInsightPanel'
import { SectionCard } from '../components/shared/SectionCard'
import { useDashboardFilters } from '../hooks/use-dashboard-filters'
import { useCorridorsSnapshot, useMetaSnapshot } from '../hooks/use-snapshots'
import { riskTone, toDateInputValue } from '../lib/format'

export function CorridorsPage() {
  const { filters } = useDashboardFilters()
  const corridorsQuery = useCorridorsSnapshot()
  const metaQuery = useMetaSnapshot()
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
    <div className="space-y-gutter">
      <PageHeader
        eyebrow="Module 03 · Corridor surveillance"
        title="Corridor Monitor"
        subtitle="Right-of-way vegetation risk, NDVI history, and three-month forecasts for transmission corridors."
        lastUpdated={metaQuery.data?.generatedAt}
      />

      <BentoGrid columns={{ base: 1, sm: 2, lg: 4 }}>
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
      </BentoGrid>

      <BentoGrid columns={{ base: 1, xl: 12 }}>
        <BentoCell colSpan={{ base: 1, xl: 9 }}>
          <SectionCard title="Transmission corridor map" eyebrow="Interactive OSM layer">
            <CorridorMap segments={segments} selectedSegmentId={activeSegmentId} onSelect={setSelectedSegmentId} />
          </SectionCard>
        </BentoCell>

        <BentoCell colSpan={{ base: 1, xl: 3 }}>
          <RightRail
            predictions={<LiveCorridorModelPanel segment={selectedSegment} />}
            copilot={
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
            }
          />
        </BentoCell>
      </BentoGrid>

      <BentoGrid columns={{ base: 1, xl: 2 }}>
        <SectionCard title={`${selectedSegment.segmentId} NDVI history`} eyebrow="Selected segment">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredHistory}>
                <CartesianGrid {...chartGrid} />
                <XAxis dataKey="month" {...chartAxis} />
                <YAxis domain={[0, 1]} {...chartAxis} />
                <Tooltip content={<GlassTooltip />} />
                <Line type="monotone" dataKey="ndvi" stroke={chartPalette.secondary} strokeWidth={2.5} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Three-month vegetation forecast" eyebrow="Prophet-ready trend">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={selectedSegment.forecast}>
                <ChartGradients />
                <CartesianGrid {...chartGrid} />
                <XAxis dataKey="month" {...chartAxis} />
                <YAxis domain={[0, 1]} {...chartAxis} />
                <Tooltip content={<GlassTooltip />} />
                <Area type="monotone" dataKey="upperNdvi" fill={`url(#${areaGradientIds.warn})`} stroke="none" />
                <Area type="monotone" dataKey="lowerNdvi" fill={`url(#${areaGradientIds.primary})`} stroke="none" />
                <Line type="monotone" dataKey="forecastNdvi" stroke={chartPalette.warn} strokeWidth={2.5} dot />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </BentoGrid>

      <SectionCard title="Encroachment alerts" eyebrow="Action queue">
        <div className="space-y-3">
          {corridorAlerts.map((alert) => (
            <div key={alert.segmentId} className="rounded-card bg-recessed/70 p-4 shadow-insetSoft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-ink">{alert.segmentId}</p>
                  <p className="mt-1 text-small text-muted">
                    {alert.states} · {alert.voltageKv} kV
                  </p>
                </div>
                <span className={`rounded-pill px-3 py-1 text-eyebrow font-medium ${riskTone(alert.riskLabel)}`}>
                  {alert.riskLabel}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-small text-ink">
                <span>NDVI {alert.latestNdvi.toFixed(3)} · d3m {alert.delta3m.toFixed(3)}</span>
                <span>{alert.recommendedAction}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
