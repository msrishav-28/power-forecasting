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
    <div className="rounded-[28px] border border-white/70 bg-panel/90 p-5 shadow-panel">
      <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-3 shadow-insetSoft">
        <Search className="h-4 w-4 text-muted" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search transformer, substation, or state"
          className="w-full bg-transparent text-sm text-ink outline-none"
        />
      </div>
      <div className="mt-4 max-h-[760px] space-y-3 overflow-auto pr-1">
        {assets.map((asset) => {
          const selected = asset.assetId === selectedAssetId
          return (
            <button
              key={asset.assetId}
              type="button"
              onClick={() => onSelect(asset.assetId)}
              className={`w-full rounded-[22px] p-4 text-left transition ${
                selected ? 'bg-ink text-white shadow-lg' : 'bg-recessed/60 text-ink hover:bg-white/90'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold">{asset.assetId}</div>
                  <div className={`mt-1 text-sm ${selected ? 'text-white/70' : 'text-muted'}`}>
                    {asset.substation} · {asset.state}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    selected ? 'bg-white/15 text-white' : riskTone(asset.status)
                  }`}
                >
                  {asset.status}
                </span>
              </div>
              <div className={`mt-4 flex items-center justify-between text-sm ${selected ? 'text-white/85' : 'text-ink'}`}>
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
