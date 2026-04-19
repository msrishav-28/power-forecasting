import type { AssetSnapshot, CorridorsSnapshot, GridSnapshot, MetaSnapshot } from '../lib/contracts'

async function readSnapshot<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Unable to load snapshot: ${path}`)
  }
  return (await response.json()) as T
}

export function getMetaSnapshot() {
  return readSnapshot<MetaSnapshot>('/snapshots/meta.json')
}

export function getAssetsSnapshot() {
  return readSnapshot<AssetSnapshot>('/snapshots/assets.json')
}

export function getGridSnapshot() {
  return readSnapshot<GridSnapshot>('/snapshots/grid.json')
}

export function getCorridorsSnapshot() {
  return readSnapshot<CorridorsSnapshot>('/snapshots/corridors.json')
}
