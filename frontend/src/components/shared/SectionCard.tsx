import { Card, Text } from '@tremor/react'
import type { PropsWithChildren, ReactNode } from 'react'

interface SectionCardProps extends PropsWithChildren {
  title: string
  eyebrow?: string
  action?: ReactNode
  className?: string
}

export function SectionCard({ title, eyebrow, action, className, children }: SectionCardProps) {
  return (
    <Card className={`rounded-[28px] border-0 bg-panel/90 shadow-panel ${className || ''}`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? <Text className="font-mono uppercase tracking-[0.28em] text-muted">{eyebrow}</Text> : null}
          <h3 className="mt-2 text-lg font-semibold text-ink">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </Card>
  )
}
