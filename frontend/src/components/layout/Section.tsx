import type { PropsWithChildren, ReactNode } from 'react'

interface SectionProps extends PropsWithChildren {
  title?: string
  eyebrow?: string
  description?: string
  action?: ReactNode
  /** "comfortable" = p-pane-lg, "default" = p-pane, "compact" = p-4. */
  padding?: 'comfortable' | 'default' | 'compact'
  className?: string
}

/**
 * Section — a titled card container with consistent inner padding and an optional
 * gradient accent bar to the left of the title. Thin, opinionated wrapper that
 * standardizes the rhythm previously left to each page.
 *
 * Visual identity: glass surface with hairline border, soft panel shadow.
 */
export function Section({
  title,
  eyebrow,
  description,
  action,
  padding = 'default',
  className = '',
  children,
}: SectionProps) {
  const padClass = padding === 'comfortable' ? 'p-pane-lg' : padding === 'compact' ? 'p-4' : 'p-pane'

  return (
    <section
      className={`relative rounded-panel border border-glassEdge bg-panel/70 backdrop-blur-glass shadow-glass ${padClass} ${className}`}
    >
      {(title || eyebrow || action) && (
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-stretch gap-3">
            {title && <span aria-hidden className="mt-1 w-[3px] rounded-pill bg-brand" />}
            <div>
              {eyebrow && (
                <p className="font-mono text-eyebrow uppercase text-muted">{eyebrow}</p>
              )}
              {title && <h3 className="mt-1 text-h3 font-semibold text-ink">{title}</h3>}
              {description && <p className="mt-2 max-w-prose text-small text-muted">{description}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  )
}
