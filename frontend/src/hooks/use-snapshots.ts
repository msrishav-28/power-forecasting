import { useQuery } from '@tanstack/react-query'

import { getAssetsSnapshot, getCorridorsSnapshot, getGridSnapshot, getMetaSnapshot } from '../api/snapshots'

export function useMetaSnapshot() {
  return useQuery({
    queryKey: ['snapshot', 'meta'],
    queryFn: getMetaSnapshot,
    staleTime: Infinity,
  })
}

export function useAssetsSnapshot() {
  return useQuery({
    queryKey: ['snapshot', 'assets'],
    queryFn: getAssetsSnapshot,
    staleTime: Infinity,
  })
}

export function useGridSnapshot() {
  return useQuery({
    queryKey: ['snapshot', 'grid'],
    queryFn: getGridSnapshot,
    staleTime: Infinity,
  })
}

export function useCorridorsSnapshot() {
  return useQuery({
    queryKey: ['snapshot', 'corridors'],
    queryFn: getCorridorsSnapshot,
    staleTime: Infinity,
  })
}
