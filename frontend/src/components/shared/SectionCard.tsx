import { Card, Text } from '@tremor/react'
import type { PropsWithChildren, ReactNode } from 'react'

interface SectionCardProps extends PropsWithChildren {
  title: string
  eyebrow?: string
  action?: ReactNode
  className?: string
}

/**
 * SectionCard — glass-surfaced titled section. The 3px gradient accent bar to
 * the left of the title is the brand signature; it appears on every section
 * heading across the app.
 */
export function SectionCard({ title, eyebrow, action, className, children }: SectionCardProps) {
  return (
    <Card
      className={`relative rounded-panel border border-glassEdge bg-panel/70 p-pane shadow-glass backdrop-blur-glass ${
        className || ''
      }`}
    >
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-stretch gap-3">
          <span aria-hidden className="w-[3px] shrink-0 rounded-pill bg-brand" />
          <div className="min-w-0">
            {eyebrow ? (
              <Text className="font-mono text-eyebrow uppercase text-muted">{eyebrow}</Text>
            ) : null}
            <h3 className="mt-1 text-h3 font-semibold text-ink">{title}</h3>
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </Card>
  )
}
