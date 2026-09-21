/**
 * Layout grids: the scaffolding you design against.
 *
 * Two ideas stack on top of each other.
 *
 *  1. **Regions.** A frame's grid is a tree. The root region covers the frame;
 *     splitting it into columns or rows gives child regions, and each of those
 *     splits again. "Two columns, the left split into two rows, the right into
 *     two columns" is three splits, not a pile of nodes.
 *
 *  2. **Guide sets.** Any region carries the familiar 12-column / 8px overlays.
 *     A set is drawn across the region that declares it, splits or no splits —
 *     a 12-column set on the root spans the whole frame, the way it does in
 *     every other design tool. Want a grid inside one column? Give that region
 *     its own set; both draw at once.
 *
 * Nothing here mutates: the solver turns a region tree plus a box into flat
 * lists of rectangles and line positions, which the overlay draws and the
 * snapper snaps to.
 */

import { uid } from './id'
import { rect } from './geometry'
import type {
  Doc,
  FrameGrid,
  GridRegion,
  GuideAlign,
  GuideKind,
  GuideSet,
  LayoutGuide,
  Rect,
  SplitDir,
} from './types'

export const GRID_COLOR = 'rgba(232,97,60,0.5)'

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

export function makeSet(patch: Partial<GuideSet> = {}): GuideSet {
  return {
    id: uid(),
    kind: 'columns',
    visible: true,
    count: 12,
    size: 80,
    gutter: 20,
    align: 'stretch',
    color: GRID_COLOR,
    opacity: 0.18,
    ...patch,
  }
}

export function makeRegion(patch: Partial<GridRegion> = {}): GridRegion {
  return {
    id: uid(),
    ratio: 1,
    dir: null,
    gap: 24,
    pad: [0, 0, 0, 0],
    children: [],
    sets: [],
    ...patch,
  }
}

export function makeGrid(patch: Partial<FrameGrid> = {}): FrameGrid {
  return { visible: true, snap: true, root: makeRegion(), ...patch }
}

/** A frame's grid, or a fresh empty one — so callers never branch on null. */
export const gridOf = (g: FrameGrid | null | undefined): FrameGrid => g ?? makeGrid({ visible: false })

// ---------------------------------------------------------------------------
// Walking the region tree
//
// A region is addressed by its *path*: the child indices from the root down.
// `[]` is the root, `[0, 1]` is the second child of the first child. Paths
// survive edits to other branches, which ids alone would not make obvious.
// ---------------------------------------------------------------------------

export type RegionPath = number[]

export const pathKey = (p: RegionPath) => p.join('.')

/** The region at `path`, or undefined if the path has gone stale. */
export function regionAt(root: GridRegion, path: RegionPath): GridRegion | undefined {
  let cur: GridRegion | undefined = root
  for (const i of path) {
    cur = cur ? kidsOf(cur)[i] : undefined
    if (!cur) return undefined
  }
  return cur
}

/** Every region in the tree, parents before children. */
export function eachRegion(
  root: GridRegion,
  visit: (r: GridRegion, path: RegionPath) => void,
  path: RegionPath = [],
) {
  visit(root, path)
  kidsOf(root).forEach((c, i) => eachRegion(c, visit, [...path, i]))
}

/**
 * A region's own arrays, guaranteed. Documents round-trip through JSON and can
 * be hand-edited, so the solver treats a missing `children` or `sets` as empty
 * rather than letting it take the whole canvas down.
 */
export const kidsOf = (r: GridRegion): GridRegion[] => r.children ?? []
export const setsOf = (r: GridRegion): GuideSet[] => r.sets ?? []

export const isLeaf = (r: GridRegion) => !r.dir || kidsOf(r).length === 0

/** Does this grid actually divide the frame, or is it one plain region? */
export const hasSplits = (g: FrameGrid) => kidsOf(g.root).length > 0

