import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore, type Tool } from '@/store/store'
import { absPos, frameOf, isAutoLayout, isContainer } from '@/core/doc'
import { normalizeRect, rect } from '@/core/geometry'
import type { Node, NodeSpec, Rect } from '@/core/types'
import { NodeView } from '@/render/NodeView'
import { FrameView } from './FrameView'
import { Overlay } from './Overlay'
import { clientToWorld, measuredBounds, nodeWorldRect } from './measure'
import { snapRect, snapThreshold, type GridLines, type SnapLine } from './snapping'
import { frameGridLines } from './GridOverlay'
import { containerAt, insertionIndexAt, insertLibraryItem } from './insert'
import { keys } from './keys'
import { useDragStore } from '@/store/drag'
import { EDITABLE_PROP } from '@/render/NodeView'

type Gesture =
  | { kind: 'none' }
  | { kind: 'pan'; sx: number; sy: number; vx: number; vy: number }
  | { kind: 'marquee'; x0: number; y0: number; additive: boolean }
  | {
      kind: 'move'
      ids: string[]
      sx: number
      sy: number
      origin: Record<string, Rect>
      exclude: Set<string>
      detached: boolean
      moved: boolean
      duped: boolean
      /** the host frame's layout grid, solved once at pick-up */
      lines: GridLines
    }
  | { kind: 'draw'; tool: Tool; x0: number; y0: number }

const DRAW_TOOLS: Tool[] = ['frame', 'box', 'ellipse', 'text', 'line', 'arrow', 'sticky', 'stack']

