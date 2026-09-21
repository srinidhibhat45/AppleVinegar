import { create } from 'zustand'
import { produce, type Draft } from 'immer'
import {
  absPos,
  absRect,
  attach,
  cloneSubtree,
  copyName,
  defaultLayout,
  descendants,
  detach,
  emptyDoc,
  frameList,
  frameOf,
  instantiate,
  isAutoLayout,
  isContainer,
  makeNode,
  nextFramePosition,
  removeNode,
  reparent,
  selectionBounds,
  siblingList,
} from '@/core/doc'
import { clamp, rect, unionRects } from '@/core/geometry'
import {
  GRID_PRESETS,
  makeGrid,
  makeRegion,
  makeSet,
  migrateGrids,
  regionAt,
  type RegionPath,
} from '@/core/grid'
import type {
  Doc,
  FrameGrid,
  GridRegion,
  GuideSet,
  LayoutMode,
  Node,
  NodeSpec,
  Rect,
  SplitDir,
  Style,
  Theme,
} from '@/core/types'
import { getDevice } from '@/core/devices'
import { useFiles } from '@/files/store'

export type Tool =
  | 'select'
  | 'hand'
  | 'frame'
  | 'box'
  | 'ellipse'
  | 'text'
  | 'line'
  | 'arrow'
  | 'sticky'
  | 'stack'

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export interface ContextMenuState {
  x: number
  y: number
  /** node the menu was opened on, if any */
  target: string | null
}

export interface DropHint {
  /** world-space rect to highlight */
  r: Rect
  /** insertion line for auto-layout drops */
  line?: { x1: number; y1: number; x2: number; y2: number }
}

export interface Toast {
  id: string
  text: string
  tone?: 'info' | 'good' | 'warn'
}

const HISTORY_LIMIT = 200
const STORAGE_KEY = 'applecider:doc:v1'
const PREFS_KEY = 'applecider:prefs:v1'

export interface Prefs {
  showGrid: boolean
  snap: boolean
  gridSize: number
  showGuides: boolean
  leftPanel: boolean
  rightPanel: boolean
  darkUI: boolean
  rulers: boolean
}

const defaultPrefs: Prefs = {
  showGrid: true,
  snap: true,
  gridSize: 8,
  showGuides: true,
  leftPanel: true,
  rightPanel: true,
  darkUI: false,
  rulers: true,
}

export interface State {
  doc: Doc
  past: Doc[]
  future: Doc[]
  _txn: boolean
  _txnBase: Doc | null

  selection: string[]
  hover: string | null
  editing: string | null
  tool: Tool
  viewport: Viewport
  /** pointer position in world space, for paste / quick-insert placement */
  cursor: { x: number; y: number }

  prefs: Prefs
  palette: boolean
  contextMenu: ContextMenuState | null
  dropHint: DropHint | null
  present: { active: boolean; frameId: string | null; history: string[] }
  clipboard: { nodes: Record<string, Node>; roots: string[] } | null
  toasts: Toast[]
  shortcutsOpen: boolean
  /** the code-handoff modal */
  codeOpen: boolean
  /** true while an edit is waiting to be written to storage */
  saving: boolean
  savedAt: number | null
  /** which panel the left rail is showing */
  panel: 'components' | 'layers' | 'frames'
  /** the grid region the inspector is editing, highlighted on canvas */
  gridFocus: { frameId: string; path: RegionPath } | null

  // --- doc mutation -------------------------------------------------------
  mutate: (recipe: (d: Draft<Doc>) => void, history?: boolean) => void
  begin: () => void
  end: () => void
  undo: () => void
  redo: () => void

  // --- selection ----------------------------------------------------------
  select: (ids: string[] | string | null, additive?: boolean) => void
  selectAll: () => void
  setHover: (id: string | null) => void
  setEditing: (id: string | null) => void

  // --- viewport -----------------------------------------------------------
  setViewport: (v: Partial<Viewport>) => void
  zoomBy: (factor: number, cx: number, cy: number) => void
  zoomTo: (z: number) => void
  zoomToFit: (ids?: string[]) => void
  screenToWorld: (x: number, y: number) => { x: number; y: number }
  worldToScreen: (x: number, y: number) => { x: number; y: number }

  // --- tools & ui ---------------------------------------------------------
  setTool: (t: Tool) => void
  setPrefs: (p: Partial<Prefs>) => void
  setPalette: (open: boolean) => void
  setContextMenu: (m: ContextMenuState | null) => void
  setDropHint: (h: DropHint | null) => void
  setCursor: (x: number, y: number) => void
  toast: (text: string, tone?: Toast['tone']) => void
  dismissToast: (id: string) => void
  setShortcuts: (open: boolean) => void
  setCodeOpen: (open: boolean) => void
  setPanel: (p: 'components' | 'layers' | 'frames') => void

