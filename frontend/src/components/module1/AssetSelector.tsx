import { Search } from 'lucide-react'

import type { AssetCard } from '../../lib/contracts'
import { riskTone } from '../../lib/format'

interface AssetSelectorProps {
  assets: AssetCard[]
  search: string
  onSearchChange: (value: string) => void
  selectedAssetId: string | null
  onSelect: (assetId: string) => void
}

export function AssetSelector({
  assets,
  search,
  onSearchChange,
  selectedAssetId,
  onSelect,
}: AssetSelectorProps) {
  return (
    <div className="rounded-panel border border-glassEdge bg-panel/70 p-pane shadow-glass backdrop-blur-glass">
      <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 shadow-insetSoft">
        <Search className="h-4 w-4 text-muted" aria-hidden />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search transformer, substation, or state"
          className="w-full bg-transparent text-small text-ink outline-none"
        />
      </div>
      <div className="mt-4 max-h-[680px] space-y-3 overflow-auto pr-1 xl:max-h-[720px]">
        {assets.map((asset) => {
          const selected = asset.assetId === selectedAssetId
          return (
            <button
              key={asset.assetId}
              type="button"
              onClick={() => onSelect(asset.assetId)}
              className={`w-full rounded-card p-4 text-left transition ${
                selected
                  ? 'bg-brand text-white shadow-glass'
                  : 'bg-recessed/60 text-ink hover:bg-white/90'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{asset.assetId}</div>
                  <div className={`mt-1 text-small ${selected ? 'text-white/70' : 'text-muted'}`}>
                    {asset.substation} · {asset.state}
                  </div>
                </div>
                <span
                  className={`rounded-pill px-3 py-1 text-eyebrow font-medium ${
                    selected ? 'bg-white/15 text-white' : riskTone(asset.status)
                  }`}
                >
                  {asset.status}
                </span>
              </div>
              <div className={`mt-4 flex items-center justify-between text-small ${selected ? 'text-white/85' : 'text-ink'}`}>
                <span>Health {asset.healthIndex}</span>
                <span>RUL {Math.round(asset.rulDays)}d</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
