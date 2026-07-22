import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react'
import { createPortal } from 'react-dom'

import styles from './Popover.module.css'

interface PopoverProps {
  align?: 'start' | 'end'
  ariaLabel: string
  children: ReactNode
  open: boolean
  trigger: ReactNode
  onClose: () => void
}

export function Popover({
  align = 'start',
  ariaLabel,
  children,
  open,
  trigger,
  onClose,
}: PopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!open) {
      return
    }

    const positionPanel = () => {
      const container = containerRef.current
      const panel = panelRef.current

      if (!container || !panel) {
        return
      }

      if (window.innerWidth <= 520) {
        Object.assign(panel.style, {
          top: 'auto',
          right: '0.75rem',
          bottom: '0.75rem',
          left: '0.75rem',
          width: 'auto',
          visibility: 'visible',
        })

        return
      }

      Object.assign(panel.style, {
        top: '0px',
        right: 'auto',
        bottom: 'auto',
        left: '0px',
        width: 'max-content',
        visibility: 'hidden',
      })

      const triggerBounds = container.getBoundingClientRect()
      const panelBounds = panel.getBoundingClientRect()
      const edgePadding = 8
      const gap = 6

      const preferredLeft =
        align === 'end'
          ? triggerBounds.right - panelBounds.width
          : triggerBounds.left

      const left = Math.min(
        Math.max(preferredLeft, edgePadding),
        window.innerWidth - panelBounds.width - edgePadding,
      )

      const fitsBelow =
        triggerBounds.bottom + gap + panelBounds.height <=
        window.innerHeight - edgePadding

      const top = fitsBelow
        ? triggerBounds.bottom + gap
        : Math.max(
            edgePadding,
            triggerBounds.top - panelBounds.height - gap,
          )

      Object.assign(panel.style, {
        top: `${top}px`,
        left: `${left}px`,
        visibility: 'visible',
      })
    }

    positionPanel()
    const resizeObserver = new ResizeObserver(positionPanel)

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    if (panelRef.current) {
      resizeObserver.observe(panelRef.current)
    }

    window.addEventListener('resize', positionPanel)
    window.addEventListener('scroll', positionPanel, true)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', positionPanel)
      window.removeEventListener('scroll', positionPanel, true)
    }
  }, [align, open])

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) {
        return
      }

      const clickedTrigger =
        containerRef.current?.contains(event.target)
      const clickedPanel = panelRef.current?.contains(event.target)

      if (!clickedTrigger && !clickedPanel) {
        onClose()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      )
    }
  }, [onClose, open])

  return (
    <div
      className={styles.container}
      ref={containerRef}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          event.stopPropagation()
          onClose()
        }
      }}
    >
      {trigger}

      {open
        ? createPortal(
            <div
              className={styles.panel}
              ref={panelRef}
              role="dialog"
              aria-label={ariaLabel}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