export function Canvas() {
  const ref = useRef<HTMLDivElement>(null)
  const g = useRef<Gesture>({ kind: 'none' })
  const [marquee, setMarquee] = useState<Rect | null>(null)
  const [draw, setDraw] = useState<Rect | null>(null)
  const [snap, setSnap] = useState<SnapLine[]>([])
  const [dropParent, setDropParent] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number>(-1)
  const [panning, setPanning] = useState(false)

  const doc = useStore((s) => s.doc)
  const viewport = useStore((s) => s.viewport)
  const tool = useStore((s) => s.tool)
  const prefs = useStore((s) => s.prefs)
  const hover = useStore((s) => s.hover)

  // --- wheel: trackpad pan, ctrl/cmd pinch-zoom --------------------------
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const st = useStore.getState()
      const r = el.getBoundingClientRect()
      if (e.ctrlKey || e.metaKey) {
        const factor = Math.exp(-e.deltaY * 0.0115)
        st.zoomBy(factor, e.clientX - r.left, e.clientY - r.top)
      } else {
        const k = e.shiftKey && Math.abs(e.deltaX) < 1 ? { x: -e.deltaY, y: 0 } : { x: -e.deltaX, y: -e.deltaY }
        st.setViewport({ x: st.viewport.x + k.x, y: st.viewport.y + k.y })
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

  // --- library drag-and-drop ---------------------------------------------
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = useDragStore.getState()
      if (!d.item) return
      const r = ref.current?.getBoundingClientRect()
      const over = !!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      d.move(e.clientX, e.clientY, over)
      if (over) {
        const p = containerAt(e.clientX, e.clientY)
        setDropParent(p)
        const pn = p ? useStore.getState().doc.nodes[p] : undefined
        setDropIndex(pn && isAutoLayout(pn) ? insertionIndexAt(p!, e.clientX, e.clientY) : -1)
      } else {
        setDropParent(null)
        setDropIndex(-1)
      }
    }
    const onUp = (e: PointerEvent) => {
      const d = useDragStore.getState()
      if (!d.item) return
      const item = d.item
      const r = ref.current?.getBoundingClientRect()
      const over = !!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      d.end()
      setDropParent(null)
      setDropIndex(-1)
      if (over) {
        const id = insertLibraryItem(item, e.clientX, e.clientY)
        useStore.getState().select(id)
      }
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  // -----------------------------------------------------------------------
  const resolveTarget = useCallback((clientX: number, clientY: number, deep: boolean): string | null => {
    const stack = document.elementsFromPoint(clientX, clientY)
    const st = useStore.getState()
    for (const el of stack) {
      const host = (el as HTMLElement).closest?.('[data-node-id]') as HTMLElement | null
      if (!host) continue
      const id = host.dataset.nodeId
      if (!id || !st.doc.nodes[id]) continue
      if (deep) return id
      // default granularity: the outermost thing that is not the frame itself
      let cur = st.doc.nodes[id]
      if (cur.type === 'frame') return cur.id
      while (cur.parent) {
        const p = st.doc.nodes[cur.parent]
        if (!p) break
        if (p.type === 'frame') return cur.id
        cur = p
      }
      return cur.id
    }
    return null
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button === 2) return
    const st = useStore.getState()
    const el = ref.current!
    const r = el.getBoundingClientRect()
    const localX = e.clientX - r.left
    const localY = e.clientY - r.top
    st.setContextMenu(null)
    el.setPointerCapture(e.pointerId)

    // pan
    if (e.button === 1 || keys.space || tool === 'hand') {
      g.current = { kind: 'pan', sx: localX, sy: localY, vx: viewport.x, vy: viewport.y }
      setPanning(true)
      return
    }

    // draw tools
    if (DRAW_TOOLS.includes(tool)) {
      const w = clientToWorld(e.clientX, e.clientY)
      g.current = { kind: 'draw', tool, x0: w.x, y0: w.y }
      setDraw(rect(w.x, w.y, 0, 0))
      return
    }

    const targetId = resolveTarget(e.clientX, e.clientY, e.metaKey || e.ctrlKey)

    if (!targetId) {
      g.current = { kind: 'marquee', x0: localX, y0: localY, additive: e.shiftKey }
      if (!e.shiftKey) st.select(null)
      setMarquee(rect(localX, localY, 0, 0))
      return
    }

    let ids = st.selection
    if (e.shiftKey) {
      st.select(targetId, true)
      ids = useStore.getState().selection
    } else if (!ids.includes(targetId)) {
      st.select(targetId)
      ids = [targetId]
    }

    // drag the whole selection
    const origin: Record<string, Rect> = {}
    const exclude = new Set<string>()
    for (const id of ids) {
      const wr = nodeWorldRect(id)
      if (wr) origin[id] = wr
      exclude.add(id)
      const stack = [...(st.doc.nodes[id]?.children ?? [])]
      while (stack.length) {
        const c = stack.pop()!
        exclude.add(c)
        stack.push(...(st.doc.nodes[c]?.children ?? []))
      }
    }
    const w = clientToWorld(e.clientX, e.clientY)
    // Solving the grid on every pointermove would redo the same arithmetic 60
    // times a second; the frame cannot change mid-drag, so do it once here.
    const host = frameOf(st.doc.nodes, ids[0])
    g.current = {
      kind: 'move',
      ids,
      sx: w.x,
      sy: w.y,
      origin,
      exclude,
      detached: false,
      moved: false,
      duped: false,
      lines: host ? frameGridLines(host.id) : { xs: [], ys: [] },
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const st = useStore.getState()
    const el = ref.current!
    const r = el.getBoundingClientRect()
    const localX = e.clientX - r.left
    const localY = e.clientY - r.top
    const world = clientToWorld(e.clientX, e.clientY)
    st.setCursor(world.x, world.y)

    const cur = g.current
    if (cur.kind === 'none') {
      if (!DRAW_TOOLS.includes(tool) && tool !== 'hand') {
        const id = resolveTarget(e.clientX, e.clientY, e.metaKey || e.ctrlKey)
        st.setHover(id)
      } else if (hover) st.setHover(null)
      return
    }

    if (cur.kind === 'pan') {
      st.setViewport({ x: cur.vx + (localX - cur.sx), y: cur.vy + (localY - cur.sy) })
      return
    }

    if (cur.kind === 'marquee') {
      setMarquee(normalizeRect(cur.x0, cur.y0, localX, localY))
      return
    }

    if (cur.kind === 'draw') {
      setDraw(normalizeRect(cur.x0, cur.y0, world.x, world.y))
      return
    }

    // --- move ------------------------------------------------------------
    const dx = world.x - cur.sx
    const dy = world.y - cur.sy
    if (!cur.moved && Math.abs(dx) < 2.5 / viewport.zoom && Math.abs(dy) < 2.5 / viewport.zoom) return

    if (!cur.moved) {
      st.begin()
      cur.moved = true
      // alt-drag duplicates
      if (keys.alt && !cur.duped) {
        st.duplicateSelection(0, 0)
        const newIds = useStore.getState().selection
        cur.ids = newIds
        cur.duped = true
        const origin: Record<string, Rect> = {}
        for (const id of newIds) {
          const wr = nodeWorldRect(id)
          if (wr) origin[id] = wr
        }
        cur.origin = origin
        cur.exclude = new Set(newIds)
      }
      // pull out of auto-layout so dragging actually moves things
      const needsDetach = cur.ids.some((id) => {
        const n = st.doc.nodes[id]
        return n?.parent && isAutoLayout(st.doc.nodes[n.parent])
      })
      if (needsDetach) {
        const snapshot: Record<string, Rect> = { ...cur.origin }
        st.mutate((d) => {
          for (const id of cur.ids) {
            const n = d.nodes[id]
            if (!n?.parent) continue
            if (!isAutoLayout(d.nodes[n.parent])) continue
            const wr = snapshot[id]
            // hop up to the nearest non-auto ancestor
            let host: string | null = n.parent
            while (host && isAutoLayout(d.nodes[host])) host = d.nodes[host].parent
            const list = host ? d.nodes[host].children : d.roots
            const kids = d.nodes[n.parent].children
            kids.splice(kids.indexOf(id), 1)
            n.parent = host
            list.push(id)
            if (wr) {
              const hostAbs = host ? absPos(d.nodes as Record<string, Node>, host) : { x: 0, y: 0 }
              n.frame.x = Math.round(wr.x - hostAbs.x)
              n.frame.y = Math.round(wr.y - hostAbs.y)
              n.frame.w = Math.round(wr.w)
              n.frame.h = Math.round(wr.h)
            }
            n.size = { w: 'fixed', h: 'fixed' }
          }
        }, false)
        cur.detached = true
      }
    }

    // snapping against siblings of the primary node
    let sdx = 0
    let sdy = 0
    let lines: SnapLine[] = []
    const primary = cur.ids[0]
    const po = cur.origin[primary]
    if (po && prefs.snap && !keys.meta) {
      const moving = rect(po.x + dx, po.y + dy, po.w, po.h)
      const parentId = st.doc.nodes[primary]?.parent ?? null
      const siblings = (parentId ? st.doc.nodes[parentId].children : st.doc.roots).filter(
        (id) => !cur.exclude.has(id),
      )
      const targets: Rect[] = []
      for (const sid of siblings.slice(0, 80)) {
        const wr = nodeWorldRect(sid)
        if (wr) targets.push(wr)
      }
      if (parentId) {
        const pr = nodeWorldRect(parentId)
        if (pr) targets.push(pr)
      }
      const res = snapRect(moving, targets, snapThreshold(viewport.zoom), prefs.gridSize, cur.lines)
      sdx = res.dx
      sdy = res.dy
      lines = res.lines
    }
    setSnap(lines)

    st.mutate((d) => {
      for (const id of cur.ids) {
        const n = d.nodes[id]
        const o = cur.origin[id]
        if (!n || !o || n.locked) continue
        const parentAbs = n.parent ? absPos(d.nodes as Record<string, Node>, n.parent) : { x: 0, y: 0 }
        n.frame.x = Math.round(o.x + dx + sdx - parentAbs.x)
        n.frame.y = Math.round(o.y + dy + sdy - parentAbs.y)
      }
    }, false)

    // where would this land?
    const p = containerAt(e.clientX, e.clientY, cur.exclude)
    setDropParent(p)
    const pn = p ? st.doc.nodes[p] : undefined
    setDropIndex(pn && isAutoLayout(pn) ? insertionIndexAt(p!, e.clientX, e.clientY, cur.exclude) : -1)
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const st = useStore.getState()
    const cur = g.current
    g.current = { kind: 'none' }
    setPanning(false)
    ref.current?.releasePointerCapture?.(e.pointerId)

    if (cur.kind === 'marquee') {
      const m = marquee
      setMarquee(null)
      if (!m || m.w < 3 || m.h < 3) return
      const world = rect(
        (m.x - viewport.x) / viewport.zoom,
        (m.y - viewport.y) / viewport.zoom,
        m.w / viewport.zoom,
        m.h / viewport.zoom,
      )
      const picked: string[] = []
      const consider = (id: string) => {
        const wr = nodeWorldRect(id)
        if (!wr) return
        const hit =
          wr.x < world.x + world.w && wr.x + wr.w > world.x && wr.y < world.y + world.h && wr.y + wr.h > world.y
        if (hit) picked.push(id)
      }
      for (const rootId of st.doc.roots) {
        const n = st.doc.nodes[rootId]
        if (!n || n.hidden || n.locked) continue
        if (n.type === 'frame') {
          const fr = nodeWorldRect(rootId)
          const fullyInside =
            fr && fr.x >= world.x && fr.y >= world.y && fr.x + fr.w <= world.x + world.w && fr.y + fr.h <= world.y + world.h
          if (fullyInside) picked.push(rootId)
          else n.children.forEach(consider)
        } else consider(rootId)
      }
      st.select(cur.additive ? [...st.selection, ...picked] : picked)
      return
    }

    if (cur.kind === 'draw') {
      const d = draw
      setDraw(null)
      const created = createDrawn(cur.tool, d, cur.x0, cur.y0, e.clientX, e.clientY)
      if (created) {
        st.select(created)
        st.setTool('select')
        const n = useStore.getState().doc.nodes[created]
        if (n && (n.type === 'text' || n.type === 'sticky')) st.setEditing(created)
      }
      return
    }

    if (cur.kind === 'move') {
      setSnap([])
      const p = dropParent
      const idx = dropIndex
      setDropParent(null)
      setDropIndex(-1)
      if (cur.moved) {
        const changed = cur.ids.filter((id) => (st.doc.nodes[id]?.parent ?? null) !== p)
        if (changed.length || (p && idx >= 0)) {
          st.mutate((d) => {
            for (const id of cur.ids) {
              const n = d.nodes[id]
              if (!n) continue
              const wr = nodeWorldRect(id)
              const from = n.parent ? d.nodes[n.parent].children : d.roots
              from.splice(from.indexOf(id), 1)
              n.parent = p
              const to = p ? d.nodes[p].children : d.roots
              if (p && idx >= 0) to.splice(Math.min(idx, to.length), 0, id)
              else to.push(id)
              const pAbs = p ? absPos(d.nodes as Record<string, Node>, p) : { x: 0, y: 0 }
              if (wr) {
                n.frame.x = Math.round(wr.x - pAbs.x)
                n.frame.y = Math.round(wr.y - pAbs.y)
              }
            }
          }, false)
        }
        st.end()
      }
      return
    }
  }

  const createDrawn = (
    t: Tool,
    r: Rect | null,
    x0: number,
    y0: number,
    clientX: number,
    clientY: number,
  ): string | null => {
    const st = useStore.getState()
    const tiny = !r || r.w < 6 || r.h < 6
    const defaults: Record<string, { w: number; h: number; spec: (w: number, h: number) => NodeSpec }> = {
      frame: { w: 390, h: 844, spec: (w, h) => ({ type: 'frame', name: 'Frame', w, h, style: { fill: 'var(--w-paper)', clip: true }, props: { chrome: 'none' } }) },
      box: { w: 160, h: 100, spec: (w, h) => ({ type: 'box', w, h }) },
      ellipse: { w: 120, h: 120, spec: (w, h) => ({ type: 'ellipse', w, h }) },
      text: { w: 220, h: 28, spec: (w, h) => ({ type: 'text', w, h: Math.max(h, 24), props: { text: 'Text' }, size: { w: 'fixed', h: 'hug' } }) },
      sticky: { w: 180, h: 160, spec: (w, h) => ({ type: 'sticky', w, h, props: { text: '' } }) },
      line: { w: 200, h: 2, spec: (w, h) => ({ type: 'line', w, h: Math.max(2, h), props: { x1: 0, y1: 0.5, x2: 1, y2: 0.5 } }) },
      arrow: { w: 200, h: 2, spec: (w, h) => ({ type: 'arrow', w, h: Math.max(2, h), props: { head: 'end', x1: 0, y1: 0.5, x2: 1, y2: 0.5 } }) },
      stack: {
        w: 320,
        h: 160,
        spec: (w, h) => ({
          type: 'stack',
          name: 'Column',
          w,
          h,
          layout: { mode: 'column', gap: 12, pad: [12, 12, 12, 12], align: 'stretch' },
          style: { stroke: 'var(--w-faint)', strokeStyle: 'dashed' },
        }),
      },
    }
    const def = defaults[t]
    if (!def) return null
    const w = tiny ? def.w : Math.round(r!.w)
    const h = tiny ? def.h : Math.round(r!.h)
    const x = tiny ? x0 : r!.x
    const y = tiny ? y0 : r!.y
    const spec = def.spec(w, h)

    if (t === 'frame') {
      return st.insertSpec(spec, { parent: null, x: Math.round(x), y: Math.round(y), origin: 'tool:frame' })
    }
    const parentId = containerAt(clientX, clientY)
    if (!parentId) {
      return st.insertSpec(spec, { parent: null, x: Math.round(x), y: Math.round(y), origin: `tool:${t}` })
    }
    const parent = st.doc.nodes[parentId]
    if (isAutoLayout(parent)) {
      const index = insertionIndexAt(parentId, clientX, clientY)
      const id = st.insertSpec(spec, { parent: parentId, origin: `tool:${t}` })
      st.mutate((d) => {
        const kids = d.nodes[parentId].children
        const at = kids.indexOf(id)
        if (at >= 0 && index >= 0 && index !== at) {
          kids.splice(at, 1)
          kids.splice(Math.min(index, kids.length), 0, id)
        }
      })
      return id
    }
    const pr = nodeWorldRect(parentId)
    const id = st.insertSpec(spec, { parent: parentId, origin: `tool:${t}` })
    st.mutate((d) => {
      const n = d.nodes[id]
      if (!n) return
      n.frame.x = Math.round(pr ? x - pr.x : x)
      n.frame.y = Math.round(pr ? y - pr.y : y)
    })
    return id
  }

  const onDoubleClick = (e: React.PointerEvent) => {
    const st = useStore.getState()
    const deep = resolveTarget(e.clientX, e.clientY, true)
    if (!deep) return
    const n = st.doc.nodes[deep]
    if (!n) return
    st.select(deep)
    if (EDITABLE_PROP[n.type] && !isContainer(n)) st.setEditing(deep)
  }

  const onContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    const st = useStore.getState()
    const target = resolveTarget(e.clientX, e.clientY, e.altKey)
    if (target && !st.selection.includes(target)) st.select(target)
    st.setContextMenu({ x: e.clientX, y: e.clientY, target: target ?? null })
  }

  // grid sizing in screen space
  const gridStep = prefs.gridSize * viewport.zoom
  const major = gridStep < 6 ? gridStep * 8 : gridStep < 14 ? gridStep * 4 : gridStep
  const isDrawTool = DRAW_TOOLS.includes(tool)

  return (
    <div
      id="cider-canvas"
      ref={ref}
      className={`canvas ${tool === 'hand' ? 'tool-hand' : ''} ${isDrawTool ? 'tool-draw' : ''} ${panning || keys.space ? 'panning' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={onDoubleClick as any}
      onContextMenu={onContextMenu}
      onPointerLeave={() => useStore.getState().setHover(null)}
    >
      {prefs.showGrid && (
        <div
          className="canvas-grid"
          style={{
            backgroundSize: `${major}px ${major}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
            opacity: major < 5 ? 0 : 1,
          }}
        />
      )}

      <div
        className={`world w-surface w-theme-${doc.theme} ${doc.roughness > 0.02 && doc.theme !== 'wire' ? 'rough-on' : ''}`}
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        {doc.roots.map((id) =>
          doc.nodes[id]?.type === 'frame' ? (
            <FrameView key={id} id={id} />
          ) : (
            <NodeView key={id} id={id} parentId={null} />
          ),
        )}
      </div>

      <Overlay
        marquee={marquee}
        draw={draw}
        snapLines={snap}
        dropParent={dropParent}
        dropIndex={dropIndex}
      />
    </div>
  )
}

/** Used by the overlay to draw the selection box for measured nodes. */
export function selectionRect(ids: string[]): Rect | null {
  return measuredBounds(ids)
}
