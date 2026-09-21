import type { Rect } from '@/core/types'

export interface SnapLine {
  axis: 'x' | 'y'
  /** world coordinate of the line */
  pos: number
  /** extent of the line so it visually connects the two objects */
  from: number
  to: number
}

export interface SnapResult {
  dx: number
  dy: number
  lines: SnapLine[]
}

/**
 * Snap distance in world units. It tracks zoom so the gesture always feels
 * like ~7 screen pixels, but is clamped: at 2% zoom an unclamped threshold
 * would be 350 world px and every drag would jump to the nearest edge.
 */
export const snapThreshold = (zoom: number) => Math.min(7 / zoom, 24)

type Cand = { v: number; kind: 'start' | 'mid' | 'end' }

const xCands = (r: Rect): Cand[] => [
  { v: r.x, kind: 'start' },
  { v: r.x + r.w / 2, kind: 'mid' },
  { v: r.x + r.w, kind: 'end' },
]
const yCands = (r: Rect): Cand[] => [
  { v: r.y, kind: 'start' },
  { v: r.y + r.h / 2, kind: 'mid' },
  { v: r.y + r.h, kind: 'end' },
]

/**
 * Align `moving` to nearby `targets`, then fall back to the pixel grid.
 * Returns the delta to apply plus the guide lines to draw.
 */
export function snapRect(
  moving: Rect,
  targets: Rect[],
  threshold: number,
  grid = 0,
): SnapResult {
  const lines: SnapLine[] = []
  let bestX: { d: number; delta: number; line: SnapLine } | null = null
  let bestY: { d: number; delta: number; line: SnapLine } | null = null

  for (const t of targets) {
    for (const m of xCands(moving)) {
      for (const c of xCands(t)) {
        const d = Math.abs(m.v - c.v)
        if (d <= threshold && (!bestX || d < bestX.d)) {
          bestX = {
            d,
            delta: c.v - m.v,
            line: {
              axis: 'x',
              pos: c.v,
              from: Math.min(moving.y, t.y) - 12,
              to: Math.max(moving.y + moving.h, t.y + t.h) + 12,
            },
          }
        }
      }
    }
    for (const m of yCands(moving)) {
      for (const c of yCands(t)) {
        const d = Math.abs(m.v - c.v)
        if (d <= threshold && (!bestY || d < bestY.d)) {
          bestY = {
            d,
            delta: c.v - m.v,
            line: {
              axis: 'y',
              pos: c.v,
              from: Math.min(moving.x, t.x) - 12,
              to: Math.max(moving.x + moving.w, t.x + t.w) + 12,
            },
          }
        }
      }
    }
  }

  let dx = 0
  let dy = 0
  if (bestX) {
    dx = bestX.delta
    lines.push(bestX.line)
  } else if (grid > 0) {
    dx = Math.round(moving.x / grid) * grid - moving.x
  }
  if (bestY) {
    dy = bestY.delta
    lines.push(bestY.line)
  } else if (grid > 0) {
    dy = Math.round(moving.y / grid) * grid - moving.y
  }
  return { dx, dy, lines }
}

/** Snap one edge value (used while resizing). */
export function snapValue(v: number, candidates: number[], threshold: number, grid = 0): number {
  let best = v
  let bestD = threshold + 1
  for (const c of candidates) {
    const d = Math.abs(v - c)
    if (d < bestD) {
      bestD = d
      best = c
    }
  }
  if (bestD <= threshold) return best
  return grid > 0 ? Math.round(v / grid) * grid : v
}