  // --- editing ------------------------------------------------------------
  addFrame: (deviceId: string, at?: { x: number; y: number }) => string
  insertSpec: (spec: NodeSpec, opts?: { parent?: string | null; x?: number; y?: number; origin?: string; select?: boolean }) => string
  deleteSelection: () => void
  duplicateSelection: (dx?: number, dy?: number) => void
  copySelection: () => void
  pasteClipboard: (at?: { x: number; y: number }) => void
  group: () => void
  ungroup: () => void
  wrapInStack: (mode: 'row' | 'column') => void
  splitIntoColumns: (n: number, mode?: 'row' | 'column') => void
  setLayoutMode: (mode: LayoutMode) => void
  nudge: (dx: number, dy: number) => void
  moveBy: (ids: string[], dx: number, dy: number) => void
  setStyle: (patch: Partial<Style>, ids?: string[]) => void
  setProps: (patch: Record<string, any>, ids?: string[]) => void
  setNode: (id: string, patch: Partial<Node>) => void
  align: (how: 'left' | 'hcenter' | 'right' | 'top' | 'vcenter' | 'bottom') => void
  distribute: (axis: 'h' | 'v') => void
  order: (how: 'front' | 'forward' | 'backward' | 'back') => void
  toggleLock: (ids?: string[]) => void
  toggleHidden: (ids?: string[]) => void
  rename: (id: string, name: string) => void
  setTheme: (t: Theme) => void
  setRoughness: (r: number) => void
  reparentNodes: (ids: string[], parent: string | null, index?: number) => void
  setLink: (id: string, target: string | undefined) => void

  // --- layout grid --------------------------------------------------------
  setGridFocus: (f: { frameId: string; path: RegionPath } | null) => void
  toggleGrid: (ids?: string[]) => void
  setGrid: (id: string, patch: Partial<FrameGrid>) => void
  applyGridPreset: (id: string, presetId: string) => void
  splitGridRegion: (id: string, path: RegionPath, dir: SplitDir, count: number) => void
  mergeGridRegion: (id: string, path: RegionPath) => void
  setGridRegion: (id: string, path: RegionPath, patch: Partial<GridRegion>) => void
  addGuideSet: (id: string, path: RegionPath, patch?: Partial<GuideSet>) => void
  setGuideSet: (id: string, path: RegionPath, setId: string, patch: Partial<GuideSet>) => void
  removeGuideSet: (id: string, path: RegionPath, setId: string) => void

  // --- document -----------------------------------------------------------
  newDoc: () => void
  loadDoc: (d: Doc) => void
  renameDoc: (name: string) => void

  // --- present ------------------------------------------------------------
  startPresent: (frameId?: string) => void
  stopPresent: () => void
  presentGo: (frameId: string) => void
  presentBack: () => void
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return defaultPrefs
}

/** Which file record edits are written back to. */
let currentFileId: string | null = null
export const setCurrentFileId = (id: string | null) => {
  currentFileId = id
}
export const getCurrentFileId = () => currentFileId

function persist(doc: Doc) {
  if (currentFileId) {
    void useFiles.getState().saveDoc(currentFileId, doc)
    return
  }
  // no file yet (scratch document) — keep a crash-recovery copy
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ format: 'applecider', version: 1, doc }))
  } catch {
    /* quota — ignore */
  }
}

export function loadPersisted(): Doc | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.doc?.nodes) return migrateGrids(parsed.doc as Doc)
  } catch {
    /* ignore */
  }
  return null
}

let saveTimer: number | undefined
function schedulePersist(doc: Doc) {
  useStore.setState({ saving: true })
  window.clearTimeout(saveTimer)
  saveTimer = window.setTimeout(() => {
    persist(doc)
    useStore.setState({ saving: false, savedAt: Date.now() })
  }, 500)
}

/**
 * The grid a frame should get the first time someone asks for one: the column
 * count its device implies, with the margins that device ships with.
 */
function defaultGridFor(node: { props?: Record<string, any>; frame: Rect }): FrameGrid {
  const dev = getDevice(node.props?.device ?? '')
  const w = node.frame.w
  const columns = dev?.guides?.columns ?? (w < 600 ? 4 : w < 1000 ? 8 : 12)
  const gutter = dev?.guides?.gutter ?? (w < 600 ? 16 : 24)
  const margin = dev?.guides?.margin ?? (w < 600 ? 20 : 64)
  return makeGrid({
    root: makeRegion({
      pad: [margin, margin, margin, margin],
      sets: [makeSet({ kind: 'columns', count: columns, gutter })],
    }),
  })
}

/** Run `fn` against one region of a frame's grid, inside a history entry. */
function withRegion(
  s: State,
  id: string,
  path: RegionPath,
  fn: (region: GridRegion) => void,
) {
  s.mutate((d) => {
    const t = d.nodes[id]
    if (!t) return
    if (!t.grid) t.grid = defaultGridFor(t)
    const region = regionAt(t.grid.root as GridRegion, path)
    if (region) fn(region)
  })
}

