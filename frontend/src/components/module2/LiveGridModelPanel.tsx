import { useMutation } from '@tanstack/react-query'
import { Button } from '@tremor/react'
import { AlertTriangle, LoaderCircle, Radar } from 'lucide-react'
import { useState } from 'react'

import { apiClient } from '../../api/client'
import type { GridSnapshot, LoadForecastResponse, OutageCauseResponse } from '../../lib/contracts'
import { formatDateTime, formatNumber, riskTone } from '../../lib/format'
import { SectionCard } from '../shared/SectionCard'

export function LiveGridModelPanel({ grid }: { grid: GridSnapshot }) {
  const [lineAgeYears, setLineAgeYears] = useState(12)
  const [loadPct, setLoadPct] = useState(82)
  const [voltageKv, setVoltageKv] = useState(400)

  const scenarioDate = new Date()
  const scenarioMonth = scenarioDate.getMonth() + 1
  const scenarioHour = scenarioDate.getHours()

  const forecastMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.get<LoadForecastResponse>('/api/forecast/load', {
        params: { region: 'ER-I', horizon: 7 },
      })
      return response.data
    },
  })

  const outageMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<OutageCauseResponse>('/api/predict/outage-cause', {
        hour_of_day: scenarioHour,
        month: scenarioMonth,
        wind_speed: grid.weather.windSpeedMs,
        rainfall_mm: grid.weather.rainfallMm,
        temperature: grid.weather.temperatureC,
        load_pct: loadPct,
        line_age_years: lineAgeYears,
        voltage_kv: voltageKv,
      })
      return response.data
    },
  })

  const topForecastDay = forecastMutation.data?.forecast
    .slice()
    .sort((left, right) => right.forecastMw - left.forecastMw)[0]

  return (
    <SectionCard title="Live grid models" eyebrow="Backend actions">
      <p className="text-sm leading-7 text-muted">
        Trigger the backend forecast service or classify an outage scenario using the current weather snapshot and your
        chosen line conditions.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Button
          className="rounded-2xl border-0 bg-ink px-4 py-3 text-white hover:bg-slate-800"
          loading={forecastMutation.isPending}
          icon={Radar}
          onClick={() => forecastMutation.mutate()}
        >
          Refresh 7-day forecast
        </Button>
        <Button
          className="rounded-2xl border-0 bg-signal px-4 py-3 text-white hover:bg-signalDeep"
          loading={outageMutation.isPending}
          icon={AlertTriangle}
          onClick={() => outageMutation.mutate()}
        >
          Classify outage scenario
        </Button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium text-ink">Scenario load %</span>
          <input
            type="number"
            min={10}
            max={130}
            value={loadPct}
            onChange={(event) => setLoadPct(Number(event.target.value))}
            className="w-full rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-ink outline-none"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-ink">Line age (years)</span>
          <input
            type="number"
            min={1}
            max={60}
            value={lineAgeYears}
            onChange={(event) => setLineAgeYears(Number(event.target.value))}
            className="w-full rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-ink outline-none"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-ink">Voltage class</span>
          <select
            value={voltageKv}
            onChange={(event) => setVoltageKv(Number(event.target.value))}
            className="w-full rounded-2xl border border-white/70 bg-white/75 px-4 py-3 text-sm text-ink outline-none"
          >
            {[220, 400, 765].map((value) => (
              <option key={value} value={value}>
                {value} kV
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-[24px] bg-recessed/70 p-4 shadow-insetSoft">
          {forecastMutation.isPending ? (
            <div className="flex items-center gap-3 text-sm text-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Running live load forecast...
            </div>
          ) : forecastMutation.data ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted">Peak forecast day</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">
                    {topForecastDay ? `${formatNumber(topForecastDay.forecastMw)} MW` : 'n/a'}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${riskTone(forecastMutation.data.severity)}`}>
                  {forecastMutation.data.severity}
                </span>
              </div>
              <p className="text-sm text-muted">
                Live backend forecast updated {formatDateTime(forecastMutation.data.timestamp)}
              </p>
            </div>
          ) : (
            <p className="text-sm leading-7 text-muted">
              No live forecast request yet. Use this when you want a backend-generated forecast refresh instead of the
              stored snapshot.
            </p>
          )}
        </div>

        <div className="rounded-[24px] bg-recessed/70 p-4 shadow-insetSoft">
          {outageMutation.isPending ? (
            <div className="flex items-center gap-3 text-sm text-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Classifying outage scenario...
            </div>
          ) : outageMutation.data ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted">Predicted root cause</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">{outageMutation.data.predicted_cause}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${riskTone(outageMutation.data.severity)}`}>
                  {outageMutation.data.severity}
                </span>
              </div>
              <div className="space-y-2 text-sm text-ink">
                {outageMutation.data.top_candidates.map((candidate) => (
                  <div key={candidate.label} className="flex items-center justify-between">
                    <span>{candidate.label}</span>
                    <span>{Math.round(candidate.probability * 100)}%</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted">
                Updated {formatDateTime(outageMutation.data.timestamp)} with live weather conditions.
              </p>
            </div>
          ) : (
            <p className="text-sm leading-7 text-muted">
              Adjust the scenario inputs and run a classification to test outage-cause behavior from the FastAPI
              service.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
