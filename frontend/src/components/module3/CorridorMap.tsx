import { MapContainer, Polyline, TileLayer } from 'react-leaflet'

import type { CorridorSegment } from '../../lib/contracts'

const riskColors: Record<CorridorSegment['riskLabel'], string> = {
  Critical: '#b42318',
  High: '#ff6b35',
  Medium: '#f59e0b',
  Low: '#2f855a',
}

interface CorridorMapProps {
  segments: CorridorSegment[]
  selectedSegmentId: string | null
  onSelect: (segmentId: string) => void
}

export function CorridorMap({ segments, selectedSegmentId, onSelect }: CorridorMapProps) {
  return (
    <div className="h-[540px] overflow-hidden rounded-[28px] border border-white/70 shadow-panel">
      <MapContainer center={[24.3, 86.3]} zoom={7} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {segments.map((segment) => (
          <Polyline
            key={segment.segmentId}
            positions={segment.geometry}
            pathOptions={{
              color: riskColors[segment.riskLabel],
              weight: segment.segmentId === selectedSegmentId ? 7 : 4,
              opacity: segment.segmentId === selectedSegmentId ? 1 : 0.78,
            }}
            eventHandlers={{
              click: () => onSelect(segment.segmentId),
            }}
          />
        ))}
      </MapContainer>
    </div>
  )
}