export const useStore = create<State>()((set, get) => ({
  doc: emptyDoc(),
  past: [],
  future: [],
  _txn: false,
  _txnBase: null,

  selection: [],
  hover: null,
  editing: null,
  tool: 'select',
  viewport: { x: 0, y: 0, zoom: 1 },
  cursor: { x: 0, y: 0 },

  prefs: loadPrefs(),
  gridFocus: null,
  palette: false,
  contextMenu: null,
  dropHint: null,
  present: { active: false, frameId: null, history: [] },
  clipboard: null,
  toasts: [],
  shortcutsOpen: false,
  codeOpen: false,
  saving: false,
  savedAt: null,
  panel: 'components',

  // -------------------------------------------------------------------------
  mutate: (recipe, history = true) =>
    set((s) => {
      const next = produce(s.doc, (d) => {
        recipe(d)
        d.updatedAt = Date.now()
      })
      if (next === s.doc) return {}
      schedulePersist(next)
      if (history && !s._txn) {
        return { doc: next, past: [...s.past, s.doc].slice(-HISTORY_LIMIT), future: [] }
      }
      return { doc: next }
    }),

  begin: () => set((s) => (s._txn ? {} : { _txn: true, _txnBase: s.doc })),

  end: () =>
    set((s) => {
      if (!s._txn) return {}
      if (s._txnBase && s._txnBase !== s.doc) {
        return {
          _txn: false,
          _txnBase: null,
          past: [...s.past, s._txnBase].slice(-HISTORY_LIMIT),
          future: [],
        }
      }
      return { _txn: false, _txnBase: null }
    }),

  undo: () =>
    set((s) => {
      const prev = s.past[s.past.length - 1]
      if (!prev) return {}
      schedulePersist(prev)
      return {
        doc: prev,
        past: s.past.slice(0, -1),
        future: [s.doc, ...s.future].slice(0, HISTORY_LIMIT),
        selection: s.selection.filter((id) => prev.nodes[id]),
        editing: null,
      }
    }),

  redo: () =>
    set((s) => {
      const next = s.future[0]
      if (!next) return {}
      schedulePersist(next)
      return {
        doc: next,
        past: [...s.past, s.doc].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
        selection: s.selection.filter((id) => next.nodes[id]),
        editing: null,
      }
    }),

  // -------------------------------------------------------------------------
  select: (ids, additive = false) =>
    set((s) => {
      const arr = ids == null ? [] : Array.isArray(ids) ? ids : [ids]
      const valid = arr.filter((id) => s.doc.nodes[id])
      if (!additive) return { selection: valid, editing: null }
      const next = new Set(s.selection)
      for (const id of valid) (next.has(id) ? next.delete(id) : next.add(id))
      return { selection: [...next], editing: null }
    }),

  selectAll: () =>
    set((s) => {
      // select siblings of the current selection's parent, else all roots
      const first = s.selection[0] ? s.doc.nodes[s.selection[0]] : undefined
      if (first?.parent) return { selection: [...s.doc.nodes[first.parent].children] }
      return { selection: [...s.doc.roots] }
    }),

  setHover: (id) => set((s) => (s.hover === id ? {} : { hover: id })),
  setEditing: (id) => set({ editing: id }),

  // -------------------------------------------------------------------------
  setViewport: (v) => set((s) => ({ viewport: { ...s.viewport, ...v } })),

  zoomBy: (factor, cx, cy) =>
    set((s) => {
      const zoom = clamp(s.viewport.zoom * factor, 0.02, 64)
      const k = zoom / s.viewport.zoom
      return {
        viewport: {
          zoom,
          x: cx - (cx - s.viewport.x) * k,
          y: cy - (cy - s.viewport.y) * k,
        },
      }
    }),

  zoomTo: (z) =>
    set((s) => {
      const el = document.getElementById('cider-canvas')
      const w = el?.clientWidth ?? window.innerWidth
      const h = el?.clientHeight ?? window.innerHeight
      const zoom = clamp(z, 0.02, 64)
      const k = zoom / s.viewport.zoom
      return {
        viewport: {
          zoom,
          x: w / 2 - (w / 2 - s.viewport.x) * k,
          y: h / 2 - (h / 2 - s.viewport.y) * k,
        },
      }
    }),

  zoomToFit: (ids) => {
    const s = get()
    const target = ids?.length ? ids : s.selection.length ? s.selection : s.doc.roots
    if (!target.length) return
    const b = unionRects(target.filter((id) => s.doc.nodes[id]).map((id) => absRect(s.doc.nodes, id)))
    if (b.w <= 0 || b.h <= 0) return
    const el = document.getElementById('cider-canvas')
    const vw = (el?.clientWidth ?? window.innerWidth) - 80
    const vh = (el?.clientHeight ?? window.innerHeight) - 80
    const zoom = clamp(Math.min(vw / b.w, vh / b.h), 0.02, 4)
    set({
      viewport: {
        zoom,
        x: (el?.clientWidth ?? window.innerWidth) / 2 - (b.x + b.w / 2) * zoom,
        y: (el?.clientHeight ?? window.innerHeight) / 2 - (b.y + b.h / 2) * zoom,
      },
    })
  },

  screenToWorld: (x, y) => {
    const { viewport } = get()
    return { x: (x - viewport.x) / viewport.zoom, y: (y - viewport.y) / viewport.zoom }
  },

  worldToScreen: (x, y) => {
    const { viewport } = get()
    return { x: x * viewport.zoom + viewport.x, y: y * viewport.zoom + viewport.y }
  },

  // -------------------------------------------------------------------------
  setTool: (t) => set({ tool: t, editing: null }),
  setPrefs: (p) =>
    set((s) => {
      const prefs = { ...s.prefs, ...p }
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
      } catch {
        /* ignore */
      }
      return { prefs }
    }),
  setPalette: (open) => set({ palette: open, contextMenu: null }),
  setContextMenu: (m) => set({ contextMenu: m }),
  setDropHint: (h) => set({ dropHint: h }),
  setCursor: (x, y) => set({ cursor: { x, y } }),
  toast: (text, tone = 'info') =>
    set((s) => {
      const id = Math.random().toString(36).slice(2)
      window.setTimeout(() => get().dismissToast(id), 2600)
      return { toasts: [...s.toasts, { id, text, tone }] }
    }),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setShortcuts: (open) => set({ shortcutsOpen: open }),
  setCodeOpen: (open) => set({ codeOpen: open }),
  setPanel: (p) => set({ panel: p, prefs: { ...get().prefs, leftPanel: true } }),

  // -------------------------------------------------------------------------
  addFrame: (deviceId, at) => {
    const dev = getDevice(deviceId)
    const w = dev?.w ?? 400
    const h = dev?.h ?? 800
    const s = get()
    const pos = at ?? nextFramePosition(s.doc, w)
    const id = makeNode('frame').id
    s.mutate((d) => {
      const n = makeNode('frame', {
        id,
        name: dev?.name ?? 'Frame',
        frame: rect(Math.round(pos.x), Math.round(pos.y), w, h),
        props: { device: deviceId, chrome: dev?.chrome ?? 'none', face: dev?.face },
        style: { fill: 'var(--paper)', clip: true },
      })
      // Every frame arrives with the grid its device implies, switched off
      // until you ask for it — so Shift+G is instant rather than a setup task.
      n.grid = { ...defaultGridFor(n), visible: false }
      d.nodes[id] = n
      d.roots.push(id)
    })
    set({ selection: [id] })
    return id
  },

  insertSpec: (spec, opts = {}) => {
    const s = get()
    let newId = ''
    s.mutate((d) => {
      const nodes = d.nodes as Record<string, Node>
      const id = instantiate(spec, nodes, null, opts.origin)
      newId = id
      const n = nodes[id]
      let parent: string | null = opts.parent ?? null
      if (parent === undefined) parent = null
      if (parent && !nodes[parent]) parent = null
      if (parent) {
        const pAbs = absPos(nodes, parent)
        n.frame.x = Math.round((opts.x ?? pAbs.x) - pAbs.x)
        n.frame.y = Math.round((opts.y ?? pAbs.y) - pAbs.y)
        n.parent = parent
        nodes[parent].children.push(id)
      } else {
        n.frame.x = Math.round(opts.x ?? 0)
        n.frame.y = Math.round(opts.y ?? 0)
        d.roots.push(id)
      }
    })
    if (opts.select !== false) set({ selection: [newId] })
    return newId
  },

  deleteSelection: () => {
    const s = get()
    if (!s.selection.length) return
    s.mutate((d) => {
      for (const id of s.selection) removeNode(d, id)
    })
    set({ selection: [], editing: null })
  },

  duplicateSelection: (dx = 24, dy = 24) => {
    const s = get()
    if (!s.selection.length) return
    const created: string[] = []
    s.mutate((d) => {
      const names = new Set(Object.values(d.nodes).map((n) => n.name))
      for (const id of s.selection) {
        const src = d.nodes[id]
        if (!src) continue
        const copy = cloneSubtree(d.nodes as Record<string, Node>, id, src.parent)
        d.nodes[copy].name = copyName(src.name, names)
        names.add(d.nodes[copy].name)
        d.nodes[copy].frame.x += dx
        d.nodes[copy].frame.y += dy
        const list = siblingList(d, src.parent)
        list.splice(list.indexOf(id) + 1, 0, copy)
        created.push(copy)
      }
    })
    set({ selection: created })
  },

  copySelection: () => {
    const s = get()
    if (!s.selection.length) return
    const nodes: Record<string, Node> = {}
    const roots: string[] = []
    for (const id of s.selection) {
      const n = s.doc.nodes[id]
      if (!n) continue
      roots.push(id)
      for (const d of [id, ...descendants(s.doc.nodes, id)]) {
        nodes[d] = JSON.parse(JSON.stringify(s.doc.nodes[d]))
      }
    }
    set({ clipboard: { nodes, roots } })
    // Mirror to the system clipboard when the browser allows it. This rejects
    // rather than throws when the document is not focused or permission is
    // denied, so the rejection is swallowed explicitly.
    try {
      navigator.clipboard
        ?.writeText(JSON.stringify({ format: 'applecider-clip', version: 1, nodes, roots }))
        .catch(() => undefined)
    } catch {
      /* clipboard unavailable — the in-app clipboard still works */
    }
    s.toast(`Copied ${roots.length} item${roots.length > 1 ? 's' : ''}`)
  },

  pasteClipboard: (at) => {
    const s = get()
    const clip = s.clipboard
    if (!clip || !clip.roots.length) return
    const created: string[] = []
    const origin = unionRects(
      clip.roots.map((id) => {
        const n = clip.nodes[id]
        return rect(n.frame.x, n.frame.y, n.frame.w, n.frame.h)
      }),
    )
    const target = at ?? s.cursor
    s.mutate((d) => {
      // stage clipboard nodes into a scratch map then clone into the doc
      const scratch: Record<string, Node> = { ...(d.nodes as Record<string, Node>) }
      for (const [k, v] of Object.entries(clip.nodes)) if (!scratch[k]) scratch[k] = v
      for (const id of clip.roots) {
        const parentAt = findDropParent(d, target.x, target.y, [])
        const copy = cloneSubtree(scratch, id, parentAt)
        // copy freshly created nodes into the doc
        for (const [k, v] of Object.entries(scratch)) if (!d.nodes[k]) d.nodes[k] = v
        const n = d.nodes[copy]
        const rel = clip.nodes[id]
        const pAbs = parentAt ? absPos(d.nodes as Record<string, Node>, parentAt) : { x: 0, y: 0 }
        n.frame.x = Math.round(target.x - pAbs.x + (rel.frame.x - origin.x))
        n.frame.y = Math.round(target.y - pAbs.y + (rel.frame.y - origin.y))
        n.parent = parentAt
        siblingList(d, parentAt).push(copy)
        created.push(copy)
      }
    })
    set({ selection: created })
  },

  group: () => {
    const s = get()
    if (s.selection.length < 1) return
    const ids = orderedSelection(s.doc, s.selection)
    const parent = s.doc.nodes[ids[0]]?.parent ?? null
    const b = selectionBounds(s.doc.nodes, ids)
    let gid = ''
    s.mutate((d) => {
      const pAbs = parent ? absPos(d.nodes as Record<string, Node>, parent) : { x: 0, y: 0 }
      const g = makeNode('group', {
        name: 'Group',
        parent,
        frame: rect(b.x - pAbs.x, b.y - pAbs.y, b.w, b.h),
      })
      gid = g.id
      d.nodes[g.id] = g
      const list = siblingList(d, parent)
      const idx = Math.min(...ids.map((i) => list.indexOf(i)).filter((i) => i >= 0))
      list.splice(idx < 0 ? list.length : idx, 0, g.id)
      for (const id of ids) {
        const n = d.nodes[id]
        if (!n) continue
        const abs = absPos(d.nodes as Record<string, Node>, id)
        detach(d, id)
        n.parent = g.id
        n.frame.x = abs.x - b.x
        n.frame.y = abs.y - b.y
        g.children.push(id)
      }
    })
    set({ selection: [gid] })
  },

  ungroup: () => {
    const s = get()
    const released: string[] = []
    s.mutate((d) => {
      for (const id of s.selection) {
        const g = d.nodes[id]
        if (!g || !isContainer(g) || g.type === 'frame') continue
        const parent = g.parent
        const list = siblingList(d, parent)
        const at = list.indexOf(id)
        const kids = [...g.children]
        for (let i = 0; i < kids.length; i++) {
          const k = kids[i]
          const n = d.nodes[k]
          const abs = absPos(d.nodes as Record<string, Node>, k)
          const pAbs = parent ? absPos(d.nodes as Record<string, Node>, parent) : { x: 0, y: 0 }
          n.parent = parent
          n.frame.x = abs.x - pAbs.x
          n.frame.y = abs.y - pAbs.y
          list.splice(at + i, 0, k)
          released.push(k)
        }
        g.children = []
        detach(d, id)
        delete d.nodes[id]
      }
    })
    if (released.length) set({ selection: released })
  },

  wrapInStack: (mode) => {
    const s = get()
    if (!s.selection.length) return
    const ids = orderedSelection(s.doc, s.selection)
    const parent = s.doc.nodes[ids[0]]?.parent ?? null
    const b = selectionBounds(s.doc.nodes, ids)
    let sid = ''
    s.mutate((d) => {
      const pAbs = parent ? absPos(d.nodes as Record<string, Node>, parent) : { x: 0, y: 0 }
      const st = makeNode('stack', {
        name: mode === 'row' ? 'Row' : 'Column',
        parent,
        frame: rect(b.x - pAbs.x, b.y - pAbs.y, b.w, b.h),
        layout: { ...defaultLayout(), mode, gap: 12, align: 'stretch' },
        size: { w: 'fixed', h: 'hug' },
      })
      sid = st.id
      d.nodes[st.id] = st
      const list = siblingList(d, parent)
      const idx = Math.min(...ids.map((i) => list.indexOf(i)).filter((i) => i >= 0))
      list.splice(idx < 0 ? list.length : idx, 0, st.id)
      // sort children along the stack axis so wrapping preserves visual order
      const sorted = [...ids].sort((a, c) => {
        const ra = absRect(d.nodes as Record<string, Node>, a)
        const rc = absRect(d.nodes as Record<string, Node>, c)
        return mode === 'row' ? ra.x - rc.x : ra.y - rc.y
      })
      for (const id of sorted) {
        const n = d.nodes[id]
        detach(d, id)
        n.parent = st.id
        n.frame.x = 0
        n.frame.y = 0
        st.children.push(id)
      }
    })
    set({ selection: [sid] })
  },

  splitIntoColumns: (n, mode = 'row') => {
    const s = get()
    const targetId = s.selection[0]
    const target = targetId ? s.doc.nodes[targetId] : undefined
    if (!target || !isContainer(target)) {
      s.toast('Select a frame, group or stack to split', 'warn')
      return
    }
    const created: string[] = []
    s.mutate((d) => {
      const t = d.nodes[targetId]
      t.layout.mode = mode
      t.layout.gap = t.layout.gap || 16
      t.layout.align = 'stretch'
      const kids: string[] = []
      for (let i = 0; i < n; i++) {
        const cell = makeNode('stack', {
          name: mode === 'row' ? `Column ${i + 1}` : `Row ${i + 1}`,
          parent: t.id,
          frame: rect(0, 0, Math.floor(t.frame.w / n), Math.floor(t.frame.h / n)),
          layout: { ...defaultLayout(), mode: mode === 'row' ? 'column' : 'row', gap: 12, pad: [0, 0, 0, 0] },
          size: { w: mode === 'row' ? 'fill' : 'fill', h: mode === 'row' ? 'fill' : 'fill' },
          style: { stroke: 'transparent', strokeStyle: 'dashed', fill: 'transparent' },
          props: { placeholder: true },
        })
        d.nodes[cell.id] = cell
        kids.push(cell.id)
        created.push(cell.id)
      }
      // existing children move into the first cell
      const existing = [...t.children]
      t.children = kids
      if (existing.length) {
        const first = d.nodes[kids[0]]
        for (const e of existing) {
          d.nodes[e].parent = first.id
          first.children.push(e)
        }
      }
    })
    set({ selection: created })
    s.toast(`Split into ${n} ${mode === 'row' ? 'columns' : 'rows'}`)
  },

  setLayoutMode: (mode) => {
    const s = get()
    s.mutate((d) => {
      for (const id of s.selection) {
        const n = d.nodes[id]
        if (!n || !isContainer(n)) continue
        const was = n.layout.mode
        n.layout.mode = mode
        if (was === 'free' && mode !== 'free') {
          // sort children by position so the flow matches what was on screen
          n.children.sort((a, b) => {
            const na = d.nodes[a]
            const nb = d.nodes[b]
            return mode === 'row' ? na.frame.x - nb.frame.x : na.frame.y - nb.frame.y
          })
          if (n.layout.gap === 0) n.layout.gap = 12
        }
      }
    })
  },

  nudge: (dx, dy) => {
    const s = get()
    s.mutate((d) => {
      for (const id of s.selection) {
        const n = d.nodes[id]
        if (!n || n.locked) continue
        n.frame.x += dx
        n.frame.y += dy
      }
    })
  },

  moveBy: (ids, dx, dy) => {
    get().mutate((d) => {
      for (const id of ids) {
        const n = d.nodes[id]
        if (!n || n.locked) continue
        n.frame.x += dx
        n.frame.y += dy
      }
    }, false)
  },

  setStyle: (patch, ids) => {
    const s = get()
    const targets = ids ?? s.selection
    s.mutate((d) => {
      for (const id of targets) {
        const n = d.nodes[id]
        if (!n) continue
        n.style = { ...n.style, ...patch }
      }
    })
  },

  setProps: (patch, ids) => {
    const s = get()
    const targets = ids ?? s.selection
    s.mutate((d) => {
      for (const id of targets) {
        const n = d.nodes[id]
        if (!n) continue
        n.props = { ...n.props, ...patch }
      }
    })
  },

  setNode: (id, patch) => {
    get().mutate((d) => {
      const n = d.nodes[id]
      if (!n) return
      Object.assign(n, patch)
    })
  },

  align: (how) => {
    const s = get()
    if (s.selection.length === 0) return
    const ids = s.selection
    // aligning a single child aligns it inside its parent
    const single = ids.length === 1
    const container = single ? s.doc.nodes[ids[0]]?.parent : null
    const bounds = single
      ? container
        ? rect(0, 0, s.doc.nodes[container].frame.w, s.doc.nodes[container].frame.h)
        : null
      : selectionBounds(s.doc.nodes, ids)
    if (!bounds) return
    s.mutate((d) => {
      for (const id of ids) {
        const n = d.nodes[id]
        if (!n || n.locked) continue
        const pAbs = single
          ? { x: 0, y: 0 }
          : n.parent
            ? absPos(d.nodes as Record<string, Node>, n.parent)
            : { x: 0, y: 0 }
        switch (how) {
          case 'left':
            n.frame.x = bounds.x - pAbs.x
            break
          case 'hcenter':
            n.frame.x = bounds.x + bounds.w / 2 - n.frame.w / 2 - pAbs.x
            break
          case 'right':
            n.frame.x = bounds.x + bounds.w - n.frame.w - pAbs.x
            break
          case 'top':
            n.frame.y = bounds.y - pAbs.y
            break
          case 'vcenter':
            n.frame.y = bounds.y + bounds.h / 2 - n.frame.h / 2 - pAbs.y
            break
          case 'bottom':
            n.frame.y = bounds.y + bounds.h - n.frame.h - pAbs.y
            break
        }
        n.frame.x = Math.round(n.frame.x)
        n.frame.y = Math.round(n.frame.y)
      }
    })
  },

  distribute: (axis) => {
    const s = get()
    if (s.selection.length < 3) return
    const items = s.selection
      .map((id) => ({ id, r: absRect(s.doc.nodes, id) }))
      .sort((a, b) => (axis === 'h' ? a.r.x - b.r.x : a.r.y - b.r.y))
    const first = items[0].r
    const last = items[items.length - 1].r
    const total = axis === 'h' ? last.x + last.w - first.x : last.y + last.h - first.y
    const used = items.reduce((acc, i) => acc + (axis === 'h' ? i.r.w : i.r.h), 0)
    const gap = (total - used) / (items.length - 1)
    let cur = axis === 'h' ? first.x : first.y
    s.mutate((d) => {
      for (const it of items) {
        const n = d.nodes[it.id]
        const pAbs = n.parent ? absPos(d.nodes as Record<string, Node>, n.parent) : { x: 0, y: 0 }
        if (axis === 'h') {
          n.frame.x = Math.round(cur - pAbs.x)
          cur += it.r.w + gap
        } else {
          n.frame.y = Math.round(cur - pAbs.y)
          cur += it.r.h + gap
        }
      }
    })
  },

  order: (how) => {
    const s = get()
    s.mutate((d) => {
      for (const id of s.selection) {
        const n = d.nodes[id]
        if (!n) continue
        const list = siblingList(d, n.parent)
        const i = list.indexOf(id)
        if (i < 0) continue
        list.splice(i, 1)
        if (how === 'front') list.push(id)
        else if (how === 'back') list.unshift(id)
        else if (how === 'forward') list.splice(Math.min(i + 1, list.length), 0, id)
        else list.splice(Math.max(i - 1, 0), 0, id)
      }
    })
  },

  toggleLock: (ids) => {
    const s = get()
    const targets = ids ?? s.selection
    s.mutate((d) => {
      const anyUnlocked = targets.some((id) => d.nodes[id] && !d.nodes[id].locked)
      for (const id of targets) if (d.nodes[id]) d.nodes[id].locked = anyUnlocked
    })
  },

  toggleHidden: (ids) => {
    const s = get()
    const targets = ids ?? s.selection
    s.mutate((d) => {
      const anyVisible = targets.some((id) => d.nodes[id] && !d.nodes[id].hidden)
      for (const id of targets) if (d.nodes[id]) d.nodes[id].hidden = anyVisible
    })
  },

  rename: (id, name) => get().mutate((d) => { if (d.nodes[id]) d.nodes[id].name = name }),
  setTheme: (t) => get().mutate((d) => { d.theme = t }),
  setRoughness: (r) => get().mutate((d) => { d.roughness = clamp(r, 0, 1) }),

  reparentNodes: (ids, parent, index) => {
    get().mutate((d) => {
      for (const id of ids) reparent(d, id, parent, index)
    })
  },

  setLink: (id, target) => get().mutate((d) => { if (d.nodes[id]) d.nodes[id].link = target }),

  // --- layout grid ---------------------------------------------------------
  setGridFocus: (f) => set({ gridFocus: f }),

  /**
   * Turn the grid on or off for the selected frames. A frame that has never had
   * one gets the grid its device suggests — a phone wants 4 columns, a desktop
   * 12 — so the first press shows something useful rather than an empty toggle.
   */
  toggleGrid: (ids) => {
    const s = get()
    const frames = (ids ?? s.selection)
      .map((id) => frameOf(s.doc.nodes, id))
      .filter((f): f is Node => !!f)
    const unique = [...new Map(frames.map((f) => [f.id, f])).values()]
    if (!unique.length) {
      s.toast('Select a frame to add a layout grid', 'warn')
      return
    }
    const turningOn = unique.some((f) => !f.grid?.visible)
    s.mutate((d) => {
      for (const f of unique) {
        const t = d.nodes[f.id]
        if (!t.grid) t.grid = defaultGridFor(t)
        t.grid.visible = turningOn
      }
    })
    if (turningOn && !s.prefs.showGuides) s.setPrefs({ showGuides: true })
  },

  setGrid: (id, patch) =>
    get().mutate((d) => {
      const t = d.nodes[id]
      if (!t) return
      t.grid = { ...(t.grid ?? defaultGridFor(t)), ...patch }
    }),

  applyGridPreset: (id, presetId) => {
    const preset = GRID_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    get().mutate((d) => {
      const t = d.nodes[id]
      if (!t) return
      t.grid = makeGrid({ visible: true, snap: t.grid?.snap ?? true, root: preset.build() })
    })
    set({ gridFocus: { frameId: id, path: [] } })
  },

  splitGridRegion: (id, path, dir, count) => {
    withRegion(get(), id, path, (region) => {
      const n = Math.max(1, Math.min(12, Math.round(count)))
      if (n === 1) {
        region.dir = null
        region.children = []
        return
      }
      // Re-splitting the same way keeps the children you already nested, so
      // going 2 → 3 columns does not throw away the rows inside them.
      const keep = region.dir === dir ? region.children : []
      region.dir = dir
      region.children = Array.from({ length: n }, (_, i) => keep[i] ?? makeRegion())
    })
    set({ gridFocus: { frameId: id, path } })
  },

  mergeGridRegion: (id, path) => {
    withRegion(get(), id, path, (region) => {
      region.dir = null
      region.children = []
    })
  },

  setGridRegion: (id, path, patch) => {
    withRegion(get(), id, path, (region) => Object.assign(region, patch))
  },

  addGuideSet: (id, path, patch) => {
    withRegion(get(), id, path, (region) => {
      region.sets.push(makeSet(patch))
    })
  },

  setGuideSet: (id, path, setId, patch) => {
    withRegion(get(), id, path, (region) => {
      const set_ = region.sets.find((x) => x.id === setId)
      if (set_) Object.assign(set_, patch)
    })
  },

  removeGuideSet: (id, path, setId) => {
    withRegion(get(), id, path, (region) => {
      region.sets = region.sets.filter((x) => x.id !== setId)
    })
  },

  // -------------------------------------------------------------------------
  newDoc: () => {
    const d = emptyDoc()
    persist(d)
    set({ doc: d, past: [], future: [], selection: [], viewport: { x: 0, y: 0, zoom: 1 } })
  },

  loadDoc: (d) => {
    migrateGrids(d)
    persist(d)
    set({ doc: d, past: [], future: [], selection: [], editing: null })
    setTimeout(() => get().zoomToFit(d.roots), 0)
  },

  renameDoc: (name) => get().mutate((d) => { d.name = name }),

  // -------------------------------------------------------------------------
  startPresent: (frameId) => {
    const s = get()
    const first =
      frameId ??
      s.selection.map((id) => frameOf(s.doc.nodes, id)).find(Boolean)?.id ??
      frameList(s.doc)[0]
    if (!first) {
      s.toast('Add a frame first', 'warn')
      return
    }
    set({ present: { active: true, frameId: first, history: [] } })
  },
  stopPresent: () => set({ present: { active: false, frameId: null, history: [] } }),
  presentGo: (frameId) =>
    set((s) => ({
      present: {
        active: true,
        frameId,
        history: s.present.frameId ? [...s.present.history, s.present.frameId] : s.present.history,
      },
    })),
  presentBack: () =>
    set((s) => {
      const h = [...s.present.history]
      const prev = h.pop()
      if (!prev) return {}
      return { present: { active: true, frameId: prev, history: h } }
    }),
}))