/** Does anything draw at all — a split, or a visible guide set anywhere? */
export function isEmptyGrid(g: FrameGrid): boolean {
  let any = false
  eachRegion(g.root, (r) => {
    if (kidsOf(r).length > 0 || setsOf(r).some((s) => s.visible)) any = true
  })
  return !any
}

// ---------------------------------------------------------------------------
// Editing (returns new trees; callers may also mutate an immer draft in place)
// ---------------------------------------------------------------------------

/**
 * Divide `region` into `count` children. Existing children are dropped — a
 * re-split is a fresh division, not a merge, which is what "split into 3" means
 * once you already have 2.
 */
export function splitRegion(region: GridRegion, dir: SplitDir, count: number): GridRegion {
  const n = Math.max(1, Math.min(12, Math.round(count)))
  if (n === 1) return mergeRegion(region)
  // Re-splitting the same way keeps whatever the children already hold, so
  // going 2 → 3 columns does not throw away the rows you nested inside them.
  const keep = region.dir === dir ? kidsOf(region) : []
  const children = Array.from({ length: n }, (_, i) => keep[i] ?? makeRegion())
  return { ...region, dir, children }
}

/** Collapse a split, making the region a leaf again. */
export function mergeRegion(region: GridRegion): GridRegion {
  return { ...region, dir: null, children: [] }
}

// ---------------------------------------------------------------------------
// Solving
// ---------------------------------------------------------------------------

export interface SolvedRegion {
  path: RegionPath
  region: GridRegion
  /** the region's box, before its own padding */
  rect: Rect
  /** the box its children and guides live in, after padding */
  inner: Rect
  depth: number
  leaf: boolean
}

const insetBy = (r: Rect, pad: [number, number, number, number]): Rect => {
  const [t, rt, b, l] = pad
  return rect(r.x + l, r.y + t, Math.max(0, r.w - l - rt), Math.max(0, r.h - t - b))
}

/**
 * Flatten the region tree into boxes, parents before children.
 * `box` is the frame-local rectangle the root covers.
 */
export function solveRegions(root: GridRegion, box: Rect): SolvedRegion[] {
  const out: SolvedRegion[] = []

  const visit = (region: GridRegion, r: Rect, path: RegionPath, depth: number) => {
    const inner = insetBy(r, region.pad ?? [0, 0, 0, 0])
    out.push({ path, region, rect: r, inner, depth, leaf: isLeaf(region) })
    if (isLeaf(region)) return

    const kids = kidsOf(region)
    const gap = Math.max(0, region.gap)
    const along = region.dir === 'cols' ? inner.w : inner.h
    const free = Math.max(0, along - gap * (kids.length - 1))
    const totalRatio = kids.reduce((sum, k) => sum + Math.max(0.01, k.ratio), 0)

    let cursor = region.dir === 'cols' ? inner.x : inner.y
    kids.forEach((kid, i) => {
      const share = (free * Math.max(0.01, kid.ratio)) / totalRatio
      const kr =
        region.dir === 'cols'
          ? rect(cursor, inner.y, share, inner.h)
          : rect(inner.x, cursor, inner.w, share)
      cursor += share + gap
      visit(kid, kr, [...path, i], depth + 1)
    })
  }

  visit(root, box, [], 0)
  return out
}

// ---------------------------------------------------------------------------
// Guide sets → bands
// ---------------------------------------------------------------------------

export interface GuideBand extends Rect {
  kind: GuideKind
}

/** Where `count` tracks of `size` start, along an axis of length `along`. */
function trackOffsets(
  along: number,
  count: number,
  size: number,
  gutter: number,
  align: GuideAlign,
): { offset: number; track: number } {
  if (align === 'stretch') {
    const free = along - gutter * (count - 1)
    return { offset: 0, track: Math.max(0, free / count) }
  }
  const total = size * count + gutter * (count - 1)
  const slack = along - total
  const offset = align === 'center' ? slack / 2 : align === 'end' ? slack : 0
  return { offset, track: size }
}

