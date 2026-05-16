import type { PropsWithChildren } from 'react'

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
type ColCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

export type ResponsiveColumns = Partial<Record<Breakpoint, ColCount>>

interface BentoGridProps extends PropsWithChildren {
  /** Responsive column counts per breakpoint. */
  columns?: ResponsiveColumns
  /** Override the default gap. */
  gap?: 'gutter' | 'gutter-lg' | 'tight'
  className?: string
}

// Pre-enumerated class lookups so Tailwind's JIT can see them.
const baseColClass: Record<ColCount, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  7: 'grid-cols-7',
  8: 'grid-cols-8',
  9: 'grid-cols-9',
  10: 'grid-cols-10',
  11: 'grid-cols-11',
  12: 'grid-cols-12',
}

const breakpointColClass: Record<Exclude<Breakpoint, 'base'>, Record<ColCount, string>> = {
  sm: {
    1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4',
    5: 'sm:grid-cols-5', 6: 'sm:grid-cols-6', 7: 'sm:grid-cols-7', 8: 'sm:grid-cols-8',
    9: 'sm:grid-cols-9', 10: 'sm:grid-cols-10', 11: 'sm:grid-cols-11', 12: 'sm:grid-cols-12',
  },
  md: {
    1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4',
    5: 'md:grid-cols-5', 6: 'md:grid-cols-6', 7: 'md:grid-cols-7', 8: 'md:grid-cols-8',
    9: 'md:grid-cols-9', 10: 'md:grid-cols-10', 11: 'md:grid-cols-11', 12: 'md:grid-cols-12',
  },
  lg: {
    1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6', 7: 'lg:grid-cols-7', 8: 'lg:grid-cols-8',
    9: 'lg:grid-cols-9', 10: 'lg:grid-cols-10', 11: 'lg:grid-cols-11', 12: 'lg:grid-cols-12',
  },
  xl: {
    1: 'xl:grid-cols-1', 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3', 4: 'xl:grid-cols-4',
    5: 'xl:grid-cols-5', 6: 'xl:grid-cols-6', 7: 'xl:grid-cols-7', 8: 'xl:grid-cols-8',
    9: 'xl:grid-cols-9', 10: 'xl:grid-cols-10', 11: 'xl:grid-cols-11', 12: 'xl:grid-cols-12',
  },
  '2xl': {
    1: '2xl:grid-cols-1', 2: '2xl:grid-cols-2', 3: '2xl:grid-cols-3', 4: '2xl:grid-cols-4',
    5: '2xl:grid-cols-5', 6: '2xl:grid-cols-6', 7: '2xl:grid-cols-7', 8: '2xl:grid-cols-8',
    9: '2xl:grid-cols-9', 10: '2xl:grid-cols-10', 11: '2xl:grid-cols-11', 12: '2xl:grid-cols-12',
  },
  '3xl': {
    1: '3xl:grid-cols-1', 2: '3xl:grid-cols-2', 3: '3xl:grid-cols-3', 4: '3xl:grid-cols-4',
    5: '3xl:grid-cols-5', 6: '3xl:grid-cols-6', 7: '3xl:grid-cols-7', 8: '3xl:grid-cols-8',
    9: '3xl:grid-cols-9', 10: '3xl:grid-cols-10', 11: '3xl:grid-cols-11', 12: '3xl:grid-cols-12',
  },
}

function columnsToClassNames(columns: ResponsiveColumns): string {
  const classes: string[] = []
  if (columns.base) classes.push(baseColClass[columns.base])
  ;(['sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const).forEach((bp) => {
    const count = columns[bp]
    if (count) classes.push(breakpointColClass[bp][count])
  })
  return classes.join(' ')
}

export function BentoGrid({
  columns = { base: 1, md: 2, lg: 3 },
  gap = 'gutter',
  className = '',
  children,
}: BentoGridProps) {
  const gapClass =
    gap === 'gutter-lg' ? 'gap-gutter-lg' : gap === 'tight' ? 'gap-4' : 'gap-gutter xl:gap-gutter-lg'
  const colClass = columnsToClassNames(columns)

  return <div className={`grid ${gapClass} ${colClass} ${className}`}>{children}</div>
}
