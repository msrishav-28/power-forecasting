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

import { AssetSelector } from '../components/module1/AssetSelector'
import { LiveAssetModelPanel } from '../components/module1/LiveAssetModelPanel'
import { KpiCard } from '../components/shared/KpiCard'
import { LLMInsightPanel } from '../components/shared/LLMInsightPanel'
import { SectionCard } from '../components/shared/SectionCard'
import { useDashboardFilters } from '../hooks/use-dashboard-filters'
import { useAssetsSnapshot } from '../hooks/use-snapshots'
import { formatNumber, riskTone, toDateInputValue } from '../lib/format'

export function AssetsPage() {
  const { filters } = useDashboardFilters()
  const assetsQuery = useAssetsSnapshot()
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
    <div className="grid gap-5 2xl:grid-cols-[320px,1.55fr,0.95fr]">
      <AssetSelector
        assets={filteredAssets}
        search={search}
        onSearchChange={setSearch}
        selectedAssetId={activeAssetId}
        onSelect={setSelectedAssetId}
      />

      <div className="space-y-5">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
        </section>

        <SectionCard title={`${selectedAsset.assetId} asset profile`} eyebrow="Transformer focus">
          <div className="grid gap-5 xl:grid-cols-[1.25fr,0.9fr]">
            <div className="rounded-[26px] bg-grid p-5 shadow-insetSoft">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">Health Trend</p>
              <div className="mt-4 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={healthHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[20, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#0f766e" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="overflow-hidden rounded-[26px]">
              <img
                src="https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=1200&q=80"
                alt="Electrical transformer and substation equipment"
                className="h-full min-h-[320px] w-full object-cover"
              />
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[22px] bg-recessed/70 p-4 shadow-insetSoft">
              <p className="text-sm text-muted">Substation</p>
              <p className="mt-2 font-semibold text-ink">{selectedAsset.substation}</p>
            </div>
            <div className="rounded-[22px] bg-recessed/70 p-4 shadow-insetSoft">
              <p className="text-sm text-muted">Manufacturer</p>
              <p className="mt-2 font-semibold text-ink">{selectedAsset.manufacturer}</p>
            </div>
            <div className="rounded-[22px] bg-recessed/70 p-4 shadow-insetSoft">
              <p className="text-sm text-muted">Capacity</p>
              <p className="mt-2 font-semibold text-ink">{selectedAsset.capacityMva} MVA</p>
            </div>
            <div className="rounded-[22px] bg-recessed/70 p-4 shadow-insetSoft">
              <p className="text-sm text-muted">Status</p>
              <p className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${riskTone(selectedAsset.status)}`}>
                {selectedAsset.status}
              </p>
            </div>
          </div>
        </SectionCard>

        <div className="grid gap-5 xl:grid-cols-2">
          <SectionCard title="Thermal and load stress" eyebrow="Last 7 days">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sensorHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="oil_temp" stroke="#ff6b35" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="winding_temp" stroke="#0f766e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="load_pct" stroke="#1d4ed8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="DGA warning trend" eyebrow="Last 30 days">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gasHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                  <XAxis dataKey="timestamp" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="h2_ppm" fill="#f97316" stroke="#f97316" fillOpacity={0.26} />
                  <Area type="monotone" dataKey="ch4_ppm" fill="#1d4ed8" stroke="#1d4ed8" fillOpacity={0.18} />
                  <Area type="monotone" dataKey="co_ppm" fill="#0f766e" stroke="#0f766e" fillOpacity={0.18} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Anomaly drivers" eyebrow="Explainer">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={selectedAsset.anomaly.drivers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                <XAxis dataKey="feature" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="score" fill="#ff6b35" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="space-y-4">
        <LiveAssetModelPanel asset={selectedAsset} />
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
      </div>
    </div>
  )
}
