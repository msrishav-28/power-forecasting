import { useMutation } from '@tanstack/react-query'
import { Button } from '@tremor/react'
import { Activity, Gauge, LoaderCircle } from 'lucide-react'

import { apiClient } from '../../api/client'
import type { AnomalyPredictionResponse, AssetCard, RulPredictionResponse } from '../../lib/contracts'
import { formatDateTime, riskTone } from '../../lib/format'
import { SectionCard } from '../shared/SectionCard'

export function LiveAssetModelPanel({ asset }: { asset: AssetCard }) {
  const rulMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<RulPredictionResponse>('/api/predict/rul', {
        asset_id: asset.assetId,
      })
      return response.data
    },
  })

  const anomalyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<AnomalyPredictionResponse>('/api/predict/anomaly', {
        asset_id: asset.assetId,
      })
      return response.data
    },
  })

  return (
    <SectionCard title="Live model refresh" eyebrow="Backend actions">
      <p className="text-sm leading-7 text-muted">
        Snapshot metrics load instantly. Use these controls when you want the FastAPI service to rerun the live saved
        models for the selected asset.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <Button
          className="rounded-2xl border-0 bg-ink px-4 py-3 text-white hover:bg-slate-800"
          loading={rulMutation.isPending}
          icon={Gauge}
          onClick={() => rulMutation.mutate()}
        >
          Refresh RUL
        </Button>
        <Button
          className="rounded-2xl border-0 bg-signal px-4 py-3 text-white hover:bg-signalDeep"
          loading={anomalyMutation.isPending}
          icon={Activity}
          onClick={() => anomalyMutation.mutate()}
        >
          Re-run anomaly scan
        </Button>
      </div>

      <div className="mt-5 space-y-4">
        <div className="rounded-[24px] bg-recessed/70 p-4 shadow-insetSoft">
          {rulMutation.isPending ? (
            <div className="flex items-center gap-3 text-sm text-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Running live RUL model...
            </div>
          ) : rulMutation.data ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted">Live RUL estimate</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">{Math.round(rulMutation.data.rul_days)} days</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${riskTone(rulMutation.data.severity)}`}>
                  {rulMutation.data.severity}
                </span>
              </div>
              <p className="text-sm text-muted">
                Confidence {Math.round(rulMutation.data.confidence * 100)}% · updated{' '}
                {formatDateTime(rulMutation.data.timestamp)}
              </p>
            </div>
          ) : (
            <p className="text-sm leading-7 text-muted">
              No live RUL request yet. The snapshot value remains visible above until you trigger a refresh.
            </p>
          )}
        </div>

        <div className="rounded-[24px] bg-recessed/70 p-4 shadow-insetSoft">
          {anomalyMutation.isPending ? (
            <div className="flex items-center gap-3 text-sm text-muted">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Re-running anomaly reconstruction...
            </div>
          ) : anomalyMutation.data ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted">Live anomaly score</p>
                  <p className="mt-1 text-2xl font-semibold text-ink">{anomalyMutation.data.score.toFixed(3)}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${riskTone(anomalyMutation.data.severity)}`}>
                  {anomalyMutation.data.severity}
                </span>
              </div>
              <div className="space-y-2 text-sm text-ink">
                {anomalyMutation.data.drivers.map((driver) => (
                  <div key={driver.feature} className="flex items-center justify-between">
                    <span>{driver.feature}</span>
                    <span>{driver.score.toFixed(3)}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted">
                Threshold {anomalyMutation.data.threshold.toFixed(3)} · updated{' '}
                {formatDateTime(anomalyMutation.data.timestamp)}
              </p>
            </div>
          ) : (
            <p className="text-sm leading-7 text-muted">
              Run the live anomaly detector to compare current reconstruction error against the saved threshold.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
