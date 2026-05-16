import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PropsWithChildren,
  type ReactNode,
} from 'react'

interface TabsContextValue {
  activeId: string
  setActiveId: (id: string) => void
  registerTab: (id: string, ref: HTMLButtonElement | null) => void
  focusAdjacent: (currentId: string, direction: 1 | -1) => void
  groupId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs subcomponents must be used inside <Tabs>')
  return ctx
}

interface TabsProps extends PropsWithChildren {
  defaultValue: string
  className?: string
  onChange?: (value: string) => void
}

export function Tabs({ defaultValue, className = '', children, onChange }: TabsProps) {
  const [activeId, setActiveIdState] = useState(defaultValue)
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const groupId = useId()

  const setActiveId = useCallback(
    (id: string) => {
      setActiveIdState(id)
      onChange?.(id)
    },
    [onChange],
  )

  const registerTab = useCallback((id: string, ref: HTMLButtonElement | null) => {
    if (ref) tabRefs.current.set(id, ref)
    else tabRefs.current.delete(id)
  }, [])

  const focusAdjacent = useCallback((currentId: string, direction: 1 | -1) => {
    const ids = Array.from(tabRefs.current.keys())
    const idx = ids.indexOf(currentId)
    if (idx === -1) return
    const next = (idx + direction + ids.length) % ids.length
    const target = tabRefs.current.get(ids[next])
    target?.focus()
  }, [])

  const value = useMemo(
    () => ({ activeId, setActiveId, registerTab, focusAdjacent, groupId }),
    [activeId, setActiveId, registerTab, focusAdjacent, groupId],
  )

  return (
    <TabsContext.Provider value={value}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabsListProps extends PropsWithChildren {
  className?: string
  ariaLabel?: string
}

export function TabsList({ children, className = '', ariaLabel }: TabsListProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1 rounded-pill border border-glassEdge bg-panel/70 p-1 backdrop-blur-glass shadow-glass ${className}`}
    >
      {children}
    </div>
  )
}

interface TabProps extends PropsWithChildren {
  value: string
  icon?: ReactNode
  className?: string
}

export function Tab({ value, icon, children, className = '' }: TabProps) {
  const { activeId, setActiveId, registerTab, focusAdjacent, groupId } = useTabsContext()
  const isActive = activeId === value

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusAdjacent(value, 1)
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusAdjacent(value, -1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusAdjacent(value, -1)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusAdjacent(value, 1)
    }
  }

  return (
    <button
      ref={(ref) => registerTab(value, ref)}
      role="tab"
      type="button"
      id={`${groupId}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${groupId}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setActiveId(value)}
      onKeyDown={handleKeyDown}
      className={`inline-flex items-center gap-2 rounded-pill px-4 py-2 text-small font-medium transition ${
        isActive ? 'bg-brand text-white shadow-glass' : 'text-muted hover:text-ink'
      } ${className}`}
    >
      {icon}
      {children}
    </button>
  )
}

interface TabPanelProps extends PropsWithChildren {
  value: string
  className?: string
}

export function TabPanel({ value, children, className = '' }: TabPanelProps) {
  const { activeId, groupId } = useTabsContext()
  if (activeId !== value) return null
  return (
    <div
      role="tabpanel"
      id={`${groupId}-panel-${value}`}
      aria-labelledby={`${groupId}-tab-${value}`}
      className={`animate-cross-fade ${className}`}
    >
      {children}
    </div>
  )
}