/**
 * The rectangles a single set paints inside `box`.
 *
 * `grid` sets tile the box with square cells and are drawn as a CSS gradient
 * instead — painting a thousand divs for an 8px grid on a 1440px frame is how
 * you make a canvas stutter — so this returns nothing for them.
 */
export function setBands(set: GuideSet, box: Rect): GuideBand[] {
  if (!set.visible || box.w <= 0 || box.h <= 0) return []
  if (set.kind === 'grid') return []

  const count = Math.max(1, Math.min(60, Math.round(set.count)))
  const gutter = Math.max(0, set.gutter)
  const horizontal = set.kind === 'columns'
  const along = horizontal ? box.w : box.h
  const { offset, track } = trackOffsets(along, count, Math.max(1, set.size), gutter, set.align)
  if (track <= 0) return []

  const bands: GuideBand[] = []
  for (let i = 0; i < count; i++) {
    const at = offset + i * (track + gutter)
    if (at > along || at + track < 0) continue
    bands.push(
      horizontal
        ? { x: box.x + at, y: box.y, w: track, h: box.h, kind: set.kind }
        : { x: box.x, y: box.y + at, w: box.w, h: track, kind: set.kind },
    )
  }
  return bands
}

// ---------------------------------------------------------------------------
// Snapping
// ---------------------------------------------------------------------------

/** Vertical and horizontal lines a node can snap to, in the same space as `box`. */
export interface GridLines {
  xs: number[]
  ys: number[]
}

const MAX_LINES = 400

/**
 * Every edge worth snapping to: region boundaries (inner and outer) and the
 * edges of every visible band. Square `grid` sets contribute their cell lines
 * up to a sane ceiling, past which a "snap target" is just the pixel grid.
 */
export function gridSnapLines(grid: FrameGrid, box: Rect): GridLines {
  const xs = new Set<number>()
  const ys = new Set<number>()
  if (!grid.snap) return { xs: [], ys: [] }

  for (const sr of solveRegions(grid.root, box)) {
    xs.add(sr.rect.x).add(sr.rect.x + sr.rect.w)
    ys.add(sr.rect.y).add(sr.rect.y + sr.rect.h)
    xs.add(sr.inner.x).add(sr.inner.x + sr.inner.w)
    ys.add(sr.inner.y).add(sr.inner.y + sr.inner.h)

    for (const set of setsOf(sr.region)) {
      if (!set.visible) continue
      if (set.kind === 'grid') {
        const step = Math.max(2, set.size)
        if (sr.inner.w / step > MAX_LINES || sr.inner.h / step > MAX_LINES) continue
        for (let x = sr.inner.x; x <= sr.inner.x + sr.inner.w + 0.5; x += step) xs.add(x)
        for (let y = sr.inner.y; y <= sr.inner.y + sr.inner.h + 0.5; y += step) ys.add(y)
        continue
      }
      for (const b of setBands(set, sr.inner)) {
        if (set.kind === 'columns') xs.add(b.x).add(b.x + b.w)
        else ys.add(b.y).add(b.y + b.h)
      }
    }
  }

  const round = (s: Set<number>) =>
    [...new Set([...s].map((v) => Math.round(v * 10) / 10))].slice(0, MAX_LINES * 2)
  return { xs: round(xs), ys: round(ys) }
}

// ---------------------------------------------------------------------------
// Presets
// ---------------------------------------------------------------------------

export interface GridPreset {
  id: string
  label: string
  hint: string
  build: () => GridRegion
}

const cols = (n: number, gutter: number, margin: number): GridRegion =>
  makeRegion({
    pad: [margin, margin, margin, margin],
    sets: [makeSet({ kind: 'columns', count: n, gutter })],
  })

/** Split a fresh region into `n` children, optionally weighted. */
const split = (dir: SplitDir, ratios: number[], gap = 24, pad = 0): GridRegion =>
  makeRegion({
    dir,
    gap,
    pad: [pad, pad, pad, pad],
    children: ratios.map((ratio) => makeRegion({ ratio })),
  })