// ---------------------------------------------------------------------------
// helpers used by the store and the canvas
// ---------------------------------------------------------------------------

/** Selection in document order (so grouping preserves z-order). */
export function orderedSelection(doc: Doc, ids: string[]): string[] {
  const order = new Map<string, number>()
  let i = 0
  const visit = (list: string[]) => {
    for (const id of list) {
      order.set(id, i++)
      const n = doc.nodes[id]
      if (n) visit(n.children)
    }
  }
  visit(doc.roots)
  return [...ids].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
}

/**
 * Deepest container whose absolute rect contains the point, excluding `skip`
 * and their descendants. Returns null when the point is on bare canvas.
 */
export function findDropParent(
  doc: Doc | Draft<Doc>,
  x: number,
  y: number,
  skip: string[],
): string | null {
  const nodes = doc.nodes as Record<string, Node>
  const skipSet = new Set(skip)
  let best: string | null = null
  let bestDepth = -1

  const visit = (id: string, depth: number) => {
    if (skipSet.has(id)) return
    const n = nodes[id]
    if (!n || n.hidden || n.locked) return
    const r = absRect(nodes, id)
    if (x < r.x || y < r.y || x > r.x + r.w || y > r.y + r.h) return
    if (isContainer(n) && depth > bestDepth) {
      best = id
      bestDepth = depth
    }
    for (const c of n.children) visit(c, depth + 1)
  }
  for (const id of doc.roots) visit(id, 0)
  return best
}

