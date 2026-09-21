import { uid } from './id'
import { rect, unionRects } from './geometry'
import type { Doc, Layout, LayoutMode, Node, NodeSpec, NodeType, Rect, Size } from './types'

/** Patch accepted by makeNode — layout/size may be partial and get defaults. */
export type NodePatch = Partial<Omit<Node, 'layout' | 'size'>> & {
  layout?: Partial<Layout>
  size?: Partial<Size>
}

export const defaultLayout = (): Layout => ({
  mode: 'free',
  gap: 12,
  pad: [0, 0, 0, 0],
  align: 'start',
  justify: 'start',
  columns: 2,
  wrap: false,
})

export const defaultSize = (): Size => ({ w: 'fixed', h: 'fixed' })

/** Node types that can hold children. */
const CONTAINERS = new Set<NodeType>(['frame', 'group', 'stack', 'grid'])
export const isContainer = (n: Node | undefined): boolean => !!n && CONTAINERS.has(n.type)

/** Node types whose children are laid out by the browser rather than by x/y. */
export const isAutoLayout = (n: Node | undefined): boolean =>
  !!n && (n.layout.mode === 'row' || n.layout.mode === 'column' || n.layout.mode === 'grid')

export function makeNode(type: NodeType, patch: NodePatch = {}): Node {
  return {
    id: patch.id ?? uid(),
    type,
    name: patch.name ?? defaultName(type),
    parent: patch.parent ?? null,
    children: patch.children ?? [],
    frame: patch.frame ?? rect(0, 0, 100, 40),
    layout: { ...defaultLayout(), ...(patch.layout ?? {}) },
    size: { ...defaultSize(), ...(patch.size ?? {}) },
    style: patch.style ?? {},
    props: patch.props ?? {},
    rotation: patch.rotation ?? 0,
    locked: patch.locked ?? false,
    hidden: patch.hidden ?? false,
    link: patch.link,
    guides: patch.guides ?? null,
    from: patch.from,
  }
}

const NAMES: Partial<Record<NodeType, string>> = {
  frame: 'Frame',
  group: 'Group',
  stack: 'Stack',
  grid: 'Grid',
  box: 'Box',
  text: 'Text',
  image: 'Image',
  icon: 'Icon',
  ellipse: 'Ellipse',
  line: 'Line',
  arrow: 'Arrow',
  scribble: 'Text lines',
  sticky: 'Sticky',
  divider: 'Divider',
  button: 'Button',
  input: 'Input',
  textarea: 'Textarea',
  select: 'Select',
  checkbox: 'Checkbox',
  radio: 'Radio',
  switch: 'Switch',
  slider: 'Slider',
  segmented: 'Segmented',
  rating: 'Rating',
  stepper: 'Stepper',
  avatar: 'Avatar',
  badge: 'Badge',
  progress: 'Progress',
  spinner: 'Spinner',
  chart: 'Chart',
  table: 'Table',
  calendar: 'Calendar',
  code: 'Code',
  map: 'Map',
  video: 'Video',
  qr: 'QR',
  browserbar: 'Browser bar',
  statusbar: 'Status bar',
}

export const defaultName = (type: NodeType) => NAMES[type] ?? type

// ---------------------------------------------------------------------------
// Spec instantiation
// ---------------------------------------------------------------------------

/**
 * Turn a declarative NodeSpec tree into real nodes and write them into `nodes`.
 * Returns the id of the created root.
 */
export function instantiate(
  spec: NodeSpec,
  nodes: Record<string, Node>,
  parent: string | null,
  origin?: string,
  parentMode?: LayoutMode,
): string {
  // An auto-layout container with no explicit size fills its parent's main
  // axis and hugs its content on the other — the default that makes a column
  // of rows behave the way you expect without spelling it out everywhere.
  // Inside a grid, a child fills its track unless it asks not to; a fixed
  // width there would just overflow the column.
  const auto = spec.layout?.mode === 'row' || spec.layout?.mode === 'column' || spec.layout?.mode === 'grid'
  const inGrid = parentMode === 'grid'
  const size: Size = {
    w: spec.size?.w ?? (inGrid ? 'fill' : spec.w !== undefined ? 'fixed' : auto ? 'fill' : 'fixed'),
    h: spec.size?.h ?? (spec.h !== undefined ? 'fixed' : auto ? 'hug' : 'fixed'),
  }
  const node = makeNode(spec.type, {
    name: spec.name,
    parent,
    frame: rect(spec.x ?? 0, spec.y ?? 0, spec.w ?? 120, spec.h ?? 40),
    layout: spec.layout,
    size,
    style: spec.style,
    props: spec.props,
    locked: spec.locked,
    guides: spec.guides ?? null,
    from: origin,
  })
  nodes[node.id] = node
  if (spec.children?.length) {
    node.children = spec.children.map((c) => instantiate(c, nodes, node.id, undefined, node.layout.mode))
  }
  return node.id
}

/** Deep-copy a subtree under a new parent, returning the new root id. */
export function cloneSubtree(
  nodes: Record<string, Node>,
  id: string,
  parent: string | null,
): string {
  const src = nodes[id]
  if (!src) return id
  const copy: Node = {
    ...src,
    id: uid(),
    parent,
    children: [],
    frame: { ...src.frame },
    layout: { ...src.layout },
    size: { ...src.size },
    style: { ...src.style },
    props: JSON.parse(JSON.stringify(src.props ?? {})),
    guides: src.guides ? { ...src.guides } : null,
  }
  nodes[copy.id] = copy
  copy.children = src.children.map((c) => cloneSubtree(nodes, c, copy.id))
  return copy.id
}

