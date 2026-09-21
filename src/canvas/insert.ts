import type { LibraryItem, NodeSpec } from '@/core/types'
import { useStore } from '@/store/store'
import { isAutoLayout } from '@/core/doc'
import { clientToWorld, nodeWorldRect } from './measure'

/** Deepest container under a client point, skipping excluded subtrees. */
export function containerAt(clientX: number, clientY: number, exclude?: Set<string>): string | null {
  const stack = document.elementsFromPoint(clientX, clientY)
  const { doc } = useStore.getState()
  for (const el of stack) {
    const host = (el as HTMLElement).closest?.('[data-node-id]') as HTMLElement | null
    if (!host) continue
    let id: string | null = host.dataset.nodeId ?? null
    // walk up to the nearest allowed container
    while (id) {
      const n = doc.nodes[id]
      if (!n) break
      const blocked = exclude?.has(id) || n.locked
      const canHold = n.type === 'frame' || n.type === 'group' || n.type === 'stack' || n.type === 'grid'
      if (!blocked && canHold) return id
      id = n.parent
    }
  }
  return null
}

/** Where a drop lands in an auto-layout container, by comparing child midpoints. */
export function insertionIndexAt(parentId: string, clientX: number, clientY: number, exclude?: Set<string>): number {
  const { doc } = useStore.getState()
  const parent = doc.nodes[parentId]
  if (!parent) return -1
  const horizontal = parent.layout.mode === 'row'
  let index = 0
  for (const childId of parent.children) {
    if (exclude?.has(childId)) continue
    const el = document.querySelector<HTMLElement>(`[data-node-id="${childId}"]`)
    if (!el) {
      index++
      continue
    }
    const r = el.getBoundingClientRect()
    const mid = horizontal ? r.left + r.width / 2 : r.top + r.height / 2
    const p = horizontal ? clientX : clientY
    if (p > mid) index++
    else break
  }
  return index
}

/** Screen rect of the insertion line for the current drop, in canvas-local px. */
export function insertionLine(
  parentId: string,
  index: number,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const { doc } = useStore.getState()
  const parent = doc.nodes[parentId]
  if (!parent) return null
  const horizontal = parent.layout.mode === 'row'
  const pr = nodeWorldRect(parentId)
  if (!pr) return null
  const kids = parent.children
  const at = Math.min(index, kids.length)
  let pos: number
  if (kids.length === 0) {
    pos = horizontal ? pr.x + pr.w / 2 : pr.y + pr.h / 2
  } else if (at >= kids.length) {
    const r = nodeWorldRect(kids[kids.length - 1])
    pos = r ? (horizontal ? r.x + r.w + parent.layout.gap / 2 : r.y + r.h + parent.layout.gap / 2) : 0
  } else {
    const r = nodeWorldRect(kids[at])
    pos = r ? (horizontal ? r.x - parent.layout.gap / 2 : r.y - parent.layout.gap / 2) : 0
  }
  return horizontal
    ? { x1: pos, y1: pr.y + 4, x2: pos, y2: pr.y + pr.h - 4 }
    : { x1: pr.x + 4, y1: pos, x2: pr.x + pr.w - 4, y2: pos }
}

/**
 * Place a library item at a screen point: frames land on the canvas, anything
 * else goes into the deepest container under the cursor.
 */
export function insertLibraryItem(
  item: LibraryItem,
  clientX: number,
  clientY: number,
  opts: { center?: boolean } = {},
): string {
  const st = useStore.getState()
  const spec: NodeSpec = item.build()
  const world = clientToWorld(clientX, clientY)
  const cx = opts.center === false ? world.x : world.x - (spec.w ?? item.w) / 2
  const cy = opts.center === false ? world.y : world.y - (spec.h ?? item.h) / 2

  if (spec.type === 'frame' || (spec.type === 'group' && spec.children?.some((c) => c.type === 'frame'))) {
    return st.insertSpec(spec, { parent: null, x: Math.round(cx), y: Math.round(cy), origin: item.id })
  }

  const parentId = containerAt(clientX, clientY)
  if (!parentId) {
    return st.insertSpec(spec, { parent: null, x: Math.round(cx), y: Math.round(cy), origin: item.id })
  }

  const parent = st.doc.nodes[parentId]
  if (isAutoLayout(parent)) {
    const index = insertionIndexAt(parentId, clientX, clientY)
    const id = st.insertSpec(spec, { parent: parentId, x: 0, y: 0, origin: item.id })
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
  const ox = pr ? cx - pr.x : cx
  const oy = pr ? cy - pr.y : cy
  const id = st.insertSpec(spec, { parent: parentId, origin: item.id })
  st.mutate((d) => {
    const n = d.nodes[id]
    if (n) {
      n.frame.x = Math.round(ox)
      n.frame.y = Math.round(oy)
    }
  })
  return id
}

/** Insert at the middle of the viewport — used by the command palette. */
export function insertAtViewportCenter(item: LibraryItem): string {
  const el = document.getElementById('cider-canvas')
  const r = el?.getBoundingClientRect()
  const cx = (r?.left ?? 0) + (r?.width ?? window.innerWidth) / 2
  const cy = (r?.top ?? 0) + (r?.height ?? window.innerHeight) / 2
  return insertLibraryItem(item, cx, cy)
}
