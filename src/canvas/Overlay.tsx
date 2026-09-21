import { useLayoutEffect, useRef, useState } from 'react'
import { useStore } from '@/store/store'
import { absPos, frameOf } from '@/core/doc'
import { rect } from '@/core/geometry'
import type { Node, Rect } from '@/core/types'
import { nodeWorldRect } from './measure'
import type { SnapLine } from './snapping'
import { snapThreshold, snapValue, type GridLines } from './snapping'
import { frameGridLines } from './GridOverlay'
import { keys } from './keys'

type HandleId = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

const HANDLES: { id: HandleId; x: number; y: number; cursor: string }[] = [
  { id: 'nw', x: 0, y: 0, cursor: 'nwse-resize' },
  { id: 'n', x: 0.5, y: 0, cursor: 'ns-resize' },
  { id: 'ne', x: 1, y: 0, cursor: 'nesw-resize' },
  { id: 'e', x: 1, y: 0.5, cursor: 'ew-resize' },
  { id: 'se', x: 1, y: 1, cursor: 'nwse-resize' },
  { id: 's', x: 0.5, y: 1, cursor: 'ns-resize' },
  { id: 'sw', x: 0, y: 1, cursor: 'nesw-resize' },
  { id: 'w', x: 0, y: 0.5, cursor: 'ew-resize' },
]

interface Props {
  marquee: Rect | null
  draw: Rect | null
  snapLines: SnapLine[]
  dropParent: string | null
  dropIndex: number
}

