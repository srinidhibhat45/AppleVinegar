import { memo } from 'react'
import { useStore } from '@/store/store'
import { gridSnapLines, pathKey, setBands, setsOf, solveRegions } from '@/core/grid'
import { rect } from '@/core/geometry'
import { absPos } from '@/core/doc'
import type { GuideSet, Rect } from '@/core/types'

/**
 * Square grids can cover a frame in thousands of cells, so they are painted as
 * a repeating gradient — one element, no matter how fine the grid.
 */
function squareGrid(set: GuideSet, box: Rect, key: string) {
  const step = Math.max(2, set.size)
  const line = `${set.color} 0 1px, transparent 1px ${step}px`
  return (
    <div
      key={key}
      className="grid-square"
      style={{
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        opacity: set.opacity,
        backgroundImage: `repeating-linear-gradient(to right, ${line}), repeating-linear-gradient(to bottom, ${line})`,
      }}
    />
  )
}

/**
 * The layout grid drawn over a frame: guide bands per region, a hairline around
 * every split so nested regions read at a glance, and a wash over whichever
 * region the inspector is pointing at.
 */
function GridOverlayInner({ id }: { id: string }) {
  const grid = useStore((s) => s.doc.nodes[id]?.grid)
  const frame = useStore((s) => s.doc.nodes[id]?.frame)
  const on = useStore((s) => s.prefs.showGuides)
  const focus = useStore((s) => (s.gridFocus?.frameId === id ? s.gridFocus.path : null))
  const zoom = useStore((s) => s.viewport.zoom)

  if (!grid?.visible || !on || !frame) return null

  const box = rect(0, 0, frame.w, frame.h)
  const solved = solveRegions(grid.root, box)
  const focusKey = focus ? pathKey(focus) : null
  // Hairlines should stay hairlines: one screen pixel, whatever the zoom.
  const hair = Math.min(2, 1 / zoom)

  return (
    <div className="grid-overlay">
      {solved.map((sr) => {
        const key = pathKey(sr.path)
        return (
          <div key={key}>
            {setsOf(sr.region).map((set) =>
              !set.visible ? null : set.kind === 'grid' ? (
                squareGrid(set, sr.inner, `${key}:${set.id}`)
              ) : (
                <div key={`${key}:${set.id}`} style={{ opacity: set.opacity }}>
                  {setBands(set, sr.inner).map((b, i) => (
                    <div
                      key={i}
                      className="grid-band"
                      style={{ left: b.x, top: b.y, width: b.w, height: b.h, background: set.color }}
                    />
                  ))}
                </div>
              ),
            )}
            {sr.depth > 0 && (
              <div
                className="grid-region"
                style={{
                  left: sr.rect.x,
                  top: sr.rect.y,
                  width: sr.rect.w,
                  height: sr.rect.h,
                  borderWidth: hair,
                }}
              />
            )}
            {focusKey === key && (
              <div
                className="grid-region focus"
                style={{
                  left: sr.rect.x,
                  top: sr.rect.y,
                  width: sr.rect.w,
                  height: sr.rect.h,
                  borderWidth: Math.max(hair, 1.5 / zoom),
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

export const GridOverlay = memo(GridOverlayInner)

/**
 * Snap lines a node inside `frameId` can align to, in world space. Frames can
 * sit inside groups, so the offset comes from `absPos`, not `frame.x/y`.
 */
export function frameGridLines(frameId: string): { xs: number[]; ys: number[] } {
  const st = useStore.getState()
  const f = st.doc.nodes[frameId]
  if (!f?.grid?.snap || !f.grid.visible || !st.prefs.snap || !st.prefs.showGuides) {
    return { xs: [], ys: [] }
  }
  const origin = absPos(st.doc.nodes, frameId)
  const local = gridSnapLines(f.grid, rect(0, 0, f.frame.w, f.frame.h))
  return {
    xs: local.xs.map((v) => v + origin.x),
    ys: local.ys.map((v) => v + origin.y),
  }
}