export const GRID_PRESETS: GridPreset[] = [
  { id: '12col', label: '12 columns', hint: 'Desktop web', build: () => cols(12, 24, 64) },
  { id: '8col', label: '8 columns', hint: 'Tablet', build: () => cols(8, 20, 32) },
  { id: '4col', label: '4 columns', hint: 'Phone', build: () => cols(4, 16, 20) },
  {
    id: '8px',
    label: '8px grid',
    hint: 'Baseline',
    build: () => makeRegion({ sets: [makeSet({ kind: 'grid', size: 8, opacity: 0.1 })] }),
  },
  { id: 'halves', label: 'Two columns', hint: '1 : 1', build: () => split('cols', [1, 1]) },
  { id: 'thirds', label: 'Three columns', hint: '1 : 1 : 1', build: () => split('cols', [1, 1, 1]) },
  { id: 'sidebar', label: 'Sidebar + main', hint: '1 : 3', build: () => split('cols', [1, 3]) },
  { id: 'stacked', label: 'Two rows', hint: '1 : 1', build: () => split('rows', [1, 1]) },
  {
    id: 'header',
    label: 'Header + body',
    hint: 'Row, then columns',
    build: () => {
      const r = split('rows', [1, 5])
      r.children[1] = splitRegion(r.children[1], 'cols', 2)
      return r
    },
  },
  {
    id: 'holy-grail',
    label: 'App shell',
    hint: 'Nav, sidebar, content',
    build: () => {
      const r = split('rows', [1, 8])
      const body = splitRegion(r.children[1], 'cols', 2)
      body.children[0].ratio = 1
      body.children[1].ratio = 4
      body.children[1].sets = [makeSet({ kind: 'columns', count: 8, gutter: 20 })]
      r.children[1] = body
      return r
    },
  },
]

// ---------------------------------------------------------------------------
// Migration
// ---------------------------------------------------------------------------

/** Turn a pre-grid `LayoutGuide` into the region tree that draws the same thing. */
export function gridFromLegacy(g: LayoutGuide): FrameGrid {
  return makeGrid({
    visible: g.enabled,
    root: makeRegion({
      pad: [g.margin, g.margin, g.margin, g.margin],
      sets: [
        makeSet({
          kind: 'columns',
          count: Math.max(1, g.columns),
          gutter: g.gutter,
          color: g.color || GRID_COLOR,
        }),
      ],
    }),
  })
}

/**
 * Fill in anything a hand-edited or older grid is missing. Documents round-trip
 * through JSON, so treat every field as possibly absent.
 */
export function normalizeGrid(g: Partial<FrameGrid> | null | undefined): FrameGrid | null {
  if (!g) return null
  const region = (r: Partial<GridRegion> | undefined): GridRegion => {
    const base = makeRegion()
    if (!r) return base
    const pad = Array.isArray(r.pad) && r.pad.length === 4 ? r.pad : base.pad
    return {
      id: r.id ?? base.id,
      ratio: typeof r.ratio === 'number' ? r.ratio : 1,
      dir: r.dir === 'cols' || r.dir === 'rows' ? r.dir : null,
      gap: typeof r.gap === 'number' ? r.gap : base.gap,
      pad: [...pad] as [number, number, number, number],
      children: (r.children ?? []).map(region),
      sets: (r.sets ?? []).map((s) => makeSet(s)),
    }
  }
  return {
    visible: g.visible ?? true,
    snap: g.snap ?? true,
    root: region(g.root),
  }
}

/**
 * Bring a freshly opened document up to date: legacy `guides` become a real
 * grid, and any grid that lost fields on its way through JSON is filled in.
 * Safe to run on an already-current document.
 */
export function migrateGrids(doc: Doc): Doc {
  for (const node of Object.values(doc.nodes)) {
    if (node.grid) {
      node.grid = normalizeGrid(node.grid)
    } else if (node.guides) {
      node.grid = gridFromLegacy(node.guides)
    }
    delete node.guides
  }
  return doc
}
