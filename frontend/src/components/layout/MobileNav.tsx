import { Menu, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

interface MobileNavProps {
  /** Sidebar element to render inside the drawer. */
  children: (close: () => void) => ReactNode
  /** ClassName applied to the trigger button. */
  triggerClassName?: string
}

/**
 * MobileNav — hamburger trigger + slide-over drawer wrapping the Sidebar.
 * Visible only below `lg:` (controlled by parent rendering). Light-touch
 * focus management: focus moves to the close button on open, returns to
 * the trigger on close. Backdrop click and Escape both dismiss.
 */
export function MobileNav({ children, triggerClassName = '' }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) triggerRef.current?.focus()
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-glassEdge bg-white/60 text-ink shadow-glass transition hover:bg-white/80 lg:hidden ${triggerClassName}`}
      >
        <Menu className="h-5 w-5" aria-hidden />
        <span className="sr-only">Open navigation</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" id="mobile-nav-drawer">
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation overlay"
            className="absolute inset-0 bg-ink/30 backdrop-blur-glass animate-cross-fade"
          />
          <div className="absolute inset-y-0 left-0 flex w-[min(320px,90vw)] flex-col overflow-y-auto bg-panel/95 p-4 shadow-panel backdrop-blur-glass animate-fade-up">
            <div className="mb-4 flex items-center justify-end">
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-glassEdge bg-white/60 text-ink shadow-glass transition hover:bg-white/80"
              >
                <X className="h-5 w-5" aria-hidden />
                <span className="sr-only">Close navigation</span>
              </button>
            </div>
            {children(close)}
          </div>
        </div>
      )}
    </>
  )
}
