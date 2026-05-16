import type { PropsWithChildren } from 'react'

type Breakpoint = 'base' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
type Span = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 'full'

export type ResponsiveSpan = Partial<Record<Breakpoint, Span>>

interface BentoCellProps extends PropsWithChildren {
  colSpan?: ResponsiveSpan
  rowSpan?: ResponsiveSpan
  className?: string
}

const baseCol: Record<Span, string> = {
  1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4',
  5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8',
  9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12',
  full: 'col-span-full',
}
const baseRow: Record<Span, string> = {
  1: 'row-span-1', 2: 'row-span-2', 3: 'row-span-3', 4: 'row-span-4',
  5: 'row-span-5', 6: 'row-span-6', 7: 'row-span-7', 8: 'row-span-8',
  9: 'row-span-9', 10: 'row-span-10', 11: 'row-span-11', 12: 'row-span-12',
  full: 'row-span-full',
}

const bpCol: Record<Exclude<Breakpoint, 'base'>, Record<Span, string>> = {
  sm: {
    1: 'sm:col-span-1', 2: 'sm:col-span-2', 3: 'sm:col-span-3', 4: 'sm:col-span-4',
    5: 'sm:col-span-5', 6: 'sm:col-span-6', 7: 'sm:col-span-7', 8: 'sm:col-span-8',
    9: 'sm:col-span-9', 10: 'sm:col-span-10', 11: 'sm:col-span-11', 12: 'sm:col-span-12',
    full: 'sm:col-span-full',
  },
  md: {
    1: 'md:col-span-1', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-4',
    5: 'md:col-span-5', 6: 'md:col-span-6', 7: 'md:col-span-7', 8: 'md:col-span-8',
    9: 'md:col-span-9', 10: 'md:col-span-10', 11: 'md:col-span-11', 12: 'md:col-span-12',
    full: 'md:col-span-full',
  },
  lg: {
    1: 'lg:col-span-1', 2: 'lg:col-span-2', 3: 'lg:col-span-3', 4: 'lg:col-span-4',
    5: 'lg:col-span-5', 6: 'lg:col-span-6', 7: 'lg:col-span-7', 8: 'lg:col-span-8',
    9: 'lg:col-span-9', 10: 'lg:col-span-10', 11: 'lg:col-span-11', 12: 'lg:col-span-12',
    full: 'lg:col-span-full',
  },
  xl: {
    1: 'xl:col-span-1', 2: 'xl:col-span-2', 3: 'xl:col-span-3', 4: 'xl:col-span-4',
    5: 'xl:col-span-5', 6: 'xl:col-span-6', 7: 'xl:col-span-7', 8: 'xl:col-span-8',
    9: 'xl:col-span-9', 10: 'xl:col-span-10', 11: 'xl:col-span-11', 12: 'xl:col-span-12',
    full: 'xl:col-span-full',
  },
  '2xl': {
    1: '2xl:col-span-1', 2: '2xl:col-span-2', 3: '2xl:col-span-3', 4: '2xl:col-span-4',
    5: '2xl:col-span-5', 6: '2xl:col-span-6', 7: '2xl:col-span-7', 8: '2xl:col-span-8',
    9: '2xl:col-span-9', 10: '2xl:col-span-10', 11: '2xl:col-span-11', 12: '2xl:col-span-12',
    full: '2xl:col-span-full',
  },
  '3xl': {
    1: '3xl:col-span-1', 2: '3xl:col-span-2', 3: '3xl:col-span-3', 4: '3xl:col-span-4',
    5: '3xl:col-span-5', 6: '3xl:col-span-6', 7: '3xl:col-span-7', 8: '3xl:col-span-8',
    9: '3xl:col-span-9', 10: '3xl:col-span-10', 11: '3xl:col-span-11', 12: '3xl:col-span-12',
    full: '3xl:col-span-full',
  },
}

const bpRow: Record<Exclude<Breakpoint, 'base'>, Record<Span, string>> = {
  sm: {
    1: 'sm:row-span-1', 2: 'sm:row-span-2', 3: 'sm:row-span-3', 4: 'sm:row-span-4',
    5: 'sm:row-span-5', 6: 'sm:row-span-6', 7: 'sm:row-span-7', 8: 'sm:row-span-8',
    9: 'sm:row-span-9', 10: 'sm:row-span-10', 11: 'sm:row-span-11', 12: 'sm:row-span-12',
    full: 'sm:row-span-full',
  },
  md: {
    1: 'md:row-span-1', 2: 'md:row-span-2', 3: 'md:row-span-3', 4: 'md:row-span-4',
    5: 'md:row-span-5', 6: 'md:row-span-6', 7: 'md:row-span-7', 8: 'md:row-span-8',
    9: 'md:row-span-9', 10: 'md:row-span-10', 11: 'md:row-span-11', 12: 'md:row-span-12',
    full: 'md:row-span-full',
  },
  lg: {
    1: 'lg:row-span-1', 2: 'lg:row-span-2', 3: 'lg:row-span-3', 4: 'lg:row-span-4',
    5: 'lg:row-span-5', 6: 'lg:row-span-6', 7: 'lg:row-span-7', 8: 'lg:row-span-8',
    9: 'lg:row-span-9', 10: 'lg:row-span-10', 11: 'lg:row-span-11', 12: 'lg:row-span-12',
    full: 'lg:row-span-full',
  },
  xl: {
    1: 'xl:row-span-1', 2: 'xl:row-span-2', 3: 'xl:row-span-3', 4: 'xl:row-span-4',
    5: 'xl:row-span-5', 6: 'xl:row-span-6', 7: 'xl:row-span-7', 8: 'xl:row-span-8',
    9: 'xl:row-span-9', 10: 'xl:row-span-10', 11: 'xl:row-span-11', 12: 'xl:row-span-12',
    full: 'xl:row-span-full',
  },
  '2xl': {
    1: '2xl:row-span-1', 2: '2xl:row-span-2', 3: '2xl:row-span-3', 4: '2xl:row-span-4',
    5: '2xl:row-span-5', 6: '2xl:row-span-6', 7: '2xl:row-span-7', 8: '2xl:row-span-8',
    9: '2xl:row-span-9', 10: '2xl:row-span-10', 11: '2xl:row-span-11', 12: '2xl:row-span-12',
    full: '2xl:row-span-full',
  },
  '3xl': {
    1: '3xl:row-span-1', 2: '3xl:row-span-2', 3: '3xl:row-span-3', 4: '3xl:row-span-4',
    5: '3xl:row-span-5', 6: '3xl:row-span-6', 7: '3xl:row-span-7', 8: '3xl:row-span-8',
    9: '3xl:row-span-9', 10: '3xl:row-span-10', 11: '3xl:row-span-11', 12: '3xl:row-span-12',
    full: '3xl:row-span-full',
  },
}

function spanToClassNames(span: ResponsiveSpan | undefined, base: Record<Span, string>, bp: Record<Exclude<Breakpoint, 'base'>, Record<Span, string>>): string {
  if (!span) return ''
  const out: string[] = []
  if (span.base) out.push(base[span.base])
  ;(['sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const).forEach((b) => {
    const v = span[b]
    if (v) out.push(bp[b][v])
  })
  return out.join(' ')
}

export function BentoCell({ colSpan, rowSpan, className = '', children }: BentoCellProps) {
  const col = spanToClassNames(colSpan, baseCol, bpCol)
  const row = spanToClassNames(rowSpan, baseRow, bpRow)
  return <div className={`${col} ${row} ${className}`}>{children}</div>
}
