import type { Rect } from './types'

export const rect = (x: number, y: number, w: number, h: number): Rect => ({ x, y, w, h })

export const rectRight = (r: Rect) => r.x + r.w
export const rectBottom = (r: Rect) => r.y + r.h
export const rectCX = (r: Rect) => r.x + r.w / 2
export const rectCY = (r: Rect) => r.y + r.h / 2

export function rectContains(r: Rect, x: number, y: number): boolean {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h
}

export function rectIntersects(a: Rect, b: Rect): boolean {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y)
}

/** Does `outer` fully contain `inner`? */
export function rectWraps(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.w <= outer.x + outer.w &&
    inner.y + inner.h <= outer.y + outer.h
  )
}

export function unionRects(rects: Rect[]): Rect {
  if (rects.length === 0) return rect(0, 0, 0, 0)
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const r of rects) {
    minX = Math.min(minX, r.x)
    minY = Math.min(minY, r.y)
    maxX = Math.max(maxX, r.x + r.w)
    maxY = Math.max(maxY, r.y + r.h)
  }
  return rect(minX, minY, maxX - minX, maxY - minY)
}

export function normalizeRect(x0: number, y0: number, x1: number, y1: number): Rect {
  return rect(Math.min(x0, x1), Math.min(y0, y1), Math.abs(x1 - x0), Math.abs(y1 - y0))
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export const round = (v: number, step = 1) => Math.round(v / step) * step

export function expandRect(r: Rect, by: number): Rect {
  return rect(r.x - by, r.y - by, r.w + by * 2, r.h + by * 2)
}
