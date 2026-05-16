import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { Skeleton } from './components/layout/Skeleton'

const DashboardLayout = lazy(() =>
  import('./pages/DashboardLayout').then((module) => ({ default: module.DashboardLayout })),
)
const OverviewPage = lazy(() => import('./pages/OverviewPage').then((module) => ({ default: module.OverviewPage })))
const AssetsPage = lazy(() => import('./pages/AssetsPage').then((module) => ({ default: module.AssetsPage })))
const GridPage = lazy(() => import('./pages/GridPage').then((module) => ({ default: module.GridPage })))
const CorridorsPage = lazy(() =>
  import('./pages/CorridorsPage').then((module) => ({ default: module.CorridorsPage })),
)

function App() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-content px-4 py-gutter sm:px-6 lg:px-8">
          <Skeleton variant="page" />
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="grid" element={<GridPage />} />
          <Route path="corridors" element={<CorridorsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
