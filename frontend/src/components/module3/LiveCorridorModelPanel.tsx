import { useMutation } from '@tanstack/react-query'
import { Button } from '@tremor/react'
import { LoaderCircle, Radar } from 'lucide-react'

import { apiClient } from '../../api/client'
import type { CorridorSegment, NdviRiskResponse } from '../../lib/contracts'
import { formatDateTime, riskTone } from '../../lib/format'
import { SectionCard } from '../shared/SectionCard'

export function LiveCorridorModelPanel({ segment }: { segment: CorridorSegment }) {
  const riskMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<NdviRiskResponse>('/api/predict/ndvi-risk', {
        segment_id: segment.segmentId,
        ndvi: segment.latestNdvi,
        ndvi_3m_delta: segment.delta3m,
        ndvi_6m_delta: segment.delta6m,
        ndvi_stddev: Math.abs(segment.delta6m) / 2 + 0.02,
        terrain_slope: segment.terrainSlope,
      })
      return response.data
    },
  })

  return (
    <SectionCard title="Live corridor scoring" eyebrow="Backend actions">
      <p className="text-sm leading-7 text-muted">
        Re-score the selected transmission segment through the FastAPI classifier to compare the live model output
        against the stored corridor snapshot.
      </p>

      <Button
        className="mt-5 rounded-2xl border-0 bg-ink px-4 py-3 text-white hover:bg-slate-800"
        loading={riskMutation.isPending}
        icon={Radar}
        onClick={() => riskMutation.mutate()}
      >
        Refresh NDVI risk
      </Button>

      <div className="mt-5 rounded-[24px] bg-recessed/70 p-4 shadow-insetSoft">
        {riskMutation.isPending ? (
          <div className="flex items-center gap-3 text-sm text-muted">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Re-scoring corridor risk...
          </div>
        ) : riskMutation.data ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted">Live risk label</p>
                <p className="mt-1 text-2xl font-semibold text-ink">{riskMutation.data.risk_label}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${riskTone(riskMutation.data.severity)}`}>
                {riskMutation.data.severity}
              </span>
            </div>
            <p className="text-sm text-ink">
              Threshold check: <strong>{riskMutation.data.threshold_label}</strong>
            </p>
            <p className="text-sm text-muted">
              Confidence {Math.round(riskMutation.data.confidence * 100)}% · updated{' '}
              {formatDateTime(riskMutation.data.timestamp)}
            </p>
          </div>
        ) : (
          <p className="text-sm leading-7 text-muted">
            No live risk request yet. Use this when you want a backend model pass on the selected segment.
          </p>
        )}
      </div>
    </SectionCard>
  )
}