export function Overlay({ marquee, draw, snapLines, dropParent, dropIndex }: Props) {
  const selection = useStore((s) => s.selection)
  const hover = useStore((s) => s.hover)
  const doc = useStore((s) => s.doc)
  const viewport = useStore((s) => s.viewport)
  const editing = useStore((s) => s.editing)

  const [bounds, setBounds] = useState<Rect | null>(null)
  const [members, setMembers] = useState<Rect[]>([])
  const [hoverRect, setHoverRect] = useState<Rect | null>(null)
  const [dropRect, setDropRect] = useState<Rect | null>(null)
  const [dropLine, setDropLine] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null)
  const resizing = useRef<null | {
    handle: HandleId
    start: Rect
    nodes: { id: string; r: Rect }[]
    sx: number
    sy: number
    siblings: Rect[]
    /** the host frame's layout grid, solved once when the handle is grabbed */
    lines: GridLines
  }>(null)

  // measure after every commit so overlays never lag a frame behind
  useLayoutEffect(() => {
    const rects: Rect[] = []
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const id of selection) {
      const r = nodeWorldRect(id)
      if (!r) continue
      rects.push(r)
      minX = Math.min(minX, r.x)
      minY = Math.min(minY, r.y)
      maxX = Math.max(maxX, r.x + r.w)
      maxY = Math.max(maxY, r.y + r.h)
    }
    setMembers(rects.length > 1 ? rects : [])
    setBounds(rects.length ? rect(minX, minY, maxX - minX, maxY - minY) : null)
    setHoverRect(hover && !selection.includes(hover) ? nodeWorldRect(hover) : null)

    if (dropParent) {
      setDropRect(nodeWorldRect(dropParent))
      const pn = doc.nodes[dropParent]
      if (pn && dropIndex >= 0 && (pn.layout.mode === 'row' || pn.layout.mode === 'column')) {
        const horizontal = pn.layout.mode === 'row'
        const pr = nodeWorldRect(dropParent)
        const kids = pn.children
        const at = Math.min(dropIndex, kids.length)
        let pos = 0
        if (!pr) {
          setDropLine(null)
          return
        }
        if (kids.length === 0) pos = horizontal ? pr.x + pr.w / 2 : pr.y + pr.h / 2
        else if (at >= kids.length) {
          const r = nodeWorldRect(kids[kids.length - 1])
          pos = r ? (horizontal ? r.x + r.w + pn.layout.gap / 2 : r.y + r.h + pn.layout.gap / 2) : 0
        } else {
          const r = nodeWorldRect(kids[at])
          pos = r ? (horizontal ? r.x - pn.layout.gap / 2 : r.y - pn.layout.gap / 2) : 0
        }
        setDropLine(
          horizontal
            ? { x1: pos, y1: pr.y + 4, x2: pos, y2: pr.y + pr.h - 4 }
            : { x1: pr.x + 4, y1: pos, x2: pr.x + pr.w - 4, y2: pos },
        )
      } else setDropLine(null)
    } else {
      setDropRect(null)
      setDropLine(null)
    }
  }, [selection, hover, doc, viewport, dropParent, dropIndex])

  const W = (v: number) => v * viewport.zoom + viewport.x
  const H = (v: number) => v * viewport.zoom + viewport.y
  const S = (v: number) => v * viewport.zoom

  // --- resize -------------------------------------------------------------
  const startResize = (e: React.PointerEvent, handle: HandleId) => {
    e.stopPropagation()
    e.preventDefault()
    const st = useStore.getState()
    if (!bounds) return
    const nodes = selection
      .map((id) => ({ id, r: nodeWorldRect(id) }))
      .filter((x): x is { id: string; r: Rect } => !!x.r)
    const parentId = st.doc.nodes[selection[0]]?.parent ?? null
    const siblings: Rect[] = []
    const sibIds = parentId ? st.doc.nodes[parentId].children : st.doc.roots
    for (const sid of sibIds.slice(0, 60)) {
      if (selection.includes(sid)) continue
      const r = nodeWorldRect(sid)
      if (r) siblings.push(r)
    }
    if (parentId) {
      const pr = nodeWorldRect(parentId)
      if (pr) siblings.push(pr)
    }
    const host = frameOf(st.doc.nodes, selection[0])
    resizing.current = {
      handle,
      start: { ...bounds },
      nodes,
      sx: 0,
      sy: 0,
      siblings,
      lines: host ? frameGridLines(host.id) : { xs: [], ys: [] },
    }
    st.begin()
    const canvas = document.getElementById('cider-canvas')!
    const cr = canvas.getBoundingClientRect()
    const originX = e.clientX
    const originY = e.clientY

    const onMove = (ev: PointerEvent) => {
      const g = resizing.current
      if (!g) return
      void cr
      const z = useStore.getState().viewport.zoom
      const dx = (ev.clientX - originX) / z
      const dy = (ev.clientY - originY) / z
      let { x, y, w, h } = g.start
      const hs = g.handle
      const right = x + w
      const bottom = y + h

      let nx = x
      let ny = y
      let nw = w
      let nh = h
      const gridSize = useStore.getState().prefs.snap ? useStore.getState().prefs.gridSize : 0
      const thr = snapThreshold(z)
      // Sibling edges first, then the layout grid: an edge you can see beats
      // the scaffolding behind it when both are in range.
      const xs = [...g.siblings.flatMap((r) => [r.x, r.x + r.w]), ...g.lines.xs]
      const ys = [...g.siblings.flatMap((r) => [r.y, r.y + r.h]), ...g.lines.ys]

      if (hs.includes('w')) {
        const v = snapValue(x + dx, xs, thr, gridSize)
        nx = Math.min(v, right - 2)
        nw = right - nx
      }
      if (hs.includes('e')) {
        const v = snapValue(right + dx, xs, thr, gridSize)
        nw = Math.max(2, v - x)
      }
      if (hs.includes('n')) {
        const v = snapValue(y + dy, ys, thr, gridSize)
        ny = Math.min(v, bottom - 2)
        nh = bottom - ny
      }
      if (hs.includes('s')) {
        const v = snapValue(bottom + dy, ys, thr, gridSize)
        nh = Math.max(2, v - y)
      }

      if (keys.shift && w > 0 && h > 0 && hs.length === 2) {
        const ar = w / h
        if (nw / nh > ar) nw = nh * ar
        else nh = nw / ar
        if (hs.includes('w')) nx = right - nw
        if (hs.includes('n')) ny = bottom - nh
      }
      if (keys.alt) {
        const cx = x + w / 2
        const cy = y + h / 2
        if (hs.includes('w') || hs.includes('e')) {
          nw = Math.abs((hs.includes('e') ? nw : nw) * 1)
          nx = cx - nw / 2
        }
        if (hs.includes('n') || hs.includes('s')) {
          ny = cy - nh / 2
        }
      }

      const kx = w > 0 ? nw / w : 1
      const ky = h > 0 ? nh / h : 1
      useStore.getState().mutate((d) => {
        for (const item of g.nodes) {
          const n = d.nodes[item.id]
          if (!n || n.locked) continue
          const relX = w > 0 ? (item.r.x - x) / w : 0
          const relY = h > 0 ? (item.r.y - y) / h : 0
          const worldX = nx + relX * nw
          const worldY = ny + relY * nh
          const pAbs = n.parent ? absPos(d.nodes as Record<string, Node>, n.parent) : { x: 0, y: 0 }
          n.frame.x = Math.round(worldX - pAbs.x)
          n.frame.y = Math.round(worldY - pAbs.y)
          n.frame.w = Math.max(1, Math.round(item.r.w * kx))
          n.frame.h = Math.max(1, Math.round(item.r.h * ky))
          n.size = { w: 'fixed', h: 'fixed' }
        }
      }, false)
    }

    const onUp = () => {
      resizing.current = null
      useStore.getState().end()
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const primary = selection.length === 1 ? doc.nodes[selection[0]] : undefined
  const showHandles = !!bounds && !editing && bounds.w * viewport.zoom > 14 && bounds.h * viewport.zoom > 14

  return (
    <div className="overlay">
      {/* hover */}
      {hoverRect && (
        <div
          className={`hover-box ${doc.nodes[hover!] && doc.nodes[hover!].children.length ? 'container' : ''}`}
          style={{
            left: W(hoverRect.x),
            top: H(hoverRect.y),
            width: S(hoverRect.w),
            height: S(hoverRect.h),
          }}
        />
      )}

      {/* drop target */}
      {dropRect && (
        <div
          className="drop-target"
          style={{ left: W(dropRect.x), top: H(dropRect.y), width: S(dropRect.w), height: S(dropRect.h) }}
        />
      )}
      {dropLine && (
        <div
          className="drop-line"
          style={{
            left: W(Math.min(dropLine.x1, dropLine.x2)) - (dropLine.x1 === dropLine.x2 ? 1.5 : 0),
            top: H(Math.min(dropLine.y1, dropLine.y2)) - (dropLine.y1 === dropLine.y2 ? 1.5 : 0),
            width: dropLine.x1 === dropLine.x2 ? 3 : S(Math.abs(dropLine.x2 - dropLine.x1)),
            height: dropLine.y1 === dropLine.y2 ? 3 : S(Math.abs(dropLine.y2 - dropLine.y1)),
          }}
        />
      )}

      {/* members of a multi-selection */}
      {members.map((r, i) => (
        <div
          key={i}
          className="sel-box member"
          style={{ left: W(r.x), top: H(r.y), width: S(r.w), height: S(r.h) }}
        />
      ))}

      {/* selection */}
      {bounds && (
        <>
          <div
            className={`sel-box ${selection.length > 1 ? 'multi' : ''}`}
            style={{ left: W(bounds.x), top: H(bounds.y), width: S(bounds.w), height: S(bounds.h) }}
          />
          {showHandles &&
            HANDLES.map((hd) => (
              <div
                key={hd.id}
                className={`handle ${hd.x === 0.5 || hd.y === 0.5 ? 'round' : ''}`}
                style={{
                  left: W(bounds.x + bounds.w * hd.x),
                  top: H(bounds.y + bounds.h * hd.y),
                  cursor: hd.cursor,
                }}
                onPointerDown={(e) => startResize(e, hd.id)}
              />
            ))}
          {!editing && (
            <div className="sel-size" style={{ left: W(bounds.x + bounds.w / 2), top: H(bounds.y + bounds.h) + 9 }}>
              {Math.round(bounds.w)} × {Math.round(bounds.h)}
            </div>
          )}
          {primary?.link && (
            <div className="link-badge" style={{ left: W(bounds.x + bounds.w), top: H(bounds.y) }}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M7 17L17 7M9 7h8v8" />
              </svg>
            </div>
          )}
        </>
      )}

      {/* snap guides */}
      {snapLines.map((l, i) =>
        l.axis === 'x' ? (
          <div
            key={i}
            className={`snap-line v ${l.grid ? 'from-grid' : ''}`}
            style={{ left: W(l.pos), top: H(l.from), height: S(l.to - l.from) }}
          />
        ) : (
          <div
            key={i}
            className={`snap-line h ${l.grid ? 'from-grid' : ''}`}
            style={{ top: H(l.pos), left: W(l.from), width: S(l.to - l.from) }}
          />
        ),
      )}

      {/* marquee + draw preview */}
      {marquee && (
        <div className="marquee" style={{ left: marquee.x, top: marquee.y, width: marquee.w, height: marquee.h }} />
      )}
      {draw && (
        <div
          className="marquee"
          style={{ left: W(draw.x), top: H(draw.y), width: S(draw.w), height: S(draw.h) }}
        />
      )}
    </div>
  )
}
