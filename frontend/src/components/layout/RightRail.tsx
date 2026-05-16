import { BrainCircuit, Gauge } from 'lucide-react'
import type { ReactNode } from 'react'

import { Tab, TabPanel, Tabs, TabsList } from './Tabs'

interface RightRailProps {
  /** Live model panel (predictions). */
  predictions: ReactNode
  /** AI/LLM copilot panel. */
  copilot: ReactNode
  className?: string
}

/**
 * RightRail — the home for Live model + AI Copilot panels on every page.
 *
 * Behaviour:
 * - `xl:` and up — both panels render stacked in a vertical column.
 * - below `xl:` — a tab-switcher lets the operator pick one at a time, which
 *   eliminates the long scroll-past-everything problem on tablets and laptops.
 *
 * The component owns the responsive layout so pages don't have to.
 */
export function RightRail({ predictions, copilot, className = '' }: RightRailProps) {
  return (
    <div className={className}>
      {/* xl+ — stacked column, both panels always visible */}
      <div className="hidden xl:flex xl:flex-col xl:gap-gutter">
        {predictions}
        {copilot}
      </div>

      {/* below xl — tab-switcher */}
      <div className="xl:hidden">
        <Tabs defaultValue="predictions">
          <TabsList ariaLabel="Live model and copilot tabs">
            <Tab value="predictions" icon={<Gauge className="h-4 w-4" aria-hidden />}>
              Predictions
            </Tab>
            <Tab value="copilot" icon={<BrainCircuit className="h-4 w-4" aria-hidden />}>
              AI Copilot
            </Tab>
          </TabsList>
          <div className="mt-4">
            <TabPanel value="predictions">{predictions}</TabPanel>
            <TabPanel value="copilot">{copilot}</TabPanel>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