// ---------------------------------------------------------------------------
// Tree walking
// ---------------------------------------------------------------------------

export function* walk(nodes: Record<string, Node>, id: string): Generator<Node> {
  const n = nodes[id]
  if (!n) return
  yield n
  for (const c of n.children) yield* walk(nodes, c)
}

export function descendants(nodes: Record<string, Node>, id: string): string[] {
  const out: string[] = []
  const stack = [...(nodes[id]?.children ?? [])]
  while (stack.length) {
    const cur = stack.pop()!
    out.push(cur)
    const n = nodes[cur]
    if (n) stack.push(...n.children)
  }
  return out
}

export function ancestors(nodes: Record<string, Node>, id: string): string[] {
  const out: string[] = []
  let cur = nodes[id]?.parent
  while (cur) {
    out.push(cur)
    cur = nodes[cur]?.parent
  }
  return out
}

export function isDescendantOf(nodes: Record<string, Node>, id: string, maybeAncestor: string) {
  let cur = nodes[id]?.parent
  while (cur) {
    if (cur === maybeAncestor) return true
    cur = nodes[cur]?.parent
  }
  return false
}

/**
 * Every top-most frame in the document, in reading order. Frames can be nested
 * inside groups (a flow of screens dragged around together), so presentation
 * and prototype links walk the tree rather than just scanning the roots.
 */
export function frameList(doc: Doc): string[] {
  const out: string[] = []
  const visit = (id: string) => {
    const n = doc.nodes[id]
    if (!n) return
    if (n.type === 'frame') {
      out.push(id)
      return
    }
    for (const c of n.children) visit(c)
  }
  for (const id of doc.roots) visit(id)
  return out
}

/** Nearest ancestor of type `frame`, or the node itself if it is a frame. */
export function frameOf(nodes: Record<string, Node>, id: string): Node | undefined {
  let cur: Node | undefined = nodes[id]
  while (cur) {
    if (cur.type === 'frame') return cur
    cur = cur.parent ? nodes[cur.parent] : undefined
  }
  return undefined
}

// ---------------------------------------------------------------------------
// Coordinates
// ---------------------------------------------------------------------------

/** Absolute (world-space) top-left of a node, using stored frames. */
export function absPos(nodes: Record<string, Node>, id: string): { x: number; y: number } {
  let x = 0
  let y = 0
  let cur: Node | undefined = nodes[id]
  while (cur) {
    x += cur.frame.x
    y += cur.frame.y
    cur = cur.parent ? nodes[cur.parent] : undefined
  }
  return { x, y }
}

export function absRect(nodes: Record<string, Node>, id: string): Rect {
  const n = nodes[id]
  if (!n) return rect(0, 0, 0, 0)
  const p = absPos(nodes, id)
  return rect(p.x, p.y, n.frame.w, n.frame.h)
}

export function selectionBounds(nodes: Record<string, Node>, ids: string[]): Rect {
  return unionRects(ids.filter((id) => nodes[id]).map((id) => absRect(nodes, id)))
}

// ---------------------------------------------------------------------------
// Mutations (operate on a draft — always call inside immer produce)
// ---------------------------------------------------------------------------

export function siblingList(doc: Doc, parent: string | null): string[] {
  return parent ? doc.nodes[parent].children : doc.roots
}

export function detach(doc: Doc, id: string) {
  const n = doc.nodes[id]
  if (!n) return
  const list = siblingList(doc, n.parent)
  const i = list.indexOf(id)
  if (i >= 0) list.splice(i, 1)
}

export function attach(doc: Doc, id: string, parent: string | null, index = -1) {
  const n = doc.nodes[id]
  if (!n) return
  n.parent = parent
  const list = siblingList(doc, parent)
  if (index < 0 || index > list.length) list.push(id)
  else list.splice(index, 0, id)
}

export function removeNode(doc: Doc, id: string) {
  const n = doc.nodes[id]
  if (!n) return
  for (const c of [...n.children]) removeNode(doc, c)
  detach(doc, id)
  delete doc.nodes[id]
}

/** Move `id` into `parent` at `index`, preserving its on-screen position. */
export function reparent(doc: Doc, id: string, parent: string | null, index = -1) {
  const n = doc.nodes[id]
  if (!n) return
  if (parent && (parent === id || isDescendantOf(doc.nodes, parent, id))) return
  const before = absPos(doc.nodes, id)
  detach(doc, id)
  attach(doc, id, parent, index)
  const parentAbs = parent ? absPos(doc.nodes, parent) : { x: 0, y: 0 }
  n.frame.x = before.x - parentAbs.x
  n.frame.y = before.y - parentAbs.y
}

export function emptyDoc(name = 'Untitled'): Doc {
  return {
    id: uid(),
    name,
    nodes: {},
    roots: [],
    theme: 'sketch',
    roughness: 0.55,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

/** Find a free spot to the right of everything already on the canvas. */
export function nextFramePosition(doc: Doc, w: number): { x: number; y: number } {
  const frames = doc.roots.map((id) => doc.nodes[id]).filter(Boolean)
  if (frames.length === 0) return { x: 0, y: 0 }
  const b = unionRects(frames.map((f) => f.frame))
  void w
  return { x: b.x + b.w + 120, y: b.y }
}

/** Unique-ish name for a duplicate: "Card" → "Card copy" → "Card copy 2". */
export function copyName(name: string, existing: Set<string>): string {
  let base = `${name} copy`
  if (!existing.has(base)) return base
  let i = 2
  while (existing.has(`${base} ${i}`)) i++
  return `${base} ${i}`
}
