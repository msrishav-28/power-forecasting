import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

const DashboardLayout = lazy(() =>
  import('./pages/DashboardLayout').then((module) => ({ default: module.DashboardLayout })),
)
const AssetsPage = lazy(() => import('./pages/AssetsPage').then((module) => ({ default: module.AssetsPage })))
const GridPage = lazy(() => import('./pages/GridPage').then((module) => ({ default: module.GridPage })))
const CorridorsPage = lazy(() =>
  import('./pages/CorridorsPage').then((module) => ({ default: module.CorridorsPage })),
)

function App() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center px-6">
          <div className="rounded-[30px] bg-panel/90 px-8 py-6 text-center shadow-panel">
            <p className="font-mono text-xs uppercase tracking-[0.34em] text-muted">Loading Route</p>
            <h1 className="mt-3 text-2xl font-semibold text-ink">Preparing dashboard module...</h1>
          </div>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard/assets" replace />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard/assets" replace />} />
          <Route path="assets" element={<AssetsPage />} />
          <Route path="grid" element={<GridPage />} />
          <Route path="corridors" element={<CorridorsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
