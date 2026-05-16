import { useDeferredValue, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartGradients, GlassTooltip } from '../components/charts/ChartComponents'
import { areaGradientIds, chartAxis, chartGrid, chartPalette } from '../components/charts/ChartTheme'
import { BentoCell } from '../components/layout/BentoCell'
import { BentoGrid } from '../components/layout/BentoGrid'
import { PageHeader } from '../components/layout/PageHeader'
import { RightRail } from '../components/layout/RightRail'
import { AssetSelector } from '../components/module1/AssetSelector'
import { LiveAssetModelPanel } from '../components/module1/LiveAssetModelPanel'
import { KpiCard } from '../components/shared/KpiCard'
import { LLMInsightPanel } from '../components/shared/LLMInsightPanel'
import { SectionCard } from '../components/shared/SectionCard'
import { useDashboardFilters } from '../hooks/use-dashboard-filters'
import { useAssetsSnapshot, useMetaSnapshot } from '../hooks/use-snapshots'
import { formatNumber, riskTone, toDateInputValue } from '../lib/format'

export function AssetsPage() {
  const { filters } = useDashboardFilters()
  const assetsQuery = useAssetsSnapshot()
  const metaQuery = useMetaSnapshot()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)

  const allAssets = assetsQuery.data?.assets ?? []
  const filteredAssets = allAssets.filter((asset) => {
    const matchesState = filters.states.length === 0 || filters.states.includes(asset.state)
    const matchesVoltage = filters.voltageLevel === 'All' || asset.voltageKv === filters.voltageLevel
    const query = deferredSearch.trim().toLowerCase()
    const matchesSearch =
      query.length === 0 ||
      asset.assetId.toLowerCase().includes(query) ||
      asset.substation.toLowerCase().includes(query) ||
      asset.state.toLowerCase().includes(query)
    return matchesState && matchesVoltage && matchesSearch
  })

  const activeAssetId = filteredAssets.some((asset) => asset.assetId === selectedAssetId)
    ? selectedAssetId
    : filteredAssets[0]?.assetId ?? null
  const selectedAsset = filteredAssets.find((asset) => asset.assetId === activeAssetId) ?? filteredAssets[0]

  if (!assetsQuery.data || !selectedAsset) {
    return null
  }

  const healthHistory = selectedAsset.history.filter((item) => {
    const date = toDateInputValue(item.date)
    return date >= filters.startDate && date <= filters.endDate
  })
  const sensorHistory = selectedAsset.sensors7d.filter((item) => {
    const date = toDateInputValue(item.timestamp)
    return date >= filters.startDate && date <= filters.endDate
  })
  const gasHistory = selectedAsset.gases30d.filter((item) => {
    const date = toDateInputValue(item.timestamp)
    return date >= filters.startDate && date <= filters.endDate
  })

  return (
    <div className="space-y-gutter">
      <PageHeader
        eyebrow="Module 01 · Predictive maintenance"
        title="Asset Health"
        subtitle="Transformer fleet condition, RUL forecasts, anomaly drivers, and field-ready advisories."
        lastUpdated={metaQuery.data?.generatedAt}
      />

      <BentoGrid columns={{ base: 1, sm: 2, lg: 4 }}>
        <KpiCard
          label="Health Index"
          value={`${selectedAsset.healthIndex}/100`}
          delta={`${selectedAsset.healthDelta30d} vs 30d`}
          tone="signal"
        />
        <KpiCard
          label="Estimated RUL"
          value={`${Math.round(selectedAsset.rulDays)} days`}
          delta={`${selectedAsset.rulBand.low}-${selectedAsset.rulBand.high} day band`}
        />
        <KpiCard
          label="Anomaly Score"
          value={selectedAsset.anomaly.score.toFixed(2)}
          delta={`Threshold ${selectedAsset.anomaly.threshold}`}
          tone={selectedAsset.anomaly.isDetected ? 'signal' : 'stable'}
        />
        <KpiCard
          label="Latest Load"
          value={formatNumber(selectedAsset.latestReadings.loadPct || 0, '%')}
          delta={`${selectedAsset.voltageKv} kV class`}
        />
      </BentoGrid>

      <BentoGrid columns={{ base: 1, lg: 12 }}>
        <BentoCell colSpan={{ base: 1, lg: 4, xl: 3 }}>
          <AssetSelector
            assets={filteredAssets}
            search={search}
            onSearchChange={setSearch}
            selectedAssetId={activeAssetId}
            onSelect={setSelectedAssetId}
          />
        </BentoCell>

        <BentoCell colSpan={{ base: 1, lg: 8, xl: 6 }}>
          <SectionCard title={`${selectedAsset.assetId} asset profile`} eyebrow="Transformer focus">
            <div className="grid gap-5">
              <div className="rounded-[26px] border border-slate-100 bg-slate-50 p-5">
                <p className="font-mono text-eyebrow uppercase text-muted">Health Trend</p>
                <div className="mt-4 h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={healthHistory}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" {...chartAxis} />
                      <YAxis domain={[20, 100]} {...chartAxis} />
                      <Tooltip content={<GlassTooltip />} />
                      <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-card border border-slate-100 bg-slate-50 p-4">
                <p className="text-small text-muted">Substation</p>
                <p className="mt-2 font-semibold text-ink">{selectedAsset.substation}</p>
              </div>
              <div className="rounded-card border border-slate-100 bg-slate-50 p-4">
                <p className="text-small text-muted">Manufacturer</p>
                <p className="mt-2 font-semibold text-ink">{selectedAsset.manufacturer}</p>
              </div>
              <div className="rounded-card border border-slate-100 bg-slate-50 p-4">
                <p className="text-small text-muted">Capacity</p>
                <p className="mt-2 font-semibold text-ink">{selectedAsset.capacityMva} MVA</p>
              </div>
              <div className="rounded-card border border-slate-100 bg-slate-50 p-4">
                <p className="text-small text-muted">Status</p>
                <p className={`mt-2 inline-flex rounded-pill px-3 py-1 text-small font-semibold ${riskTone(selectedAsset.status)}`}>
                  {selectedAsset.status}
                </p>
              </div>
            </div>
          </SectionCard>
        </BentoCell>

        <BentoCell colSpan={{ base: 1, lg: 12, xl: 3 }}>
          <RightRail
            predictions={<LiveAssetModelPanel asset={selectedAsset} />}
            copilot={
              <LLMInsightPanel
                scope="asset"
                title="Asset advisory"
                prompt="Given the transformer health, anomaly score, gas trend, and RUL, produce a field maintenance advisory."
                context={{
                  assetId: selectedAsset.assetId,
                  substation: selectedAsset.substation,
                  state: selectedAsset.state,
                  healthIndex: selectedAsset.healthIndex,
                  rulDays: selectedAsset.rulDays,
                  anomalyScore: selectedAsset.anomaly.score,
                  latestReadings: selectedAsset.latestReadings,
                }}
              />
            }
          />
        </BentoCell>
      </BentoGrid>

      <BentoGrid columns={{ base: 1, xl: 2 }}>
        <SectionCard title="Thermal and load stress" eyebrow="Last 7 days">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorHistory}>
                <CartesianGrid {...chartGrid} />
                <XAxis dataKey="timestamp" {...chartAxis} />
                <YAxis {...chartAxis} />
                <Tooltip content={<GlassTooltip />} />
                <Line type="monotone" dataKey="oil_temp" stroke={chartPalette.warn} strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="winding_temp" stroke={chartPalette.secondary} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="load_pct" stroke={chartPalette.primary} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="DGA warning trend" eyebrow="Last 30 days">
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gasHistory}>
                <ChartGradients />
                <CartesianGrid {...chartGrid} />
                <XAxis dataKey="timestamp" {...chartAxis} />
                <YAxis {...chartAxis} />
                <Tooltip content={<GlassTooltip />} />
                <Area type="monotone" dataKey="h2_ppm" stroke={chartPalette.warn} fill={`url(#${areaGradientIds.warn})`} />
                <Area type="monotone" dataKey="ch4_ppm" stroke={chartPalette.primary} fill={`url(#${areaGradientIds.primary})`} />
                <Area type="monotone" dataKey="co_ppm" stroke={chartPalette.secondary} fill={`url(#${areaGradientIds.secondary})`} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </BentoGrid>

      <SectionCard title="Anomaly drivers" eyebrow="Explainer">
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={selectedAsset.anomaly.drivers}>
              <CartesianGrid {...chartGrid} />
              <XAxis dataKey="feature" {...chartAxis} />
              <YAxis {...chartAxis} />
              <Tooltip content={<GlassTooltip />} />
              <Bar dataKey="score" fill={chartPalette.warn} radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
    </div>
  )
}
