import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/render/icons'

interface MenuProps {
  x: number
  y: number
  onClose: () => void
  children: ReactNode
  width?: number
  align?: 'left' | 'right'
}

/** A floating menu that keeps itself inside the viewport and closes on the
 *  next click or Escape. Used for the top bar and the canvas context menu. */
export function Menu({ x, y, onClose, children, width, align = 'left' }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x, y })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    let nx = align === 'right' ? x - r.width : x
    let ny = y
    if (nx + r.width > window.innerWidth - 8) nx = window.innerWidth - r.width - 8
    if (nx < 8) nx = 8
    if (ny + r.height > window.innerHeight - 8) ny = Math.max(8, window.innerHeight - r.height - 8)
    setPos({ x: nx, y: ny })
  }, [x, y, align])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as globalThis.Node)) onClose()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    // defer so the click that opened the menu does not immediately close it
    const t = setTimeout(() => window.addEventListener('mousedown', onDown), 0)
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      ref={ref}
      className="menu scroll"
      style={{ left: pos.x, top: pos.y, minWidth: width }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>,
    document.body,
  )
}

export function MenuItem({
  icon,
  label,
  kbd,
  onClick,
  disabled,
  danger,
  checked,
}: {
  icon?: string
  label: string
  kbd?: string
  onClick?: () => void
  disabled?: boolean
  danger?: boolean
  checked?: boolean
}) {
  return (
    <button
      className="menu-item"
      disabled={disabled}
      style={danger ? { color: 'var(--danger)' } : undefined}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      <span className="mi-icon">{icon ? <Icon name={icon} size={14} /> : checked ? <Icon name="check" size={14} /> : null}</span>
      <span className="mi-label">{label}</span>
      {kbd && <span className="mi-key">{kbd}</span>}
    </button>
  )
}

export const MenuSep = () => <div className="menu-sep" />
export const MenuLabel = ({ children }: { children: ReactNode }) => <div className="menu-label">{children}</div>
