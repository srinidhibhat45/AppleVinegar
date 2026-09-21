import { rect } from '@/core/geometry'
import type { Rect } from '@/core/types'
import { useStore } from '@/store/store'

/**
 * Geometry is read back from the DOM rather than computed from stored x/y.
 * Auto-layout children are positioned by the browser, so the DOM is the only
 * source of truth that is correct for every layout mode.
 */

export const canvasEl = () => document.getElementById('cider-canvas')

export function canvasRect(): DOMRect {
  return (
    canvasEl()?.getBoundingClientRect() ??
    ({ left: 0, top: 0, width: 0, height: 0 } as DOMRect)
  )
}

export function clientToWorld(clientX: number, clientY: number): { x: number; y: number } {
  const c = canvasRect()
  const { viewport } = useStore.getState()
  return {
    x: (clientX - c.left - viewport.x) / viewport.zoom,
    y: (clientY - c.top - viewport.y) / viewport.zoom,
  }
}

export function worldToClient(x: number, y: number): { x: number; y: number } {
  const c = canvasRect()
  const { viewport } = useStore.getState()
  return { x: x * viewport.zoom + viewport.x + c.left, y: y * viewport.zoom + viewport.y + c.top }
}

/** Position in canvas-local screen px (what the overlay layer uses). */
export function worldToOverlay(x: number, y: number): { x: number; y: number } {
  const { viewport } = useStore.getState()
  return { x: x * viewport.zoom + viewport.x, y: y * viewport.zoom + viewport.y }
}

export const nodeEl = (id: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-node-id="${id}"]`)

/** World-space rect of a rendered node, measured from the DOM. */
export function nodeWorldRect(id: string): Rect | null {
  const el = nodeEl(id)
  if (!el) return null
  const r = el.getBoundingClientRect()
  const c = canvasRect()
  const { viewport } = useStore.getState()
  return rect(
    (r.left - c.left - viewport.x) / viewport.zoom,
    (r.top - c.top - viewport.y) / viewport.zoom,
    r.width / viewport.zoom,
    r.height / viewport.zoom,
  )
}

export function nodeWorldRects(ids: string[]): Record<string, Rect> {
  const out: Record<string, Rect> = {}
  for (const id of ids) {
    const r = nodeWorldRect(id)
    if (r) out[id] = r
  }
  return out
}

/** Union of several measured rects; null when nothing is on screen. */
export function measuredBounds(ids: string[]): Rect | null {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  let any = false
  for (const id of ids) {
    const r = nodeWorldRect(id)
    if (!r) continue
    any = true
    minX = Math.min(minX, r.x)
    minY = Math.min(minY, r.y)
    maxX = Math.max(maxX, r.x + r.w)
    maxY = Math.max(maxY, r.y + r.h)
  }
  return any ? rect(minX, minY, maxX - minX, maxY - minY) : null
}

/** Deepest rendered node under a client point, walking up from the DOM target. */
export function nodeIdFromPoint(clientX: number, clientY: number): string | null {
  const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null
  const hit = el?.closest('[data-node-id]') as HTMLElement | null
  return hit?.dataset.nodeId ?? null
}