/** Topmost node at a world point (respecting z-order, skipping locked/hidden). */
export function hitTest(
  doc: Doc,
  x: number,
  y: number,
  opts: { deep?: boolean; skip?: Set<string> } = {},
): string | null {
  const nodes = doc.nodes
  let found: string | null = null

  const visit = (id: string): void => {
    const n = nodes[id]
    if (!n || n.hidden) return
    const r = absRect(nodes, id)
    const inside = x >= r.x && y >= r.y && x <= r.x + r.w && y <= r.y + r.h
    if (!inside && n.type !== 'frame') return
    if (inside && !n.locked && !opts.skip?.has(id)) found = id
    // children draw on top of the parent, so check them last (front-most wins)
    if (inside || n.type === 'frame') {
      for (const c of n.children) visit(c)
    }
  }
  for (const id of doc.roots) visit(id)
  return found
}

/**
 * The node that should be selected by a plain click: the outermost meaningful
 * ancestor (top-level child of a frame), unless the user is drilling in.
 */
export function selectionTarget(doc: Doc, id: string | null, deep: boolean): string | null {
  if (!id) return null
  if (deep) return id
  const n = doc.nodes[id]
  if (!n) return null
  if (!n.parent) return id
  let cur = n
  while (cur.parent) {
    const p = doc.nodes[cur.parent]
    if (!p) break
    if (p.type === 'frame') return cur.id
    cur = p
  }
  return cur.id
}

export const nodeById = (id: string | null | undefined): Node | undefined =>
  id ? useStore.getState().doc.nodes[id] : undefined

export { isAutoLayout, isContainer, absPos, absRect, attach, detach, siblingList }
export type { Node, Doc }
